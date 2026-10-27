import { PackageCheck, Printer } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { OrderActions } from "@/components/admin/OrderActions";
import { AdminHeader, OrderStatusBadge } from "@/components/admin/ui";
import { OrderItemsTable } from "@/components/orders/OrderItemsTable";
import { Badge } from "@/components/ui/Badge";
import { Box, BoxHeader } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { emirateName } from "@/lib/emirates";
import type { OrderStatus } from "@/lib/orders";
import { formatUaePhone } from "@/lib/phone";
import { getOrder } from "@/server/admin/orders";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/orders/[number]">): Promise<Metadata> {
  const { locale, number } = await params;
  const t = await getTranslations({ locale, namespace: "AdminUI.order" });
  return { title: t("title", { number }) };
}

export default async function AdminOrderPage({ params }: PageProps<"/[locale]/admin/orders/[number]">) {
  const { locale: loc, number } = await params;
  setRequestLocale(loc);
  const order = await getOrder(number);
  if (!order) notFound();
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.order");
  const tOrders = await getTranslations("AdminUI.orders");
  const tStatus = await getTranslations("OrderStatus");
  const tPay = await getTranslations("Payment");
  const dt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeStyle: "short" });
  const status = order.status as OrderStatus;

  return (
    <div>
      <Link href="/admin/orders" className="mb-2 inline-block text-sm font-semibold text-brand-700 hover:underline">← {t("back")}</Link>
      <AdminHeader
        title={<span dir="ltr">{order.number}</span>}
        subtitle={t("placed", { date: dt.format(order.placedAt) })}
        actions={
          <>
            {order.isDemo && <Badge tone="neutral">{tOrders("demo")}</Badge>}
            <OrderStatusBadge status={status} label={tStatus(status)} />
            <Link href={`/admin/orders/${order.number}/packing-slip`} className={buttonClass("outline", "sm")}>
              <PackageCheck className="size-3.5" aria-hidden />
              {t("packingSlip")}
            </Link>
            <Link href={`/admin/orders/${order.number}/invoice`} className={buttonClass("outline", "sm")}>
              <Printer className="size-3.5" aria-hidden />
              {t("invoice")}
            </Link>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Box className="p-4">
            <OrderItemsTable items={order.items} totals={order} />
          </Box>

          <div className="grid gap-4 md:grid-cols-2">
            <Box>
              <BoxHeader title={t("customer")} />
              <div className="space-y-1 p-4 text-sm">
                <p className="font-semibold">{order.fullName}</p>
                <p dir="ltr" className="text-start"><a href={`mailto:${order.email}`} className="text-brand-700 hover:underline">{order.email}</a></p>
                <p dir="ltr" className="text-start"><a href={`tel:${order.phone}`} className="hover:underline">{formatUaePhone(order.phone)}</a></p>
                <p className="pt-1 text-xs text-ink-500">
                  {order.user ? (
                    <Link href={`/admin/customers/${order.user.id}`} className="font-semibold text-brand-700 hover:underline">{`${t("account")}: ${order.user.name}`}</Link>
                  ) : (
                    t("guest")
                  )}
                </p>
                <p className="pt-2 text-xs">
                  <span className="font-semibold">{t("payment")}:</span> {tPay(order.paymentMethod)} · {tPay(order.paymentStatus)}
                </p>
                {order.stripePaymentIntentId && (
                  <a
                    href={`https://dashboard.stripe.com/${order.stripePaymentIntentId.startsWith("pi_") && process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") ? "test/" : ""}payments/${order.stripePaymentIntentId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs font-semibold text-brand-700 hover:underline"
                    dir="ltr"
                  >
                    {t("stripeLink")} ↗
                  </a>
                )}
                <p className="text-xs">
                  <span className="font-semibold">{t("deliveryMethod")}:</span> {order.deliveryMethod === "express" ? t("express") : t("standard")}
                </p>
                {order.subscriptionId && <p className="text-xs font-semibold text-brand-700">{t("renewal", { id: order.subscriptionId })}</p>}
              </div>
            </Box>
            <Box>
              <BoxHeader title={t("delivery")} />
              <address className="space-y-0.5 p-4 text-sm not-italic leading-6">
                <p>{[order.unit, order.building, order.street].filter(Boolean).join(", ")}</p>
                <p>{order.area}, {emirateName(order.emirate, locale)}</p>
                {order.landmark && <p className="text-ink-500">{order.landmark}</p>}
                {order.customerNote && (
                  <p className="mt-2 rounded-sm bg-accent-50 px-2 py-1 text-xs"><span className="font-semibold">{t("customerNote")}:</span> {order.customerNote}</p>
                )}
              </address>
            </Box>
          </div>
        </div>

        <div className="space-y-4">
          <OrderActions key={`${status}-${order.paymentStatus}`} number={order.number} status={status} paymentMethod={order.paymentMethod} paymentStatus={order.paymentStatus} />
          <Box>
            <BoxHeader title={t("timeline")} />
            <ol className="space-y-3 p-4">
              {[...order.events].reverse().map((e) => (
                <li key={e.id} className="relative border-s-2 border-line ps-3 text-sm">
                  {e.status && <OrderStatusBadge status={e.status as OrderStatus} label={tStatus(e.status)} />}
                  {e.note && <p className="mt-1 whitespace-pre-line text-ink-800">{e.note}</p>}
                  <p className="mt-0.5 text-xs text-ink-500">
                    {e.actorName ?? t("system")} · {dt.format(e.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </Box>
        </div>
      </div>
    </div>
  );
}
