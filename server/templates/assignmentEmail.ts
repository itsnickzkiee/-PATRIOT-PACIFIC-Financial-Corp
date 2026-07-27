export interface AssignmentEmailData {
  recipientName: string;
  assignmentRole: string;
  borrower: string;
  loanId: string;
  loanStatus: string;
  property: string;
  state: string;
  loanAmount: string;
  signInUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function assignmentEmail(
  data: AssignmentEmailData
): string {
  const recipientName = escapeHtml(data.recipientName);
  const assignmentRole = escapeHtml(data.assignmentRole);
  const borrower = escapeHtml(data.borrower);
  const loanId = escapeHtml(data.loanId);
  const loanStatus = escapeHtml(data.loanStatus);
  const property = escapeHtml(data.property);
  const state = escapeHtml(data.state);
  const loanAmount = escapeHtml(data.loanAmount);
  const signInUrl = escapeHtml(data.signInUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Loan Assignment Notification</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background-color: #f3f4f6;
    font-family: Arial, Helvetica, sans-serif;
    color: #1f2937;
  "
>
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="background-color: #f3f4f6;"
  >
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            max-width: 650px;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
          "
        >
          <tr>
            <td
              align="center"
              style="
                padding: 30px 24px;
                background-color: #7b1e22;
                color: #ffffff;
              "
            >
              <h1
                style="
                  margin: 0;
                  font-size: 25px;
                  line-height: 1.3;
                "
              >
                Patriot Pacific Financial Corp.
              </h1>

              <p
                style="
                  margin: 8px 0 0;
                  font-size: 15px;
                  color: #f9d6d8;
                "
              >
                Loan Assignment Notification
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 34px 30px;">
              <h2
                style="
                  margin: 0 0 16px;
                  color: #7b1e22;
                  font-size: 22px;
                "
              >
                Hello ${recipientName},
              </h2>

              <p
                style="
                  margin: 0 0 20px;
                  font-size: 16px;
                  line-height: 1.6;
                "
              >
                You have been assigned as
                <strong>${assignmentRole}</strong>
                for the following loan.
              </p>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  overflow: hidden;
                "
              >
                <tr>
                  <td
                    style="
                      width: 38%;
                      padding: 13px;
                      background-color: #f9fafb;
                      border-bottom: 1px solid #e5e7eb;
                      font-weight: bold;
                    "
                  >
                    Borrower
                  </td>

                  <td
                    style="
                      padding: 13px;
                      border-bottom: 1px solid #e5e7eb;
                    "
                  >
                    ${borrower}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 13px;
                      background-color: #f9fafb;
                      border-bottom: 1px solid #e5e7eb;
                      font-weight: bold;
                    "
                  >
                    Loan ID
                  </td>

                  <td
                    style="
                      padding: 13px;
                      border-bottom: 1px solid #e5e7eb;
                    "
                  >
                    ${loanId}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 13px;
                      background-color: #f9fafb;
                      border-bottom: 1px solid #e5e7eb;
                      font-weight: bold;
                    "
                  >
                    Loan Status
                  </td>

                  <td
                    style="
                      padding: 13px;
                      border-bottom: 1px solid #e5e7eb;
                    "
                  >
                    ${loanStatus}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 13px;
                      background-color: #f9fafb;
                      border-bottom: 1px solid #e5e7eb;
                      font-weight: bold;
                    "
                  >
                    Property
                  </td>

                  <td
                    style="
                      padding: 13px;
                      border-bottom: 1px solid #e5e7eb;
                    "
                  >
                    ${property}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 13px;
                      background-color: #f9fafb;
                      border-bottom: 1px solid #e5e7eb;
                      font-weight: bold;
                    "
                  >
                    State
                  </td>

                  <td
                    style="
                      padding: 13px;
                      border-bottom: 1px solid #e5e7eb;
                    "
                  >
                    ${state}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 13px;
                      background-color: #f9fafb;
                      font-weight: bold;
                    "
                  >
                    Loan Amount
                  </td>

                  <td style="padding: 13px;">
                    ${loanAmount}
                  </td>
                </tr>
              </table>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td
                    align="center"
                    style="padding-top: 30px;"
                  >
                    <a
                      href="${signInUrl}"
                      style="
                        display: inline-block;
                        padding: 14px 30px;
                        background-color: #7b1e22;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: bold;
                      "
                    >
                      Sign In to View Loan
                    </a>
                  </td>
                </tr>
              </table>

              <p
                style="
                  margin: 30px 0 0;
                  color: #4b5563;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                Please sign in to your Patriot Pacific account
                to review the loan information and continue the
                required processing.
              </p>
            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="
                padding: 20px;
                background-color: #f9fafb;
                color: #6b7280;
                font-size: 12px;
                line-height: 1.6;
              "
            >
              © ${new Date().getFullYear()}
              Patriot Pacific Financial Corp.
              <br />

              This is an automated notification.
              Please do not reply to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}