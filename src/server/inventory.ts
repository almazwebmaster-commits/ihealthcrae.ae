import "server-only";
import { z } from "zod";
import type { Prisma, StockReason } from "@/generated/prisma/client";
import { audit, type Actor } from "./admin/audit";
import { db } from "./db";

type Tx = Prisma.TransactionClient;

/** Logs a stock change that has just been applied to the product (balance = stock afterwards). */
export async function recordMovement(
  tx: Tx,
  m: { productId: number; change: number; reason: StockReason; orderId?: number | null; note?: string | null; actor?: Actor | null },
) {
  if (!m.change) return;
  const p = await tx.product.findUnique({ where: { id: m.productId }, select: { stock: true } });
  if (!p) return;
  await tx.stockMovement.create({
    data: { productId: m.productId, change: m.change, balance: p.stock, reason: m.reason, orderId: m.orderId ?? null, note: m.note ?? null, actorId: m.actor?.id ?? null, actorName: m.actor?.name ?? null },
  });
}

export const manualReasons = ["RECEIVE", "ADJUST", "RETURN", "DAMAGE"] as const satisfies readonly StockReason[];

export const AdjustInput = z.object({
  productId: z.number().int().positive(),
  /** Positive adds, negative removes; "ADJUST" may also set an exact count via `setTo` */
  change: z.number().int().min(-100_000).max(100_000),
  setTo: z.number().int().min(0).max(1_000_000).nullable().default(null),
  reason: z.enum(manualReasons),
  note: z.string().trim().max(200).default(""),
});

export type AdjustResult = { ok: true; stock: number } | { ok: false; error: "invalid" | "negative" | "notFound" };

/** Staff stock adjustment. Never lets stock go below zero, even with concurrent orders. */
export async function adjustStock(actor: Actor, raw: unknown): Promise<AdjustResult> {
  const parsed = AdjustInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;
  return db.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id: v.productId }, select: { stock: true, nameEn: true } });
    if (!p) return { ok: false, error: "notFound" } as const;
    const change = v.setTo != null ? v.setTo - p.stock : v.change;
    if (!change) return { ok: true, stock: p.stock } as const;
    const r = await tx.product.updateMany({
      where: { id: v.productId, ...(change < 0 ? { stock: { gte: -change } } : {}) },
      data: { stock: { increment: change } },
    });
    if (!r.count) return { ok: false, error: "negative" } as const;
    await recordMovement(tx, { productId: v.productId, change, reason: v.reason, note: v.note || null, actor });
    await audit(actor, "stock.adjust", "product", v.productId, `${p.nameEn}: ${change > 0 ? "+" : ""}${change} (${v.reason})`);
    return { ok: true, stock: p.stock + change } as const;
  });
}

export async function setLowStockAt(actor: Actor, productId: number, lowStockAt: number) {
  const n = Math.max(0, Math.min(100_000, Math.round(lowStockAt)));
  const p = await db.product.update({ where: { id: productId }, data: { lowStockAt: n } });
  await audit(actor, "stock.threshold", "product", productId, `${p.nameEn}: low at ${n}`);
}

const PER_PAGE = 30;
export const stockFilters = ["all", "low", "out"] as const;
export type StockFilter = (typeof stockFilters)[number];

/** Low stock = at or below the product's own limit (but not zero). */
const lowWhere = (): Prisma.ProductWhereInput => ({ stock: { gt: 0, lte: db.product.fields.lowStockAt } });

export async function listInventory(query: { q?: string; filter?: string; page?: number }) {
  const and: Prisma.ProductWhereInput[] = [{ status: { not: "ARCHIVED" } }];
  if (query.filter === "low") and.push(lowWhere());
  else if (query.filter === "out") and.push({ stock: 0 });
  const text = query.q?.trim();
  if (text) {
    const like = { contains: text, mode: "insensitive" as const };
    and.push({ OR: [{ nameEn: like }, { nameAr: like }, { sku: like }, { brand: { name: like } }] });
  }
  const where = { AND: and };
  const page = Math.max(1, query.page ?? 1);
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [{ stock: "asc" }, { nameEn: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: { id: true, sku: true, nameEn: true, nameAr: true, stock: true, lowStockAt: true, status: true, price: true, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } },
    }),
  ]);
  return { rows: rows.map((r) => ({ ...r, price: Number(r.price) })), total, page, pages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

export async function inventorySummary() {
  const live = { status: { not: "ARCHIVED" as const } };
  const [skus, out, low, units, value] = await Promise.all([
    db.product.count({ where: live }),
    db.product.count({ where: { ...live, stock: 0 } }),
    db.product.count({ where: { ...live, ...lowWhere() } }),
    db.product.aggregate({ where: live, _sum: { stock: true } }),
    db.$queryRaw<{ v: number }[]>`select coalesce(sum(price * stock), 0)::float as v from "Product" where status <> 'ARCHIVED'`,
  ]);
  return { skus, out, low, units: units._sum.stock ?? 0, value: value[0]?.v ?? 0 };
}

export async function lowStockProducts(take = 6) {
  return db.product.findMany({
    where: { status: "ACTIVE", stock: { lte: db.product.fields.lowStockAt } },
    orderBy: { stock: "asc" },
    take,
    select: { id: true, nameEn: true, nameAr: true, stock: true, sku: true, lowStockAt: true },
  });
}

export const countLowStock = () => db.product.count({ where: { status: "ACTIVE", stock: { lte: db.product.fields.lowStockAt } } });

export async function productMovements(productId: number, take = 100) {
  const [product, movements] = await Promise.all([
    db.product.findUnique({ where: { id: productId }, select: { id: true, sku: true, nameEn: true, nameAr: true, stock: true, lowStockAt: true } }),
    db.stockMovement.findMany({ where: { productId }, orderBy: { createdAt: "desc" }, take }),
  ]);
  if (!product) return null;
  const orderIds = [...new Set(movements.map((m) => m.orderId).filter((x): x is number => !!x))];
  const orders = new Map((await db.order.findMany({ where: { id: { in: orderIds } }, select: { id: true, number: true } })).map((o) => [o.id, o.number]));
  return { product, movements: movements.map((m) => ({ ...m, orderNumber: m.orderId ? orders.get(m.orderId) : undefined })) };
}
