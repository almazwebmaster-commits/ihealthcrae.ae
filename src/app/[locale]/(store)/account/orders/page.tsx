import { ChevronRight, Package } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/account/EmptyState";
import { OrderStatusBadge } from "@/components/admin/ui";
import { Box } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/i18n-utils";
import type { OrderStatus } from "@/lib/orders";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/orders">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AccountArea" });
  return { title: t("orders"), robots: { index: false } };
}

export default async function OrdersPage({ params }: PageProps<"/[locale]/account/orders">) {
  const { locale: loc } = await params;
  setRequestLocale(loc);
  const { user } = await requireUser(loc, "/account/orders");
  const locale = await getLocale();
  const t = await getTranslations("AccountArea");
  const tStatus = await getTranslations("OrderStatus");
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { placedAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  if (!orders.length) {
    return <EmptyState icon={Package} title={t("ordersEmptyTitle")} body={t("ordersEmptyBody")} cta={{ href: "/", label: t("startShopping") }} />;
  }
  const dt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium" });

  return (
    <div className="space-y-3">
      <Box className="px-5 py-4">
        <h1 className="text-xl font-extrabold">{t("orders")}</h1>
      </Box>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/account/orders/${o.number}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-sm border border-line bg-white p-4 hover:border-ink-400">
              <span className="font-bold" dir="ltr">{o.number}</span>
              <span className="text-sm text-ink-600">{t("orderPlaced", { date: dt.format(o.placedAt) })}</span>
              <span className="text-sm text-ink-600">{t("orderItems", { count: o._count.items })}</span>
              <span className="ms-auto font-bold tabular-nums">{formatPrice(Number(o.total), locale)}</span>
              <OrderStatusBadge status={o.status as OrderStatus} label={tStatus(o.status)} />
              <ChevronRight className="flip-rtl size-4 text-ink-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
