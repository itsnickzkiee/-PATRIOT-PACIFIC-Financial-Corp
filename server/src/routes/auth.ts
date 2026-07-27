import express from "express";
import bcrypt from "bcrypt";

import pool from "../config/database.js";

import {
  resetUserPassword,
  sendPasswordResetCode,
  verifyPasswordResetCode,
} from "../../services/passwordResetService.js";

import {
  isValidResetCodeFormat,
  MAX_RESET_ATTEMPTS,
} from "../../services/resetCodeService.js";


import {
  createAccessToken,
} from "../../utils/jwt.js";

type DatabaseUser = {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: string;
  status: string;
  must_change_password:
    | number
    | boolean;
};

type DatabaseProfile = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  status: string;
  phone_number: string | null;
  department: string | null;
  company: string | null;
  location: string | null;
  last_login_at: string | null;
  created_at: string;
};

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

router.post("/login", async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email
            .trim()
            .toLowerCase()
        : "";

    const password =
      typeof req.body.password ===
      "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      res.status(400).json({
        message:
          "Email and password are required.",
      });

      return;
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        password_hash,
        role,
        status,
        must_change_password
      FROM users
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
      `,
      [email],
    );

    const users =
      rows as DatabaseUser[];

    const user = users[0];

    if (!user) {
      res.status(401).json({
        message:
          "Incorrect email or password.",
      });

      return;
    }

    if (user.status !== "Registered") {
  res.status(403).json({
    message:
      user.status === "Deactivated"
        ? "Your account has been deactivated. Please contact the administrator."
        : "Your account is not yet registered. Please complete account verification.",
  });

  return;
}

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password_hash,
      );

    if (!passwordMatches) {
      res.status(401).json({
        message:
          "Incorrect email or password.",
      });

      return;
    }

    await pool.query(
      `
      UPDATE users
      SET last_login_at =
        CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [user.id],
    );

    const token = createAccessToken({
  userId: user.id,
  email: user.email,
  role: user.role,
});

res.json({
  message: "Login successful.",
  token,

  user: {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role,
    mustChangePassword: Boolean(
      user.must_change_password,
    ),
  },
});

  } catch (error) {
    console.error(
      "Login error:",
      error,
    );

    res.status(500).json({
      message:
        "Server error. Unable to login at this time.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Forgot Password
|--------------------------------------------------------------------------
*/

router.post(
  "/forgot-password",
  async (req, res) => {
    try {
      const email =
        typeof req.body.email ===
        "string"
          ? req.body.email
              .trim()
              .toLowerCase()
          : "";

      if (!email) {
        res.status(400).json({
          message:
            "Email address is required.",
        });

        return;
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        res.status(400).json({
          message:
            "Enter a valid email address.",
        });

        return;
      }

      const result =
        await sendPasswordResetCode(
          email,
        );

      if (
        result.reason ===
        "DEACTIVATED"
      ) {
        res.status(403).json({
          message:
            "This account has been deactivated. Please contact the administrator.",
        });

        return;
      }

      if (
        result.reason ===
        "EMAIL_FAILED"
      ) {
        res.status(500).json({
          message:
            "Unable to send the verification code. Please try again.",
        });

        return;
      }

      /*
       * Generic response para hindi malaman
       * kung registered o hindi ang email.
       */
      res.json({
        message:
          "If an account exists for this email, a verification code has been sent.",
      });
    } catch (error) {
      console.error(
        "Forgot password error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to process the password reset request.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| Verify Reset Code
|--------------------------------------------------------------------------
*/

router.post(
  "/verify-reset-code",
  async (req, res) => {
    try {
      const email =
        typeof req.body.email ===
        "string"
          ? req.body.email
              .trim()
              .toLowerCase()
          : "";

      const code =
        typeof req.body.code ===
        "string"
          ? req.body.code.trim()
          : "";

      if (!email || !code) {
        res.status(400).json({
          message:
            "Email and verification code are required.",
        });

        return;
      }

      if (
        !isValidResetCodeFormat(code)
      ) {
        res.status(400).json({
          message:
            "The verification code must contain exactly 6 digits.",
        });

        return;
      }

      const result =
        await verifyPasswordResetCode(
          email,
          code,
        );

      if (!result.valid) {
        if (
          result.reason ===
          "EXPIRED"
        ) {
          res.status(400).json({
            verified: false,
            message:
              "The verification code has expired. Request a new code.",
          });

          return;
        }

        if (
          result.reason === "USED"
        ) {
          res.status(400).json({
            verified: false,
            message:
              "This verification code has already been used.",
          });

          return;
        }

        if (
          result.reason ===
          "TOO_MANY_ATTEMPTS"
        ) {
          res.status(429).json({
            verified: false,
            message:
              `Too many incorrect attempts. Request a new code. Maximum attempts: ${MAX_RESET_ATTEMPTS}.`,
          });

          return;
        }

        res.status(400).json({
          verified: false,
          message:
            "Invalid email or verification code.",
        });

        return;
      }

      res.json({
        verified: true,
        message:
          "Verification code confirmed.",
      });
    } catch (error) {
      console.error(
        "Verify reset code error:",
        error,
      );

      res.status(500).json({
        verified: false,
        message:
          "Unable to verify the code.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
*/

router.post(
  "/reset-password",
  async (req, res) => {
    try {
      const email =
        typeof req.body.email ===
        "string"
          ? req.body.email
              .trim()
              .toLowerCase()
          : "";

      const code =
        typeof req.body.code ===
        "string"
          ? req.body.code.trim()
          : "";

      const newPassword =
        typeof req.body.newPassword ===
        "string"
          ? req.body.newPassword
          : "";

      const confirmPassword =
        typeof req.body
          .confirmPassword === "string"
          ? req.body.confirmPassword
          : "";

      if (
        !email ||
        !code ||
        !newPassword ||
        !confirmPassword
      ) {
        res.status(400).json({
          message:
            "Email, verification code, new password, and password confirmation are required.",
        });

        return;
      }

      if (
        !isValidResetCodeFormat(code)
      ) {
        res.status(400).json({
          message:
            "The verification code must contain exactly 6 digits.",
        });

        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          message:
            "The new password must contain at least 8 characters.",
        });

        return;
      }

      const hasUppercase =
        /[A-Z]/.test(newPassword);

      const hasLowercase =
        /[a-z]/.test(newPassword);

      const hasNumber =
        /\d/.test(newPassword);

      if (
        !hasUppercase ||
        !hasLowercase ||
        !hasNumber
      ) {
        res.status(400).json({
          message:
            "The password must contain an uppercase letter, lowercase letter, and number.",
        });

        return;
      }

      if (
        newPassword !== confirmPassword
      ) {
        res.status(400).json({
          message:
            "The password confirmation does not match.",
        });

        return;
      }

      const result =
        await resetUserPassword(
          email,
          code,
          newPassword,
        );

      if (!result.valid) {
        if (
          result.reason === "EXPIRED"
        ) {
          res.status(400).json({
            message:
              "The verification code has expired. Request a new code.",
          });

          return;
        }

        if (
          result.reason === "USED"
        ) {
          res.status(400).json({
            message:
              "This verification code has already been used.",
          });

          return;
        }

        if (
          result.reason ===
          "TOO_MANY_ATTEMPTS"
        ) {
          res.status(429).json({
            message:
              "Too many incorrect attempts. Request a new verification code.",
          });

          return;
        }

        res.status(400).json({
          message:
            "Invalid email or verification code.",
        });

        return;
      }

      res.json({
        message:
          "Password reset successful. You can now log in using your new password.",
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
| Get User Profile
|--------------------------------------------------------------------------
*/

router.get(
  "/profile/:id",
  async (req, res) => {
    try {
      const userId = Number(
        req.params.id,
      );

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

      const [rows] = await pool.query(
        `
        SELECT
          id,
          full_name,
          email,
          role,
          status,
          phone_number,
          department,
          company,
          location,
          last_login_at,
          created_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId],
      );

      const users =
        rows as DatabaseProfile[];

      const user = users[0];

      if (!user) {
        res.status(404).json({
          message:
            "User profile not found.",
        });

        return;
      }

      res.json({
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          status: user.status,
          phone:
            user.phone_number,
          department:
            user.department,
          company: user.company,
          location: user.location,
          lastActive:
            user.last_login_at,
          dateJoined:
            user.created_at,
        },
      });
    } catch (error) {
      console.error(
        "Load profile error:",
        error,
      );

      res.status(500).json({
        message:
          "Unable to load user profile.",
      });
    }
  },
);

router.post("/change-password", async (req, res) => {
  try {
    const userId = Number(req.body.userId);

    const currentPassword =
      typeof req.body.currentPassword === "string"
        ? req.body.currentPassword
        : "";

    const newPassword =
      typeof req.body.newPassword === "string"
        ? req.body.newPassword
        : "";

    const confirmPassword =
      typeof req.body.confirmPassword === "string"
        ? req.body.confirmPassword
        : "";

    if (
      !userId ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters.",
      });
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    if (
      !hasUppercase ||
      !hasLowercase ||
      !hasNumber
    ) {
      return res.status(400).json({
        message:
          "Password must contain uppercase, lowercase and number.",
      });
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        password_hash
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    const users = rows as {
      id: number;
      password_hash: string;
    }[];

    const user = users[0];

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const matches = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!matches) {
      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    const passwordHash = await bcrypt.hash(
      newPassword,
      12
    );

    await pool.query(
      `
      UPDATE users
      SET
        password_hash = ?,
        must_change_password = 0
      WHERE id = ?
      `,
      [passwordHash, userId]
    );

    res.json({
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to change password.",
    });
  }
});


export default router;