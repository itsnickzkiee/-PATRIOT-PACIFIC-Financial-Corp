import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2";

import pool from "../src/config/database.js";

type NotificationUserRow =
  RowDataPacket & {
    id: number;
    notifications_enabled:
      | number
      | boolean
      | null;
  };

type RecipientRow =
  RowDataPacket & {
    id: number;
  };

export async function createNotification(
  userId: number,
  message: string,
  type = "general",
): Promise<boolean> {
  if (
    !Number.isInteger(userId) ||
    userId <= 0 ||
    !message.trim()
  ) {
    return false;
  }

  const [rows] =
    await pool.query<
      NotificationUserRow[]
    >(
      `
      SELECT
        id,
        notifications_enabled
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId],
    );

  const user = rows[0];

  if (
    !user ||
    !Boolean(
      user.notifications_enabled,
    )
  ) {
    return false;
  }

  await pool.execute<ResultSetHeader>(
    `
    INSERT INTO notifications (
      user_id,
      message,
      type,
      is_read
    )
    VALUES (?, ?, ?, FALSE)
    `,
    [
      userId,
      message.trim(),
      type,
    ],
  );

  return true;
}

export async function createBroadcastNotification(
  message: string,
  type = "general",
  excludeUserId?: number,
): Promise<number> {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    return 0;
  }

  const params: number[] = [];
  let excludeSql = "";

  if (
    Number.isInteger(excludeUserId) &&
    Number(excludeUserId) > 0
  ) {
    excludeSql = "AND id <> ?";
    params.push(Number(excludeUserId));
  }

  const [recipients] =
    await pool.query<RecipientRow[]>(
      `
      SELECT id
      FROM users
      WHERE
        COALESCE(
          notifications_enabled,
          1
        ) = 1
        AND LOWER(TRIM(status)) IN (
          'active',
          'registered'
        )
        ${excludeSql}
      `,
      params,
    );

  if (recipients.length === 0) {
    return 0;
  }

  const placeholders = recipients
    .map(() => "(?, ?, ?, FALSE)")
    .join(", ");

  const values:
    Array<string | number> = [];

  for (const recipient of recipients) {
    values.push(
      recipient.id,
      cleanMessage,
      type,
    );
  }

  const [result] =
    await pool.execute<ResultSetHeader>(
      `
      INSERT INTO notifications (
        user_id,
        message,
        type,
        is_read
      )
      VALUES ${placeholders}
      `,
      values,
    );

  return result.affectedRows;
}
