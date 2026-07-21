import { Router, type Request } from "express";
import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2";

import pool from "../config/database.js";

const router = Router();

interface LoanRow extends RowDataPacket {
  id: string;
  borrower: string;
  status: string;
  status_started_at: Date | string | null;
  funded_at: Date | string | null;
  closed_at: Date | string | null;
  funded_date: Date | string | null;
  calc_completed: Date | string | null;
  payroll_processed: Date | string | null;
  primary_lo: string;
  lo2: string | null;
  lo3: string | null;
  state: string;
  has_notes: number | boolean;
  files_count: number;
  property: string;
  base_loan_amount: number;
  total_loan_amount: number;
  loan_exp_date: Date | string | null;
  lock_pricing: number;
  loan_type: string;
  origination_a1: number;
  origination_a2: number;
  origination_a3: number;
  points_a01: number;
  ysp: number;
  lock_cost: number;
  lender_credit: number;
  flat_fee: number;
}

interface LoanRequestBody {
  id?: string;
  borrower?: string;
  status?: string;

  fundedDate?: string | null;
  calcCompleted?: string | null;
  payrollProcessed?: string | null;

  primaryLO?: string;
  lo2?: string | null;
  lo3?: string | null;

  state?: string;
  hasNotes?: boolean;
  filesCount?: number;

  property?: string;
  baseLoanAmount?: number;
  totalLoanAmount?: number;
  loanExpDate?: string | null;
  lockPricing?: number;
  type?: string;

  revenue?: {
    originationA1?: number;
    originationA2?: number;
    originationA3?: number;
    pointsA01?: number;
    ysp?: number;
  };

  deductions?: {
    lockCost?: number;
    lenderCredit?: number;
    flatFee?: number;
  };
}


interface CurrentUserRow extends RowDataPacket {
  id: number;
  full_name: string;
  role: string;
  status?: string;
}

type NormalizedRole =
  | "admin"
  | "loan_officer"
  | "processor"
  | "accounting"
  | "unknown";

function normalizeRole(role: string): NormalizedRole {
  const value = role
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    value === "admin" ||
    value === "super_admin" ||
    value === "superadmin" ||
    value === "system_administrator"
  ) {
    return "admin";
  }

  if (
    value === "loan_officer" ||
    value === "loanofficer"
  ) {
    return "loan_officer";
  }

  if (value === "processor") {
    return "processor";
  }

  if (value === "accounting") {
    return "accounting";
  }

  return "unknown";
}

function getRequestUserId(
  req: Request,
): number | null {
  const headerValue =
    req.headers["x-user-id"];

  const rawValue =
    Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue ??
        req.body?.currentUserId ??
        req.body?.userId;

  const userId = Number(rawValue);

  return Number.isInteger(userId) &&
    userId > 0
    ? userId
    : null;
}

async function getCurrentUser(
  req: Request,
): Promise<CurrentUserRow | null> {
  const userId = getRequestUserId(req);

  if (!userId) {
    return null;
  }

  const [rows] =
    await pool.query<CurrentUserRow[]>(
      `
        SELECT
          id,
          full_name,
          role,
          status
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [userId],
    );

  const user = rows[0];

  if (!user) {
    return null;
  }

  if (
    user.status &&
    user.status.toLowerCase() !== "active"
  ) {
    return null;
  }

  return user;
}

function accountingUpdateBody(
  existing: LoanRow,
  incoming: LoanRequestBody,
): LoanRequestBody {
  return {
    borrower: existing.borrower,
    status: existing.status,
    fundedDate:
      incoming.fundedDate ??
      formatDate(existing.funded_date),
    calcCompleted:
      incoming.calcCompleted ??
      formatDate(existing.calc_completed),
    payrollProcessed:
      incoming.payrollProcessed ??
      formatDate(existing.payroll_processed),
    primaryLO: existing.primary_lo,
    lo2: existing.lo2,
    lo3: existing.lo3,
    state: existing.state,
    hasNotes: Boolean(existing.has_notes),
    filesCount: Number(existing.files_count),
    property: existing.property,
    baseLoanAmount: Number(
      existing.base_loan_amount,
    ),
    totalLoanAmount: Number(
      existing.total_loan_amount,
    ),
    loanExpDate:
      formatDate(existing.loan_exp_date),
    lockPricing: Number(
      existing.lock_pricing,
    ),
    type: existing.loan_type,
    revenue: {
      originationA1:
        incoming.revenue?.originationA1 ??
        Number(existing.origination_a1),
      originationA2:
        incoming.revenue?.originationA2 ??
        Number(existing.origination_a2),
      originationA3:
        incoming.revenue?.originationA3 ??
        Number(existing.origination_a3),
      pointsA01:
        incoming.revenue?.pointsA01 ??
        Number(existing.points_a01),
      ysp:
        incoming.revenue?.ysp ??
        Number(existing.ysp),
    },
    deductions: {
      lockCost:
        incoming.deductions?.lockCost ??
        Number(existing.lock_cost),
      lenderCredit:
        incoming.deductions?.lenderCredit ??
        Number(existing.lender_credit),
      flatFee:
        incoming.deductions?.flatFee ??
        Number(existing.flat_fee),
    },
  };
}

const VALID_STATUSES = [
  "Loan Setup",
  "Disclosed",
  "Submitted to Underwriting",
  "Approved w/ Conditions",
  "Re-submittal",
  "Clear to Close",
  "Docs Out",
  "Docs Signed",
  "Loan Funded",
  "Closed",
];

function emptyToNull(
  value?: string | null,
): string | null {
  if (!value || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function formatDate(
  value: Date | string | null,
): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const year = value.getFullYear();
  const month = String(
    value.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(value.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
}

function mapLoan(row: LoanRow) {
  return {
    id: String(row.id),
    borrower: row.borrower,
    status: row.status,
    statusStartedAt: formatDate(
      row.status_started_at,
    ),
    fundedAt: formatDate(row.funded_at),
    closedAt: formatDate(row.closed_at),

    fundedDate:
      formatDate(row.funded_date) ?? "",
    calcCompleted: formatDate(
      row.calc_completed,
    ),
    payrollProcessed: formatDate(
      row.payroll_processed,
    ),

    primaryLO: row.primary_lo,
    lo2: row.lo2,
    lo3: row.lo3,

    state: row.state,
    hasNotes: Boolean(row.has_notes),
    filesCount: Number(row.files_count),

    property: row.property,
    baseLoanAmount: Number(
      row.base_loan_amount,
    ),
    totalLoanAmount: Number(
      row.total_loan_amount,
    ),
    loanExpDate:
      formatDate(row.loan_exp_date) ?? "",
    lockPricing: Number(row.lock_pricing),
    type: row.loan_type,

    revenue: {
      originationA1: Number(
        row.origination_a1,
      ),
      originationA2: Number(
        row.origination_a2,
      ),
      originationA3: Number(
        row.origination_a3,
      ),
      pointsA01: Number(row.points_a01),
      ysp: Number(row.ysp),
    },

    deductions: {
      lockCost: Number(row.lock_cost),
      lenderCredit: Number(
        row.lender_credit,
      ),
      flatFee: Number(row.flat_fee),
    },
  };
}

function validateRequiredFields(
  body: LoanRequestBody,
  requireId: boolean,
): string | null {
  if (requireId && !body.id?.trim()) {
    return "Loan ID is required.";
  }

  if (!body.borrower?.trim()) {
    return "Borrower is required.";
  }

  if (!body.status?.trim()) {
    return "Status is required.";
  }

  if (!body.primaryLO?.trim()) {
    return "Primary LO is required.";
  }

  if (!body.state?.trim()) {
    return "State is required.";
  }

  if (!body.property?.trim()) {
    return "Property is required.";
  }

  if (!body.type?.trim()) {
    return "Loan type is required.";
  }

  if (!VALID_STATUSES.includes(body.status)) {
    return "Invalid loan status.";
  }

  return null;
}

// GET all loans
router.get("/", async (_req, res) => {
  try {
    const [rows] =
      await pool.query<LoanRow[]>(
        `
          SELECT *
          FROM loans
          ORDER BY created_at DESC
        `,
      );

    res.json(rows.map(mapLoan));
  } catch (error) {
    console.error(
      "Failed to fetch loans:",
      error,
    );

    res.status(500).json({
      message: "Failed to fetch loans.",
    });
  }
});

// GET one loan
router.get("/:id", async (req, res) => {
  try {
    const [rows] =
      await pool.query<LoanRow[]>(
        `
          SELECT *
          FROM loans
          WHERE id = ?
          LIMIT 1
        `,
        [req.params.id],
      );

    if (rows.length === 0) {
      res.status(404).json({
        message: "Loan not found.",
      });
      return;
    }

    res.json(mapLoan(rows[0]));
  } catch (error) {
    console.error(
      "Failed to fetch loan:",
      error,
    );

    res.status(500).json({
      message: "Failed to fetch loan.",
    });
  }
});

// CREATE loan
router.post("/", async (req, res) => {
  try {
    const currentUser =
      await getCurrentUser(req);

    if (!currentUser) {
      res.status(401).json({
        message:
          "A valid logged-in user is required.",
      });
      return;
    }

    if (
      normalizeRole(currentUser.role) !==
      "admin"
    ) {
      res.status(403).json({
        message:
          "Only an Admin can create loans.",
      });
      return;
    }

    const body =
      req.body as LoanRequestBody;

    const validationError =
      validateRequiredFields(body, true);

    if (validationError) {
      res.status(400).json({
        message: validationError,
      });
      return;
    }

    const loanId = body.id!.trim();

    const [existingRows] =
      await pool.query<LoanRow[]>(
        `
          SELECT id
          FROM loans
          WHERE id = ?
          LIMIT 1
        `,
        [loanId],
      );

    if (existingRows.length > 0) {
      res.status(409).json({
        message:
          "A loan with this ID already exists.",
      });
      return;
    }

    await pool.execute<ResultSetHeader>(
      `
        INSERT INTO loans (
          id,
          borrower,
          status,
          funded_date,
          calc_completed,
          payroll_processed,
          primary_lo,
          lo2,
          lo3,
          state,
          has_notes,
          files_count,
          property,
          base_loan_amount,
          total_loan_amount,
          loan_exp_date,
          lock_pricing,
          loan_type,
          origination_a1,
          origination_a2,
          origination_a3,
          points_a01,
          ysp,
          lock_cost,
          lender_credit,
          flat_fee
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        )
      `,
      [
        loanId,
        body.borrower!.trim(),
        body.status!,
        emptyToNull(body.fundedDate),
        emptyToNull(
          body.calcCompleted,
        ),
        emptyToNull(
          body.payrollProcessed,
        ),
        body.primaryLO!.trim(),
        emptyToNull(body.lo2),
        emptyToNull(body.lo3),
        body.state!.trim().toUpperCase(),
        body.hasNotes ? 1 : 0,
        Number(body.filesCount ?? 0),
        body.property!.trim(),
        Number(
          body.baseLoanAmount ?? 0,
        ),
        Number(
          body.totalLoanAmount ?? 0,
        ),
        emptyToNull(body.loanExpDate),
        Number(body.lockPricing ?? 0),
        body.type!.trim(),
        Number(
          body.revenue?.originationA1 ??
            0,
        ),
        Number(
          body.revenue?.originationA2 ??
            0,
        ),
        Number(
          body.revenue?.originationA3 ??
            0,
        ),
        Number(
          body.revenue?.pointsA01 ?? 0,
        ),
        Number(body.revenue?.ysp ?? 0),
        Number(
          body.deductions?.lockCost ?? 0,
        ),
        Number(
          body.deductions?.lenderCredit ??
            0,
        ),
        Number(
          body.deductions?.flatFee ?? 0,
        ),
      ],
    );

    const [createdRows] =
      await pool.query<LoanRow[]>(
        `
          SELECT *
          FROM loans
          WHERE id = ?
          LIMIT 1
        `,
        [loanId],
      );

    res
      .status(201)
      .json(mapLoan(createdRows[0]));
  } catch (error) {
    console.error(
      "Failed to create loan:",
      error,
    );

    res.status(500).json({
      message: "Failed to create loan.",
    });
  }
});

// UPDATE loan
router.put("/:id", async (req, res) => {
  try {
    const currentUser =
      await getCurrentUser(req);

    if (!currentUser) {
      res.status(401).json({
        message:
          "A valid logged-in user is required.",
      });
      return;
    }

    const role =
      normalizeRole(currentUser.role);

    if (
      role === "loan_officer" ||
      role === "unknown"
    ) {
      res.status(403).json({
        message:
          "You only have permission to view loans.",
      });
      return;
    }

    const loanId = req.params.id;

    const [existingRows] =
      await pool.query<LoanRow[]>(
        `
          SELECT *
          FROM loans
          WHERE id = ?
          LIMIT 1
        `,
        [loanId],
      );

    const existingLoan =
      existingRows[0];

    if (!existingLoan) {
      res.status(404).json({
        message: "Loan not found.",
      });
      return;
    }

    let body =
      req.body as LoanRequestBody;

    if (role === "accounting") {
      body = accountingUpdateBody(
        existingLoan,
        body,
      );
    }

    const validationError =
      validateRequiredFields(body, false);

    if (validationError) {
      res.status(400).json({
        message: validationError,
      });
      return;
    }

    const [result] =
      await pool.execute<ResultSetHeader>(
        `
          UPDATE loans
          SET
            status_started_at = CASE
              WHEN status <> ?
                THEN CURRENT_TIMESTAMP
              ELSE status_started_at
            END,
            funded_at = CASE
              WHEN status <> ?
                AND ? = 'Loan Funded'
                THEN CURRENT_TIMESTAMP
              ELSE funded_at
            END,
            closed_at = CASE
              WHEN status <> ?
                AND ? = 'Closed'
                THEN CURRENT_TIMESTAMP
              ELSE closed_at
            END,
            borrower = ?,
            status = ?,
            funded_date = ?,
            calc_completed = ?,
            payroll_processed = ?,
            primary_lo = ?,
            lo2 = ?,
            lo3 = ?,
            state = ?,
            has_notes = ?,
            files_count = ?,
            property = ?,
            base_loan_amount = ?,
            total_loan_amount = ?,
            loan_exp_date = ?,
            lock_pricing = ?,
            loan_type = ?,
            origination_a1 = ?,
            origination_a2 = ?,
            origination_a3 = ?,
            points_a01 = ?,
            ysp = ?,
            lock_cost = ?,
            lender_credit = ?,
            flat_fee = ?
          WHERE id = ?
        `,
        [
          body.status!,
          body.status!,
          body.status!,
          body.status!,
          body.status!,
          body.borrower!.trim(),
          body.status!,
          emptyToNull(body.fundedDate),
          emptyToNull(
            body.calcCompleted,
          ),
          emptyToNull(
            body.payrollProcessed,
          ),
          body.primaryLO!.trim(),
          emptyToNull(body.lo2),
          emptyToNull(body.lo3),
          body.state!
            .trim()
            .toUpperCase(),
          body.hasNotes ? 1 : 0,
          Number(body.filesCount ?? 0),
          body.property!.trim(),
          Number(
            body.baseLoanAmount ?? 0,
          ),
          Number(
            body.totalLoanAmount ?? 0,
          ),
          emptyToNull(body.loanExpDate),
          Number(body.lockPricing ?? 0),
          body.type!.trim(),
          Number(
            body.revenue
              ?.originationA1 ?? 0,
          ),
          Number(
            body.revenue
              ?.originationA2 ?? 0,
          ),
          Number(
            body.revenue
              ?.originationA3 ?? 0,
          ),
          Number(
            body.revenue?.pointsA01 ??
              0,
          ),
          Number(
            body.revenue?.ysp ?? 0,
          ),
          Number(
            body.deductions?.lockCost ??
              0,
          ),
          Number(
            body.deductions
              ?.lenderCredit ?? 0,
          ),
          Number(
            body.deductions?.flatFee ??
              0,
          ),
          loanId,
        ],
      );

    if (result.affectedRows === 0) {
      res.status(404).json({
        message: "Loan not found.",
      });
      return;
    }

    const [updatedRows] =
      await pool.query<LoanRow[]>(
        `
          SELECT *
          FROM loans
          WHERE id = ?
          LIMIT 1
        `,
        [loanId],
      );

    res.json(mapLoan(updatedRows[0]));
  } catch (error) {
    console.error(
      "Failed to update loan:",
      error,
    );

    res.status(500).json({
      message: "Failed to update loan.",
    });
  }
});

// DELETE loan
router.delete(
  "/:id",
  async (req, res) => {
    try {
      const currentUser =
        await getCurrentUser(req);

      if (!currentUser) {
        res.status(401).json({
          message:
            "A valid logged-in user is required.",
        });
        return;
      }

      if (
        normalizeRole(currentUser.role) !==
        "admin"
      ) {
        res.status(403).json({
          message:
            "Only an Admin can delete loans.",
        });
        return;
      }

      const [result] =
        await pool.execute<ResultSetHeader>(
          `
            DELETE FROM loans
            WHERE id = ?
          `,
          [req.params.id],
        );

      if (result.affectedRows === 0) {
        res.status(404).json({
          message: "Loan not found.",
        });
        return;
      }

      res.json({
        message:
          "Loan deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Failed to delete loan:",
        error,
      );

      res.status(500).json({
        message:
          "Failed to delete loan.",
      });
    }
  },
);

export default router;