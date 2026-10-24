import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { AdminHeader, DataTable, field, OrderStatusBadge, Pager, qs } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/i18n-utils";
import { orderStatuses, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { listOrders } from "@/server/admin/orders";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/orders">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.orders" });
  return { title: t("title") };
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function AdminOrders({ params, searchParams }: PageProps<"/[locale]/admin/orders">) {
  setRequestLocale((await params).locale);
  const locale = await getLocale();
  const sp = await searchParams;
  const t = await getTranslations("AdminUI.orders");
  const tp = await getTranslations("AdminUI.products");
  const tStatus = await getTranslations("OrderStatus");
  const tPay = await getTranslations("Payment");
  const query = { q: str(sp.q), status: str(sp.status), payment: str(sp.payment), page: Number(str(sp.page)) || 1 };
  const { rows, total, page, pages, byStatus } = await listOrders(query);
  const dt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeStyle: "short" });
  const openCount = (byStatus.PLACED ?? 0) + (byStatus.PROCESSING ?? 0) + (byStatus.OUT_FOR_DELIVERY ?? 0);
  const tabs: { key?: string; label: string; count?: number }[] = [
    { label: t("all") },
    { key: "open", label: t("open"), count: openCount },
    ...orderStatuses.filter((s) => s !== "PENDING_PAYMENT").map((s) => ({ key: s, label: tStatus(s), count: byStatus[s] ?? 0 })),
  ];

  return (
    <div>
      <AdminHeader title={t("title")} subtitle={t("results", { count: total })} />

      <nav className="no-scrollbar mb-3 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = (query.status ?? undefined) === tab.key;
          return (
            <Link
              key={tab.key ?? "all"}
              href={`/admin/orders${qs({ status: tab.key, payment: query.payment, q: query.q })}`}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1.5 text-sm font-semibold",
                active ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white text-ink-700 hover:border-ink-400",
              )}
            >
              {tab.label}
              {tab.count != null && <span className={cn("text-xs tabular-nums", active ? "text-brand-100" : "text-ink-500")}>{tab.count}</span>}
            </Link>
          );
        })}
      </nav>

      <form className="mb-3 grid gap-2 rounded-sm border border-line bg-white p-3 sm:grid-cols-[1fr_14rem_auto]">
        {query.status && <input type="hidden" name="status" value={query.status} />}
        <input name="q" defaultValue={query.q} placeholder={t("search")} aria-label={t("search")} className={field} />
        <select name="payment" defaultValue={query.payment ?? ""} aria-label={t("col.payment")} className={field}>
          <option value="">{t("allPayments")}</option>
          <option value="COD">{tPay("COD")}</option>
          <option value="CARD">{tPay("CARD")}</option>
        </select>
        <button type="submit" className={buttonClass("primary", "md")}>{t("filter")}</button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-sm border border-line bg-white px-4 py-10 text-center text-sm text-ink-600">{t("empty")}</p>
      ) : (
        <DataTable head={[t("col.order"), t("col.date"), t("col.customer"), t("col.items"), t("col.total"), t("col.payment"), t("col.status")]}>
          {rows.map((o) => (
            <tr key={o.id} className="hover:bg-surface">
              <td className="px-3 py-2.5">
                <Link href={`/admin/orders/${o.number}`} className="font-bold text-brand-700 hover:underline" dir="ltr">{o.number}</Link>
                {o.isDemo && <Badge tone="neutral" className="ms-2">{t("demo")}</Badge>}
              </td>
              <td className="px-3 py-2.5 text-xs text-ink-600">{dt.format(o.placedAt)}</td>
              <td className="px-3 py-2.5">
                <span className="block font-medium">{o.fullName}</span>
                <span className="block text-xs text-ink-500" dir="ltr">{o.email}</span>
              </td>
              <td className="px-3 py-2.5 tabular-nums">{o._count.items}</td>
              <td className="px-3 py-2.5 font-semibold tabular-nums">{formatPrice(Number(o.total), locale)}</td>
              <td className="px-3 py-2.5 text-xs">
                <span className="block">{tPay(o.paymentMethod)}</span>
                <span className={cn("block font-semibold", o.paymentStatus === "PAID" ? "text-success" : o.paymentStatus === "REFUNDED" ? "text-ink-500" : "text-accent-700")}>{tPay(o.paymentStatus)}</span>
              </td>
              <td className="px-3 py-2.5"><OrderStatusBadge status={o.status as OrderStatus} label={tStatus(o.status)} /></td>
            </tr>
          ))}
        </DataTable>
      )}
      <Pager page={page} pages={pages} prev={tp("previous")} next={tp("next")} href={(n) => `/admin/orders${qs({ ...query, page: n })}`} />
    </div>
  );
}
