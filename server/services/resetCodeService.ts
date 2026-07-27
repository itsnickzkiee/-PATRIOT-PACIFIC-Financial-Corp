import crypto from "crypto";
import bcrypt from "bcrypt";

export const RESET_CODE_EXPIRY_MINUTES = 10;
export const MAX_RESET_ATTEMPTS = 5;

/**
 * Gumagawa ng secure na 6-digit verification code.
 */
export function generateResetCode(): string {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

/**
 * Gumagawa ng expiration date para sa reset code.
 */
export function createResetCodeExpiry(): Date {
  const expiresAt = new Date();

  expiresAt.setMinutes(
    expiresAt.getMinutes() +
      RESET_CODE_EXPIRY_MINUTES,
  );

  return expiresAt;
}

/**
 * Hini-hash ang verification code bago i-save sa database.
 */
export async function hashResetCode(
  code: string,
): Promise<string> {
  return bcrypt.hash(code, 10);
}

/**
 * Kinukumpara ang code na nilagay ng user
 * sa hashed code mula sa database.
 */
export async function verifyResetCode(
  code: string,
  codeHash: string,
): Promise<boolean> {
  return bcrypt.compare(code, codeHash);
}

/**
 * Validation para siguraduhing eksaktong
 * anim na numero ang reset code.
 */
export function isValidResetCodeFormat(
  code: unknown,
): code is string {
  return (
    typeof code === "string" &&
    /^\d{6}$/.test(code.trim())
  );
}