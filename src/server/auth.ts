import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "./db";
import { resetPasswordMail, verifyEmailMail } from "./email-templates";
import { sendMail } from "./mail";

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }
    : undefined;

export const googleEnabled = Boolean(google);

/**
 * Email confirmation is only enforced once a real mailbox is configured (SMTP_HOST).
 * Without it, nobody could receive the link and every new account would be locked out.
 */
const emailDelivery = Boolean(process.env.SMTP_HOST);

/** Roles: "user" = customer, "staff" = can use /admin, "admin" = full control incl. staff management. */
export const STAFF_ROLES = ["staff", "admin"] as const;

// Emails are sent without awaiting, so response timing can't reveal whether an account exists.
const deliver = (mail: Parameters<typeof sendMail>[0]) =>
  void sendMail(mail).catch((e) => console.error("[mail] send failed:", e));

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: emailDelivery,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) =>
      deliver(resetPasswordMail((user as { locale?: string }).locale ?? "en", user.email, user.name, url)),
  },

  emailVerification: {
    sendOnSignUp: emailDelivery,
    sendOnSignIn: emailDelivery,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) =>
      deliver(verifyEmailMail((user as { locale?: string }).locale ?? "en", user.email, user.name, url)),
  },

  socialProviders: google ? { google } : {},

  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      locale: { type: "string", required: false, defaultValue: "en", input: true },
    },
  },

  // No cookie cache: sign-out, password resets and role changes must take effect immediately.
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh expiry at most daily
  },

  // Brute-force protection on the sensitive endpoints (per IP, per minute).
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },

  plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
