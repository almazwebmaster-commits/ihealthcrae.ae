"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "@/lib/auth-errors";
import { normalizeUaePhone } from "@/lib/phone";
import { FormMessage } from "./AuthCard";
import { PasswordInput } from "./PasswordInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-semibold text-sale">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

// ── Sign in ─────────────────────────────────────────────────────────────

export function SignInForm({ next }: { next: string }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setError(undefined);
        const { error } = await authClient.signIn.email({
          email: String(f.get("email")).trim(),
          password: String(f.get("password")),
          // Where to land after signing in — also used by the verification link Better Auth
          // re-sends when the email isn't confirmed yet.
          callbackURL: `/${locale}${next}`,
        });
        setBusy(false);
        if (error) return setError(t(`errors.${authErrorKey(error)}`));
        router.replace(next);
        router.refresh();
      }}
    >
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Field id="email" label={t("email")}>
        <Input id="email" name="email" type="email" autoComplete="email" dir="ltr" required />
      </Field>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label htmlFor="password" className="mb-0">{t("password")}</Label>
          <Link href="/forgot-password" className="text-xs font-semibold text-brand-700 hover:underline">
            {t("forgot")}
          </Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
        {t("signInCta")}
      </Button>
    </form>
  );
}

// ── Register ────────────────────────────────────────────────────────────

export function RegisterForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const name = String(f.get("name")).trim();
        const email = String(f.get("email")).trim();
        const phoneRaw = String(f.get("phone")).trim();
        const password = String(f.get("password"));
        const confirm = String(f.get("confirm"));
        const phone = phoneRaw ? normalizeUaePhone(phoneRaw) : null;

        const next: Record<string, string> = {};
        if (!name) next.name = t("errors.nameRequired");
        if (!EMAIL_RE.test(email)) next.email = t("errors.invalidEmail");
        if (phoneRaw && !phone) next.phone = t("errors.invalidPhone");
        if (password.length < 8) next.password = t("errors.passwordTooShort");
        else if (password !== confirm) next.confirm = t("errors.passwordMismatch");
        if (!f.get("terms")) next.terms = t("errors.termsRequired");
        setErrors(next);
        setFormError(undefined);
        if (Object.keys(next).length) return;

        setBusy(true);
        const { data, error } = await authClient.signUp.email({
          name,
          email,
          password,
          phone: phone ?? undefined,
          locale,
          callbackURL: `/${locale}/account?welcome=1`,
        });
        setBusy(false);
        if (error) return setFormError(t(`errors.${authErrorKey(error)}`));
        // A session token means the account is active immediately (email confirmation not required).
        if (data?.token) {
          router.replace("/account?welcome=1");
          router.refresh();
          return;
        }
        router.push(`/check-email?email=${encodeURIComponent(email)}`);
      }}
    >
      {formError && <FormMessage tone="error">{formError}</FormMessage>}
      <Field id="name" label={t("name")} error={errors.name}>
        <Input id="name" name="name" autoComplete="name" aria-invalid={!!errors.name} required />
      </Field>
      <Field id="email" label={t("email")} error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" dir="ltr" aria-invalid={!!errors.email} required />
      </Field>
      <Field id="phone" label={t("phone")} error={errors.phone} hint={t("phoneHint")}>
        <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="050 123 4567" aria-invalid={!!errors.phone} />
      </Field>
      <Field id="password" label={t("password")} error={errors.password} hint={t("passwordHint")}>
        <PasswordInput id="password" name="password" autoComplete="new-password" aria-invalid={!!errors.password} required />
      </Field>
      <Field id="confirm" label={t("confirmPassword")} error={errors.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} required />
      </Field>
      <div>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-700">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 shrink-0 accent-brand-600" />
          <span>
            {t.rich("terms", {
              terms: (c) => <Link href="/terms" className="font-semibold text-brand-700 hover:underline">{c}</Link>,
              privacy: (c) => <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">{c}</Link>,
            })}
          </span>
        </label>
        {errors.terms && <p className="mt-1 text-xs font-semibold text-sale">{errors.terms}</p>}
      </div>
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
        {t("registerCta")}
      </Button>
    </form>
  );
}

// ── Resend verification ─────────────────────────────────────────────────

export function ResendVerification({ email }: { email: string }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  return (
    <div className="space-y-3">
      {state === "sent" && <FormMessage tone="success">{t("resent")}</FormMessage>}
      {state === "error" && <FormMessage tone="error">{t("errors.tooMany")}</FormMessage>}
      <Button
        variant="outline"
        className="w-full"
        disabled={state === "busy" || !email}
        onClick={async () => {
          setState("busy");
          const { error } = await authClient.sendVerificationEmail({ email, callbackURL: `/${locale}/account?welcome=1` });
          setState(error ? "error" : "sent");
        }}
      >
        {t("resend")}
      </Button>
    </div>
  );
}

// ── Forgot password ─────────────────────────────────────────────────────

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [sentTo, setSentTo] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (sentTo) return <FormMessage tone="success">{t("forgotSent", { email: sentTo })}</FormMessage>;

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const email = String(new FormData(e.currentTarget).get("email")).trim();
        if (!EMAIL_RE.test(email)) return setError(t("errors.invalidEmail"));
        setBusy(true);
        const { error } = await authClient.requestPasswordReset({ email, redirectTo: `/${locale}/reset-password` });
        setBusy(false);
        // Same message whether or not the account exists — only rate limiting is surfaced.
        if (error?.status === 429) return setError(t("errors.tooMany"));
        setSentTo(email);
      }}
    >
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Field id="email" label={t("email")}>
        <Input id="email" name="email" type="email" autoComplete="email" dir="ltr" required />
      </Field>
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
        {t("sendLink")}
      </Button>
    </form>
  );
}

// ── Reset password ──────────────────────────────────────────────────────

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("Auth");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (done) {
    return (
      <div className="space-y-4">
        <FormMessage tone="success">{t("resetDone")}</FormMessage>
        <Link href="/sign-in" className="block text-center text-sm font-semibold text-brand-700 hover:underline">
          {t("signInLink")}
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const password = String(f.get("password"));
        const confirm = String(f.get("confirm"));
        const next: Record<string, string> = {};
        if (password.length < 8) next.password = t("errors.passwordTooShort");
        else if (password !== confirm) next.confirm = t("errors.passwordMismatch");
        setErrors(next);
        if (Object.keys(next).length) return;
        setBusy(true);
        const { error } = await authClient.resetPassword({ newPassword: password, token });
        setBusy(false);
        if (error) return setErrors({ form: t(`errors.${authErrorKey(error)}`) });
        setDone(true);
      }}
    >
      {errors.form && <FormMessage tone="error">{errors.form}</FormMessage>}
      <Field id="password" label={t("newPassword")} error={errors.password} hint={t("passwordHint")}>
        <PasswordInput id="password" name="password" autoComplete="new-password" aria-invalid={!!errors.password} required />
      </Field>
      <Field id="confirm" label={t("confirmPassword")} error={errors.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} required />
      </Field>
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
        {t("resetCta")}
      </Button>
    </form>
  );
}
