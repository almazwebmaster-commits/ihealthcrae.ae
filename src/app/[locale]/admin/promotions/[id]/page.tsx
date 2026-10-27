import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { CouponForm } from "@/components/admin/CouponForm";
import { AdminHeader, DataTable, OrderStatusBadge } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/i18n-utils";
import type { OrderStatus } from "@/lib/orders";
import { couponStatus } from "@/lib/promotions";
import { toUaeInput } from "@/lib/uae-time";
import { getCoupon } from "@/server/promotions";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/promotions/[id]">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.promotions" });
  return { title: t("editCode") };
}

const n = (d: unknown) => (d == null ? "" : String(Number(d)));

export default async function EditCouponPage({ params }: PageProps<"/[locale]/admin/promotions/[id]">) {
  const { locale: loc, id } = await params;
  setRequestLocale(loc);
  const coupon = Number.isInteger(Number(id)) ? await getCoupon(Number(id)) : null;
  if (!coupon) notFound();
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.promotions");
  const tStatus = await getTranslations("OrderStatus");
  const fmt = (v: unknown) => formatPrice(Number(v), locale);
  const dt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });
  const status = couponStatus(coupon);
  const tone = status === "active" ? "success" : status === "scheduled" ? "info" : status === "disabled" ? "sale" : "neutral";

  return (
    <div className="space-y-6">
      <AdminHeader
        title={<span className="font-mono" dir="ltr">{coupon.code}</span>}
        subtitle={t("usedSummary", { count: coupon.usedCount, total: fmt(coupon.totalDiscount) })}
        actions={<Badge tone={tone}>{t(`status.${status}`)}</Badge>}
      />
      <CouponForm
        key={coupon.updatedAt.toISOString()}
        initial={{
          id: coupon.id,
          code: coupon.code,
          descriptionEn: coupon.descriptionEn,
          descriptionAr: coupon.descriptionAr,
          type: coupon.type,
          value: n(coupon.value),
          maxDiscount: n(coupon.maxDiscount),
          minSpend: n(coupon.minSpend),
          startsAt: toUaeInput(coupon.startsAt),
          endsAt: toUaeInput(coupon.endsAt),
          usageLimit: coupon.usageLimit == null ? "" : String(coupon.usageLimit),
          perCustomerLimit: coupon.perCustomerLimit == null ? "" : String(coupon.perCustomerLimit),
          active: coupon.active,
        }}
      />
      <div>
        <h2 className="mb-2 text-lg font-extrabold">{t("recentUses")}</h2>
        {coupon.redemptions.length ? (
          <DataTable head={[t("col.order"), t("col.customer"), t("col.saved"), t("col.orderTotal"), t("col.status"), t("col.date")]}>
            {coupon.redemptions.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2.5">
                  <Link href={`/admin/orders/${r.order.number}`} className="font-semibold text-brand-700 hover:underline" dir="ltr">{r.order.number}</Link>
                </td>
                <td className="px-3 py-2.5 text-xs" dir="ltr">{r.email}</td>
                <td className="px-3 py-2.5 tabular-nums text-success">−{fmt(r.amount)}</td>
                <td className="px-3 py-2.5 tabular-nums">{fmt(r.order.total)}</td>
                <td className="px-3 py-2.5">
                  <OrderStatusBadge status={r.order.status as OrderStatus} label={tStatus(r.order.status)} />
                </td>
                <td className="px-3 py-2.5 text-xs text-ink-600">{dt.format(r.createdAt)}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <p className="text-sm text-ink-600">{t("noUses")}</p>
        )}
      </div>
    </div>
  );
}
