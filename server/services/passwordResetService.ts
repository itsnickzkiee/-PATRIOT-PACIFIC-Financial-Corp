import bcrypt from "bcrypt";

import pool from "../src/config/database.js";
import { sendMail } from "../src/config/mailer.js";

import {
  createResetCodeExpiry,
  generateResetCode,
  hashResetCode,
  MAX_RESET_ATTEMPTS,
  RESET_CODE_EXPIRY_MINUTES,
  verifyResetCode as compareResetCode,
} from "./resetCodeService.js";

import { createResetPasswordEmail } from "../templates/resetPasswordEmail.js";

type UserRecord = {
  id: number;
  full_name: string;
  email: string;
  status: string;
};

type ResetCodeRecord = {
  id: number;
  user_id: number;
  code_hash: string;
  expires_at: Date | string;
  used_at: Date | string | null;
  attempts: number;
};

export type ResetCodeResult = {
  success: boolean;
  reason?:
    | "USER_NOT_FOUND"
    | "DEACTIVATED"
    | "EMAIL_FAILED";
};

export type VerificationResult = {
  valid: boolean;
  reason?:
    | "INVALID_CODE"
    | "EXPIRED"
    | "USED"
    | "TOO_MANY_ATTEMPTS"
    | "USER_NOT_FOUND";
};

/*
|--------------------------------------------------------------------------
| Send Password Reset Code
|--------------------------------------------------------------------------
*/

export async function sendPasswordResetCode(
  email: string,
): Promise<ResetCodeResult> {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      full_name,
      email,
      status
    FROM users
    WHERE LOWER(email) = LOWER(?)
    LIMIT 1
    `,
    [email],
  );

  const users = rows as UserRecord[];
  const user = users[0];

  if (!user) {
    return {
      success: false,
      reason: "USER_NOT_FOUND",
    };
  }

  if (user.status === "Deactivated") {
    return {
      success: false,
      reason: "DEACTIVATED",
    };
  }

  const code = generateResetCode();
  const codeHash = await hashResetCode(code);
  const expiresAt = createResetCodeExpiry();

  await pool.query(
    `
    DELETE FROM password_reset_codes
    WHERE user_id = ?
    `,
    [user.id],
  );

  await pool.query(
    `
    INSERT INTO password_reset_codes
    (
      user_id,
      code_hash,
      expires_at,
      attempts
    )
    VALUES (?, ?, ?, 0)
    `,
    [user.id, codeHash, expiresAt],
  );

  const emailSent = await sendMail({
    to: user.email,
    subject: "Password Reset Verification Code",

    html: createResetPasswordEmail({
      recipientName: user.full_name,
      code,
      expiresInMinutes:
        RESET_CODE_EXPIRY_MINUTES,
    }),

    text:
      `Your Patriot Pacific password reset code is ${code}. ` +
      `It expires in ${RESET_CODE_EXPIRY_MINUTES} minutes.`,
  });

  if (!emailSent) {
    await pool.query(
      `
      DELETE FROM password_reset_codes
      WHERE user_id = ?
      `,
      [user.id],
    );

    return {
      success: false,
      reason: "EMAIL_FAILED",
    };
  }

  return {
    success: true,
  };
}

/*
|--------------------------------------------------------------------------
| Find Latest Reset Code
|--------------------------------------------------------------------------
*/

async function findLatestResetCode(
  email: string,
): Promise<{
  user: UserRecord | undefined;
  resetCode: ResetCodeRecord | undefined;
}> {
  const [userRows] = await pool.query(
    `
    SELECT
      id,
      full_name,
      email,
      status
    FROM users
    WHERE LOWER(email) = LOWER(?)
    LIMIT 1
    `,
    [email],
  );

  const users = userRows as UserRecord[];
  const user = users[0];

  if (!user) {
    return {
      user: undefined,
      resetCode: undefined,
    };
  }

  const [codeRows] = await pool.query(
    `
    SELECT
      id,
      user_id,
      code_hash,
      expires_at,
      used_at,
      attempts
    FROM password_reset_codes
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [user.id],
  );

  const resetCodes =
    codeRows as ResetCodeRecord[];

  return {
    user,
    resetCode: resetCodes[0],
  };
}

/*
|--------------------------------------------------------------------------
| Verify Password Reset Code
|--------------------------------------------------------------------------
*/

export async function verifyPasswordResetCode(
  email: string,
  code: string,
): Promise<VerificationResult> {
  const { user, resetCode } =
    await findLatestResetCode(email);

  if (!user || !resetCode) {
    return {
      valid: false,
      reason: "USER_NOT_FOUND",
    };
  }

  if (resetCode.used_at) {
    return {
      valid: false,
      reason: "USED",
    };
  }

  if (
    resetCode.attempts >=
    MAX_RESET_ATTEMPTS
  ) {
    return {
      valid: false,
      reason: "TOO_MANY_ATTEMPTS",
    };
  }

  const expirationDate = new Date(
    resetCode.expires_at,
  );

  if (
    Number.isNaN(expirationDate.getTime()) ||
    expirationDate.getTime() <= Date.now()
  ) {
    return {
      valid: false,
      reason: "EXPIRED",
    };
  }

  const codeMatches =
    await compareResetCode(
      code,
      resetCode.code_hash,
    );

  if (!codeMatches) {
    await pool.query(
      `
      UPDATE password_reset_codes
      SET attempts = attempts + 1
      WHERE id = ?
      `,
      [resetCode.id],
    );

    return {
      valid: false,
      reason: "INVALID_CODE",
    };
  }

  return {
    valid: true,
  };
}

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
*/

export async function resetUserPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<VerificationResult> {
  const verification =
    await verifyPasswordResetCode(
      email,
      code,
    );

  if (!verification.valid) {
    return verification;
  }

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [userRows] =
      await connection.query(
        `
        SELECT
          id,
          full_name,
          email,
          status
        FROM users
        WHERE LOWER(email) = LOWER(?)
        LIMIT 1
        FOR UPDATE
        `,
        [email],
      );

    const users =
      userRows as UserRecord[];

    const user = users[0];

    if (!user) {
      await connection.rollback();

      return {
        valid: false,
        reason: "USER_NOT_FOUND",
      };
    }

    const [codeRows] =
      await connection.query(
        `
        SELECT
          id,
          user_id,
          code_hash,
          expires_at,
          used_at,
          attempts
        FROM password_reset_codes
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
        `,
        [user.id],
      );

    const resetCodes =
      codeRows as ResetCodeRecord[];

    const resetCode = resetCodes[0];

    if (!resetCode || resetCode.used_at) {
      await connection.rollback();

      return {
        valid: false,
        reason: "USED",
      };
    }

    const expirationDate = new Date(
      resetCode.expires_at,
    );

    if (
      Number.isNaN(
        expirationDate.getTime(),
      ) ||
      expirationDate.getTime() <=
        Date.now()
    ) {
      await connection.rollback();

      return {
        valid: false,
        reason: "EXPIRED",
      };
    }

    const codeMatches =
      await compareResetCode(
        code,
        resetCode.code_hash,
      );

    if (!codeMatches) {
      await connection.query(
        `
        UPDATE password_reset_codes
        SET attempts = attempts + 1
        WHERE id = ?
        `,
        [resetCode.id],
      );

      await connection.commit();

      return {
        valid: false,
        reason: "INVALID_CODE",
      };
    }

    const passwordHash =
      await bcrypt.hash(newPassword, 12);

    await connection.query(
      `
      UPDATE users
      SET
        password_hash = ?,
        must_change_password = 0
      WHERE id = ?
      `,
      [passwordHash, user.id],
    );

    await connection.query(
      `
      UPDATE password_reset_codes
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [resetCode.id],
    );

    await connection.commit();

    return {
      valid: true,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}