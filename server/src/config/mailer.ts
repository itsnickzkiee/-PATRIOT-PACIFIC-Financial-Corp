import dns from "node:dns";
import nodemailer from "nodemailer";

dns.setDefaultResultOrder("ipv4first");

const emailUser =
  process.env.EMAIL_USER;

const emailAppPassword =
  process.env.EMAIL_APP_PASSWORD;

if (!emailUser || !emailAppPassword) {
  console.warn(
    "Email credentials are missing. Check EMAIL_USER and EMAIL_APP_PASSWORD.",
  );
}

const transporter =
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
      user: emailUser,
      pass: emailAppPassword,
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

const frontendUrl =
  process.env.FRONTEND_URL ??
  "http://localhost:5173";

const senderName =
  process.env.EMAIL_FROM_NAME ??
  "Patriot Pacific Financial Corp.";

function escapeHtml(
  value: string,
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type EmailLayoutOptions = {
  title: string;
  greeting: string;
  message: string;

  details?: Array<{
    label: string;
    value: string;
    highlight?: boolean;
  }>;

  buttonLabel?: string;
  buttonUrl?: string;
  securityNote?: string;
};

function emailLayout({
  title,
  greeting,
  message,
  details = [],
  buttonLabel,
  buttonUrl,
  securityNote,
}: EmailLayoutOptions): string {
  const detailRows = details
    .map(
      ({
        label,
        value,
        highlight,
      }) => `
        <div style="margin-bottom:14px;">
          <div
            style="
              font-size:12px;
              font-weight:700;
              letter-spacing:.08em;
              text-transform:uppercase;
              color:#806b72;
            "
          >
            ${escapeHtml(label)}
          </div>

          ${
            highlight
              ? `
                <div
                  style="
                    display:inline-block;
                    margin-top:7px;
                    padding:11px 15px;
                    border-radius:9px;
                    background:#710d25;
                    color:#fff;
                    font-size:18px;
                    font-weight:800;
                    letter-spacing:1px;
                  "
                >
                  ${escapeHtml(value)}
                </div>
              `
              : `
                <div
                  style="
                    margin-top:5px;
                    font-size:15px;
                    font-weight:700;
                    color:#30282b;
                    word-break:break-word;
                  "
                >
                  ${escapeHtml(value)}
                </div>
              `
          }
        </div>
      `,
    )
    .join("");

  return `
    <!doctype html>

    <html>
      <body
        style="
          margin:0;
          background:#f6f3f4;
          font-family:Arial,sans-serif;
          color:#30282b;
        "
      >
        <div style="padding:32px 16px;">
          <div
            style="
              max-width:620px;
              margin:0 auto;
              background:#fff;
              border-radius:18px;
              overflow:hidden;
              box-shadow:
                0 12px 34px
                rgba(76,13,29,.14);
            "
          >
            <div
              style="
                padding:30px;
                background:
                  linear-gradient(
                    135deg,
                    #350711,
                    #8c1230
                  );
                color:#fff;
              "
            >
              <div
                style="
                  font-size:25px;
                  font-weight:800;
                "
              >
                Patriot Pacific
              </div>

              <div
                style="
                  margin-top:5px;
                  color:#f2dce3;
                "
              >
                Financial Corp.
              </div>
            </div>

            <div style="padding:32px;">
              <h1
                style="
                  margin:0 0 16px;
                  color:#710d25;
                  font-size:24px;
                "
              >
                ${escapeHtml(title)}
              </h1>

              <p
                style="
                  margin:0 0 12px;
                  font-size:16px;
                  line-height:1.6;
                "
              >
                ${escapeHtml(greeting)}
              </p>

              <p
                style="
                  margin:0;
                  font-size:15px;
                  line-height:1.7;
                  color:#5f5055;
                "
              >
                ${escapeHtml(message)}
              </p>

              ${
                detailRows
                  ? `
                    <div
                      style="
                        margin:25px 0;
                        padding:21px;
                        background:#fff8fa;
                        border:
                          1px solid #eadde1;
                        border-radius:13px;
                      "
                    >
                      ${detailRows}
                    </div>
                  `
                  : ""
              }

              ${
                buttonLabel &&
                buttonUrl
                  ? `
                    <a
                      href="${escapeHtml(
                        buttonUrl,
                      )}"
                      style="
                        display:inline-block;
                        padding:12px 23px;
                        background:#8c1230;
                        border-radius:10px;
                        color:#fff;
                        text-decoration:none;
                        font-weight:800;
                      "
                    >
                      ${escapeHtml(
                        buttonLabel,
                      )}
                    </a>
                  `
                  : ""
              }

              ${
                securityNote
                  ? `
                    <div
                      style="
                        margin-top:24px;
                        padding:14px 16px;
                        border-left:
                          4px solid #8c1230;
                        background:#fbf3f5;
                        color:#705d63;
                        font-size:13px;
                        line-height:1.6;
                      "
                    >
                      ${escapeHtml(
                        securityNote,
                      )}
                    </div>
                  `
                  : ""
              }
            </div>

            <div
              style="
                padding:18px 32px;
                background:#f8f5f6;
                color:#806b72;
                font-size:12px;
                line-height:1.6;
              "
            >
              This is an automated security
              message from Patriot Pacific
              Financial Corp.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function deliverEmail(
  options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  },
): Promise<void> {
  if (
    !emailUser ||
    !emailAppPassword
  ) {
    throw new Error(
      "Email service credentials are not configured.",
    );
  }

  await transporter.sendMail({
    from: {
      name: senderName,
      address: emailUser,
    },

    ...options,
  });
}

export async function verifyEmailConnection(): Promise<void> {
  if (
    !emailUser ||
    !emailAppPassword
  ) {
    console.warn(
      "Email verification skipped because credentials are missing.",
    );

    return;
  }

  try {
    await transporter.verify();

    console.log(
      "Email service connected successfully.",
    );
  } catch (error) {
    console.warn(
      "Email service is unavailable. Backend will continue running.",
    );

    console.error(
      "Email connection error:",
      error,
    );
  }
}

type TemporaryPasswordReason =
  | "account_created"
  | "email_changed"
  | "password_reset";

type SendTemporaryPasswordOptions = {
  recipientName: string;
  recipientEmail: string;
  temporaryPassword: string;
  role: string;
  reason?: TemporaryPasswordReason;
};

export async function sendTemporaryPasswordEmail({
  recipientName,
  recipientEmail,
  temporaryPassword,
  role,
  reason = "account_created",
}: SendTemporaryPasswordOptions): Promise<void> {
  const title =
    reason === "password_reset"
      ? "Your Password Was Reset"
      : reason === "email_changed"
        ? "Your Login Email Was Updated"
        : "Your Account Has Been Created";

  const subject =
    reason === "password_reset"
      ? "Patriot Pacific – Temporary Password"
      : reason === "email_changed"
        ? "Patriot Pacific – New Email and Temporary Password"
        : "Patriot Pacific – Your Account Has Been Created";

  const message =
    reason === "password_reset"
      ? "An administrator reset your password. Use the temporary password below to sign in."
      : reason === "email_changed"
        ? "Your account email was changed. A new temporary password was created for your security."
        : "Your Patriot Pacific account was created successfully.";

  await deliverEmail({
    to: recipientEmail,
    subject,

    text: `
Hello ${recipientName},

${message}

Email: ${recipientEmail}
Role: ${role}
Temporary Password: ${temporaryPassword}

Login: ${frontendUrl}/login

You must change this temporary password after signing in.
    `.trim(),

    html: emailLayout({
      title,
      greeting:
        `Hello ${recipientName},`,
      message,

      details: [
        {
          label: "Email",
          value: recipientEmail,
        },
        {
          label: "Role",
          value: role,
        },
        {
          label:
            "Temporary Password",
          value:
            temporaryPassword,
          highlight: true,
        },
      ],

      buttonLabel: "Sign In",
      buttonUrl:
        `${frontendUrl}/login`,

      securityNote:
        "For your security, you must create a new password after signing in. Do not share this temporary password.",
    }),
  });

  console.log(
    `Temporary password email sent to ${recipientEmail}.`,
  );
}

export async function sendEmailChangedSecurityAlert(
  options: {
    recipientName: string;
    oldEmail: string;
    newEmail: string;
  },
): Promise<void> {
  await deliverEmail({
    to: options.oldEmail,

    subject:
      "Patriot Pacific – Security Alert: Email Changed",

    text: `
Hello ${options.recipientName},

Your Patriot Pacific account email was changed.

Old email: ${options.oldEmail}
New email: ${options.newEmail}

If you did not expect this change, contact your administrator immediately.
    `.trim(),

    html: emailLayout({
      title:
        "Security Alert: Email Changed",

      greeting:
        `Hello ${options.recipientName},`,

      message:
        "The login email connected to your Patriot Pacific account was changed.",

      details: [
        {
          label:
            "Previous Email",
          value:
            options.oldEmail,
        },
        {
          label:
            "New Email",
          value:
            options.newEmail,
        },
      ],

      securityNote:
        "If you did not expect this change, contact your administrator immediately.",
    }),
  });
}

export async function sendAccountUpdatedEmail(
  options: {
    recipientName: string;
    recipientEmail: string;
    role: string;
  },
): Promise<void> {
  await deliverEmail({
    to: options.recipientEmail,

    subject:
      "Patriot Pacific – Account Information Updated",

    text: `
Hello ${options.recipientName},

Your Patriot Pacific account information was updated.

Email: ${options.recipientEmail}
Role: ${options.role}
    `.trim(),

    html: emailLayout({
      title:
        "Account Information Updated",

      greeting:
        `Hello ${options.recipientName},`,

      message:
        "An administrator updated your Patriot Pacific account information.",

      details: [
        {
          label: "Email",
          value:
            options.recipientEmail,
        },
        {
          label: "Role",
          value: options.role,
        },
      ],

      buttonLabel:
        "Open Patriot Pacific",

      buttonUrl:
        `${frontendUrl}/login`,

      securityNote:
        "Contact your administrator if you do not recognise this update.",
    }),
  });
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(
  options: SendMailOptions,
): Promise<boolean> {
  try {
    await deliverEmail({
      to: options.to,
      subject: options.subject,

      text:
        options.text ??
        "Please view this email in an HTML-compatible email client.",

      html: options.html,
    });

    return true;
  } catch (error) {
    console.error(
      "Failed to send email:",
      error,
    );

    return false;
  }
}

export function getFrontendUrl(): string {
  return frontendUrl;
}