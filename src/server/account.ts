import "server-only";
import type { CartLine } from "@/lib/cart-store";
import { getProductsBySlugs } from "./catalog";
import { db } from "./db";

// ── Addresses

export function getAddresses(userId: string) {
  return db.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
}

export type AddressRow = Awaited<ReturnType<typeof getAddresses>>[number];

// ── Wishlist

export async function getWishlistSlugs(userId: string) {
  const rows = await db.wishlistItem.findMany({
    where: { userId },
    select: { product: { select: { slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.product.slug);
}

export async function getWishlistProducts(userId: string) {
  const slugs = await getWishlistSlugs(userId);
  const products = await getProductsBySlugs(slugs);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return slugs.map((s) => bySlug.get(s)).filter((p) => p != null);
}

async function productId(slug: string) {
  return (await db.product.findUnique({ where: { slug }, select: { id: true } }))?.id;
}

export async function setWishlisted(userId: string, slug: string, on: boolean) {
  const id = await productId(slug);
  if (!id) return false;
  if (on) {
    await db.wishlistItem.upsert({
      where: { userId_productId: { userId, productId: id } },
      create: { userId, productId: id },
      update: {},
    });
  } else {
    await db.wishlistItem.deleteMany({ where: { userId, productId: id } });
  }
  return true;
}

// ── Cart (signed-in shoppers). Sentinels: option -1 = no variant, subWeeks 0 = one-time.

export async function getCart(userId: string): Promise<CartLine[]> {
  const rows = await db.cartItem.findMany({
    where: { userId },
    include: { product: { select: { slug: true } } },
    orderBy: { id: "asc" },
  });
  return rows.map((r) => ({
    slug: r.product.slug,
    option: r.option < 0 ? undefined : r.option,
    sub: r.subWeeks > 0 ? r.subWeeks : undefined,
    qty: r.qty,
  }));
}

/** Replaces the stored cart with `lines` (unknown products are dropped). */
export async function saveCart(userId: string, lines: CartLine[]) {
  const ids = new Map(
    (await db.product.findMany({ where: { slug: { in: lines.map((l) => l.slug) } }, select: { id: true, slug: true } })).map(
      (p) => [p.slug, p.id],
    ),
  );
  const data = lines
    .filter((l) => ids.has(l.slug))
    .map((l) => ({
      userId,
      productId: ids.get(l.slug)!,
      option: l.option ?? -1,
      subWeeks: l.sub ?? 0,
      qty: Math.max(1, Math.min(10, Math.round(l.qty))),
    }));
  await db.$transaction([
    db.cartItem.deleteMany({ where: { userId } }),
    db.cartItem.createMany({ data, skipDuplicates: true }),
  ]);
}
