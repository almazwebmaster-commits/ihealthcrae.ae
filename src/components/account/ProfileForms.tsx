"use client";

import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormMessage } from "@/components/auth/AuthCard";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "@/lib/auth-errors";
import { formatUaePhone, normalizeUaePhone } from "@/lib/phone";

type Msg = { tone: "error" | "success"; text: string } | undefined;

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string | null; locale: string; emailVerified: boolean } }) {
  const t = useTranslations("AccountArea");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>();
  const [busy, setBusy] = useState(false);

  return (
    <Box className="p-5">
      <h2 className="mb-4 text-lg font-bold">{t("personalInfo")}</h2>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const name = String(f.get("name")).trim();
          const phoneRaw = String(f.get("phone")).trim();
          const phone = phoneRaw ? normalizeUaePhone(phoneRaw) : null;
          if (!name) return setMsg({ tone: "error", text: tAuth("errors.nameRequired") });
          if (phoneRaw && !phone) return setMsg({ tone: "error", text: tAuth("errors.invalidPhone") });
          setBusy(true);
          const { error } = await authClient.updateUser({ name, phone: phone ?? "", locale: String(f.get("locale")) });
          setBusy(false);
          setMsg(error ? { tone: "error", text: tAuth(`errors.${authErrorKey(error)}`) } : { tone: "success", text: t("saved") });
          if (!error) router.refresh();
        }}
      >
        {msg && <div className="sm:col-span-2"><FormMessage tone={msg.tone}>{msg.text}</FormMessage></div>}
        <div>
          <Label htmlFor="p-name">{tAuth("name")}</Label>
          <Input id="p-name" name="name" defaultValue={user.name} autoComplete="name" required />
        </div>
        <div>
          <Label htmlFor="p-phone">{tAuth("phone")}</Label>
          <Input id="p-phone" name="phone" type="tel" dir="ltr" defaultValue={user.phone ? formatUaePhone(user.phone) : ""} placeholder="050 123 4567" autoComplete="tel" />
        </div>
        <div>
          <Label htmlFor="p-email">{t("emailLabel")}</Label>
          <div className="flex h-10 items-center gap-2 rounded-sm border border-line bg-surface px-3 text-sm text-ink-700">
            <bdi dir="ltr" className="truncate">{user.email}</bdi>
            {user.emailVerified && (
              <span className="ms-auto inline-flex shrink-0 items-center gap-1 text-xs font-bold text-success">
                <BadgeCheck className="size-4" aria-hidden />
                {t("verified")}
              </span>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="p-locale">{t("language")}</Label>
          <select id="p-locale" name="locale" defaultValue={user.locale} className="h-10 w-full rounded-sm border border-line-strong bg-white px-3 text-sm focus:border-brand-500 focus:outline-none">
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" disabled={busy}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Box>
  );
}

export function SecurityForms({ hasPassword }: { hasPassword: boolean }) {
  const t = useTranslations("AccountArea");
  const tAuth = useTranslations("Auth");
  const [msg, setMsg] = useState<Msg>();
  const [busy, setBusy] = useState(false);

  return (
    <Box className="space-y-5 p-5">
      <h2 className="text-lg font-bold">{t("securityTitle")}</h2>
      {msg && <FormMessage tone={msg.tone}>{msg.text}</FormMessage>}

      {hasPassword ? (
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            const newPassword = String(f.get("new"));
            if (newPassword.length < 8) return setMsg({ tone: "error", text: tAuth("errors.passwordTooShort") });
            if (newPassword !== String(f.get("confirm"))) return setMsg({ tone: "error", text: tAuth("errors.passwordMismatch") });
            setBusy(true);
            const { error } = await authClient.changePassword({
              currentPassword: String(f.get("current")),
              newPassword,
              revokeOtherSessions: f.get("revoke") === "on",
            });
            setBusy(false);
            if (error) return setMsg({ tone: "error", text: tAuth(`errors.${authErrorKey(error)}`) });
            form.reset();
            setMsg({ tone: "success", text: t("passwordChanged") });
          }}
        >
          <div className="sm:col-span-2">
            <Label htmlFor="s-current">{t("currentPassword")}</Label>
            <PasswordInput id="s-current" name="current" autoComplete="current-password" required />
          </div>
          <div>
            <Label htmlFor="s-new">{tAuth("newPassword")}</Label>
            <PasswordInput id="s-new" name="new" autoComplete="new-password" required />
          </div>
          <div>
            <Label htmlFor="s-confirm">{tAuth("confirmPassword")}</Label>
            <PasswordInput id="s-confirm" name="confirm" autoComplete="new-password" required />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-800 sm:col-span-2">
            <input type="checkbox" name="revoke" defaultChecked className="size-4 accent-brand-600" />
            {t("signOutOthers")}
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" disabled={busy}>
              {t("changePassword")}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-ink-600">{t("socialOnly")}</p>
      )}

      <div className="border-t border-line pt-4">
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const { error } = await authClient.revokeOtherSessions();
            setBusy(false);
            setMsg(error ? { tone: "error", text: tAuth("errors.generic") } : { tone: "success", text: t("signedOutOthers") });
          }}
        >
          {t("signOutEverywhere")}
        </Button>
      </div>
    </Box>
  );
}
