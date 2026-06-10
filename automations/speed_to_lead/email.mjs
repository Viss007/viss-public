import nodemailer from "nodemailer";
import { notifyEventPlainText } from "./notify.mjs";

const EMAIL_SEND_TIMEOUT_MS = 20000;

export function emailHealthSlice() {
  const to = process.env.NOTIFY_EMAIL_TO?.trim();
  const host = process.env.SMTP_HOST?.trim();
  if (!to || !host) {
    return { mode: "off", configured: false };
  }
  return { mode: "smtp", configured: true };
}

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

export async function sendEmailNotify({
  eventType,
  payload,
  receivedAt,
  jobId,
  idempotencyKey,
}) {
  const slice = emailHealthSlice();
  if (!slice.configured) {
    console.log("[email] NOTIFY_EMAIL_TO or SMTP_HOST unset; skipping email");
    return { ok: true, skipped: true };
  }

  const text = notifyEventPlainText({
    eventType,
    payload,
    receivedAt,
    jobId,
    idempotencyKey,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure:
      process.env.SMTP_SECURE === "1" ||
      String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
        : undefined,
  });

  const from =
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "speed-lead@localhost";

  const subject = `[Speed Lead] ${eventType}`;

  try {
    await withTimeout(
      transporter.sendMail({
        from,
        to: process.env.NOTIFY_EMAIL_TO.trim(),
        subject,
        text,
      }),
      EMAIL_SEND_TIMEOUT_MS,
      "email"
    );
    return { ok: true, skipped: false };
  } catch (e) {
    console.error("[email] send failed:", e?.message ?? e);
    return { ok: false, error: String(e?.message ?? e) };
  }
}
