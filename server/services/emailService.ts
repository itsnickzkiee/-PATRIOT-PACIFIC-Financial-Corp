import nodemailer from "nodemailer";

type LoanAssignmentEmailData = {
  recipientEmail: string;
  recipientName: string;
  assignmentRole: string;
  borrower: string;
  loanId: string;
  loanStatus: string;
  property?: string;
  state?: string;
  loanAmount?: number;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatLoanAmount(value?: number): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "N/A";
  }

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export async function sendLoanAssignmentEmail({
  recipientEmail,
  recipientName,
  assignmentRole,
  borrower,
  loanId,
  loanStatus,
  property,
  state,
  loanAmount,
}: LoanAssignmentEmailData): Promise<void> {
  const cleanEmail = recipientEmail.trim();

  if (!cleanEmail) {
    return;
  }

  await transporter.sendMail({
    from:
      process.env.MAIL_FROM ??
      process.env.SMTP_USER,
    to: cleanEmail,
    subject: `New Loan Assignment - Loan #${loanId}`,
    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
        "
      >
        <h2>New Loan Assignment</h2>

        <p>
          Hello ${escapeHtml(recipientName)},
        </p>

        <p>
          You have been assigned as
          <strong>${escapeHtml(assignmentRole)}</strong>
          to the following loan:
        </p>

        <table
          style="
            border-collapse: collapse;
            width: 100%;
            max-width: 560px;
          "
        >
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <strong>Loan ID</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              ${escapeHtml(loanId)}
            </td>
          </tr>

          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <strong>Borrower</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              ${escapeHtml(borrower)}
            </td>
          </tr>

          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <strong>Status</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              ${escapeHtml(loanStatus)}
            </td>
          </tr>

          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <strong>Assignment</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              ${escapeHtml(assignmentRole)}
            </td>
          </tr>

          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <strong>Property</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              ${escapeHtml(property ?? "N/A")}
            </td>
          </tr>

          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <strong>State</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              ${escapeHtml(state ?? "N/A")}
            </td>
          </tr>

          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <strong>Loan Amount</strong>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              ${formatLoanAmount(loanAmount)}
            </td>
          </tr>
        </table>

        <p>
          Please log in to the Patriot Pacific Loan Management
          System to review the loan.
        </p>

        <p>
          Regards,<br />
          Patriot Pacific
        </p>
      </div>
    `,
  });
}