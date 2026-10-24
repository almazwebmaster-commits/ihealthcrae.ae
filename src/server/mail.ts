import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer, { type Transporter } from "nodemailer";

export type Mail = { to: string; subject: string; html: string; text: string };

const OUTBOX = join(process.cwd(), ".mail-outbox");

let transporter: Transporter | undefined;

function smtp() {
  if (!process.env.SMTP_HOST) return undefined;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

/**
 * Sends through the store's own mailbox (SMTP_* in .env). Without SMTP settings
 * the email is written to .mail-outbox/ so it can be opened in a browser.
 */
export async function sendMail(mail: Mail) {
  const t = smtp();
  if (t) {
    await t.sendMail({ from: process.env.MAIL_FROM, ...mail });
    return;
  }
  await mkdir(OUTBOX, { recursive: true });
  const slug = mail.subject.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40);
  const file = join(OUTBOX, `${new Date().toISOString().replace(/[:.]/g, "-")}-${slug}.html`);
  const header = `<!-- To: ${mail.to} | Subject: ${mail.subject} -->\n`;
  await writeFile(file, header + mail.html, "utf8");
  console.log(`[mail] No SMTP configured — saved "${mail.subject}" for ${mail.to} → ${file}`);
}
