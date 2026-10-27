"use client";

import { Ban, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { setCustomerBlockedAction } from "@/app/[locale]/admin/customers/actions";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { useRouter } from "@/i18n/navigation";

export function BlockCustomer({ id, blocked, reason }: { id: string; blocked: boolean; reason: string | null }) {
  const t = useTranslations("AdminUI.customers");
  const router = useRouter();
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const run = (next: boolean) =>
    start(async () => {
      setError(undefined);
      const res = await setCustomerBlockedAction(id, next, note);
      if (!res.ok) return setError(t(`errors.${res.error}`));
      setConfirming(false);
      setNote("");
      router.refresh();
    });

  return (
    <Box className="space-y-3 p-4">
      <h2 className="text-base font-bold">{t("access")}</h2>
      {error && <p role="alert" className="rounded-sm bg-sale-50 px-3 py-2 text-xs text-sale">{error}</p>}
      {blocked ? (
        <>
          <p className="flex items-start gap-2 rounded-sm bg-sale-50 px-3 py-2 text-sm text-sale">
            <Ban className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="font-bold">{t("blockedNotice")}</span>
              {reason && <span className="block text-xs text-ink-700">{t("reason")}: {reason}</span>}
            </span>
          </p>
          <Button variant="outline" className="w-full" disabled={pending} onClick={() => run(false)}>
            <ShieldCheck className="size-4" aria-hidden />
            {t("unblock")}
          </Button>
        </>
      ) : confirming ? (
        <>
          <p className="text-sm text-ink-700">{t("blockExplain")}</p>
          <div>
            <Label htmlFor="block-reason">{t("reason")}</Label>
            <textarea id="block-reason" rows={2} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder={t("reasonPlaceholder")}
              className="w-full rounded-sm border border-line-strong bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <Button variant="danger" disabled={pending} onClick={() => run(true)}>{t("confirmBlock")}</Button>
            <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>{t("cancel")}</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-ink-600">{t("activeNotice")}</p>
          <Button variant="outline" className="w-full text-sale" onClick={() => setConfirming(true)}>
            <Ban className="size-4" aria-hidden />
            {t("block")}
          </Button>
        </>
      )}
    </Box>
  );
}
