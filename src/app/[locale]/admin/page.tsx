import { AlertTriangle, Banknote, ClipboardList, ShoppingBag, TrendingUp, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { AdminHeader, OrderStatusBadge } from "@/components/admin/ui";
import { Box, BoxHeader } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { formatPrice, tr } from "@/lib/i18n-utils";
import type { OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { recentActivity } from "@/server/admin/audit";
import { dashboardStats } from "@/server/admin/orders";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.dashboard" });
  return { title: t("title") };
}

function Stat({ icon: Icon, label, value, sub, href, warn }: { icon: LucideIcon; label: string; value: string; sub?: string; href?: string; warn?: boolean }) {
  const body = (
    <Box className={cn("flex h-full items-center gap-4 p-4", href && "hover:border-ink-400")}>
      <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-sm", warn ? "bg-sale-50 text-sale" : "bg-brand-50 text-brand-700")}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-extrabold leading-tight tabular-nums 2xl:text-2xl">{value}</span>
        <span className="block text-xs text-ink-600">{label}</span>
        {sub && <span className="block text-xs text-ink-500">{sub}</span>}
      </span>
    </Box>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function AdminDashboard({ params }: PageProps<"/[locale]/admin">) {
  setRequestLocale((await params).locale);
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.dashboard");
  const tStatus = await getTranslations("OrderStatus");
  const [s, activity] = await Promise.all([dashboardStats(), recentActivity()]);
  const fmt = (n: number) => formatPrice(n, locale);
  const dt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeStyle: "short" });
  const hasDemo = s.recent.some((o) => o.isDemo);

  return (
    <div className="space-y-4">
      <AdminHeader title={t("title")} />
      {hasDemo && <p className="rounded-sm border border-info/30 bg-info-50 px-3 py-2 text-xs text-info">{t("demoNotice")}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={ShoppingBag} label={t("ordersToday")} value={String(s.today)} />
        <Stat icon={TrendingUp} label={t("revenue7")} value={fmt(s.revenue7)} sub={t("orders7", { count: s.orders7 })} />
        <Stat icon={ClipboardList} label={t("openOrders")} value={String(s.open)} href="/admin/orders?status=open" warn={s.open > 0} />
        <Stat icon={Banknote} label={t("codToCollect")} value={fmt(s.codToCollect)} href="/admin/orders?status=open&payment=COD" />
        <Stat icon={AlertTriangle} label={t("lowStock")} value={String(s.lowStock)} href="/admin/products?lowStock=1" warn={s.lowStock > 0} />
      </div>

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
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface">
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
