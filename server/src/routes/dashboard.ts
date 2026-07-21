import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import pool from "../config/database.js";

const router = Router();

interface DashboardCountRow extends RowDataPacket {
  activeLoans: number;
  fundedLoans: number;
  archivedLoans: number;
  closingThisWeek: number;
  urgentLocks: number;
}

interface PipelineStageRow extends RowDataPacket {
  stage: string;
  count: number;
}

const ACTIVE_STATUSES = [
  "Loan Setup",
  "Disclosed",
  "Submitted to Underwriting",
  "Docs Out",
  "Clear to Close",
  "Docs Signed",
];

router.get("/", async (_req, res) => {
  try {
    const [statRows] = await pool.query<DashboardCountRow[]>(`
      SELECT
        SUM(
          CASE
            WHEN status IN (
              'Loan Setup',
              'Disclosed',
              'Submitted to Underwriting',
              'Docs Out',
              'Clear to Close',
              'Docs Signed'
            )
            THEN 1
            ELSE 0
          END
        ) AS activeLoans,

        SUM(
          CASE
            WHEN status = 'Loan Funded'
            THEN 1
            ELSE 0
          END
        ) AS fundedLoans,

        SUM(
          CASE
            WHEN status = 'Loan Funded'
              AND calc_completed IS NOT NULL
              AND payroll_processed IS NOT NULL
            THEN 1
            ELSE 0
          END
        ) AS archivedLoans,

        SUM(
          CASE
            WHEN status IN (
              'Loan Setup',
              'Disclosed',
              'Submitted to Underwriting',
              'Docs Out',
              'Clear to Close',
              'Docs Signed'
            )
            AND loan_exp_date BETWEEN CURDATE()
              AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            THEN 1
            ELSE 0
          END
        ) AS closingThisWeek,

        SUM(
          CASE
            WHEN status IN (
              'Loan Setup',
              'Disclosed',
              'Submitted to Underwriting',
              'Docs Out',
              'Clear to Close',
              'Docs Signed'
            )
            AND loan_exp_date BETWEEN CURDATE()
              AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
            THEN 1
            ELSE 0
          END
        ) AS urgentLocks
      FROM loans
    `);

    const [pipelineRows] = await pool.query<PipelineStageRow[]>(`
      SELECT
        status AS stage,
        COUNT(*) AS count
      FROM loans
      WHERE status IN (
        'Loan Setup',
        'Disclosed',
        'Submitted to Underwriting',
        'Docs Out',
        'Clear to Close',
        'Docs Signed'
      )
      GROUP BY status
    `);

    const stats = statRows[0];

    const activeLoans = Number(stats?.activeLoans ?? 0);

    const countByStage = new Map(
      pipelineRows.map((row) => [
        row.stage,
        Number(row.count),
      ]),
    );

    const pipelineStages = ACTIVE_STATUSES.map((stage) => {
      const count = countByStage.get(stage) ?? 0;

      const pct =
        activeLoans === 0
          ? 0
          : Math.round((count / activeLoans) * 100);

      return {
        stage,
        count,
        pct,
      };
    });

    res.json({
      activeLoans,
      fundedLoans: Number(stats?.fundedLoans ?? 0),
      archivedLoans: Number(stats?.archivedLoans ?? 0),
      closingThisWeek: Number(
        stats?.closingThisWeek ?? 0,
      ),
      urgentLocks: Number(stats?.urgentLocks ?? 0),
      onHold: 0,
      pipelineStages,
    });
  } catch (error) {
    console.error(
      "Failed to load dashboard information:",
      error,
    );

    res.status(500).json({
      message: "Failed to load dashboard information.",
    });
  }
});

export default router;