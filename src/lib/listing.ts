import { sortKeys, type ProductQuery, type SortKey } from "./catalog-types";

export type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const all = (v: string | string[] | undefined) =>
  v == null ? [] : Array.isArray(v) ? v : [v];
const num = (v: string | undefined) => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** URL search params → product query (filters, sort, page). */
export function parseListingParams(sp: SearchParams): ProductQuery {
  const sort = first(sp.sort);
  return {
    q: first(sp.q),
    brands: all(sp.brand).filter(Boolean),
    min: num(first(sp.min)),
    max: num(first(sp.max)),
    rating: num(first(sp.rating)),
    sale: first(sp.sale) === "1",
    inStock: first(sp.stock) === "1",
    subscribable: first(sp.sns) === "1" || undefined,
    multibuy: first(sp.multi) === "1" || undefined,
    sort: sortKeys.includes(sort as SortKey) ? (sort as SortKey) : undefined,
    page: num(first(sp.page)),
  };
}

/** Builds a query string from current params with overrides (null removes a key). */
export function buildQuery(
  sp: SearchParams,
  overrides: Record<string, string | string[] | null> = {},
) {
  const out = new URLSearchParams();
  const merged: Record<string, string | string[] | undefined | null> = {
    ...sp,
    ...overrides,
  };
  for (const [key, value] of Object.entries(merged)) {
    for (const v of all(value ?? undefined)) if (v !== "") out.append(key, v);
  }
  const s = out.toString();
  return s ? `?${s}` : "";
}

/** Removes a single value from a (possibly multi-valued) param. */
export function withoutValue(sp: SearchParams, key: string, value: string) {
  return buildQuery(sp, {
    [key]: all(sp[key]).filter((v) => v !== value),
    page: null,
  });
}
