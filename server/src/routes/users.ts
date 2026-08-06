import express from "express";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

import pool from "../config/database.js";

import {
  createNotification,
} from "../../services/notificationService.js";

import {
  sendAccountUpdatedEmail,
  sendEmailChangedSecurityAlert,
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
  password_hash?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  last_login_at: string | null;
  notifications_enabled: number | boolean | null;
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
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `Patriot@${randomPart}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function mapUser(user: DatabaseUser) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role,
    status: user.status,
    dateAdded: user.created_at,
    lastActive: user.last_login_at,
    notificationsEnabled:
      Boolean(user.notifications_enabled),
  };
}

async function addNotification(
  userId: number,
  message: string,
  type: string,
  enabled: boolean,
): Promise<void> {
  if (!enabled) {
    return;
  }

  await createNotification(
    userId,
    message,
    type,
  );
}

/*
|--------------------------------------------------------------------------
| Get Users
|--------------------------------------------------------------------------
*/

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
        last_login_at,
        notifications_enabled
      FROM users
      ORDER BY created_at DESC
      `,
    );

    const users = rows as DatabaseUser[];

    res.json({
      users: users.map(mapUser),
    });
  } catch (error) {
    console.error(
      "Get users error:",
      error,
    );

    res.status(500).json({
      message:
        "Unable to retrieve users.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Get Loan Officers
|--------------------------------------------------------------------------
*/

router.get(
  "/loan-officers",
  async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT
          id,
          full_name,
          email
        FROM users
        WHERE LOWER(role) = 'loan officer'
          AND LOWER(status) = 'registered'
        ORDER BY full_name ASC
        `,
      );

      const loanOfficers =
        rows as Array<{
          id: number;
          full_name: string;
          email: string;
        }>;

      res.json({
        loanOfficers:
          loanOfficers.map(
            (officer) => ({
              id: officer.id,
              name: officer.full_name,
              email: officer.email,
            }),
          ),
      });
    } catch (error) {
      console.error(
        "Get loan officers error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to retrieve loan officers.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string"
        ? req.body.name.trim()
        : "";

    const email =
      typeof req.body.email === "string"
        ? req.body.email
            .trim()
            .toLowerCase()
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

    if (
      !allowedRoles.includes(
        role as UserRole,
      )
    ) {
      res.status(400).json({
        message:
          "The selected role is invalid.",
      });

      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        message:
          "Please enter a valid email address.",
      });

      return;
    }

    const [existingRows] =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER(?)
        LIMIT 1
        `,
        [email],
      );

    if (
      (existingRows as Array<{
        id: number;
      }>).length > 0
    ) {
      res.status(409).json({
        message:
          "An account with this email already exists.",
      });

      return;
    }

    const temporaryPassword =
      generateTemporaryPassword();

    const passwordHash =
      await bcrypt.hash(
        temporaryPassword,
        10,
      );

    const [insertResult] =
      await pool.query(
        `
        INSERT INTO users (
          full_name,
          email,
          password_hash,
          role,
          status,
          must_change_password,
          email_sent_at,
          notifications_enabled
        )
        VALUES (?, ?, ?, ?, ?, 1, NULL, 1)
        `,
        [
          name,
          email,
          passwordHash,
          role,
          "Pending",
        ],
      );

    const result =
      insertResult as {
        insertId: number;
      };

    try {
      await sendTemporaryPasswordEmail({
        recipientName: name,
        recipientEmail: email,
        temporaryPassword,
        role,
        reason: "account_created",
      });

      await pool.query(
        `
        UPDATE users
        SET
          status = 'Registered',
          email_sent_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [result.insertId],
      );

      await addNotification(
        result.insertId,
        "Your Patriot Pacific account was created.",
        "account_created",
        true,
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

    const [createdRows] =
      await pool.query(
        `
        SELECT
          id,
          full_name,
          email,
          role,
          status,
          created_at,
          last_login_at,
          notifications_enabled
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [result.insertId],
      );

    const createdUser =
      (createdRows as DatabaseUser[])[0];

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
        ...mapUser(createdUser),
        online: false,
      },
    });
  } catch (error) {
    console.error(
      "Create user error:",
      error,
    );

    res.status(500).json({
      message:
        "Unable to create the user account.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Edit User
|--------------------------------------------------------------------------
*/

router.patch("/:id", async (req, res) => {
  try {
    const userId =
      Number(req.params.id);

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      res.status(400).json({
        message:
          "Invalid user ID.",
      });

      return;
    }

    const name =
      typeof req.body.name === "string"
        ? req.body.name.trim()
        : "";

    const email =
      typeof req.body.email === "string"
        ? req.body.email
            .trim()
            .toLowerCase()
        : "";

    const role =
      typeof req.body.role === "string"
        ? req.body.role.trim()
        : "";

    if (!name || !email || !role) {
      res.status(400).json({
        message:
          "Name, email and role are required.",
      });

      return;
    }

    if (
      !allowedRoles.includes(
        role as UserRole,
      )
    ) {
      res.status(400).json({
        message:
          "Invalid role.",
      });

      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        message:
          "Invalid email address.",
      });

      return;
    }

    const [currentRows] =
      await pool.query(
        `
        SELECT
          id,
          full_name,
          email,
          role,
          status,
          created_at,
          last_login_at,
          notifications_enabled
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId],
      );

    const current =
      (currentRows as DatabaseUser[])[0];

    if (!current) {
      res.status(404).json({
        message:
          "User not found.",
      });

      return;
    }

    const [duplicateRows] =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) =
          LOWER(?)
          AND id <> ?
        LIMIT 1
        `,
        [email, userId],
      );

    if (
      (duplicateRows as Array<{
        id: number;
      }>).length > 0
    ) {
      res.status(409).json({
        message:
          "Email is already being used.",
      });

      return;
    }

    const emailChanged =
      current.email.toLowerCase() !==
      email;

    const notificationsEnabled =
      Boolean(
        current.notifications_enabled,
      );

    if (emailChanged) {
      const temporaryPassword =
        generateTemporaryPassword();

      const passwordHash =
        await bcrypt.hash(
          temporaryPassword,
          10,
        );

      await pool.query(
        `
        UPDATE users
        SET
          full_name = ?,
          email = ?,
          role = ?,
          password_hash = ?,
          must_change_password = 1,
          email_sent_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [
          name,
          email,
          role,
          passwordHash,
          userId,
        ],
      );

      await sendEmailChangedSecurityAlert({
        recipientName: name,
        oldEmail: current.email,
        newEmail: email,
      });

      await sendTemporaryPasswordEmail({
        recipientName: name,
        recipientEmail: email,
        temporaryPassword,
        role,
        reason: "email_changed",
      });

      await addNotification(
        userId,
        "Your email was changed. Use the new temporary password sent to your new email address.",
        "email_changed",
        notificationsEnabled,
      );
    } else {
      await pool.query(
        `
        UPDATE users
        SET
          full_name = ?,
          role = ?
        WHERE id = ?
        `,
        [name, role, userId],
      );

      if (notificationsEnabled) {
        await sendAccountUpdatedEmail({
          recipientName: name,
          recipientEmail: email,
          role,
        });
      }

      await addNotification(
        userId,
        "Your account information was updated by an administrator.",
        "account_update",
        notificationsEnabled,
      );
    }

    const [updatedRows] =
      await pool.query(
        `
        SELECT
          id,
          full_name,
          email,
          role,
          status,
          created_at,
          last_login_at,
          notifications_enabled
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId],
      );

    const updatedUser =
      (updatedRows as DatabaseUser[])[0];

    if (!updatedUser) {
      res.status(500).json({
        message:
          "User updated, but the updated record could not be returned.",
      });

      return;
    }

    res.json({
      message: emailChanged
        ? "User updated. A new temporary password was sent to the new email address."
        : "User updated successfully.",
      user: mapUser(updatedUser),
    });
  } catch (error) {
    console.error(
      "Update user error:",
      error,
    );

    res.status(500).json({
      message:
        "Unable to update user.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/reset-password",
  async (req, res) => {
    try {
      const userId = Number(req.params.id);

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        res.status(400).json({
          message: "Invalid user ID.",
        });

        return;
      }

      const [rows] = await pool.query(
        `
        SELECT
          id,
          full_name,
          email,
          role,
          notifications_enabled
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId],
      );

      const user =
        (rows as DatabaseUser[])[0];

      if (!user) {
        res.status(404).json({
          message: "User not found.",
        });

        return;
      }

      const temporaryPassword =
        generateTemporaryPassword();

      /*
       * Send the temporary password first.
       * Do not change the database password
       * when email delivery fails.
       */
      try {
        await sendTemporaryPasswordEmail({
          recipientName: user.full_name,
          recipientEmail: user.email,
          temporaryPassword,
          role: user.role,
          reason: "password_reset",
        });
      } catch (emailError) {
        console.error(
          "Password reset email failed:",
          emailError,
        );

        res.status(502).json({
          message:
            "Unable to send the temporary password email. The user's password was not changed.",
        });

        return;
      }

      const passwordHash = await bcrypt.hash(
        temporaryPassword,
        12,
      );

      await pool.query(
        `
        UPDATE users
        SET
          password_hash = ?,
          must_change_password = 1,
          email_sent_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [passwordHash, userId],
      );

      try {
        await addNotification(
          userId,
          "Your password was reset by an administrator. A temporary password was sent to your email.",
          "password_reset",
          Boolean(
            user.notifications_enabled,
          ),
        );
      } catch (notificationError) {
        console.error(
          "Password reset notification failed:",
          notificationError,
        );

        /*
         * Do not fail the password reset because
         * the email and database update succeeded.
         */
      }

      res.json({
        message:
          "Temporary password sent successfully.",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to reset the password.",
      });
    }
  },
);
/*
|--------------------------------------------------------------------------
| Notification Preference
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/notifications",
  async (req, res) => {
    try {
      const userId =
        Number(req.params.id);

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        res.status(400).json({
          message:
            "Invalid user ID.",
        });

        return;
      }

      if (
        typeof req.body.enabled !==
        "boolean"
      ) {
        res.status(400).json({
          message:
            "The enabled value must be true or false.",
        });

        return;
      }

      const enabled =
        req.body.enabled;

      const [result] =
        await pool.query(
          `
          UPDATE users
          SET notifications_enabled = ?
          WHERE id = ?
          `,
          [enabled ? 1 : 0, userId],
        );

      const updateResult =
        result as {
          affectedRows: number;
        };

      if (
        updateResult.affectedRows === 0
      ) {
        res.status(404).json({
          message:
            "User not found.",
        });

        return;
      }

      res.json({
        message: enabled
          ? "Notifications enabled."
          : "Notifications disabled.",
        notificationsEnabled:
          enabled,
      });
    } catch (error) {
      console.error(
        "Notification setting error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to update notification settings.",
      });
    }
  },
);

export default router;
