import "server-only";
import { orderNumber } from "@/lib/orders";
import { priceLine, SUBSCRIBE_FREQUENCIES } from "@/lib/pricing";
import { FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_FEE, VAT_RATE } from "@/lib/store-settings";
import { getProduct } from "./catalog";
import { finalizeCardOrder } from "./checkout/place";
import { db } from "./db";
import { stripe, toFils } from "./stripe";

const DAY = 24 * 3600_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

export function listSubscriptions(userId: string) {
  return db.subscription.findMany({
    where: { userId, status: { not: "CANCELLED" } },
    orderBy: { nextDeliveryAt: "asc" },
    include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: { orderBy: { position: "asc" } } } } },
  });
}

// ── Customer actions (always scoped to the owner)

async function own(userId: string, id: number) {
  const sub = await db.subscription.findFirst({ where: { id, userId, status: { not: "CANCELLED" } } });
  if (!sub) throw new Error("Subscription not found");
  return sub;
}

export async function skipNextDelivery(userId: string, id: number) {
  const sub = await own(userId, id);
  await db.subscription.update({ where: { id }, data: { nextDeliveryAt: new Date(sub.nextDeliveryAt.getTime() + sub.intervalWeeks * 7 * DAY) } });
}

export async function changeInterval(userId: string, id: number, weeks: number) {
  if (!(SUBSCRIBE_FREQUENCIES as readonly number[]).includes(weeks)) throw new Error("Invalid interval");
  await own(userId, id);
  await db.subscription.update({ where: { id }, data: { intervalWeeks: weeks } });
}

export async function setPaused(userId: string, id: number, paused: boolean) {
  const sub = await own(userId, id);
  const nextDeliveryAt = !paused && sub.nextDeliveryAt.getTime() < Date.now() ? new Date(Date.now() + DAY) : sub.nextDeliveryAt;
  await db.subscription.update({ where: { id }, data: { status: paused ? "PAUSED" : "ACTIVE", nextDeliveryAt } });
}

export async function cancelSubscription(userId: string, id: number) {
  await own(userId, id);
  await db.subscription.update({ where: { id }, data: { status: "CANCELLED" } });
}

// ── Renewals

export type RenewalResult = { subscriptionId: number; outcome: "charged" | "failed" | "skipped"; order?: string; reason?: string };

/** Charges every due ACTIVE subscription off-session and creates its order. Run on a schedule (daily). */
export async function runRenewals(now = new Date()): Promise<RenewalResult[]> {
  const due = await db.subscription.findMany({
    where: { status: "ACTIVE", nextDeliveryAt: { lte: now } },
    include: { user: { select: { email: true, stripeCustomerId: true } } },
    take: 100,
  });
  const results: RenewalResult[] = [];

  for (const sub of due) {
    const retryTomorrow = (reason: string) =>
      db.subscription.update({ where: { id: sub.id }, data: { lastError: reason, nextDeliveryAt: new Date(now.getTime() + DAY) } });

    const productRow = await db.product.findUnique({ where: { id: sub.productId }, select: { slug: true } });
    const product = productRow ? await getProduct(productRow.slug) : undefined;
    if (!product || !product.subscribe) {
      await retryTomorrow("Product unavailable");
      results.push({ subscriptionId: sub.id, outcome: "skipped", reason: "unavailable" });
      continue;
    }
    if (product.stock < sub.qty) {
      await retryTomorrow("Out of stock");
      results.push({ subscriptionId: sub.id, outcome: "skipped", reason: "stock" });
      continue;
    }
    if (!sub.user.stripeCustomerId || !sub.stripePaymentMethodId) {
      await retryTomorrow("No saved card");
      results.push({ subscriptionId: sub.id, outcome: "failed", reason: "no card" });
      continue;
    }

    const option = sub.option >= 0 ? sub.option : undefined;
    const p = priceLine(product, option, sub.qty, sub.intervalWeeks);
    const deliveryFee = p.total >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
    const total = round2(p.total + deliveryFee);
    const label = option != null ? product.options?.[option]?.label : undefined;

    const created = await db.order.create({
      data: {
        number: `TMP-${crypto.randomUUID()}`,
        userId: sub.userId,
        subscriptionId: sub.id,
        status: "PENDING_PAYMENT",
        paymentMethod: "CARD",
        locale: sub.locale,
        email: sub.user.email,
        fullName: sub.fullName, phone: sub.phone, emirate: sub.emirate, area: sub.area,
        street: sub.street, building: sub.building, unit: sub.unit, landmark: sub.landmark,
        itemsTotal: round2(p.base * sub.qty),
        discount: p.savings,
        deliveryFee,
        total,
        vatAmount: round2(total - total / (1 + VAT_RATE)),
        items: {
          create: {
            productId: product.id, slug: product.slug, sku: product.sku, nameEn: product.name.en, nameAr: product.name.ar,
            optionEn: label?.en ?? null, optionAr: label?.ar ?? null, imageUrl: product.images[0]?.url ?? null,
            unitPrice: p.unit, qty: sub.qty, lineTotal: p.total, subWeeks: sub.intervalWeeks,
          },
        },
        events: { create: { status: "PENDING_PAYMENT", note: `Subscription renewal #${sub.id}` } },
      },
    });
    const order = await db.order.update({ where: { id: created.id }, data: { number: orderNumber(created.id) } });

    try {
      const intent = await stripe().paymentIntents.create(
        {
          amount: toFils(total),
          currency: "aed",
          customer: sub.user.stripeCustomerId,
          payment_method: sub.stripePaymentMethodId,
          off_session: true,
          confirm: true,
          description: `iHealthcare subscription renewal ${order.number}`,
          metadata: { orderId: String(order.id), orderNumber: order.number, subscriptionId: String(sub.id) },
        },
        { idempotencyKey: `renewal-${order.id}` },
      );
      await db.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: intent.id } });
      await finalizeCardOrder(intent.id);
      await db.subscription.update({
        where: { id: sub.id },
        data: { lastError: null, nextDeliveryAt: new Date(sub.nextDeliveryAt.getTime() + sub.intervalWeeks * 7 * DAY) },
      });
      results.push({ subscriptionId: sub.id, outcome: "charged", order: order.number });
    } catch (e) {
      const reason = (e as { message?: string }).message ?? "Card was declined";
      await db.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", events: { create: { status: "CANCELLED", note: `Renewal payment failed: ${reason}` } } },
      });
      await retryTomorrow(reason.slice(0, 200));
      results.push({ subscriptionId: sub.id, outcome: "failed", order: order.number, reason });
    }
  }
  return results;
}
