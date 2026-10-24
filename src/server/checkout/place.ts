import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { emirateSlugs } from "@/lib/emirates";
import { orderNumber } from "@/lib/orders";
import { normalizeUaePhone } from "@/lib/phone";
import { deliveryMethods } from "@/lib/store-settings";
import { db } from "../db";
import { orderConfirmationMail } from "../email-templates";
import { sendMail } from "../mail";
import type { Session } from "../auth";
import { ensureStripeCustomer, stripe, toFils } from "../stripe";
import { quoteCart, type QuoteIssue } from "./quote";
import { receiptToken } from "./receipt-token";

const opt = z.string().trim().max(120).optional().transform((v) => v || undefined);

export const PlaceOrderInput = z.object({
  lines: z
    .array(z.object({ slug: z.string().min(1).max(200), option: z.number().int().min(0).optional(), sub: z.number().int().min(1).max(52).optional(), qty: z.number().int().min(1).max(10) }))
    .min(1)
    .max(50),
  email: z.string().trim().toLowerCase().email().max(200),
  fullName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(1).max(30),
  emirate: z.enum(emirateSlugs),
  area: z.string().trim().min(1).max(80),
  street: opt,
  building: z.string().trim().min(1).max(120),
  unit: opt,
  landmark: opt,
  note: z.string().trim().max(500).optional().transform((v) => v || undefined),
  delivery: z.enum(deliveryMethods),
  payment: z.enum(["CARD", "COD"]),
  saveAddress: z.boolean().optional(),
  locale: z.enum(["en", "ar"]),
});
export type PlaceOrderInputT = z.infer<typeof PlaceOrderInput>;

export type PlaceResult =
  | { ok: true; number: string; token: string; clientSecret?: string }
  | { ok: false; error: "invalid" | "invalidPhone" | "empty" | "issues" | "codNotAllowed" | "signInForSubscription" | "payment"; fields?: string[]; issues?: QuoteIssue[] };

class StockError extends Error {
  constructor(public slug: string) {
    super("stock");
  }
}

type Tx = Prisma.TransactionClient;

/** Decrements stock only if enough is left (atomic per product). */
async function takeStock(tx: Tx, items: { productId: number | null; slug: string; qty: number }[]) {
  for (const i of items) {
    if (!i.productId) continue;
    const r = await tx.product.updateMany({ where: { id: i.productId, stock: { gte: i.qty } }, data: { stock: { decrement: i.qty } } });
    if (r.count === 0) throw new StockError(i.slug);
  }
}

async function sendConfirmation(orderId: number) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (order) void sendMail(orderConfirmationMail(order)).catch((e) => console.error("[mail] order confirmation failed", e));
}

export async function placeOrder(raw: unknown, session: Session | null): Promise<PlaceResult> {
  const parsed = PlaceOrderInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid", fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))] };
  const v = parsed.data;
  const phone = normalizeUaePhone(v.phone);
  if (!phone) return { ok: false, error: "invalidPhone", fields: ["phone"] };

  const quote = await quoteCart(v.lines, { emirate: v.emirate, delivery: v.delivery, payment: v.payment });
  if (!quote.lines.length) return { ok: false, error: "empty" };
  if (quote.issues.length) return { ok: false, error: "issues", issues: quote.issues };
  if (quote.hasSubscription && !session) return { ok: false, error: "signInForSubscription" };
  if (v.payment === "COD" && !quote.codAllowed) return { ok: false, error: "codNotAllowed" };

  const items = quote.lines.map((l) => ({
    productId: l.product.id,
    slug: l.product.slug,
    sku: l.product.sku,
    nameEn: l.product.name.en,
    nameAr: l.product.name.ar,
    optionEn: l.optionLabel?.en ?? null,
    optionAr: l.optionLabel?.ar ?? null,
    imageUrl: l.product.images[0]?.url ?? null,
    unitPrice: l.unit,
    qty: l.qty,
    lineTotal: l.total,
    subWeeks: l.sub ?? null,
  }));
  const cod = v.payment === "COD";

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      if (cod) await takeStock(tx, items); // card orders take stock once payment succeeds
      const created = await tx.order.create({
        data: {
          number: `TMP-${crypto.randomUUID()}`,
          userId: session?.user.id ?? null,
          status: cod ? "PLACED" : "PENDING_PAYMENT",
          paymentMethod: v.payment,
          paymentStatus: "UNPAID",
          locale: v.locale,
          deliveryMethod: quote.express ? "express" : "standard",
          email: v.email,
          fullName: v.fullName,
          phone,
          emirate: v.emirate,
          area: v.area,
          street: v.street,
          building: v.building,
          unit: v.unit,
          landmark: v.landmark,
          customerNote: v.note,
          itemsTotal: quote.itemsTotal,
          discount: quote.discount,
          deliveryFee: round2(quote.deliveryFee + quote.codFee),
          total: quote.total,
          vatAmount: quote.vatAmount,
          items: { create: items },
          events: { create: { status: cod ? "PLACED" : "PENDING_PAYMENT", note: cod ? "Cash on delivery" : "Awaiting card payment" } },
        },
      });
      return tx.order.update({ where: { id: created.id }, data: { number: orderNumber(created.id) } });
    });
  } catch (e) {
    if (e instanceof StockError) return { ok: false, error: "issues", issues: [{ slug: e.slug, problem: "stock" }] };
    throw e;
  }

  if (session && v.saveAddress) await saveAddressIfNew(session.user.id, { ...v, phone });

  const token = receiptToken(order.number);
  if (cod) {
    await sendConfirmation(order.id);
    return { ok: true, number: order.number, token };
  }

  try {
    const customer = session ? await ensureStripeCustomer(session.user) : undefined;
    const intent = await stripe().paymentIntents.create(
      {
        amount: toFils(quote.total),
        currency: "aed",
        customer,
        receipt_email: v.email,
        description: `iHealthcare order ${order.number}`,
        metadata: { orderId: String(order.id), orderNumber: order.number },
        automatic_payment_methods: { enabled: true },
        // Save the card for Subscribe & save renewals.
        ...(quote.hasSubscription ? { setup_future_usage: "off_session" as const } : {}),
      },
      { idempotencyKey: `order-${order.id}` },
    );
    await db.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: intent.id } });
    return { ok: true, number: order.number, token, clientSecret: intent.client_secret! };
  } catch (e) {
    console.error("[checkout] Stripe error", e);
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED", events: { create: { status: "CANCELLED", note: "Card payment could not be started" } } } });
    return { ok: false, error: "payment" };
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

async function saveAddressIfNew(userId: string, a: { fullName: string; phone: string; emirate: string; area: string; street?: string; building: string; unit?: string; landmark?: string }) {
  const existing = await db.address.findMany({ where: { userId } });
  const same = existing.some((x) => x.building === a.building && x.area === a.area && (x.unit ?? "") === (a.unit ?? "") && x.emirate === a.emirate);
  if (same || existing.length >= 10) return;
  await db.address.create({
    data: { userId, fullName: a.fullName, phone: a.phone, emirate: a.emirate, area: a.area, street: a.street, building: a.building, unit: a.unit, landmark: a.landmark, isDefault: existing.length === 0 },
  });
}

/**
 * Moves a card order from PENDING_PAYMENT to PLACED once Stripe reports success.
 * Safe to call repeatedly and concurrently (return page + webhook): only one caller wins the status flip.
 */
export async function finalizeCardOrder(paymentIntentId: string) {
  const order = await db.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId }, include: { items: true } });
  if (!order) return null;
  if (order.status !== "PENDING_PAYMENT") return order;

  const intent = await stripe().paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== "succeeded") {
    if (intent.status === "requires_payment_method" && intent.last_payment_error) {
      const msg = intent.last_payment_error.message ?? "Payment failed";
      const already = await db.orderEvent.findFirst({ where: { orderId: order.id, note: `Payment failed: ${msg}` } });
      if (!already) await db.orderEvent.create({ data: { orderId: order.id, note: `Payment failed: ${msg}` } });
    }
    return order;
  }
  if (intent.amount !== toFils(Number(order.total)) || intent.currency !== "aed") {
    console.error(`[checkout] Amount mismatch on ${order.number}`);
    await db.orderEvent.create({ data: { orderId: order.id, note: "Paid amount does not match the order total — review before shipping" } });
  }

  const won = await db.$transaction(async (tx) => {
    const flip = await tx.order.updateMany({ where: { id: order.id, status: "PENDING_PAYMENT" }, data: { status: "PLACED", paymentStatus: "PAID" } });
    if (flip.count === 0) return false;
    try {
      await takeStock(tx, order.items);
    } catch (e) {
      if (!(e instanceof StockError)) throw e;
      // Paid but short on stock: keep the order, flag it for staff.
      await tx.orderEvent.create({ data: { orderId: order.id, note: `Stock shortfall on ${e.slug} — contact the customer` } });
    }
    await tx.orderEvent.create({ data: { orderId: order.id, status: "PLACED", note: "Card payment received" } });

    // Create Subscribe & save subscriptions from the paid order.
    const subLines = order.items.filter((i) => i.subWeeks && i.productId);
    // (Renewal orders already belong to a subscription.)
    if (order.userId && subLines.length && !order.subscriptionId) {
      const pm = typeof intent.payment_method === "string" ? intent.payment_method : intent.payment_method?.id;
      for (const i of subLines) {
        const product = await tx.product.findUnique({ where: { id: i.productId! }, include: { variants: { orderBy: { position: "asc" } } } });
        const option = product?.variants.findIndex((x) => x.labelEn === i.optionEn) ?? -1;
        await tx.subscription.create({
          data: {
            userId: order.userId,
            productId: i.productId!,
            option: i.optionEn ? option : -1,
            qty: i.qty,
            intervalWeeks: i.subWeeks!,
            nextDeliveryAt: new Date(Date.now() + i.subWeeks! * 7 * 24 * 3600_000),
            stripePaymentMethodId: pm ?? null,
            locale: order.locale,
            fullName: order.fullName, phone: order.phone, emirate: order.emirate, area: order.area,
            street: order.street, building: order.building, unit: order.unit, landmark: order.landmark,
            createdFromOrderId: order.id,
          },
        });
      }
    }
    return true;
  });

  if (won) await sendConfirmation(order.id);
  return db.order.findUnique({ where: { id: order.id }, include: { items: true } });
}
