import bcrypt from "bcrypt";
import pool from "./database.js";

export async function seedSuperAdmin(): Promise<void> {
  try {
    const [rows] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE role = ?
      LIMIT 1
      `,
      ["Super Admin"]
    );

    const existingAdmins = rows as Array<{ id: number }>;

    if (existingAdmins.length > 0) {
      console.log("Super Admin already exists.");
      return;
    }

    const defaultPassword = "Admin@123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await pool.query(
      `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role,
        status,
        must_change_password
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        "System Administrator",
        "admin@patriotpacific.com",
        passwordHash,
        "Super Admin",
        "Registered",
        1,
      ]
    );

    console.log("----------------------------------------");
    console.log("SUPER ADMIN CREATED");
    console.log("Email: admin@patriotpacific.com");
    console.log("Temporary password: Admin@123");
    console.log("----------------------------------------");
  } catch (error) {
    console.error("Failed to create Super Admin:", error);
    throw error;
  }
}