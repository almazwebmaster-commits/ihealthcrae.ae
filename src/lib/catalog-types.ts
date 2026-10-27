import type { L } from "./i18n-utils";
import type { TintKey } from "./tints";

// View models shared by server and client components. The database layer
// (src/server/catalog.ts) maps Prisma rows into these shapes.

export type ProductTag = "bestseller" | "new" | "deal" | "express";

export type ProductOption = { label: L; price: number };

export type QuantityTier = { qty: number; pct: number };

export type ProductImage = { url: string; width: number; height: number; alt?: L };

export type Product = {
  id: number;
  slug: string;
  sku: string;
  name: L;
  desc: L;
  brand: string;
  brandName: string;
  brandCountry: L | null;
  category: string;
  categoryName: L;
  categoryTint: TintKey;
  sub: string;
  subName: L;
  price: number;
  was?: number;
  /** ISO time a live flash deal ends (prices above already include it). */
  flashEndsAt?: string;
  rating: number;
  reviews: number;
  stock: number;
  tags: ProductTag[];
  options?: ProductOption[];
  /** Subscribe & save discount (%) — present only on eligible products. */
  subscribe?: number;
  /** Buy more, save more tiers, ascending by qty. */
  tiers?: QuantityTier[];
  images: ProductImage[];
};

export type Subcategory = { slug: string; name: L };

export type Category = { slug: string; name: L; tint: TintKey; children: Subcategory[] };

export type Brand = { slug: string; name: string; country: L | null };

// ── Listing queries

export const sortKeys = ["featured", "price-asc", "price-desc", "rating", "newest", "discount"] as const;
export type SortKey = (typeof sortKeys)[number];

export type ProductQuery = {
  category?: string; // top-level or subcategory slug
  q?: string;
  tag?: ProductTag;
  brands?: string[];
  min?: number;
  max?: number;
  rating?: number;
  sale?: boolean;
  inStock?: boolean;
  subscribable?: boolean;
  multibuy?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

export type ProductPage = {
  items: Product[];
  total: number;
  page: number;
  pages: number;
  facets: {
    brands: { slug: string; name: string; count: number }[];
    price: { min: number; max: number };
  };
};

export function discountPct(p: { price: number; was?: number }) {
  return p.was ? Math.round((1 - p.price / p.was) * 100) : 0;
}
