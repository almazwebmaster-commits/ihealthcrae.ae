import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import type {
  Brand,
  Category,
  Product,
  ProductPage,
  ProductQuery,
  ProductTag,
  SortKey,
  Subcategory,
} from "@/lib/catalog-types";
import { flashLive } from "@/lib/promotions";
import type { TintKey } from "@/lib/tints";
import { db } from "./db";

// ── Row → view-model mapping

const productInclude = {
  brand: true,
  category: true,
  subcategory: true,
  variants: { orderBy: { position: "asc" } },
  images: { orderBy: { position: "asc" } },
  tiers: { orderBy: { minQty: "asc" } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const num = (d: Prisma.Decimal | null | undefined) => (d == null ? undefined : Number(d));

const round2 = (n: number) => Math.round(n * 100) / 100;

function toProduct(r: ProductRow): Product {
  // A live flash deal lowers every price; the regular price becomes the "was" price.
  const flash = flashLive(r) ? r.flashPct! : 0;
  const cut = (n: number) => (flash ? round2(n * (1 - flash / 100)) : n);
  const tags = r.tags.map((t) => t.toLowerCase() as ProductTag);
  if (flash && !tags.includes("deal")) tags.push("deal");
  return {
    id: r.id,
    slug: r.slug,
    sku: r.sku,
    name: { en: r.nameEn, ar: r.nameAr },
    desc: { en: r.descEn, ar: r.descAr },
    brand: r.brand.slug,
    brandName: r.brand.name,
    brandCountry: r.brand.countryEn ? { en: r.brand.countryEn, ar: r.brand.countryAr ?? r.brand.countryEn } : null,
    category: r.category.slug,
    categoryName: { en: r.category.nameEn, ar: r.category.nameAr },
    categoryTint: r.category.tint as TintKey,
    sub: r.subcategory.slug,
    subName: { en: r.subcategory.nameEn, ar: r.subcategory.nameAr },
    price: cut(Number(r.price)),
    was: flash ? Math.max(Number(r.price), num(r.compareAt) ?? 0) : num(r.compareAt),
    flashEndsAt: flash ? r.flashEndsAt!.toISOString() : undefined,
    rating: Number(r.rating),
    reviews: r.reviewCount,
    stock: r.stock,
    tags,
    options: r.variants.length
      ? r.variants.map((v) => ({ label: { en: v.labelEn, ar: v.labelAr }, price: cut(Number(v.price)) }))
      : undefined,
    subscribe: r.subscribePct ?? undefined,
    tiers: r.tiers.length ? r.tiers.map((t) => ({ qty: t.minQty, pct: t.pct })) : undefined,
    images: r.images.map((i) => ({
      url: i.url,
      width: i.width,
      height: i.height,
      alt: i.altEn ? { en: i.altEn, ar: i.altAr ?? i.altEn } : undefined,
    })),
  };
}

// ── Categories & brands (small; cached per request)

export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await db.category.findMany({
    where: { parentId: null },
    orderBy: { position: "asc" },
    include: { children: { orderBy: { position: "asc" } } },
  });
  return rows.map((c) => ({
    slug: c.slug,
    name: { en: c.nameEn, ar: c.nameAr },
    tint: c.tint as TintKey,
    children: c.children.map((s) => ({ slug: s.slug, name: { en: s.nameEn, ar: s.nameAr } })),
  }));
});

/** Resolves a top-level category or a subcategory slug. */
export async function resolveCategory(slug: string): Promise<{ category: Category; sub?: Subcategory } | undefined> {
  for (const category of await getCategories()) {
    if (category.slug === slug) return { category };
    const sub = category.children.find((s) => s.slug === slug);
    if (sub) return { category, sub };
  }
  return undefined;
}

export const getBrands = cache(async (): Promise<Brand[]> => {
  const rows = await db.brand.findMany({ orderBy: { name: "asc" } });
  return rows.map((b) => ({
    slug: b.slug,
    name: b.name,
    country: b.countryEn ? { en: b.countryEn, ar: b.countryAr ?? b.countryEn } : null,
  }));
});

// ── Products

export const getProduct = cache(async (slug: string) => {
  const row = await db.product.findFirst({ where: { slug, status: "ACTIVE" }, include: productInclude });
  return row ? toProduct(row) : undefined;
});

/** Current address of a product whose old address was `slug` (after a rename), if it is live. */
export const redirectedSlug = cache(async (slug: string) => {
  const r = await db.productRedirect.findUnique({ where: { slug }, select: { product: { select: { slug: true, status: true } } } });
  return r?.product.status === "ACTIVE" ? r.product.slug : undefined;
});

/** For the cart: looks up many products at once, preserving nothing about order. */
export async function getProductsBySlugs(slugs: string[]) {
  if (!slugs.length) return [];
  const rows = await db.product.findMany({
    where: { slug: { in: slugs }, status: "ACTIVE" },
    include: productInclude,
  });
  return rows.map(toProduct);
}

const orderBy: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ popularity: "desc" }, { id: "asc" }],
  "price-asc": [{ price: "asc" }, { id: "asc" }],
  "price-desc": [{ price: "desc" }, { id: "asc" }],
  rating: [{ rating: "desc" }, { reviewCount: "desc" }, { id: "asc" }],
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  discount: [{ discountPct: "desc" }, { popularity: "desc" }],
};

/** Constraints that define the result set (route + search) — facets are computed over these. */
function contextWhere(q: ProductQuery): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ status: "ACTIVE" }];
  if (q.category) and.push({ OR: [{ category: { slug: q.category } }, { subcategory: { slug: q.category } }] });
  if (q.tag === "deal") {
    // Deals = products tagged DEAL plus any live flash deal.
    const now = new Date();
    and.push({ OR: [{ tags: { has: "DEAL" } }, { flashPct: { not: null }, flashEndsAt: { gt: now }, OR: [{ flashStartsAt: null }, { flashStartsAt: { lte: now } }] }] });
  } else if (q.tag) and.push({ tags: { has: q.tag.toUpperCase() as Uppercase<ProductTag> } });
  if (q.subscribable) and.push({ subscribePct: { not: null } });
  if (q.multibuy) and.push({ tiers: { some: {} } });
  const text = q.q?.trim();
  if (text) {
    const like = { contains: text, mode: "insensitive" as const };
    and.push({
      OR: [
        { nameEn: like },
        { nameAr: like },
        { brand: { name: like } },
        { subcategory: { nameEn: like } },
        { subcategory: { nameAr: like } },
      ],
    });
  }
  return { AND: and };
}

/** Refinement filters chosen in the sidebar. */
function refineWhere(q: ProductQuery): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];
  if (q.brands?.length) and.push({ brand: { slug: { in: q.brands } } });
  if (q.min != null) and.push({ price: { gte: q.min } });
  if (q.max != null) and.push({ price: { lte: q.max } });
  if (q.rating) and.push({ rating: { gte: q.rating } });
  if (q.sale) and.push({ compareAt: { not: null } });
  if (q.inStock) and.push({ stock: { gt: 0 } });
  return { AND: and };
}

export async function queryProducts(query: ProductQuery): Promise<ProductPage> {
  const context = contextWhere(query);
  const where: Prisma.ProductWhereInput = { AND: [context, refineWhere(query)] };
  const perPage = query.perPage ?? 20;

  const [brandGroups, priceAgg, total] = await Promise.all([
    db.product.groupBy({ by: ["brandId"], where: context, _count: { _all: true } }),
    db.product.aggregate({ where: context, _min: { price: true }, _max: { price: true } }),
    db.product.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, query.page ?? 1), pages);
  const rows = await db.product.findMany({
    where,
    include: productInclude,
    orderBy: orderBy[query.sort ?? "featured"],
    skip: (page - 1) * perPage,
    take: perPage,
  });

  const brandById = new Map(
    (await db.brand.findMany({ where: { id: { in: brandGroups.map((g) => g.brandId) } } })).map((b) => [b.id, b]),
  );

  return {
    items: rows.map(toProduct),
    total,
    page,
    pages,
    facets: {
      brands: brandGroups
        .map((g) => ({ slug: brandById.get(g.brandId)!.slug, name: brandById.get(g.brandId)!.name, count: g._count._all }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      price: {
        min: priceAgg._min.price ? Math.floor(Number(priceAgg._min.price)) : 0,
        max: priceAgg._max.price ? Math.ceil(Number(priceAgg._max.price)) : 0,
      },
    },
  };
}

export async function topProducts(opts: Omit<ProductQuery, "page">, limit: number) {
  return (await queryProducts({ ...opts, perPage: limit })).items;
}

/** Same subcategory first, then the rest of the category. */
export async function relatedProducts(p: Product, limit = 10) {
  const rows = await db.product.findMany({
    where: { status: "ACTIVE", category: { slug: p.category }, slug: { not: p.slug } },
    include: productInclude,
    orderBy: [{ popularity: "desc" }],
    take: 30,
  });
  return rows
    .map(toProduct)
    .sort((a, b) => Number(b.sub === p.sub) - Number(a.sub === p.sub))
    .slice(0, limit);
}

/** Largest current discount (%) within a category — keeps promo copy truthful. */
export async function maxDiscount(category: string) {
  const agg = await db.product.aggregate({
    where: { status: "ACTIVE", stock: { gt: 0 }, category: { slug: category } },
    _max: { discountPct: true },
  });
  return agg._max.discountPct ?? 0;
}

/**
 * Brands for the homepage grid, balanced across categories: each category's
 * most-reviewed brand first, then each category's second, and so on.
 */
export async function featuredBrands(limit: number) {
  const [categories, groups, brands] = await Promise.all([
    getCategories(),
    db.product.groupBy({
      by: ["categoryId", "brandId"],
      where: { status: "ACTIVE" },
      _sum: { reviewCount: true },
    }),
    db.brand.findMany(),
  ]);
  const catIds = await db.category.findMany({ where: { parentId: null }, select: { id: true, slug: true } });
  const idBySlug = new Map(catIds.map((c) => [c.slug, c.id]));
  const brandById = new Map(brands.map((b) => [b.id, b]));

  const ranked = categories.map((c) =>
    groups
      .filter((g) => g.categoryId === idBySlug.get(c.slug))
      .sort((a, b) => (b._sum.reviewCount ?? 0) - (a._sum.reviewCount ?? 0))
      .map((g) => g.brandId),
  );
  const picked: number[] = [];
  for (let rank = 0; picked.length < limit && ranked.some((r) => r.length > rank); rank++) {
    for (const list of ranked) {
      const id = list[rank];
      if (id && !picked.includes(id) && picked.length < limit) picked.push(id);
    }
  }
  return picked.map((id) => ({ slug: brandById.get(id)!.slug, name: brandById.get(id)!.name }));
}
