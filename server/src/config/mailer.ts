import nodemailer from "nodemailer";

const emailUser =
  process.env.EMAIL_USER;

const emailAppPassword =
  process.env.EMAIL_APP_PASSWORD;

if (!emailUser || !emailAppPassword) {
  console.warn(
    "Email credentials are missing. Check EMAIL_USER and EMAIL_APP_PASSWORD in .env.",
  );
}

const transporter =
  nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: emailUser,
      pass: emailAppPassword,
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

type SendTemporaryPasswordOptions = {
  recipientName: string;
  recipientEmail: string;
  temporaryPassword: string;
  role: string;
};

export async function verifyEmailConnection(): Promise<void> {
  if (!emailUser || !emailAppPassword) {
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

export async function sendTemporaryPasswordEmail({
  recipientName,
  recipientEmail,
  temporaryPassword,
  role,
}: SendTemporaryPasswordOptions): Promise<void> {
  if (!emailUser || !emailAppPassword) {
    throw new Error(
      "Email service credentials are not configured.",
    );
  }

  const frontendUrl =
    process.env.FRONTEND_URL ??
    "http://localhost:3000";

  const senderName =
    process.env.EMAIL_FROM_NAME ??
    "Patriot Pacific Financial Corp.";

  try {
    await transporter.sendMail({
      from: {
        name: senderName,
        address: emailUser,
      },

      to: recipientEmail,

      subject:
        "Patriot Pacific – Your Account Has Been Created",

      text: `
Hello ${recipientName},

Your Patriot Pacific account has been created.

Account details:

Email: ${recipientEmail}
Role: ${role}
Temporary Password: ${temporaryPassword}

Login here:
${frontendUrl}/login

For your security, please change your temporary password after your first login.

Regards,
Patriot Pacific Financial Corp.
      `.trim(),

      html: `
        <div
          style="
            background:#f6f3f4;
            padding:32px 16px;
            font-family:Arial,sans-serif;
            color:#30282b;
          "
        >
          <div
            style="
              max-width:600px;
              margin:0 auto;
              background:#ffffff;
              border-radius:16px;
              overflow:hidden;
              box-shadow:0 10px 30px rgba(76,13,29,0.12);
            "
          >
            <div
              style="
                padding:28px;
                background:linear-gradient(
                  135deg,
                  #350711,
                  #8c1230
                );
                color:#ffffff;
              "
            >
              <h1
                style="
                  margin:0;
                  font-size:24px;
                "
              >
                Patriot Pacific
              </h1>

              <p
                style="
                  margin:6px 0 0;
                  color:#f2dce3;
                "
              >
                Financial Corp.
              </p>
            </div>

            <div style="padding:30px;">
              <h2
                style="
                  margin-top:0;
                  color:#710d25;
                "
              >
                Welcome, ${recipientName}
              </h2>

              <p>
                Your Patriot Pacific account has
                been created successfully.
              </p>

              <div
                style="
                  margin:24px 0;
                  padding:20px;
                  background:#fff8fa;
                  border:1px solid #eadde1;
                  border-radius:12px;
                "
              >
                <p style="margin:0 0 12px;">
                  <strong>Email:</strong><br />
                  ${recipientEmail}
                </p>

                <p style="margin:0 0 12px;">
                  <strong>Role:</strong><br />
                  ${role}
                </p>

                <p style="margin:0;">
                  <strong>
                    Temporary Password:
                  </strong><br />

                  <span
                    style="
                      display:inline-block;
                      margin-top:6px;
                      padding:10px 14px;
                      background:#710d25;
                      border-radius:8px;
                      color:#ffffff;
                      font-size:18px;
                      font-weight:bold;
                      letter-spacing:1px;
                    "
                  >
                    ${temporaryPassword}
                  </span>
                </p>
              </div>

              <a
                href="${frontendUrl}/login"
                style="
                  display:inline-block;
                  padding:12px 22px;
                  background:#8c1230;
                  border-radius:10px;
                  color:#ffffff;
                  text-decoration:none;
                  font-weight:bold;
                "
              >
                Sign In
              </a>

              <p
                style="
                  margin-top:24px;
                  color:#705d63;
                  font-size:13px;
                "
              >
                For your security, please change
                your temporary password after your
                first login.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(
      `Temporary password email sent to ${recipientEmail}.`,
    );
  } catch (error) {
    console.error(
      "Unable to send temporary password email:",
      error,
    );

    throw new Error(
      "The account was created, but the temporary password email could not be sent.",
    );
  }
}