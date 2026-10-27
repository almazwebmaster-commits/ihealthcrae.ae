/** Promotion rules shared by checkout (server) and the admin UI. */

export const couponTypes = ["PERCENT", "FIXED", "FREE_DELIVERY"] as const;
export type CouponType = (typeof couponTypes)[number];

export type CouponRule = {
  code: string;
  type: CouponType;
  value: number;
  maxDiscount: number | null;
};

export const couponErrors = ["notFound", "inactive", "notStarted", "expired", "minSpend", "usedUp", "perCustomer"] as const;
export type CouponError = (typeof couponErrors)[number];

/** Codes are matched case-insensitively and stored uppercase. */
export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");
export const CODE_RE = /^[A-Z0-9_-]{3,30}$/;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Money a code takes off the items subtotal; free-delivery codes take nothing
 * off the items and waive the standard delivery fee instead.
 */
export function couponAmount(rule: CouponRule, subtotal: number) {
  if (rule.type === "PERCENT") {
    const raw = (subtotal * rule.value) / 100;
    return round2(Math.min(raw, rule.maxDiscount ?? raw, subtotal));
  }
  if (rule.type === "FIXED") return round2(Math.min(rule.value, subtotal));
  return 0;
}

export type CouponStatus = "active" | "scheduled" | "expired" | "usedUp" | "disabled";

export function couponStatus(c: { active: boolean; startsAt: Date | null; endsAt: Date | null; usageLimit: number | null; usedCount: number }, now = new Date()): CouponStatus {
  if (!c.active) return "disabled";
  if (c.endsAt && c.endsAt <= now) return "expired";
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return "usedUp";
  if (c.startsAt && c.startsAt > now) return "scheduled";
  return "active";
}

/** A product's flash deal is live when it has a % and now is inside its window. */
export function flashLive(p: { flashPct: number | null; flashStartsAt: Date | null; flashEndsAt: Date | null }, now = new Date()) {
  return !!p.flashPct && !!p.flashEndsAt && p.flashEndsAt > now && (!p.flashStartsAt || p.flashStartsAt <= now);
}
