import express from "express";
import bcrypt from "bcrypt";

import pool from "../config/database.js";

type DatabaseUser = {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: string;
  status: string;
  must_change_password: number | boolean;
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
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body.password === "string"
        ? req.body.password
        : "";

    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required.",
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

    const users = rows as DatabaseUser[];
    const user = users[0];

    if (!user) {
      res.status(401).json({
        message: "Incorrect email or password.",
      });

      return;
    }

    if (user.status === "Deactivated") {
      res.status(403).json({
        message:
          "Your account has been deactivated. Please contact the administrator.",
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
        message: "Incorrect email or password.",
      });

      return;
    }

    await pool.query(
      `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [user.id],
    );

    res.json({
      message: "Login successful.",

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
    console.error("Login error:", error);

    res.status(500).json({
      message:
        "Server error. Unable to login at this time.",
    });
  }
});

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
          phone: user.phone_number,
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

export default router;