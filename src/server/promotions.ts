import "server-only";
import { z } from "zod";
import { CODE_RE, couponAmount, couponTypes, flashLive, normalizeCode, type CouponError, type CouponRule } from "@/lib/promotions";
import { fromUaeInput } from "@/lib/uae-time";
import { audit, type Actor } from "./admin/audit";
import { db, type Tx } from "./db";


export type CouponCheck =
  | { ok: true; coupon: CouponRule & { id: number; descriptionEn: string; descriptionAr: string } }
  | { ok: false; error: CouponError; minSpend?: number };

/** Validates a code for a cart. Email enables the per-customer check (known at checkout). */
export async function checkCoupon(raw: string, ctx: { subtotal: number; email?: string }, tx: Tx = db): Promise<CouponCheck> {
  const code = normalizeCode(raw);
  const c = code ? await tx.coupon.findUnique({ where: { code } }) : null;
  if (!c) return { ok: false, error: "notFound" };
  const now = new Date();
  if (!c.active) return { ok: false, error: "inactive" };
  if (c.startsAt && c.startsAt > now) return { ok: false, error: "notStarted" };
  if (c.endsAt && c.endsAt <= now) return { ok: false, error: "expired" };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { ok: false, error: "usedUp" };
  if (c.minSpend && ctx.subtotal < Number(c.minSpend)) return { ok: false, error: "minSpend", minSpend: Number(c.minSpend) };
  if (c.perCustomerLimit != null && ctx.email) {
    const used = await tx.couponRedemption.count({ where: { couponId: c.id, email: ctx.email.toLowerCase() } });
    if (used >= c.perCustomerLimit) return { ok: false, error: "perCustomer" };
  }
  return {
    ok: true,
    coupon: { id: c.id, code: c.code, type: c.type, value: Number(c.value), maxDiscount: c.maxDiscount == null ? null : Number(c.maxDiscount), descriptionEn: c.descriptionEn, descriptionAr: c.descriptionAr },
  };
}

export class CouponRaceError extends Error {
  constructor(public reason: CouponError) {
    super("coupon");
  }
}

/** Inside the order transaction: re-checks the code and takes one use atomically. */
export async function redeemCoupon(tx: Tx, couponId: number, order: { id: number; email: string }, amount: number, ctx: { subtotal: number }) {
  const c = await tx.coupon.findUniqueOrThrow({ where: { id: couponId } });
  const check = await checkCoupon(c.code, { subtotal: ctx.subtotal, email: order.email }, tx);
  if (!check.ok) throw new CouponRaceError(check.error);
  const took = await tx.coupon.updateMany({
    where: { id: couponId, active: true, OR: [{ usageLimit: null }, { usedCount: { lt: c.usageLimit ?? 0 } }] },
    data: { usedCount: { increment: 1 } },
  });
  if (!took.count) throw new CouponRaceError("usedUp");
  await tx.couponRedemption.create({ data: { couponId, orderId: order.id, email: order.email.toLowerCase(), amount } });
}

/** Gives the use back when an order is cancelled (or its card payment never starts). */
export async function releaseCoupon(tx: Tx, orderId: number) {
  const r = await tx.couponRedemption.findUnique({ where: { orderId } });
  if (!r) return;
  await tx.couponRedemption.delete({ where: { id: r.id } });
  await tx.coupon.updateMany({ where: { id: r.couponId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
}

// ── Admin

const money = z.number().finite().positive().max(1_000_000);
/** UAE-time datetime-local value → Date */
const optDate = z.string().trim().optional().transform((v, ctx) => {
  if (!v) return null;
  const d = fromUaeInput(v);
  if (!d) {
    ctx.addIssue({ code: "custom", message: "date" });
    return z.NEVER;
  }
  return d;
});

export const CouponInput = z
  .object({
    id: z.number().int().positive().optional(),
    code: z.string().transform(normalizeCode).pipe(z.string().regex(CODE_RE, "code")),
    descriptionEn: z.string().trim().max(200),
    descriptionAr: z.string().trim().max(200),
    type: z.enum(couponTypes),
    value: z.number().finite().min(0).max(1_000_000),
    maxDiscount: money.nullable(),
    minSpend: money.nullable(),
    startsAt: optDate,
    endsAt: optDate,
    usageLimit: z.number().int().positive().max(1_000_000).nullable(),
    perCustomerLimit: z.number().int().positive().max(1000).nullable(),
    active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "PERCENT" && (v.value <= 0 || v.value > 90)) ctx.addIssue({ code: "custom", path: ["value"], message: "percent" });
    if (v.type === "FIXED" && v.value <= 0) ctx.addIssue({ code: "custom", path: ["value"], message: "required" });
    if (v.startsAt && v.endsAt && v.endsAt <= v.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "endBeforeStart" });
  });

export type SaveCouponResult = { ok: true; id: number } | { ok: false; errors: Record<string, string> };

export async function saveCoupon(actor: Actor, raw: unknown): Promise<SaveCouponResult> {
  const parsed = CouponInput.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0] ?? "form")] ??= ["code", "percent", "endBeforeStart", "date"].includes(i.message) ? i.message : "required";
    return { ok: false, errors };
  }
  const { id, ...v } = parsed.data;
  const clash = await db.coupon.findFirst({ where: { code: v.code, ...(id ? { id: { not: id } } : {}) }, select: { id: true } });
  if (clash) return { ok: false, errors: { code: "taken" } };
  const data = { ...v, value: v.type === "FREE_DELIVERY" ? 0 : v.value, maxDiscount: v.type === "PERCENT" ? v.maxDiscount : null };
  const saved = id ? await db.coupon.update({ where: { id }, data }) : await db.coupon.create({ data });
  await audit(actor, id ? "coupon.update" : "coupon.create", "coupon", saved.id, saved.code);
  return { ok: true, id: saved.id };
}

export async function setCouponActive(actor: Actor, id: number, active: boolean) {
  const c = await db.coupon.update({ where: { id }, data: { active } });
  await audit(actor, active ? "coupon.enable" : "coupon.disable", "coupon", id, c.code);
}

export function listCoupons() {
  return db.coupon.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }] });
}

export async function getCoupon(id: number) {
  const c = await db.coupon.findUnique({
    where: { id },
    include: { redemptions: { orderBy: { createdAt: "desc" }, take: 20, include: { order: { select: { number: true, total: true, status: true } } } } },
  });
  if (!c) return null;
  const totals = await db.couponRedemption.aggregate({ where: { couponId: id }, _sum: { amount: true } });
  return { ...c, totalDiscount: Number(totals._sum.amount ?? 0) };
}

/** Products with a flash deal that is live or still to come. */
export async function listFlashDeals() {
  const rows = await db.product.findMany({
    where: { flashPct: { not: null }, flashEndsAt: { gt: new Date() } },
    orderBy: { flashEndsAt: "asc" },
    select: { id: true, slug: true, nameEn: true, nameAr: true, price: true, flashPct: true, flashStartsAt: true, flashEndsAt: true, stock: true, status: true },
  });
  return rows.map((r) => ({ ...r, price: Number(r.price), live: flashLive(r) }));
}

export { couponAmount };
