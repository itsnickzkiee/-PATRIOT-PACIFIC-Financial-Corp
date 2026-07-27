import express, {
  type Request,
} from "express";
import cors from "cors";
import dotenv from "dotenv";

import pool from "./config/database.js";
import { seedSuperAdmin } from "./config/SuperAdmin.js";
import {
  verifyEmailConnection,
} from "./config/mailer.js";
import {
  runLoanWorkflow,
} from "./config/loanWorkflow.js";

import loanRoutes from "./routes/loans.js";
import dashboardRoutes from "./routes/dashboard.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import loanFileRoutes from "./routes/loanFiles.js";
import loanNoteRoutes from "./routes/loanNotes.js";

type DatabaseNotification = {
  id: number;
  user_id: number | null;
  message: string;
  type: string;
  is_read: number | boolean;
  created_at: string;
};

dotenv.config();

const app = express();
const port = Number(
  process.env.PORT ?? 5000,
);

const workflowIntervalMs = Number(
  process.env
    .LOAN_WORKFLOW_INTERVAL_MS ??
    3_600_000,
);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:5173",
  "http://localhost:5000",
];

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          "Not allowed by CORS",
        ),
      );
    },
    credentials: true,
  }),
);

app.use(express.json());

function getRequestUserId(
  req: Request,
): number | null {
  const headerValue =
    req.headers["x-user-id"];

  const rawValue =
    Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue ??
        req.query.userId ??
        req.body?.currentUserId ??
        req.body?.userId;

  const userId = Number(rawValue);

  return Number.isInteger(userId) &&
    userId > 0
    ? userId
    : null;
}

/*
|--------------------------------------------------------------------------
| Authentication Route
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

/*
|--------------------------------------------------------------------------
| Old Working Routes — no JWT middleware
|--------------------------------------------------------------------------
*/

app.use("/api/users", userRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/loan-files", loanFileRoutes);
app.use("/api/loan-notes", loanNoteRoutes);

/*
|--------------------------------------------------------------------------
| Notifications — old x-user-id setup
|--------------------------------------------------------------------------
*/

app.get(
  "/api/notifications",
  async (req, res) => {
    try {
      const userId = getRequestUserId(req);

      if (!userId) {
        res.status(400).json({
          message:
            "A valid user ID is required.",
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
  },
);

app.patch(
  "/api/notifications/read-all",
  async (req, res) => {
    try {
      const userId = getRequestUserId(req);

      if (!userId) {
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

app.patch(
  "/api/notifications/:id/read",
  async (req, res) => {
    try {
      const userId = getRequestUserId(req);
      const notificationId =
        Number(req.params.id);

      if (!userId) {
        res.status(400).json({
          message:
            "A valid user ID is required.",
        });

        return;
      }

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
            AND (
              user_id = ?
              OR user_id IS NULL
            )
          `,
          [
            notificationId,
            userId,
          ],
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

app.get("/", (_req, res) => {
  res.json({
    message:
      "Patriot Pacific backend is running.",
  });
});

app.get(
  "/api/health",
  async (_req, res) => {
    try {
      await pool.query("SELECT 1");

      res.json({
        status: "ok",
        database: "connected",
      });
    } catch (error) {
      console.error(
        "Database connection failed:",
        error,
      );

      res.status(500).json({
        status: "error",
        database: "disconnected",
      });
    }
  },
);

async function executeWorkflow(): Promise<void> {
  try {
    await runLoanWorkflow();

    console.log(
      "Automatic loan workflow checked.",
    );
  } catch (error) {
    console.error(
      "Loan workflow error:",
      error,
    );
  }
}

async function startServer(): Promise<void> {
  try {
    await pool.query("SELECT 1");

    console.log("Database connected.");

    await seedSuperAdmin();
    await verifyEmailConnection();

    await executeWorkflow();

    app.listen(port, () => {
      console.log(
        `Server running at http://localhost:${port}`,
      );
    });

    setInterval(
      () => {
        void executeWorkflow();
      },
      workflowIntervalMs,
    );
  } catch (error) {
    console.error(
      "Failed to start server:",
      error,
    );

    process.exit(1);
  }
}

void startServer();