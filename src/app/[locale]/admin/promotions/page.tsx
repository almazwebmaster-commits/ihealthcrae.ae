import { Plus, Zap } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { AdminHeader, DataTable } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { formatPrice, tr } from "@/lib/i18n-utils";
import { couponStatus, type CouponStatus } from "@/lib/promotions";
import { listCoupons, listFlashDeals } from "@/server/promotions";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/promotions">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.promotions" });
  return { title: t("title") };
}

const statusTone: Record<CouponStatus, "success" | "info" | "neutral" | "sale"> = { active: "success", scheduled: "info", expired: "neutral", usedUp: "neutral", disabled: "sale" };

export default async function PromotionsPage({ params }: PageProps<"/[locale]/admin/promotions">) {
  setRequestLocale((await params).locale);
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.promotions");
  const [coupons, deals] = await Promise.all([listCoupons(), listFlashDeals()]);
  const fmt = (n: unknown) => formatPrice(Number(n), locale);
  const dt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });

  return (
    <div className="space-y-8">
      <div>
        <AdminHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <Link href="/admin/promotions/new" className={buttonClass("accent", "md")}>
              <Plus className="size-4" aria-hidden />
              {t("newCode")}
            </Link>
          }
        />
        {coupons.length ? (
          <DataTable head={[t("col.code"), t("col.offer"), t("col.rules"), t("col.period"), t("col.uses"), t("col.status")]}>
            {coupons.map((c) => {
              const status = couponStatus(c);
              const offer =
                c.type === "PERCENT"
                  ? t("summary.percent", { pct: Number(c.value) }) + (c.maxDiscount ? ` ${t("summary.cap", { max: fmt(c.maxDiscount) })}` : "")
                  : c.type === "FIXED"
                    ? t("summary.fixed", { amount: fmt(c.value) })
                    : t("summary.freeDelivery");
              const rules = [
                c.minSpend ? t("summary.minSpend", { min: fmt(c.minSpend) }) : null,
                c.perCustomerLimit ? t("summary.perCustomer", { count: c.perCustomerLimit }) : null,
              ].filter(Boolean);
              return (
                <tr key={c.id} className="hover:bg-surface/60">
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/promotions/${c.id}`} className="font-mono font-bold text-brand-700 hover:underline" dir="ltr">{c.code}</Link>
                    {(c.descriptionEn || c.descriptionAr) && <p className="text-xs text-ink-500">{tr({ en: c.descriptionEn, ar: c.descriptionAr || c.descriptionEn }, locale)}</p>}
                  </td>
                  <td className="px-3 py-2.5">{offer}</td>
                  <td className="px-3 py-2.5 text-xs text-ink-600">{rules.join(" · ") || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-ink-600">
                    {c.startsAt || c.endsAt ? `${c.startsAt ? dt.format(c.startsAt) : t("now")} → ${c.endsAt ? dt.format(c.endsAt) : t("noEnd")}` : t("always")}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={statusTone[status]}>{t(`status.${status}`)}</Badge>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        ) : (
          <Box className="p-8 text-center text-sm text-ink-600">{t("noCodes")}</Box>
        )}
      </div>

      <div>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold">
          <Zap className="size-5 text-sale" aria-hidden />
          {t("flashTitle")}
        </h2>
        <p className="mb-3 text-sm text-ink-600">{t("flashSubtitle")}</p>
        {deals.length ? (
          <DataTable head={[t("col.product"), t("col.offer"), t("col.dealPrice"), t("col.period"), t("col.stock"), t("col.status")]}>
            {deals.map((d) => (
              <tr key={d.id} className="hover:bg-surface/60">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/products/${d.id}`} className="font-semibold text-brand-700 hover:underline">{tr({ en: d.nameEn, ar: d.nameAr }, locale)}</Link>
                </td>
                <td className="px-3 py-2.5">{t("summary.percent", { pct: d.flashPct! })}</td>
                <td className="px-3 py-2.5 tabular-nums">
                  <span className="font-semibold">{fmt(Math.round(d.price * (100 - d.flashPct!)) / 100)}</span> <s className="text-xs text-ink-500">{fmt(d.price)}</s>
                </td>
                <td className="px-3 py-2.5 text-xs text-ink-600">{`${d.flashStartsAt ? dt.format(d.flashStartsAt) : t("now")} → ${dt.format(d.flashEndsAt!)}`}</td>
                <td className="px-3 py-2.5 tabular-nums">{d.stock}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={d.status !== "ACTIVE" ? "neutral" : d.live ? "success" : "info"}>
                    {d.status !== "ACTIVE" ? t("status.hidden") : d.live ? t("status.live") : t("status.scheduled")}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Box className="p-8 text-center text-sm text-ink-600">{t("noDeals")}</Box>
        )}
      </div>
    </div>
  );
}
