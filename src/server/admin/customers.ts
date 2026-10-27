import "server-only";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { audit, type Actor } from "./audit";

const PER_PAGE = 25;
/** Orders that count towards what a customer has spent. */
const COUNTED: Prisma.OrderWhereInput = { status: { notIn: ["CANCELLED", "REFUNDED", "PENDING_PAYMENT"] as OrderStatus[] } };

type Stats = { orders: number; spent: number; lastOrderAt: Date | null };

async function statsByUser(userIds: string[]) {
  if (!userIds.length) return new Map<string, Stats>();
  const rows = await db.order.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds }, ...COUNTED },
    _count: { _all: true },
    _sum: { total: true },
    _max: { placedAt: true },
  });
  return new Map(rows.map((r) => [r.userId!, { orders: r._count._all, spent: Number(r._sum.total ?? 0), lastOrderAt: r._max.placedAt }]));
}

export async function listCustomers(query: { q?: string; status?: string; page?: number }) {
  const and: Prisma.UserWhereInput[] = [{ role: "user" }];
  if (query.status === "blocked") and.push({ banned: true });
  const text = query.q?.trim();
  if (text) {
    const like = { contains: text, mode: "insensitive" as const };
    and.push({ OR: [{ name: like }, { email: like }, { phone: { contains: text.replace(/\s/g, "") } }] });
  }
  const where = { AND: and };
  const page = Math.max(1, query.page ?? 1);
  const [total, users, blocked] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE, select: { id: true, name: true, email: true, phone: true, banned: true, createdAt: true, emailVerified: true } }),
    db.user.count({ where: { role: "user", banned: true } }),
  ]);
  const stats = await statsByUser(users.map((u) => u.id));
  return {
    rows: users.map((u) => ({ ...u, ...(stats.get(u.id) ?? { orders: 0, spent: 0, lastOrderAt: null }) })),
    total,
    blocked,
    page,
    pages: Math.max(1, Math.ceil(total / PER_PAGE)),
  };
}

/** People who checked out without an account, grouped by email. */
export async function listGuests(query: { q?: string; page?: number }) {
  const text = query.q?.trim();
  const where: Prisma.OrderWhereInput = {
    userId: null,
    isDemo: false,
    ...COUNTED,
    ...(text ? { OR: [{ email: { contains: text, mode: "insensitive" } }, { fullName: { contains: text, mode: "insensitive" } }, { phone: { contains: text.replace(/\s/g, "") } }] } : {}),
  };
  const page = Math.max(1, query.page ?? 1);
  const groups = await db.order.groupBy({ by: ["email"], where, _count: { _all: true }, _sum: { total: true }, _max: { placedAt: true }, orderBy: { _max: { placedAt: "desc" } } });
  const slice = groups.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const latest = await db.order.findMany({
    where: { email: { in: slice.map((g) => g.email) }, userId: null },
    orderBy: { placedAt: "desc" },
    distinct: ["email"],
    select: { email: true, fullName: true, phone: true, emirate: true },
  });
  const info = new Map(latest.map((o) => [o.email, o]));
  return {
    rows: slice.map((g) => ({ email: g.email, name: info.get(g.email)?.fullName ?? "", phone: info.get(g.email)?.phone ?? "", emirate: info.get(g.email)?.emirate ?? "", orders: g._count._all, spent: Number(g._sum.total ?? 0), lastOrderAt: g._max.placedAt })),
    total: groups.length,
    page,
    pages: Math.max(1, Math.ceil(groups.length / PER_PAGE)),
  };
}

export async function getCustomer(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      orders: { orderBy: { placedAt: "desc" }, take: 50, select: { id: true, number: true, status: true, paymentMethod: true, paymentStatus: true, total: true, placedAt: true, _count: { select: { items: true } } } },
      subscriptions: { orderBy: { createdAt: "desc" }, include: { product: { select: { nameEn: true, nameAr: true, slug: true } } } },
      _count: { select: { wishlist: true, sessions: true } },
    },
  });
  if (!user) return null;
  const stats = (await statsByUser([id])).get(id) ?? { orders: 0, spent: 0, lastOrderAt: null };
  const guestOrders = await db.order.count({ where: { userId: null, email: user.email } });
  return { ...user, stats, guestOrders };
}

export type BlockResult = { ok: true } | { ok: false; error: "notCustomer" | "notFound" };

/** Blocks or unblocks a customer account. Blocking signs them out everywhere at once. */
export async function setCustomerBlocked(actor: Actor, id: string, blocked: boolean, reason?: string): Promise<BlockResult> {
  const user = await db.user.findUnique({ where: { id }, select: { role: true, email: true } });
  if (!user) return { ok: false, error: "notFound" };
  // Staff accounts are managed on the Staff page, not here.
  if (user.role !== "user") return { ok: false, error: "notCustomer" };
  await db.$transaction([
    db.user.update({ where: { id }, data: { banned: blocked, banReason: blocked ? reason?.trim().slice(0, 200) || null : null, banExpires: null } }),
    ...(blocked ? [db.session.deleteMany({ where: { userId: id } })] : []),
  ]);
  await audit(actor, blocked ? "customer.block" : "customer.unblock", "user", id, [user.email, reason?.trim()].filter(Boolean).join(" — "));
  return { ok: true };
}
