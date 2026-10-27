import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { fromUaeInput, toUaeInput } from "@/lib/uae-time";
import { ProductInput, slugify, type ProductInputT, type ProductStatus, type SaveProductResult } from "@/lib/admin/product-input";
import { db } from "../db";
import { audit, type Actor } from "./audit";

const PER_PAGE = 25;

export type ProductListQuery = { q?: string; status?: string; category?: string; page?: number; lowStock?: boolean };

export async function listProducts(query: ProductListQuery) {
  const and: Prisma.ProductWhereInput[] = [];
  if (query.status && ["DRAFT", "ACTIVE", "ARCHIVED"].includes(query.status)) and.push({ status: query.status as ProductStatus });
  else and.push({ status: { not: "ARCHIVED" } });
  if (query.category) and.push({ OR: [{ category: { slug: query.category } }, { subcategory: { slug: query.category } }] });
  if (query.lowStock) and.push({ stock: { lt: 5 } });
  const text = query.q?.trim();
  if (text) {
    const like = { contains: text, mode: "insensitive" as const };
    and.push({ OR: [{ nameEn: like }, { nameAr: like }, { sku: like }, { slug: like }, { brand: { name: like } }] });
  }
  const where = { AND: and };
  const page = Math.max(1, query.page ?? 1);
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { brand: true, category: true, subcategory: true, images: { orderBy: { position: "asc" }, take: 1 } },
    }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

/** Editor data in the exact shape the form submits. */
export async function getProductForEdit(id: number): Promise<(ProductInputT & { sku: string; rating: number; reviews: number }) | null> {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      brand: true,
      subcategory: true,
      variants: { orderBy: { position: "asc" } },
      tiers: { orderBy: { minQty: "asc" } },
      images: { orderBy: { position: "asc" } },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    status: p.status,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    descEn: p.descEn,
    descAr: p.descAr,
    brandSlug: p.brand.slug,
    newBrand: "",
    subcategory: p.subcategory.slug,
    price: Number(p.price),
    compareAt: p.compareAt == null ? null : Number(p.compareAt),
    stock: p.stock,
    tags: p.tags,
    subscribePct: p.subscribePct,
    flashPct: p.flashPct,
    flashStartsAt: toUaeInput(p.flashStartsAt),
    flashEndsAt: toUaeInput(p.flashEndsAt),
    tiers: p.tiers.map((t) => ({ minQty: t.minQty, pct: t.pct })),
    variants: p.variants.map((v) => ({ labelEn: v.labelEn, labelAr: v.labelAr, price: Number(v.price) })),
    images: p.images.map((i) => ({ url: i.url, width: i.width, height: i.height })),
    rating: Number(p.rating),
    reviews: p.reviewCount,
  };
}

export async function getEditorOptions() {
  const [brands, categories] = await Promise.all([
    db.brand.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    db.category.findMany({
      where: { parentId: null },
      orderBy: { position: "asc" },
      include: { children: { orderBy: { position: "asc" } } },
    }),
  ]);
  return {
    brands,
    categories: categories.map((c) => ({
      slug: c.slug,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      children: c.children.map((s) => ({ slug: s.slug, nameEn: s.nameEn, nameAr: s.nameAr, googleCategoryId: s.googleCategoryId })),
    })),
  };
}

const KNOWN_ERRORS = new Set(["slug", "taken", "compareAt", "tiers", "required", "endBeforeStart"]);

/** Zod issues → { field: translation key } (over-long text → "tooLong", other unknown issues → "required"). */
function zodErrors(error: { issues: { path: PropertyKey[]; message: string; code: string; origin?: string }[] }) {
  const errors: Record<string, string> = {};
  for (const i of error.issues) {
    const key = i.path.map(String).join(".") || "form";
    errors[key] ??= KNOWN_ERRORS.has(i.message) ? i.message : i.code === "too_big" && i.origin === "string" ? "tooLong" : "required";
  }
  return errors;
}

export async function saveProduct(actor: Actor, raw: unknown): Promise<SaveProductResult> {
  const parsed = ProductInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const v = parsed.data;

  const sub = await db.category.findUnique({ where: { slug: v.subcategory } });
  if (!sub?.parentId) return { ok: false, errors: { subcategory: "required" } };

  const clash = await db.product.findFirst({ where: { slug: v.slug, ...(v.id ? { id: { not: v.id } } : {}) }, select: { id: true } });
  if (clash) return { ok: false, errors: { slug: "taken" } };

  // Brand: existing or create on the fly
  let brandId: number;
  if (v.newBrand) {
    const slug = slugify(v.newBrand) || `brand-${Date.now()}`;
    brandId = (await db.brand.upsert({ where: { slug }, create: { slug, name: v.newBrand }, update: {} })).id;
  } else {
    const b = await db.brand.findUnique({ where: { slug: v.brandSlug } });
    if (!b) return { ok: false, errors: { brandSlug: "required" } };
    brandId = b.id;
  }

  const existing = v.id ? await db.product.findUnique({ where: { id: v.id }, select: { sku: true, slug: true, rating: true, reviewCount: true } }) : null;
  if (v.id && !existing) return { ok: false, errors: { form: "notFound" } };

  const data = {
    slug: v.slug,
    status: v.status,
    nameEn: v.nameEn,
    nameAr: v.nameAr,
    descEn: v.descEn,
    descAr: v.descAr,
    brandId,
    categoryId: sub.parentId,
    subcategoryId: sub.id,
    price: v.price,
    compareAt: v.compareAt,
    stock: v.stock,
    tags: v.tags,
    subscribePct: v.subscribePct,
    flashPct: v.flashPct,
    flashStartsAt: v.flashPct ? fromUaeInput(v.flashStartsAt) : null,
    flashEndsAt: v.flashPct ? fromUaeInput(v.flashEndsAt) : null,
    discountPct: v.compareAt ? Math.round((1 - v.price / v.compareAt) * 100) : 0,
    popularity: existing ? existing.reviewCount * Number(existing.rating) : 0,
  };

  const id = await db.$transaction(async (tx) => {
    const product = v.id
      ? await tx.product.update({ where: { id: v.id }, data })
      : await tx.product.create({ data: { ...data, sku: `TMP-${crypto.randomUUID()}` } });
    const sku = existing?.sku ?? `IHC-${String(product.id).padStart(5, "0")}`;
    if (!existing) await tx.product.update({ where: { id: product.id }, data: { sku } });

    // Web address changes: the new address is live, the old one redirects here (301) for links and Google.
    await tx.productRedirect.deleteMany({ where: { slug: v.slug } });
    if (existing && existing.slug !== v.slug)
      await tx.productRedirect.upsert({ where: { slug: existing.slug }, create: { slug: existing.slug, productId: product.id }, update: { productId: product.id } });

    await tx.productVariant.deleteMany({ where: { productId: product.id } });
    await tx.priceTier.deleteMany({ where: { productId: product.id } });
    await tx.productImage.deleteMany({ where: { productId: product.id } });
    if (v.variants.length)
      await tx.productVariant.createMany({
        data: v.variants.map((o, i) => ({ productId: product.id, sku: `${sku}-${i + 1}`, labelEn: o.labelEn, labelAr: o.labelAr, price: o.price, position: i })),
      });
    if (v.tiers.length)
      await tx.priceTier.createMany({ data: v.tiers.map((t) => ({ productId: product.id, minQty: t.minQty, pct: t.pct })) });
    if (v.images.length)
      await tx.productImage.createMany({
        data: v.images.map((img, i) => ({ productId: product.id, ...img, altEn: v.nameEn, altAr: v.nameAr, position: i })),
      });
    return product.id;
  });

  await audit(actor, v.id ? "product.update" : "product.create", "product", id, `${v.nameEn} (${v.status})`);
  if (existing && existing.slug !== v.slug) await audit(actor, "product.slug", "product", id, `/p/${existing.slug} → /p/${v.slug}`);
  return { ok: true, id };
}

export async function setProductStatus(actor: Actor, id: number, status: ProductStatus) {
  const p = await db.product.update({ where: { id }, data: { status } });
  await audit(actor, `product.${status.toLowerCase()}`, "product", id, p.nameEn);
}

// ── CSV (core fields; options and photos are managed in the editor)

export const CSV_COLUMNS = [
  "slug", "status", "name_en", "name_ar", "description_en", "description_ar", "brand",
  "subcategory", "price", "compare_at", "stock", "tags", "subscribe_pct", "multibuy",
] as const;

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function exportProductsCsv() {
  const rows = await db.product.findMany({
    orderBy: { id: "asc" },
    include: { brand: true, subcategory: true, tiers: { take: 1 } },
  });
  const lines = rows.map((p) =>
    [
      p.slug, p.status, p.nameEn, p.nameAr, p.descEn, p.descAr, p.brand.name, p.subcategory.slug,
      Number(p.price).toFixed(2), p.compareAt == null ? "" : Number(p.compareAt).toFixed(2), p.stock,
      p.tags.join("|"), p.subscribePct ?? "", p.tiers.length ? "yes" : "no",
    ].map(csvCell).join(","),
  );
  // BOM so Excel opens Arabic text correctly
  return "﻿" + [CSV_COLUMNS.join(","), ...lines].join("\r\n");
}

/** Minimal RFC 4180 parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

export type ImportResult = { created: number; updated: number; errors: { row: number; message: string }[]; applied: boolean };

const DEFAULT_TIERS = [{ minQty: 2, pct: 5 }, { minQty: 3, pct: 10 }];

/** Creates/updates products by slug. With apply=false nothing is written (validation preview). */
export async function importProductsCsv(actor: Actor, text: string, apply: boolean): Promise<ImportResult> {
  const [header, ...body] = parseCsv(text);
  const result: ImportResult = { created: 0, updated: 0, errors: [], applied: apply };
  const idx = Object.fromEntries((header ?? []).map((h, i) => [h.trim().toLowerCase(), i]));
  const missing = ["slug", "name_en", "name_ar", "brand", "subcategory", "price", "stock"].filter((c) => idx[c] == null);
  if (missing.length) return { ...result, errors: [{ row: 1, message: `Missing columns: ${missing.join(", ")}` }] };

  const brands = new Map((await db.brand.findMany()).map((b) => [b.name.toLowerCase(), b]));
  for (const [n, cells] of body.entries()) {
    const rowNo = n + 2;
    const get = (c: string) => (idx[c] == null ? "" : (cells[idx[c]] ?? "").trim());
    try {
      const existing = await db.product.findUnique({
        where: { slug: get("slug").toLowerCase() },
        include: { variants: true, images: true, tiers: true },
      });
      let brandSlug = brands.get(get("brand").toLowerCase())?.slug ?? "";
      const input = {
        id: existing?.id,
        slug: get("slug"),
        status: (get("status") || existing?.status || "DRAFT").toUpperCase(),
        nameEn: get("name_en"),
        nameAr: get("name_ar"),
        descEn: get("description_en"),
        descAr: get("description_ar"),
        brandSlug,
        newBrand: brandSlug ? "" : get("brand"),
        subcategory: get("subcategory"),
        price: Number(get("price")),
        compareAt: get("compare_at") ? Number(get("compare_at")) : null,
        stock: Number(get("stock")),
        tags: get("tags") ? get("tags").split("|").map((t) => t.trim().toUpperCase()) : [],
        subscribePct: get("subscribe_pct") ? Number(get("subscribe_pct")) : null,
        // Flash deals are managed in the editor; an import keeps whatever is set.
        flashPct: existing?.flashPct ?? null,
        flashStartsAt: toUaeInput(existing?.flashStartsAt),
        flashEndsAt: toUaeInput(existing?.flashEndsAt),
        tiers: /^(yes|true|1)$/i.test(get("multibuy")) ? existing?.tiers.length ? existing.tiers.map((t) => ({ minQty: t.minQty, pct: t.pct })) : DEFAULT_TIERS : [],
        variants: existing?.variants.map((o) => ({ labelEn: o.labelEn, labelAr: o.labelAr, price: Number(o.price) })) ?? [],
        images: existing?.images.map((i) => ({ url: i.url, width: i.width, height: i.height })) ?? [],
      };
      const check = ProductInput.safeParse(input);
      if (!check.success) {
        const e = zodErrors(check.error);
        result.errors.push({ row: rowNo, message: Object.entries(e).map(([k, v]) => `${k}: ${v}`).join("; ") });
        continue;
      }
      if (!(await db.category.findFirst({ where: { slug: input.subcategory, parentId: { not: null } } }))) {
        result.errors.push({ row: rowNo, message: `subcategory: unknown "${input.subcategory}"` });
        continue;
      }
      if (apply) {
        const r = await saveProduct(actor, input);
        if (!r.ok) {
          result.errors.push({ row: rowNo, message: Object.entries(r.errors).map(([k, v]) => `${k}: ${v}`).join("; ") });
          continue;
        }
        if (!brandSlug && input.newBrand) {
          const b = await db.brand.findFirst({ where: { name: input.newBrand } });
          if (b) brands.set(b.name.toLowerCase(), b);
          brandSlug = b?.slug ?? "";
        }
      }
      if (existing) result.updated++;
      else result.created++;
    } catch (e) {
      result.errors.push({ row: rowNo, message: String(e instanceof Error ? e.message : e).slice(0, 200) });
    }
  }
  if (apply) await audit(actor, "product.import", "product", "csv", `${result.created} created, ${result.updated} updated`);
  return result;
}
