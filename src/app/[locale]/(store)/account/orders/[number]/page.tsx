import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { OrderStatusBadge } from "@/components/admin/ui";
import { OrderItemsTable } from "@/components/orders/OrderItemsTable";
import { Box, BoxHeader } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { emirateName } from "@/lib/emirates";
import type { OrderStatus } from "@/lib/orders";
import { formatUaePhone } from "@/lib/phone";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/orders/[number]">): Promise<Metadata> {
  return { title: (await params).number, robots: { index: false } };
}

export default async function CustomerOrderPage({ params }: PageProps<"/[locale]/account/orders/[number]">) {
  const { locale: loc, number } = await params;
  setRequestLocale(loc);
  const { user } = await requireUser(loc, `/account/orders/${number}`);
  // Scoped to the signed-in customer: other customers' order numbers return 404.
  const order = await db.order.findFirst({
    where: { number, userId: user.id },
    include: { items: { orderBy: { id: "asc" } }, events: { where: { status: { not: null } }, orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  const locale = await getLocale();
  const t = await getTranslations("AccountArea");
  const tStatus = await getTranslations("OrderStatus");
  const tPay = await getTranslations("Payment");
  const dt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-4">
      <Link href="/account/orders" className="text-sm font-semibold text-brand-700 hover:underline">← {t("backToOrders")}</Link>
      <Box className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h1 className="text-xl font-extrabold" dir="ltr">{order.number}</h1>
          <p className="text-sm text-ink-600">{t("orderPlaced", { date: dt.format(order.placedAt) })} · {tPay(order.paymentMethod)}</p>
        </div>
        <OrderStatusBadge status={order.status as OrderStatus} label={tStatus(order.status)} />
      </Box>
      <Box className="p-4">
        <OrderItemsTable items={order.items} totals={order} />
      </Box>
      <div className="grid gap-4 md:grid-cols-2">
        <Box>
          <BoxHeader title={t("deliverTo")} />
          <address className="p-4 text-sm not-italic leading-6">
            {order.fullName}
            <br />
            {[order.unit, order.building, order.street].filter(Boolean).join(", ")}
            <br />
            {order.area}, {emirateName(order.emirate, locale)}
            <br />
            <bdi dir="ltr">{formatUaePhone(order.phone)}</bdi>
          </address>
        </Box>
        <Box>
          <BoxHeader title={tStatus(order.status)} />
          <ol className="space-y-2 p-4 text-sm">
            {order.events.map((e) => (
              <li key={e.id} className="flex justify-between gap-3">
                <span className="font-medium">{tStatus(e.status!)}</span>
                <span className="text-xs text-ink-500">{dt.format(e.createdAt)}</span>
              </li>
            ))}
          </ol>
        </Box>
      </div>
    </div>
  );
}
