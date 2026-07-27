type ResetPasswordEmailParams = {
  recipientName: string;
  code: string;
  expiresInMinutes?: number;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createResetPasswordEmail({
  recipientName,
  code,
  expiresInMinutes = 10,
}: ResetPasswordEmailParams): string {
  const safeName = escapeHtml(
    recipientName || "User",
  );

  const safeCode = escapeHtml(code);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>Password Reset Code</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f4f7fb;
          font-family: Arial, Helvetica, sans-serif;
          color: #1f2937;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
        >
          <tr>
            <td
              align="center"
              style="padding: 40px 16px"
            >
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="
                  max-width: 560px;
                  background-color: #ffffff;
                  border-radius: 14px;
                  overflow: hidden;
                  box-shadow:
                    0 10px 30px
                    rgba(15, 23, 42, 0.08);
                "
              >
                <tr>
                  <td
                    style="
                      padding: 24px 32px;
                      background-color: #174a75;
                      color: #ffffff;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        font-size: 22px;
                      "
                    >
                      Patriot Pacific
                    </h1>

                    <p
                      style="
                        margin: 6px 0 0;
                        font-size: 14px;
                        color: #dbeafe;
                      "
                    >
                      Loan Management System
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 32px">
                    <h2
                      style="
                        margin: 0 0 18px;
                        font-size: 22px;
                        color: #172033;
                      "
                    >
                      Reset your password
                    </h2>

                    <p
                      style="
                        margin: 0 0 16px;
                        line-height: 1.6;
                      "
                    >
                      Hello ${safeName},
                    </p>

                    <p
                      style="
                        margin: 0 0 22px;
                        line-height: 1.6;
                      "
                    >
                      Use the verification code below
                      to reset your account password.
                    </p>

                    <div
                      style="
                        margin: 24px 0;
                        padding: 20px;
                        text-align: center;
                        background-color: #eff6ff;
                        border: 1px solid #bfdbfe;
                        border-radius: 10px;
                      "
                    >
                      <p
                        style="
                          margin: 0 0 8px;
                          font-size: 13px;
                          color: #64748b;
                          text-transform: uppercase;
                          letter-spacing: 1px;
                        "
                      >
                        Verification code
                      </p>

                      <div
                        style="
                          font-size: 34px;
                          font-weight: bold;
                          letter-spacing: 8px;
                          color: #174a75;
                        "
                      >
                        ${safeCode}
                      </div>
                    </div>

                    <p
                      style="
                        margin: 0 0 12px;
                        line-height: 1.6;
                        color: #475569;
                      "
                    >
                      This code will expire in
                      <strong>
                        ${expiresInMinutes} minutes
                      </strong>.
                    </p>

                    <p
                      style="
                        margin: 0;
                        line-height: 1.6;
                        color: #475569;
                      "
                    >
                      Do not share this code with
                      anyone. If you did not request
                      a password reset, you can safely
                      ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 20px 32px;
                      background-color: #f8fafc;
                      color: #64748b;
                      font-size: 12px;
                      text-align: center;
                    "
                  >
                    This is an automated message from
                    Patriot Pacific.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}