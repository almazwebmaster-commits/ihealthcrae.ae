import { AlertTriangle, ArrowDownRight, ArrowUpRight, Banknote, ClipboardList, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { AdminHeader, OrderStatusBadge, Stat } from "@/components/admin/ui";
import { Box, BoxHeader } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { formatPrice, tr } from "@/lib/i18n-utils";
import type { OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { recentActivity } from "@/server/admin/audit";
import { adminSections, canOpen } from "@/lib/admin-sections";
import { currentStaff } from "@/server/admin/guard";
import { PaymentSplit, RevenueChart } from "@/components/admin/SalesCharts";
import { PERIODS, salesAnalytics, type Period } from "@/server/admin/analytics";
import { dashboardStats } from "@/server/admin/orders";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.dashboard" });
  return { title: t("title") };
}

/** Period figure with the change against the previous period (up is good for every figure here). */
function Figure({ label, value, now, before, vs, none }: { label: string; value: string; now: number; before: number; vs: string; none: string }) {
  const change = before ? (now - before) / before : null;
  const up = (change ?? 0) >= 0;
  return (
    <Box className="p-4">
      <p className="text-xs font-semibold text-ink-600">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink-900">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-xs">
        {change == null ? (
          <span className="text-ink-500">{none}</span>
        ) : (
          <>
            <span className={cn("inline-flex items-center gap-0.5 font-bold tabular-nums", up ? "text-success" : "text-sale")}>
              {up ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
              {`${up ? "+" : "−"}${Math.abs(Math.round(change * 100))}%`}
            </span>
            <span className="text-ink-500">{vs}</span>
          </>
        )}
      </p>
    </Box>
  );
}

export default async function AdminDashboard({ params, searchParams }: PageProps<"/[locale]/admin">) {
  setRequestLocale((await params).locale);
  const requested = Number((await searchParams).days);
  const days: Period = (PERIODS as readonly number[]).includes(requested) ? (requested as Period) : 30;
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.dashboard");
  const staff = await currentStaff();
  if (!canOpen(staff, "dashboard")) {
    // Staff without dashboard access get a simple start page with their sections.
    const tNav = await getTranslations("AdminUI.nav");
    const areas = adminSections.filter((a) => a !== "dashboard" && canOpen(staff, a));
    return (
      <div className="space-y-4">
        <AdminHeader title={t("welcome", { name: staff?.name ?? "" })} subtitle={areas.length ? t("yourSections") : t("noSections")} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {areas.map((a) => (
            <Link key={a} href={`/admin/${a}`} className="rounded-sm border border-line bg-white p-4 font-semibold hover:border-ink-400">{tNav(a)} →</Link>
          ))}
        </div>
      </div>
    );
  }
  const tStatus = await getTranslations("OrderStatus");
  const tS = await getTranslations("AdminUI.sales");
  const [s, activity, sales] = await Promise.all([dashboardStats(), recentActivity(), salesAnalytics(days)]);
  const fmt = (n: number) => formatPrice(n, locale);
  const dt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeStyle: "short" });
  const hasDemo = s.recent.some((o) => o.isDemo);

  return (
    <div className="space-y-4">
      <AdminHeader title={t("title")} />
      {hasDemo && <p className="rounded-sm border border-info/30 bg-info-50 px-3 py-2 text-xs text-info">{t("demoNotice")}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ShoppingBag} label={t("ordersToday")} value={String(s.today)} />
        <Stat icon={ClipboardList} label={t("openOrders")} value={String(s.open)} href="/admin/orders?status=open" warn={s.open > 0} />
        <Stat icon={Banknote} label={t("codToCollect")} value={fmt(s.codToCollect)} href="/admin/orders?status=open&payment=COD" />
        <Stat icon={AlertTriangle} label={t("lowStock")} value={String(s.lowStock)} href="/admin/inventory?filter=low" warn={s.lowStock > 0} />
      </div>

      {/* Sales for the chosen period */}
      <section aria-labelledby="sales-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="sales-title" className="text-lg font-extrabold">{tS("title")}</h2>
          <nav aria-label={tS("period")} className="flex gap-1 rounded-sm border border-line bg-white p-1">
            {PERIODS.map((d) => (
              <Link key={d} href={d === 30 ? "/admin" : `/admin?days=${d}`} aria-current={days === d ? "page" : undefined}
                className={cn("rounded-xs px-3 py-1.5 text-sm font-semibold", days === d ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-surface")}>
                {tS("lastDays", { days: d })}
              </Link>
            ))}
          </nav>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Figure label={tS("revenue")} value={fmt(sales.current.revenue)} now={sales.current.revenue} before={sales.previous.revenue} vs={tS("vsPrevious", { days })} none={tS("noPrevious", { days })} />
          <Figure label={tS("orders")} value={String(sales.current.orders)} now={sales.current.orders} before={sales.previous.orders} vs={tS("vsPrevious", { days })} none={tS("noPrevious", { days })} />
          <Figure label={tS("aov")} value={fmt(sales.current.aov)} now={sales.current.aov} before={sales.previous.aov} vs={tS("vsPrevious", { days })} none={tS("noPrevious", { days })} />
          <Figure label={tS("units")} value={String(sales.current.units)} now={sales.current.units} before={sales.previous.units} vs={tS("vsPrevious", { days })} none={tS("noPrevious", { days })} />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <Box className="xl:col-span-2">
            <BoxHeader title={tS("revenuePerDay")} />
            <div className="p-4">
              <RevenueChart series={sales.series} />
            </div>
          </Box>
          <Box>
            <BoxHeader title={tS("byPayment")} />
            <div className="p-4">
              <PaymentSplit data={sales.payment} />
            </div>
          </Box>
        </div>
        <Box>
          <BoxHeader title={tS("topProducts")} />
          {sales.topProducts.length ? (
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-surface text-xs font-bold uppercase tracking-wide text-ink-600">
                <tr>
                  <th className="w-10 px-4 py-2 text-start">#</th>
                  <th className="px-2 py-2 text-start">{tS("col.product")}</th>
                  <th className="w-24 px-2 py-2 text-end">{tS("col.units")}</th>
                  <th className="hidden w-48 px-2 py-2 sm:table-cell" aria-hidden />
                  <th className="w-32 px-4 py-2 text-end">{tS("col.revenue")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sales.topProducts.map((p, i) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5 font-bold tabular-nums text-ink-500">{i + 1}</td>
                    <td className="px-2 py-2.5">
                      <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-brand-700 hover:underline">{tr({ en: p.nameEn, ar: p.nameAr }, locale)}</Link>
                    </td>
                    <td className="px-2 py-2.5 text-end font-semibold tabular-nums">{p.units}</td>
                    <td className="hidden px-2 py-2.5 sm:table-cell" aria-hidden>
                      <span className="block h-2 rounded-e-[4px] bg-chart-teal" style={{ width: `${(p.units / sales.topProducts[0].units) * 100}%` }} />
                    </td>
                    <td className="px-4 py-2.5 text-end tabular-nums">{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-ink-500">{tS("noSales")}</p>
          )}
        </Box>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Box className="xl:col-span-2">
          <BoxHeader title={t("recentOrders")} action={<Link href="/admin/orders" className="text-sm font-semibold text-brand-700 hover:underline">{t("viewAll")}</Link>} />
          <ul className="divide-y divide-line">
            {s.recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.number}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm hover:bg-surface">
                  <span className="w-28 font-bold" dir="ltr">{o.number}</span>
                  <span className="min-w-0 flex-1 truncate">{o.fullName}</span>
                  <span className="text-xs text-ink-500">{dt.format(o.placedAt)}</span>
                  <span className="w-28 text-end font-semibold tabular-nums">{fmt(Number(o.total))}</span>
                  <OrderStatusBadge status={o.status as OrderStatus} label={tStatus(o.status)} />
                </Link>
              </li>
            ))}
          </ul>
        </Box>

        <div className="space-y-4">
          <Box>
            <BoxHeader title={t("lowStockItems")} />
            <ul className="divide-y divide-line text-sm">
              {s.lowStockList.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/inventory/${p.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface">
                    <span className="min-w-0 flex-1 truncate">{tr({ en: p.nameEn, ar: p.nameAr }, locale)}</span>
                    <span className={cn("font-bold tabular-nums", p.stock === 0 ? "text-sale" : "text-accent-700")}>{t("left", { count: p.stock })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Box>
          <Box>
            <BoxHeader title={t("activity")} />
            {activity.length ? (
              <ul className="divide-y divide-line text-xs">
                {activity.map((a) => (
                  <li key={a.id} className="px-4 py-2.5">
                    <span className="font-semibold">{a.actorName}</span> · <span dir="ltr">{a.action}</span>
                    {a.summary && <span className="block truncate text-ink-600">{a.summary}</span>}
                    <span className="block text-ink-400">{dt.format(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-ink-500">{t("noActivity")}</p>
            )}
          </Box>
        </div>
      </div>
    </div>
  );
}
