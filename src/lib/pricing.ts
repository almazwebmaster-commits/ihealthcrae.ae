import type { Product, QuantityTier } from "./catalog-types";

/** Delivery intervals offered for Subscribe & save, in weeks. */
export const SUBSCRIBE_FREQUENCIES = [2, 4, 6, 8] as const;
export const DEFAULT_FREQUENCY = 4;

export type DiscountKind = "subscribe" | "multibuy";

const round2 = (n: number) => Math.round(n * 100) / 100;

export function basePrice(product: Product, option?: number) {
  return (option != null ? product.options?.[option]?.price : undefined) ?? product.price;
}

/** Highest tier the quantity qualifies for. */
export function tierFor(tiers: QuantityTier[] | undefined, qty: number) {
  return tiers?.filter((t) => qty >= t.qty).at(-1);
}

export function nextTier(tiers: QuantityTier[] | undefined, qty: number) {
  return tiers?.find((t) => qty < t.qty);
}

export function maxTierPct(tiers: QuantityTier[] | undefined) {
  return tiers?.at(-1)?.pct ?? 0;
}

/**
 * Prices a cart line. Subscribe & save and multi-buy discounts don't stack —
 * the better of the two applies.
 */
export function priceLine(product: Product, option: number | undefined, qty: number, subscribeWeeks?: number) {
  const base = basePrice(product, option);
  const tierPct = tierFor(product.tiers, qty)?.pct ?? 0;
  const snsPct = subscribeWeeks && product.subscribe ? product.subscribe : 0;
  const pct = Math.max(tierPct, snsPct);
  const kind: DiscountKind | null = pct === 0 ? null : snsPct >= tierPct ? "subscribe" : "multibuy";
  const unit = round2(base * (1 - pct / 100));
  return {
    base,
    unit,
    pct,
    kind,
    total: round2(unit * qty),
    savings: round2((base - unit) * qty),
  };
}
