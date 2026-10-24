// Seeds the catalogue: categories, brands, products, variants, tiers, images.
// Idempotent — wipes catalogue tables and re-inserts. Run: npm run db:seed

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type ProductTag } from "../src/generated/prisma/client";
import { brandSeeds } from "./seed-data/brands";
import { categorySeeds } from "./seed-data/categories";
import productImages from "./seed-data/product-images.json";
import { productSeeds, subscribePctFor, tiersFor } from "./seed-data/products";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

type ImageEntry = { url: string; width: number; height: number; position: number };
const imagesBySlug = productImages as Record<string, ImageEntry[]>;

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  await db.$transaction([
    db.priceTier.deleteMany(),
    db.productImage.deleteMany(),
    db.productVariant.deleteMany(),
    db.product.deleteMany(),
    db.brand.deleteMany(),
    db.category.deleteMany({ where: { parentId: { not: null } } }),
    db.category.deleteMany(),
  ]);

  // Categories (two levels)
  const subToParent = new Map<string, { id: number; parentId: number }>();
  for (const [i, c] of categorySeeds.entries()) {
    const parent = await db.category.create({
      data: { slug: c.slug, nameEn: c.name.en, nameAr: c.name.ar, tint: c.tint, position: i },
    });
    for (const [j, s] of c.children.entries()) {
      const sub = await db.category.create({
        data: { slug: s.slug, nameEn: s.name.en, nameAr: s.name.ar, tint: c.tint, position: j, parentId: parent.id },
      });
      subToParent.set(s.slug, { id: sub.id, parentId: parent.id });
    }
  }

  // Brands
  const brandIds = new Map<string, number>();
  for (const b of brandSeeds) {
    const row = await db.brand.create({
      data: { slug: b.slug, name: b.name, countryEn: b.country?.en, countryAr: b.country?.ar },
    });
    brandIds.set(b.slug, row.id);
  }

  // Products. createdAt is staggered so "newest" sorting is meaningful:
  // products tagged "new" are the most recent.
  const now = Date.now();
  for (const [i, p] of productSeeds.entries()) {
    const sub = subToParent.get(p.sub);
    const brandId = brandIds.get(p.brand);
    if (!sub || !brandId) throw new Error(`Unknown subcategory/brand for ${p.slug}`);

    const tags = (p.tags ?? []).map((t) => t.toUpperCase() as ProductTag);
    const isNew = tags.includes("NEW");
    const createdAt = new Date(now - (isNew ? i : 60 + (productSeeds.length - i)) * DAY);
    const sku = `IHC-${String(i + 1).padStart(5, "0")}`;
    const discount = p.was ? Math.round((1 - p.price / p.was) * 100) : 0;

    await db.product.create({
      data: {
        slug: p.slug,
        sku,
        status: "ACTIVE",
        nameEn: p.name.en,
        nameAr: p.name.ar,
        descEn: p.desc.en,
        descAr: p.desc.ar,
        brandId,
        categoryId: sub.parentId,
        subcategoryId: sub.id,
        price: p.price,
        compareAt: p.was ?? null,
        stock: p.stock ?? 50,
        tags,
        subscribePct: subscribePctFor(p) ?? null,
        rating: p.rating,
        reviewCount: p.reviews,
        popularity: p.reviews * p.rating,
        discountPct: discount,
        createdAt,
        variants: {
          create: (p.options ?? []).map((o, k) => ({
            sku: `${sku}-${k + 1}`,
            labelEn: o.label.en,
            labelAr: o.label.ar,
            price: o.price,
            position: k,
          })),
        },
        tiers: { create: tiersFor(p).map((t) => ({ minQty: t.qty, pct: t.pct })) },
        images: {
          create: (imagesBySlug[p.slug] ?? []).map((img) => ({
            url: img.url,
            width: img.width,
            height: img.height,
            altEn: p.name.en,
            altAr: p.name.ar,
            position: img.position,
          })),
        },
      },
    });
  }

  const counts = await Promise.all([db.category.count(), db.brand.count(), db.product.count(), db.productImage.count()]);
  console.log(`Seeded ${counts[0]} categories, ${counts[1]} brands, ${counts[2]} products, ${counts[3]} images.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
