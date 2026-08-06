import express from "express";

import pool from "../config/database.js";

const router = express.Router();

type UserRecord = {
  id: number;
  full_name: string;
  email: string;
};

type AdminRecord = {
  id: number;
};

/*
|--------------------------------------------------------------------------
| Password Reset Request
|--------------------------------------------------------------------------
| A user enters an email on the login page.
| Every Admin and Super Admin receives a private notification.
|--------------------------------------------------------------------------
*/

router.post(
  "/password-reset-request",
  async (req, res) => {
    try {
      const email = String(
        req.body?.email ?? "",
      )
        .trim()
        .toLowerCase();

      if (!email) {
        res.status(400).json({
          message:
            "Email address is required.",
        });

        return;
      }

      const [userRows] =
        await pool.query(
          `
          SELECT
            id,
            full_name,
            email
          FROM users
          WHERE LOWER(email) = LOWER(?)
          LIMIT 1
          `,
          [email],
        );

      const user =
        (userRows as UserRecord[])[0];

      /*
       * Generic success response kapag hindi
       * registered ang email.
       */
      if (!user) {
        res.json({
          message:
            "If the account exists, the administrator will receive the request.",
        });

        return;
      }

      /*
       * Prevent duplicate unread requests
       * within ten minutes.
       */
      const [recentRows] =
        await pool.query(
          `
          SELECT id
          FROM notifications
          WHERE type = 'password_reset_request'
            AND message LIKE ?
            AND created_at >=
              DATE_SUB(
                CURRENT_TIMESTAMP,
                INTERVAL 10 MINUTE
              )
          LIMIT 1
          `,
          [`%${user.email}%`],
        );

      const recentRequests =
        recentRows as Array<{
          id: number;
        }>;

      if (recentRequests.length > 0) {
        res.json({
          message:
            "Your password reset request has already been sent.",
        });

        return;
      }

      const [adminRows] =
        await pool.query(
          `
          SELECT id
          FROM users
          WHERE LOWER(TRIM(role)) IN (
            'admin',
            'super admin',
            'super_admin',
            'superadmin',
            'system administrator',
            'system_administrator'
          )
            AND LOWER(TRIM(status)) IN (
              'registered',
              'active'
            )
          `,
        );

      const admins =
        adminRows as AdminRecord[];

      if (admins.length === 0) {
        res.status(503).json({
          message:
            "No administrator account is currently available.",
        });

        return;
      }

      const message =
        `${user.full_name} (${user.email}) requested a password reset. ` +
        "Open User Management to reset the user's password.";

      const values = admins.map(
        (admin) => [
          admin.id,
          message,
          "password_reset_request",
          0,
        ],
      );

      await pool.query(
        `
        INSERT INTO notifications (
          user_id,
          message,
          type,
          is_read
        )
        VALUES ?
        `,
        [values],
      );

      res.status(201).json({
        message:
          "Password reset request sent to the administrator.",
      });
    } catch (error) {
      console.error(
        "Password reset request error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to send the password reset request.",
      });
    }
  },
);

export default router;