import "server-only";
import type { OrderStatus } from "@/generated/prisma/client";
import { db } from "../db";

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

const DAY = 86_400_000;
const UAE = 4 * 3600_000;
/** Orders that count as sales (placed or further along, not cancelled/refunded/unpaid card). */
const NOT_COUNTED: OrderStatus[] = ["CANCELLED", "REFUNDED", "PENDING_PAYMENT"];

/** Midnight UAE time, `daysAgo` days before today, as a UTC Date. */
function uaeMidnight(daysAgo: number) {
  const uaeNow = Date.now() + UAE;
  return new Date(Math.floor(uaeNow / DAY) * DAY - daysAgo * DAY - UAE);
}
const uaeDateKey = (d: Date) => new Date(d.getTime() + UAE).toISOString().slice(0, 10);

async function totals(from: Date, to: Date) {
  const where = { placedAt: { gte: from, lt: to }, status: { notIn: NOT_COUNTED } };
  const [agg, units] = await Promise.all([
    db.order.aggregate({ where, _sum: { total: true }, _count: { _all: true } }),
    db.orderItem.aggregate({ where: { order: where }, _sum: { qty: true } }),
  ]);
  const revenue = Number(agg._sum.total ?? 0);
  const orders = agg._count._all;
  return { revenue, orders, aov: orders ? revenue / orders : 0, units: units._sum.qty ?? 0 };
}

/** Sales figures for the last `days` days (UAE calendar days, today included) vs the period before. */
export async function salesAnalytics(days: Period) {
  const from = uaeMidnight(days - 1);
  const to = new Date();
  const prevFrom = new Date(from.getTime() - days * DAY);

  const [current, previous, daily, payment, top] = await Promise.all([
    totals(from, to),
    totals(prevFrom, from),
    db.$queryRaw<{ day: string; revenue: number; orders: number }[]>`
      select to_char(("placedAt" at time zone 'UTC') at time zone 'Asia/Dubai', 'YYYY-MM-DD') as day,
             coalesce(sum(total), 0)::float as revenue, count(*)::int as orders
      from "Order"
      where "placedAt" >= ${from} and status::text not in ('CANCELLED', 'REFUNDED', 'PENDING_PAYMENT')
      group by 1 order by 1`,
    db.order.groupBy({ by: ["paymentMethod"], where: { placedAt: { gte: from }, status: { notIn: NOT_COUNTED } }, _sum: { total: true }, _count: { _all: true } }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null }, order: { placedAt: { gte: from }, status: { notIn: NOT_COUNTED } } },
      _sum: { qty: true, lineTotal: true },
      orderBy: [{ _sum: { qty: "desc" } }],
      take: 8,
    }),
  ]);

  // One bar per day, including days without sales.
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series = Array.from({ length: days }, (_, i) => {
    const key = uaeDateKey(new Date(from.getTime() + i * DAY + UAE));
    const d = byDay.get(key);
    return { day: key, revenue: d?.revenue ?? 0, orders: d?.orders ?? 0 };
  });

  const products = await db.product.findMany({ where: { id: { in: top.map((t) => t.productId!) } }, select: { id: true, nameEn: true, nameAr: true, sku: true } });
  const names = new Map(products.map((p) => [p.id, p]));

  return {
    days,
    current,
    previous,
    series,
    payment: (["CARD", "COD"] as const).map((m) => {
      const row = payment.find((p) => p.paymentMethod === m);
      return { method: m, revenue: Number(row?._sum.total ?? 0), orders: row?._count._all ?? 0 };
    }),
    topProducts: top.map((t) => ({ ...(names.get(t.productId!) ?? { nameEn: "—", nameAr: "—", sku: "" }), id: t.productId!, units: t._sum.qty ?? 0, revenue: Number(t._sum.lineTotal ?? 0) })),
  };
}

export type SalesAnalytics = Awaited<ReturnType<typeof salesAnalytics>>;
