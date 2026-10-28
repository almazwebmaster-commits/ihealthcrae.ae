import { z } from "zod";
import { IMAGE_SRC } from "@/lib/image-src";
import { fromUaeInput } from "@/lib/uae-time";

export const productStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type ProductStatus = (typeof productStatuses)[number];
export const productTags = ["BESTSELLER", "NEW", "DEAL", "EXPRESS"] as const;

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

const money = z.number().finite().positive().max(1_000_000);

/** What the product editor submits. Shared by the form (client) and saveProduct (server). */
export const ProductInput = z
  .object({
    id: z.number().int().positive().optional(),
    slug: z.string().trim().toLowerCase().max(120).regex(SLUG_RE, "slug"),
    status: z.enum(productStatuses),
    nameEn: z.string().trim().min(2).max(200),
    nameAr: z.string().trim().min(2).max(200),
    descEn: z.string().trim().max(5000),
    descAr: z.string().trim().max(5000),
    brandSlug: z.string().trim().max(120),
    newBrand: z.string().trim().max(80),
    subcategory: z.string().trim().min(1),
    price: money,
    compareAt: money.nullable(),
    stock: z.number().int().min(0).max(1_000_000),
    lowStockAt: z.number().int().min(0).max(100_000).default(5),
    tags: z.array(z.enum(productTags)).max(4),
    subscribePct: z.number().int().min(1).max(50).nullable(),
    /** Flash deal: % off between two UAE-time datetime-local values (start optional = now) */
    flashPct: z.number().int().min(1).max(90).nullable().default(null),
    flashStartsAt: z.string().max(25).default(""),
    flashEndsAt: z.string().max(25).default(""),
    tiers: z.array(z.object({ minQty: z.number().int().min(2).max(100), pct: z.number().int().min(1).max(90) })).max(5),
    variants: z
      .array(z.object({ labelEn: z.string().trim().min(1).max(80), labelAr: z.string().trim().min(1).max(80), price: money }))
      .max(20),
    images: z
      .array(z.object({ url: z.string().regex(IMAGE_SRC), width: z.number().int().positive(), height: z.number().int().positive() }))
      .max(12),
  })
  .superRefine((v, ctx) => {
    if (!v.brandSlug && !v.newBrand) ctx.addIssue({ code: "custom", path: ["brandSlug"], message: "required" });
    if (v.compareAt != null && v.compareAt <= v.price) ctx.addIssue({ code: "custom", path: ["compareAt"], message: "compareAt" });
    if (v.flashPct != null) {
      const end = fromUaeInput(v.flashEndsAt);
      const start = fromUaeInput(v.flashStartsAt);
      if (!end) ctx.addIssue({ code: "custom", path: ["flashEndsAt"], message: "required" });
      else if (start && end <= start) ctx.addIssue({ code: "custom", path: ["flashEndsAt"], message: "endBeforeStart" });
    }
    const qtys = v.tiers.map((t) => t.minQty);
    if (new Set(qtys).size !== qtys.length) ctx.addIssue({ code: "custom", path: ["tiers"], message: "tiers" });
  });

export type ProductInputT = z.infer<typeof ProductInput>;

export type SaveProductResult = { ok: true; id: number } | { ok: false; errors: Record<string, string> };
