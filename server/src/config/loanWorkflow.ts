import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2";

import pool from "./database.js";

type WorkflowLoanRow = RowDataPacket & {
  id: string;
  borrower: string;
  status: string;
  status_started_at: Date | string | null;
  funded_at: Date | string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/*
  The user requested:
  - Two days for every processing stage.
  - An additional two-day wait after Docs Signed.
  - Loan Funded after 18 elapsed days.
  - Closed 30 days after funding.

  Because of that extra wait, Docs Signed remains active for four
  elapsed days in total: its normal two days plus the extra two days.
*/
const STATUS_FLOW: Record<
  string,
  {
    nextStatus: string;
    durationDays: number;
  }
> = {
  "Loan Setup": {
    nextStatus: "Disclosed",
    durationDays: 2,
  },
  Disclosed: {
    nextStatus: "Submitted to Underwriting",
    durationDays: 2,
  },
  "Submitted to Underwriting": {
    nextStatus: "Approved w/ Conditions",
    durationDays: 2,
  },
  "Approved w/ Conditions": {
    nextStatus: "Re-submittal",
    durationDays: 2,
  },
  "Re-submittal": {
    nextStatus: "Clear to Close",
    durationDays: 2,
  },
  "Clear to Close": {
    nextStatus: "Docs Out",
    durationDays: 2,
  },
  "Docs Out": {
    nextStatus: "Docs Signed",
    durationDays: 2,
  },
  "Docs Signed": {
    nextStatus: "Loan Funded",
    durationDays: 4,
  },
};

function toDate(
  value: Date | string | null,
): Date | null {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function addDays(
  date: Date,
  days: number,
): Date {
  return new Date(
    date.getTime() + days * DAY_MS,
  );
}

async function createNotification(
  message: string,
  type: string,
): Promise<void> {
  await pool.query(
    `
      INSERT INTO notifications (
        user_id,
        message,
        type,
        is_read
      )
      VALUES (NULL, ?, ?, FALSE)
    `,
    [message, type],
  );
}

async function moveToNextStatus(
  loan: WorkflowLoanRow,
  transitionDate: Date,
): Promise<boolean> {
  const currentRule =
    STATUS_FLOW[loan.status];

  if (!currentRule) {
    return false;
  }

  const nextStatus =
    currentRule.nextStatus;

  const isFunding =
    nextStatus === "Loan Funded";

  const [result] =
    await pool.execute<ResultSetHeader>(
      `
        UPDATE loans
        SET
          status = ?,
          status_started_at = ?,
          funded_at = CASE
            WHEN ? = 'Loan Funded'
              THEN ?
            ELSE funded_at
          END,
          funded_date = CASE
            WHEN ? = 'Loan Funded'
              THEN DATE(?)
            ELSE funded_date
          END
        WHERE id = ?
          AND status = ?
      `,
      [
        nextStatus,
        transitionDate,
        nextStatus,
        transitionDate,
        nextStatus,
        transitionDate,
        loan.id,
        loan.status,
      ],
    );

  if (result.affectedRows === 0) {
    return false;
  }

  const message = isFunding
    ? `Loan #${loan.id} for ${loan.borrower} has been funded.`
    : `Loan #${loan.id} for ${loan.borrower} moved to ${nextStatus}.`;

  await createNotification(
    message,
    isFunding ? "funded" : "status",
  );

  loan.status = nextStatus;
  loan.status_started_at =
    transitionDate;

  if (isFunding) {
    loan.funded_at = transitionDate;
  }

  return true;
}

async function closeFundedLoan(
  loan: WorkflowLoanRow,
  closeDate: Date,
): Promise<boolean> {
  const [result] =
    await pool.execute<ResultSetHeader>(
      `
        UPDATE loans
        SET
          status = 'Closed',
          status_started_at = ?,
          closed_at = ?
        WHERE id = ?
          AND status = 'Loan Funded'
      `,
      [
        closeDate,
        closeDate,
        loan.id,
      ],
    );

  if (result.affectedRows === 0) {
    return false;
  }

  await createNotification(
    `Loan #${loan.id} for ${loan.borrower} was closed and moved to Archived Loans.`,
    "archived",
  );

  loan.status = "Closed";
  loan.status_started_at = closeDate;

  return true;
}

export async function runLoanWorkflow(): Promise<void> {
  const now = new Date();

  const [rows] =
    await pool.query<WorkflowLoanRow[]>(
      `
        SELECT
          id,
          borrower,
          status,
          status_started_at,
          funded_at
        FROM loans
        WHERE status <> 'Closed'
        ORDER BY created_at ASC
      `,
    );

  for (const loan of rows) {
    /*
      Repeat so a loan can catch up when the server was offline for
      several days. The maximum is limited for safety.
    */
    for (
      let transitionCount = 0;
      transitionCount < 10;
      transitionCount += 1
    ) {
      if (loan.status === "Loan Funded") {
        const fundedAt =
          toDate(loan.funded_at);

        if (!fundedAt) {
          break;
        }

        const closeDate =
          addDays(fundedAt, 30);

        if (now < closeDate) {
          break;
        }

        await closeFundedLoan(
          loan,
          closeDate,
        );

        break;
      }

      const rule =
        STATUS_FLOW[loan.status];

      if (!rule) {
        break;
      }

      const statusStartedAt =
        toDate(
          loan.status_started_at,
        );

      if (!statusStartedAt) {
        await pool.query(
          `
            UPDATE loans
            SET status_started_at =
              COALESCE(
                created_at,
                CURRENT_TIMESTAMP
              )
            WHERE id = ?
          `,
          [loan.id],
        );

        break;
      }

      const transitionDate =
        addDays(
          statusStartedAt,
          rule.durationDays,
        );

      if (now < transitionDate) {
        break;
      }

      const moved =
        await moveToNextStatus(
          loan,
          transitionDate,
        );

      if (!moved) {
        break;
      }
    }
  }
}