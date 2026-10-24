import { CircleAlert, CircleCheck, Clock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { ClearCart } from "@/components/checkout/ClearCart";
import { OrderItemsTable } from "@/components/orders/OrderItemsTable";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { emirateName } from "@/lib/emirates";
import { finalizeCardOrder } from "@/server/checkout/place";
import { verifyReceiptToken } from "@/server/checkout/receipt-token";
import { db } from "@/server/db";
import { getSession } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout/complete">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Checkout" });
  return { title: t("thanksTitle"), robots: { index: false } };
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

/** Landing page after placing an order (COD) or after Stripe's redirect (card). */
export default async function CheckoutCompletePage({ params, searchParams }: PageProps<"/[locale]/checkout/complete">) {
  setRequestLocale((await params).locale);
  const sp = await searchParams;
  const number = str(sp.order) ?? "";
  const session = await getSession();

  let order = await db.order.findUnique({ where: { number }, include: { items: { orderBy: { id: "asc" } } } });
  if (!order) notFound();
  // Only the customer who placed it (signed token) or the account owner may see it.
  const allowed = verifyReceiptToken(number, str(sp.t)) || (session && order.userId === session.user.id);
  if (!allowed) notFound();

  // Card: confirm with Stripe right away (the webhook does the same; whichever is first wins).
  const intentId = str(sp.payment_intent);
  if (order.paymentMethod === "CARD" && order.status === "PENDING_PAYMENT" && intentId && intentId === order.stripePaymentIntentId) {
    order = (await finalizeCardOrder(intentId).then(() => db.order.findUnique({ where: { number }, include: { items: { orderBy: { id: "asc" } } } }))) ?? order;
  }

  const locale = await getLocale();
  const t = await getTranslations("Checkout");
  const tPay = await getTranslations("Payment");
  const confirmed = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";
  const failed = order.paymentMethod === "CARD" && order.status === "PENDING_PAYMENT" && str(sp.redirect_status) === "failed";

  return (
    <div className="container-site space-y-4 py-6">
      {confirmed && <ClearCart />}
      <Box className="mx-auto max-w-3xl p-6 text-center">
        {confirmed ? (
          <CircleCheck className="mx-auto size-12 text-success" aria-hidden />
        ) : failed ? (
          <CircleAlert className="mx-auto size-12 text-sale" aria-hidden />
        ) : (
          <Clock className="mx-auto size-12 text-accent-600" aria-hidden />
        )}
        <h1 className="mt-3 text-2xl font-extrabold">{confirmed ? t("thanksTitle") : failed ? t("failedTitle") : t("pendingTitle")}</h1>
        <p className="mt-1 text-sm text-ink-600">
          {confirmed ? t("thanksBody", { number: order.number, email: order.email }) : failed ? t("failedBody") : t("pendingBody")}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {failed ? (
            <Link href="/checkout" className={buttonClass("accent", "md")}>{t("tryAgain")}</Link>
          ) : (
            <>
              {session && order.userId === session.user.id && (
                <Link href={`/account/orders/${order.number}`} className={buttonClass("primary", "md")}>{t("viewOrder")}</Link>
              )}
              <Link href="/" className={buttonClass("outline", "md")}>{t("continueShopping")}</Link>
            </>
          )}
        </div>
      </Box>

      <Box className="mx-auto max-w-3xl p-5">
        <div className="mb-4 flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-bold" dir="ltr">{order.number}</span>
          <span className="text-ink-600">{tPay(order.paymentMethod)} · {tPay(order.paymentStatus)}</span>
        </div>
        <OrderItemsTable items={order.items} totals={order} compact />
        <p className="mt-4 border-t border-line pt-3 text-sm text-ink-700">
          <span className="font-semibold">{t("deliverTo")}:</span> {[order.unit, order.building, order.street].filter(Boolean).join(", ")}, {order.area}, {emirateName(order.emirate, locale)}
          {order.deliveryMethod === "express" && <span className="ms-2 font-semibold text-brand-700">· {t("express")}</span>}
        </p>
      </Box>
    </div>
  );
}
