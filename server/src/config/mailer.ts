import dns from "node:dns";
import nodemailer from "nodemailer";

dns.setDefaultResultOrder("ipv4first");

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
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
      user: emailUser,
      pass: emailAppPassword,
    },

    tls: {
      rejectUnauthorized: false,
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

const frontendUrl =
  process.env.FRONTEND_URL ??
  "http://localhost:5173";

export async function verifyEmailConnection() {
  try {
    await transporter.verify();

    console.log(
      "Email service connected successfully.",
    );
  } catch (error) {
    console.error(
      "Email service is unavailable. Backend will continue running.",
    );
    console.error(
      "Email connection error:",
      error,
    );
  }
}

type MailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendMail({
  to,
  subject,
  html,
  text,
}: MailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Patriot Pacific Financial Corp." <${emailUser}>`,
      to,
      subject,
      html,
      text,
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

export function getFrontendUrl() {
  return frontendUrl;
}