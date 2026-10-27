import "server-only";
import type { CartLine } from "@/lib/cart-store";
import type { Product } from "@/lib/catalog-types";
import { priceLine } from "@/lib/pricing";
import {
  COD_FEE,
  COD_MAX_ORDER,
  EXPRESS_DELIVERY_FEE,
  expressAvailable,
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
  VAT_RATE,
  type DeliveryMethod,
  type PaymentChoice,
} from "@/lib/store-settings";
import type { CouponError } from "@/lib/promotions";
import { getProductsBySlugs } from "../catalog";
import { checkCoupon, couponAmount } from "../promotions";

const round2 = (n: number) => Math.round(n * 100) / 100;

export type QuoteLine = {
  key: string;
  product: Product;
  option?: number;
  optionLabel?: { en: string; ar: string };
  sub?: number;
  qty: number;
  base: number; // list unit price
  unit: number; // charged unit price
  total: number;
  savings: number;
};

export type QuoteIssue = { slug: string; problem: "unavailable" | "stock"; available?: number };

export type Quote = {
  lines: QuoteLine[];
  issues: QuoteIssue[];
  itemsTotal: number; // at list prices
  discount: number; // Subscribe & save + multi-buy savings
  subtotal: number; // items after product discounts, before any promo code
  /** Applied promo code (uppercase), what it took off the items, and whether it waived delivery */
  coupon?: { id: number; code: string; type: "PERCENT" | "FIXED" | "FREE_DELIVERY"; descriptionEn: string; descriptionAr: string };
  couponDiscount: number;
  couponError?: { code: string; error: CouponError; minSpend?: number };
  deliveryFee: number;
  codFee: number;
  total: number;
  vatAmount: number;
  hasSubscription: boolean;
  express: boolean;
  codAllowed: boolean;
};

/**
 * The only place an order's price is decided. Uses live database prices and the
 * same priceLine() rules the cart shows, so client and server always agree.
 */
export async function quoteCart(
  cartLines: CartLine[],
  opts: { emirate?: string; delivery?: DeliveryMethod; payment?: PaymentChoice; coupon?: string; email?: string } = {},
): Promise<Quote> {
  const products = new Map((await getProductsBySlugs([...new Set(cartLines.map((l) => l.slug))])).map((p) => [p.slug, p]));
  const lines: QuoteLine[] = [];
  const issues: QuoteIssue[] = [];

  // Stock is shared by all lines of the same product.
  const wanted = new Map<string, number>();
  for (const l of cartLines) wanted.set(l.slug, (wanted.get(l.slug) ?? 0) + l.qty);

  for (const l of cartLines) {
    const p = products.get(l.slug);
    if (!p) {
      issues.push({ slug: l.slug, problem: "unavailable" });
      continue;
    }
    if ((wanted.get(l.slug) ?? 0) > p.stock) {
      if (!issues.some((i) => i.slug === l.slug)) issues.push({ slug: l.slug, problem: "stock", available: p.stock });
    }
    const option = l.option != null && p.options?.[l.option] ? l.option : undefined;
    const sub = l.sub && p.subscribe ? l.sub : undefined;
    const qty = Math.max(1, Math.min(10, Math.round(l.qty)));
    const pr = priceLine(p, option, qty, sub);
    lines.push({
      key: `${l.slug}|${option ?? ""}|${sub ?? ""}`,
      product: p,
      option,
      optionLabel: option != null ? p.options![option].label : undefined,
      sub,
      qty,
      base: pr.base,
      unit: pr.unit,
      total: pr.total,
      savings: pr.savings,
    });
  }

  const itemsTotal = round2(lines.reduce((s, l) => s + l.base * l.qty, 0));
  const discount = round2(lines.reduce((s, l) => s + l.savings, 0));
  const subtotal = round2(itemsTotal - discount);

  // Promo code: checked against the subtotal after product discounts.
  let coupon: Quote["coupon"];
  let couponError: Quote["couponError"];
  let couponDiscount = 0;
  if (opts.coupon?.trim() && lines.length) {
    const check = await checkCoupon(opts.coupon, { subtotal, email: opts.email });
    if (check.ok) {
      const { id, code, type, descriptionEn, descriptionAr } = check.coupon;
      coupon = { id, code, type, descriptionEn, descriptionAr };
      couponDiscount = couponAmount(check.coupon, subtotal);
    } else couponError = { code: opts.coupon.trim().toUpperCase(), error: check.error, minSpend: check.minSpend };
  }

  const express = opts.delivery === "express" && expressAvailable(opts.emirate);
  // The free-delivery threshold uses the subtotal before the promo code.
  const standardFee = subtotal >= FREE_DELIVERY_THRESHOLD || coupon?.type === "FREE_DELIVERY" ? 0 : STANDARD_DELIVERY_FEE;
  const deliveryFee = round2(standardFee + (express ? EXPRESS_DELIVERY_FEE : 0));
  const hasSubscription = lines.some((l) => l.sub);
  const payable = round2(subtotal - couponDiscount);
  const codAllowed = !hasSubscription && payable + deliveryFee + COD_FEE <= COD_MAX_ORDER;
  const codFee = opts.payment === "COD" && codAllowed ? COD_FEE : 0;
  const total = round2(payable + deliveryFee + codFee);

  return {
    lines,
    issues,
    itemsTotal,
    discount,
    subtotal,
    coupon,
    couponDiscount,
    couponError,
    deliveryFee,
    codFee,
    total,
    vatAmount: round2(total - total / (1 + VAT_RATE)),
    hasSubscription,
    express,
    codAllowed,
  };
}
