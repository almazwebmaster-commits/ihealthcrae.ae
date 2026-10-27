import { CalendarClock, Heart, ReceiptText, ShoppingBag, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { BlockCustomer } from "@/components/admin/BlockCustomer";
import { AdminHeader, DataTable, OrderStatusBadge, qs, Stat } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Box, BoxHeader } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { emirateName } from "@/lib/emirates";
import { formatPrice, tr } from "@/lib/i18n-utils";
import type { OrderStatus } from "@/lib/orders";
import { formatUaePhone } from "@/lib/phone";
import { getCustomer } from "@/server/admin/customers";
import { requireArea } from "@/server/admin/guard";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/customers/[id]">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.customers" });
  return { title: t("detailTitle") };
}

export default async function CustomerPage({ params }: PageProps<"/[locale]/admin/customers/[id]">) {
  await requireArea("customers");
  const { locale: loc, id } = await params;
  setRequestLocale(loc);
  const c = await getCustomer(id);
  if (!c) notFound();
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.customers");
  const tStatus = await getTranslations("OrderStatus");
  const tPay = await getTranslations("Payment");
  const fmt = (n: unknown) => formatPrice(Number(n), locale);
  const d = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeZone: "Asia/Dubai" });
  const aov = c.stats.orders ? c.stats.spent / c.stats.orders : 0;
  const isCustomer = c.role === "user";

  return (
    <div className="space-y-4">
      <Link href="/admin/customers" className="inline-block text-sm font-semibold text-brand-700 hover:underline">← {t("back")}</Link>
      <AdminHeader
        title={c.name}
        subtitle={<span dir="ltr">{c.email}</span>}
        actions={
          <>
            {!isCustomer && <Badge tone="brand">{c.role}</Badge>}
            {c.banned ? <Badge tone="sale">{t("blocked")}</Badge> : <Badge tone="success">{t("active")}</Badge>}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ShoppingBag} label={t("ordersCount")} value={String(c.stats.orders)} sub={c.guestOrders ? t("guestOrders", { count: c.guestOrders }) : undefined} />
        <Stat icon={Wallet} label={t("spent")} value={fmt(c.stats.spent)} />
        <Stat icon={ReceiptText} label={t("aov")} value={fmt(aov)} />
        <Stat icon={CalendarClock} label={t("lastOrder")} value={c.stats.lastOrderAt ? d.format(c.stats.lastOrderAt) : "—"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-lg font-extrabold">{t("orders")}</h2>
            {c.orders.length ? (
              <DataTable head={[t("col.order"), t("col.date"), t("col.items"), t("col.payment"), <span key="t" className="block text-end">{t("col.total")}</span>, t("col.status")]}>
                {c.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface/60">
                    <td className="px-3 py-2.5"><Link href={`/admin/orders/${o.number}`} className="font-semibold text-brand-700 hover:underline" dir="ltr">{o.number}</Link></td>
                    <td className="px-3 py-2.5 text-xs text-ink-600">{d.format(o.placedAt)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{o._count.items}</td>
                    <td className="px-3 py-2.5 text-xs">{tPay(o.paymentMethod)} · {tPay(o.paymentStatus)}</td>
                    <td className="px-3 py-2.5 text-end font-semibold tabular-nums">{fmt(o.total)}</td>
                    <td className="px-3 py-2.5"><OrderStatusBadge status={o.status as OrderStatus} label={tStatus(o.status)} /></td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <Box className="p-6 text-center text-sm text-ink-600">{t("noOrders")}</Box>
            )}
            {c.guestOrders > 0 && (
              <Link href={`/admin/orders${qs({ q: c.email })}`} className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline">{t("seeGuestOrders", { count: c.guestOrders })}</Link>
            )}
          </div>

          {c.subscriptions.length > 0 && (
            <Box>
              <BoxHeader title={t("subscriptions")} />
              <ul className="divide-y divide-line text-sm">
                {c.subscriptions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                    <span className="min-w-0 flex-1 font-semibold">{tr({ en: s.product.nameEn, ar: s.product.nameAr }, locale)}</span>
                    <span className="text-xs text-ink-600">{t("every", { weeks: s.intervalWeeks })} · ×{s.qty}</span>
                    <span className="text-xs text-ink-600">{s.status === "ACTIVE" ? t("nextDelivery", { date: d.format(s.nextDeliveryAt) }) : ""}</span>
                    <Badge tone={s.status === "ACTIVE" ? "success" : s.status === "PAUSED" ? "info" : "neutral"}>{t(`sub.${s.status}`)}</Badge>
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </div>

        <div className="space-y-4">
          <Box>
            <BoxHeader title={t("profile")} />
            <dl className="space-y-2 p-4 text-sm">
              <div><dt className="text-xs text-ink-500">{t("phone")}</dt><dd dir="ltr" className="text-start">{c.phone ? formatUaePhone(c.phone) : "—"}</dd></div>
              <div><dt className="text-xs text-ink-500">{t("joined")}</dt><dd>{d.format(c.createdAt)}</dd></div>
              <div><dt className="text-xs text-ink-500">{t("emailStatus")}</dt><dd>{c.emailVerified ? t("verified") : t("notVerified")}</dd></div>
              <div><dt className="text-xs text-ink-500">{t("language")}</dt><dd>{c.locale === "ar" ? "العربية" : "English"}</dd></div>
              <div className="flex items-center gap-1.5 text-ink-600"><Heart className="size-3.5" aria-hidden />{t("wishlist", { count: c._count.wishlist })}</div>
            </dl>
          </Box>
          <Box>
            <BoxHeader title={t("addresses")} />
            {c.addresses.length ? (
              <ul className="divide-y divide-line text-sm">
                {c.addresses.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <p className="font-semibold">{a.fullName}{a.isDefault && <Badge tone="neutral" className="ms-2">{t("default")}</Badge>}</p>
                    <p className="text-ink-700">{[a.unit, a.building, a.street].filter(Boolean).join(", ")}</p>
                    <p className="text-ink-700">{a.area}, {emirateName(a.emirate, locale)}</p>
                    <p className="text-xs text-ink-500" dir="ltr">{formatUaePhone(a.phone)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-ink-500">{t("noAddresses")}</p>
            )}
          </Box>
          {isCustomer ? <BlockCustomer id={c.id} blocked={!!c.banned} reason={c.banReason} /> : <p className="text-xs text-ink-500">{t("staffNote")}</p>}
        </div>
      </div>
    </div>
  );
}
