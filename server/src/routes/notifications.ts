import express from "express";

import pool from "../config/database.js";

type DatabaseNotification = {
  id: number;
  user_id: number | null;
  message: string;
  type: string;
  is_read: number | boolean;
  created_at: string;
};

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Get Notifications
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const userId =
      Number(req.query.userId);

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      res.status(400).json({
        message:
          "A valid user ID is required.",
      });

      return;
    }

    const [userRows] =
      await pool.query(
        `
        SELECT notifications_enabled
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId],
      );

    const user =
      (
        userRows as Array<{
          notifications_enabled:
            number | boolean | null;
        }>
      )[0];

    if (!user) {
      res.status(404).json({
        message:
          "User not found.",
      });

      return;
    }

    const notificationsEnabled =
      Boolean(
        user.notifications_enabled,
      );

    if (!notificationsEnabled) {
      res.json({
        notifications: [],
        notificationsEnabled: false,
      });

      return;
    }

    const [rows] =
      await pool.query(
        `
        SELECT
          id,
          user_id,
          message,
          type,
          is_read,
          created_at
        FROM notifications
        WHERE user_id = ?
           OR user_id IS NULL
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [userId],
      );

    const notifications =
      rows as DatabaseNotification[];

    res.json({
      notificationsEnabled: true,
      notifications:
        notifications.map(
          (notification) => ({
            id: notification.id,
            message:
              notification.message,
            type: notification.type,
            read: Boolean(
              notification.is_read,
            ),
            createdAt:
              notification.created_at,
          }),
        ),
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error,
    );

    res.status(500).json({
      message:
        "Unable to retrieve notifications.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Mark One Notification as Read
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/read",
  async (req, res) => {
    try {
      const notificationId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          notificationId,
        ) ||
        notificationId <= 0
      ) {
        res.status(400).json({
          message:
            "Invalid notification ID.",
        });

        return;
      }

      const [result] =
        await pool.query(
          `
          UPDATE notifications
          SET is_read = TRUE
          WHERE id = ?
          `,
          [notificationId],
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
            "Notification not found.",
        });

        return;
      }

      res.json({
        message:
          "Notification marked as read.",
      });
    } catch (error) {
      console.error(
        "Read notification error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to update notification.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| Mark All Notifications as Read
|--------------------------------------------------------------------------
*/

router.patch(
  "/read-all",
  async (req, res) => {
    try {
      const userId =
        Number(req.body.userId);

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        res.status(400).json({
          message:
            "A valid user ID is required.",
        });

        return;
      }

      await pool.query(
        `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = ?
           OR user_id IS NULL
        `,
        [userId],
      );

      res.json({
        message:
          "All notifications marked as read.",
      });
    } catch (error) {
      console.error(
        "Read all notifications error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to update notifications.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| Delete Notification
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const notificationId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          notificationId,
        ) ||
        notificationId <= 0
      ) {
        res.status(400).json({
          message:
            "Invalid notification ID.",
        });

        return;
      }

      const [result] =
        await pool.query(
          `
          DELETE FROM notifications
          WHERE id = ?
          `,
          [notificationId],
        );

      const deleteResult =
        result as {
          affectedRows: number;
        };

      if (
        deleteResult.affectedRows === 0
      ) {
        res.status(404).json({
          message:
            "Notification not found.",
        });

        return;
      }

      res.json({
        message:
          "Notification deleted.",
      });
    } catch (error) {
      console.error(
        "Delete notification error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to delete notification.",
      });
    }
  },
);

export default router;
