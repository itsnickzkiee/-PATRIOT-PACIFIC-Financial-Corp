import express from "express";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

import pool from "../config/database.js";

import {
  sendTemporaryPasswordEmail,
} from "../config/mailer.js";

type UserRole =
  | "Admin"
  | "Loan Officer"
  | "Processor"
  | "Accounting";

type UserStatus =
  | "Registered"
  | "Pending"
  | "Deactivated";

type DatabaseUser = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  status: UserStatus;
  created_at: string;
  last_login_at: string | null;
};

const router = express.Router();

const allowedRoles: UserRole[] = [
  "Admin",
  "Loan Officer",
  "Processor",
  "Accounting",
];

function generateTemporaryPassword(): string {
  const randomPart = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `Patriot@${randomPart}`;
}

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        role,
        status,
        created_at,
        last_login_at
      FROM users
      ORDER BY created_at DESC
      `,
    );

    const users = rows as DatabaseUser[];

    res.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        dateAdded: user.created_at,
        lastActive: user.last_login_at,
      })),
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Unable to retrieve users.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string"
        ? req.body.name.trim()
        : "";

    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const role =
      typeof req.body.role === "string"
        ? req.body.role.trim()
        : "";

    if (!name || !email || !role) {
      res.status(400).json({
        message:
          "Full name, email and role are required.",
      });

      return;
    }

    if (!allowedRoles.includes(role as UserRole)) {
      res.status(400).json({
        message: "The selected role is invalid.",
      });

      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      res.status(400).json({
        message:
          "Please enter a valid email address.",
      });

      return;
    }

    const [existingRows] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
      `,
      [email],
    );

    const existingUsers =
      existingRows as Array<{ id: number }>;

    if (existingUsers.length > 0) {
      res.status(409).json({
        message:
          "An account with this email already exists.",
      });

      return;
    }

    const temporaryPassword =
      generateTemporaryPassword();

    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      10,
    );

    const [insertResult] = await pool.query(
      `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role,
        status,
        must_change_password,
        email_sent_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NULL)
      `,
      [
        name,
        email,
        passwordHash,
        role,
        "Pending",
        1,
      ],
    );

    const result = insertResult as {
      insertId: number;
    };

    try {
      await sendTemporaryPasswordEmail({
        recipientName: name,
        recipientEmail: email,
        temporaryPassword,
        role,
      });

      await pool.query(
        `
        UPDATE users
        SET
          status = ?,
          email_sent_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        ["Registered", result.insertId],
      );

      await pool.query(
        `
        INSERT INTO notifications (
          user_id,
          message,
          type
        )
        VALUES (?, ?, ?)
        `,
        [
          null,
          `New user account created for ${name}.`,
          "user",
        ],
      );
    } catch (emailError) {
      console.error(
        "Temporary password email failed:",
        emailError,
      );

      res.status(502).json({
        message:
          "The account was created, but the temporary password email could not be sent. Check the email configuration.",
      });

      return;
    }

    const [createdRows] = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        role,
        status,
        created_at,
        last_login_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [result.insertId],
    );

    const createdUsers =
      createdRows as DatabaseUser[];

    const createdUser = createdUsers[0];

    if (!createdUser) {
      res.status(500).json({
        message:
          "The account was created, but its information could not be returned.",
      });

      return;
    }

    res.status(201).json({
      message:
        "User created and temporary password sent successfully.",

      user: {
        id: createdUser.id,
        name: createdUser.full_name,
        email: createdUser.email,
        role: createdUser.role,
        status: createdUser.status,
        dateAdded: createdUser.created_at,
        lastActive: createdUser.last_login_at,
        online: false,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      message:
        "Unable to create the user account.",
    });
  }
});

export default router;