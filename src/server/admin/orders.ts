import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { nextStatuses, openStatuses, orderStatuses, type OrderStatus } from "@/lib/orders";
import { db } from "../db";
import { stripe } from "../stripe";
import { audit, type Actor } from "./audit";

const PER_PAGE = 25;

export type OrderListQuery = { q?: string; status?: string; payment?: string; page?: number };

export async function listOrders(query: OrderListQuery) {
  const and: Prisma.OrderWhereInput[] = [];
  if (query.status === "open") and.push({ status: { in: openStatuses } });
  else if (orderStatuses.includes(query.status as OrderStatus)) and.push({ status: query.status as OrderStatus });
  if (query.payment === "CARD" || query.payment === "COD") and.push({ paymentMethod: query.payment });
  const text = query.q?.trim();
  if (text) {
    const like = { contains: text, mode: "insensitive" as const };
    and.push({ OR: [{ number: like }, { email: like }, { fullName: like }, { phone: { contains: text.replace(/\s/g, "") } }] });
  }
  const where = { AND: and };
  const page = Math.max(1, query.page ?? 1);
  const [total, rows, counts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { items: true } } },
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<Record<OrderStatus, number>>;
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PER_PAGE)), byStatus };
}

export function getOrder(number: string) {
  return db.order.findUnique({
    where: { number },
    include: {
      items: { orderBy: { id: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrder>>>;

/** Moves an order along its lifecycle. Cancelling returns stock (real orders only). */
export async function changeOrderStatus(actor: Actor, number: string, to: OrderStatus, note?: string) {
  const order = await db.order.findUnique({ where: { number }, include: { items: true } });
  if (!order) throw new Error("Order not found");
  if (!nextStatuses[order.status].includes(to)) throw new Error(`Cannot move ${order.status} → ${to}`);

  // Card money goes back through Stripe before the order is updated (if Stripe fails, nothing changes).
  let refundNote: string | undefined;
  const closing = to === "CANCELLED" || to === "REFUNDED";
  if (closing && order.paymentMethod === "CARD" && order.stripePaymentIntentId && !order.isDemo) {
    if (order.paymentStatus === "PAID") {
      const refund = await stripe().refunds.create({ payment_intent: order.stripePaymentIntentId }, { idempotencyKey: `refund-${order.id}` });
      refundNote = `Refunded to card via Stripe (${refund.id})`;
    } else if (order.status === "PENDING_PAYMENT") {
      await stripe().paymentIntents.cancel(order.stripePaymentIntentId).catch(() => {}); // stop a late payment
    }
  }

  await db.$transaction(async (tx) => {
    const data: Prisma.OrderUpdateInput = { status: to };
    // Cash is collected on delivery.
    if (to === "DELIVERED" && order.paymentMethod === "COD") data.paymentStatus = "PAID";
    if (to === "REFUNDED" || refundNote) data.paymentStatus = "REFUNDED";
    await tx.order.update({ where: { id: order.id }, data });

    // Card orders awaiting payment never took stock, so only restock placed orders.
    if (to === "CANCELLED" && !order.isDemo && order.status !== "PENDING_PAYMENT") {
      for (const item of order.items) {
        if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } });
      }
    }
    const fullNote = [note?.trim(), refundNote].filter(Boolean).join("\n") || null;
    await tx.orderEvent.create({ data: { orderId: order.id, status: to, note: fullNote, actorId: actor.id, actorName: actor.name } });
  });
  await audit(actor, "order.status", "order", number, `${order.status} → ${to}`);
}

export async function markOrderPaid(actor: Actor, number: string) {
  const order = await db.order.findUnique({ where: { number } });
  if (!order || order.paymentStatus !== "UNPAID") return;
  await db.$transaction([
    db.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } }),
    db.orderEvent.create({ data: { orderId: order.id, note: "Payment received", actorId: actor.id, actorName: actor.name } }),
  ]);
  await audit(actor, "order.paid", "order", number);
}

export async function addOrderNote(actor: Actor, number: string, note: string) {
  const order = await db.order.findUnique({ where: { number }, select: { id: true } });
  if (!order || !note.trim()) return;
  await db.orderEvent.create({ data: { orderId: order.id, note: note.trim().slice(0, 1000), actorId: actor.id, actorName: actor.name } });
  await audit(actor, "order.note", "order", number);
}

// ── Dashboard

export async function dashboardStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const counted = { status: { notIn: ["CANCELLED", "REFUNDED", "PENDING_PAYMENT"] as OrderStatus[] } };

  const [today, revenue7, open, lowStock, recent, lowStockList, codToCollect] = await Promise.all([
    db.order.count({ where: { placedAt: { gte: startOfToday }, ...counted } }),
    db.order.aggregate({ where: { placedAt: { gte: weekAgo }, ...counted }, _sum: { total: true }, _count: { _all: true } }),
    db.order.count({ where: { status: { in: openStatuses } } }),
    db.product.count({ where: { status: "ACTIVE", stock: { lt: 5 } } }),
    db.order.findMany({ orderBy: { placedAt: "desc" }, take: 8 }),
    db.product.findMany({ where: { status: "ACTIVE", stock: { lt: 5 } }, orderBy: { stock: "asc" }, take: 6, select: { id: true, nameEn: true, nameAr: true, stock: true, sku: true } }),
    db.order.aggregate({ where: { paymentMethod: "COD", paymentStatus: "UNPAID", status: { in: openStatuses } }, _sum: { total: true } }),
  ]);
  return {
    today,
    revenue7: Number(revenue7._sum.total ?? 0),
    orders7: revenue7._count._all,
    open,
    lowStock,
    recent,
    lowStockList,
    codToCollect: Number(codToCollect._sum.total ?? 0),
  };
}
