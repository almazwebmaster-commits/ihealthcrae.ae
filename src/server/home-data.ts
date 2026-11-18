import "server-only";
import { cache } from "react";
import type { HomeContent } from "@/lib/home-content";
import { db } from "./db";

/** Active products per "health need" tile (its category may be top-level or a subcategory). */
export async function healthNeedCounts(needs: HomeContent["healthNeeds"]) {
  const slugs = [...new Set(needs.map((n) => n.category))];
  const cats = await db.category.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true, parentId: true } });
  const counts = await Promise.all(
    cats.map((c) =>
      db.product.count({ where: { status: "ACTIVE", ...(c.parentId ? { subcategoryId: c.id } : { categoryId: c.id }) } }),
    ),
  );
  return new Map(cats.map((c, i) => [c.slug, counts[i]]));
}

export type OfferCoupon = {
  code: string;
  type: "PERCENT" | "FIXED" | "FREE_DELIVERY";
  value: number;
  description: { en: string; ar: string };
  minSpend: number | null;
};

/** The coupons picked for "Offers for you", in that order, keeping only ones a shopper can use now. */
export const offerCoupons = cache(async (codes: string[]): Promise<OfferCoupon[]> => {
  if (!codes.length) return [];
  const now = new Date();
  const rows = await db.coupon.findMany({
    where: {
      code: { in: codes.map((c) => c.toUpperCase()) },
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
    },
  });
  const usable = rows.filter((c) => c.usageLimit == null || c.usedCount < c.usageLimit);
  return codes
    .map((code) => usable.find((c) => c.code === code.toUpperCase()))
    .filter((c) => c != null)
    .map((c) => ({
      code: c.code,
      type: c.type,
      value: Number(c.value),
      description: { en: c.descriptionEn, ar: c.descriptionAr || c.descriptionEn },
      minSpend: c.minSpend == null ? null : Number(c.minSpend),
    }));
});
