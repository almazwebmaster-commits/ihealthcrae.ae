// Store rules used by the cart, checkout (server-side pricing) and admin.
// Change them here — the server always recalculates with these values.

export const VAT_RATE = 0.05; // prices are VAT-inclusive

export const FREE_DELIVERY_THRESHOLD = 100; // AED, after discounts
export const STANDARD_DELIVERY_FEE = 15;

/** Same-day express delivery, only in these emirates. */
export const EXPRESS_EMIRATES = ["dubai"] as const;
export const EXPRESS_DELIVERY_FEE = 20; // charged on top of standard (which may be free)

/** Cash on delivery */
export const COD_FEE = 0;
export const COD_MAX_ORDER = 2000; // AED; larger orders must pay by card

export const deliveryMethods = ["standard", "express"] as const;
export type DeliveryMethod = (typeof deliveryMethods)[number];
export type PaymentChoice = "CARD" | "COD";

export function expressAvailable(emirate: string | undefined) {
  return !!emirate && (EXPRESS_EMIRATES as readonly string[]).includes(emirate);
}
