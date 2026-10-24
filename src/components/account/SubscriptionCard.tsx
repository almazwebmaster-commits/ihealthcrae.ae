"use client";

import { AlertTriangle, CalendarClock } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { cancelAction, intervalAction, pauseAction, skipAction } from "@/app/[locale]/(store)/account/subscriptions/actions";
import { Badge } from "@/components/ui/Badge";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { formatPrice, tr, type L } from "@/lib/i18n-utils";
import { SUBSCRIBE_FREQUENCIES } from "@/lib/pricing";

export type SubscriptionView = {
  id: number;
  status: "ACTIVE" | "PAUSED";
  qty: number;
  intervalWeeks: number;
  nextDeliveryAt: Date;
  lastError: string | null;
  unitPrice: number;
  slug: string;
  name: L;
  option: L | null;
  image: string | null;
};

export function SubscriptionCard({ sub }: { sub: SubscriptionView }) {
  const t = useTranslations("Subscriptions");
  const tp = useTranslations("Product");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "full" }).format(sub.nextDeliveryAt);
  const paused = sub.status === "PAUSED";

  return (
    <Box className="p-4">
      <div className="flex gap-4">
        <Link href={`/p/${sub.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-sm border border-line bg-white">
          {sub.image && <Image src={sub.image} alt="" fill sizes="80px" className="object-contain" />}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Link href={`/p/${sub.slug}`} className="font-semibold hover:text-brand-700">{tr(sub.name, locale)}</Link>
            <Badge tone={paused ? "neutral" : "success"}>{paused ? t("paused") : t("active")}</Badge>
          </div>
          {sub.option && <p className="text-xs text-ink-600">{tr(sub.option, locale)}</p>}
          <p className="mt-1 text-sm text-ink-700">{t("qtyPrice", { qty: sub.qty, price: formatPrice(sub.unitPrice * sub.qty, locale) })}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800">
            <CalendarClock className="size-4" aria-hidden />
            {paused ? t("noDeliveries") : t("next", { date })}
          </p>
          {sub.lastError && (
            <p className="mt-2 flex items-start gap-1.5 rounded-sm bg-sale-50 px-2 py-1.5 text-xs text-sale">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {t("problem", { reason: sub.lastError })}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <label className="flex items-center gap-2 text-sm">
          {t("every")}
          <select
            value={sub.intervalWeeks}
            disabled={pending}
            onChange={(e) => start(() => intervalAction(sub.id, Number(e.target.value)))}
            className="h-9 rounded-sm border border-line-strong bg-white px-2 text-sm"
          >
            {SUBSCRIBE_FREQUENCIES.map((w) => (
              <option key={w} value={w}>{tp("weeks", { count: w })}</option>
            ))}
          </select>
        </label>
        {!paused && (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => start(() => skipAction(sub.id))}>
            {t("skip")}
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(() => pauseAction(sub.id, !paused))}>
          {paused ? t("resume") : t("pause")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ms-auto text-sale"
          disabled={pending}
          onClick={() => confirm(t("confirmCancel")) && start(() => cancelAction(sub.id))}
        >
          {t("cancel")}
        </Button>
      </div>
    </Box>
  );
}
