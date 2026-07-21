import { Router } from "express";

import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2";

import pool from "../config/database.js";

const router = Router();

interface LoanRow extends RowDataPacket {
  id: string;
}

interface UserRow extends RowDataPacket {
  id: number;
  full_name: string;
}

interface NoteRow extends RowDataPacket {
  id: number;
  loan_id: string;
  user_id: number | null;
  author_name: string;
  body: string;
  created_at: Date | string;
  updated_at: Date | string;
}

function formatDateTime(
  value: Date | string,
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? String(value)
    : date.toISOString();
}

function initialsOf(
  name: string,
): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
}

function mapNote(
  row: NoteRow,
) {
  return {
    id: row.id,
    loanId: String(
      row.loan_id,
    ),
    userId: row.user_id,
    author: row.author_name,
    initials: initialsOf(
      row.author_name,
    ),
    body: row.body,
    createdAt: formatDateTime(
      row.created_at,
    ),
    updatedAt: formatDateTime(
      row.updated_at,
    ),
  };
}

async function loanExists(
  loanId: string,
): Promise<boolean> {
  const [rows] =
    await pool.query<
      LoanRow[]
    >(
      `
        SELECT id
        FROM loans
        WHERE id = ?
        LIMIT 1
      `,
      [loanId],
    );

  return rows.length > 0;
}

// GET notes for one loan
router.get(
  "/loan/:loanId",
  async (req, res) => {
    try {
      const loanId =
        String(
          req.params.loanId ??
            "",
        ).trim();

      if (!loanId) {
        res.status(400).json({
          message:
            "Loan ID is required.",
        });
        return;
      }

      if (
        !(await loanExists(
          loanId,
        ))
      ) {
        res.status(404).json({
          message:
            "Loan not found.",
        });
        return;
      }

      const search =
        typeof req.query.search ===
        "string"
          ? req.query.search.trim()
          : "";

      let rows: NoteRow[];

      if (search) {
        const [searchRows] =
          await pool.query<
            NoteRow[]
          >(
            `
              SELECT
                id,
                loan_id,
                user_id,
                author_name,
                body,
                created_at,
                updated_at
              FROM loan_notes
              WHERE loan_id = ?
                AND (
                  body LIKE ?
                  OR author_name LIKE ?
                )
              ORDER BY created_at ASC
            `,
            [
              loanId,
              `%${search}%`,
              `%${search}%`,
            ],
          );

        rows = searchRows;
      } else {
        const [noteRows] =
          await pool.query<
            NoteRow[]
          >(
            `
              SELECT
                id,
                loan_id,
                user_id,
                author_name,
                body,
                created_at,
                updated_at
              FROM loan_notes
              WHERE loan_id = ?
              ORDER BY created_at ASC
            `,
            [loanId],
          );

        rows = noteRows;
      }

      res.json({
        notes:
          rows.map(mapNote),
      });
    } catch (error) {
      console.error(
        "Get loan notes error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to retrieve loan notes.",
      });
    }
  },
);

// CREATE note
router.post(
  "/loan/:loanId",
  async (req, res) => {
    try {
      const loanId =
        String(
          req.params.loanId ??
            "",
        ).trim();

      const body =
        typeof req.body.body ===
        "string"
          ? req.body.body.trim()
          : "";

      const userId =
        Number(req.body.userId);

      if (!loanId) {
        res.status(400).json({
          message:
            "Loan ID is required.",
        });
        return;
      }

      if (!body) {
        res.status(400).json({
          message:
            "Note cannot be empty.",
        });
        return;
      }

      if (body.length > 5000) {
        res.status(400).json({
          message:
            "Note is too long.",
        });
        return;
      }

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        res.status(401).json({
          message:
            "A valid logged-in user is required.",
        });
        return;
      }

      const [userRows] =
        await pool.query<UserRow[]>(
          `
            SELECT id, full_name
            FROM users
            WHERE id = ?
            LIMIT 1
          `,
          [userId],
        );

      const databaseUser =
        userRows[0];

      if (!databaseUser) {
        res.status(404).json({
          message:
            "Logged-in user was not found.",
        });
        return;
      }

      const authorName =
        databaseUser.full_name.trim();

      if (!authorName) {
        res.status(500).json({
          message:
            "The user account has no name.",
        });
        return;
      }

      if (
        !(await loanExists(
          loanId,
        ))
      ) {
        res.status(404).json({
          message:
            "Loan not found.",
        });
        return;
      }

      const [result] =
        await pool.execute<
          ResultSetHeader
        >(
          `
            INSERT INTO loan_notes (
              loan_id,
              user_id,
              author_name,
              body
            )
            VALUES (?, ?, ?, ?)
          `,
          [
            loanId,
            userId,
            authorName,
            body,
          ],
        );

      const [rows] =
        await pool.query<
          NoteRow[]
        >(
          `
            SELECT
              id,
              loan_id,
              user_id,
              author_name,
              body,
              created_at,
              updated_at
            FROM loan_notes
            WHERE id = ?
            LIMIT 1
          `,
          [result.insertId],
        );

      const createdNote =
        rows[0];

      if (!createdNote) {
        res.status(500).json({
          message:
            "The note was saved but could not be returned.",
        });
        return;
      }

      await pool.query(
        `
          UPDATE loans
          SET has_notes = TRUE
          WHERE id = ?
        `,
        [loanId],
      );

      await pool.query(
        `
          INSERT INTO notifications (
            user_id,
            message,
            type,
            is_read
          )
          VALUES (
            NULL,
            ?,
            'note',
            FALSE
          )
        `,
        [
          `${authorName} added a note to Loan #${loanId}.`,
        ],
      );

      res.status(201).json({
        note: mapNote(
          createdNote,
        ),
      });
    } catch (error) {
       console.error(
     "Create loan note error:",
     error,
  );

  const message =
    error instanceof Error
      ? error.message
      : "Unknown database error.";

  res.status(500).json({
    message: `Unable to create loan note: ${message}`,
  });
    }
  },
);

// UPDATE note
router.patch(
  "/:noteId",
  async (req, res) => {
    try {
      const noteId =
        Number(
          String(
            req.params.noteId ??
              "",
          ),
        );

      const body =
        typeof req.body.body ===
        "string"
          ? req.body.body.trim()
          : "";

      if (
        !Number.isInteger(
          noteId,
        ) ||
        noteId <= 0
      ) {
        res.status(400).json({
          message:
            "Invalid note ID.",
        });
        return;
      }

      if (!body) {
        res.status(400).json({
          message:
            "Note cannot be empty.",
        });
        return;
      }

      const [result] =
        await pool.execute<
          ResultSetHeader
        >(
          `
            UPDATE loan_notes
            SET body = ?
            WHERE id = ?
          `,
          [body, noteId],
        );

      if (
        result.affectedRows === 0
      ) {
        res.status(404).json({
          message:
            "Note not found.",
        });
        return;
      }

      const [rows] =
        await pool.query<
          NoteRow[]
        >(
          `
            SELECT
              id,
              loan_id,
              user_id,
              author_name,
              body,
              created_at,
              updated_at
            FROM loan_notes
            WHERE id = ?
            LIMIT 1
          `,
          [noteId],
        );

      res.json({
        note: mapNote(
          rows[0]!,
        ),
      });
    } catch (error) {
      console.error(
        "Update loan note error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to update loan note.",
      });
    }
  },
);

// DELETE note
router.delete(
  "/:noteId",
  async (req, res) => {
    try {
      const noteId =
        Number(
          String(
            req.params.noteId ??
              "",
          ),
        );

      if (
        !Number.isInteger(
          noteId,
        ) ||
        noteId <= 0
      ) {
        res.status(400).json({
          message:
            "Invalid note ID.",
        });
        return;
      }

      const [noteRows] =
        await pool.query<
          NoteRow[]
        >(
          `
            SELECT *
            FROM loan_notes
            WHERE id = ?
            LIMIT 1
          `,
          [noteId],
        );

      const note =
        noteRows[0];

      if (!note) {
        res.status(404).json({
          message:
            "Note not found.",
        });
        return;
      }

      await pool.execute(
        `
          DELETE FROM loan_notes
          WHERE id = ?
        `,
        [noteId],
      );

      const [countRows] =
        await pool.query<
          Array<
            RowDataPacket & {
              total: number;
            }
          >
        >(
          `
            SELECT
              COUNT(*) AS total
            FROM loan_notes
            WHERE loan_id = ?
          `,
          [note.loan_id],
        );

      if (
        Number(
          countRows[0]?.total ??
            0,
        ) === 0
      ) {
        await pool.query(
          `
            UPDATE loans
            SET has_notes = FALSE
            WHERE id = ?
          `,
          [note.loan_id],
        );
      }

      res.json({
        message:
          "Note deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete loan note error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to delete loan note.",
      });
    }
  },
);

export default router;