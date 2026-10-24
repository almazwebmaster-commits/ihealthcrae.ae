import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// The confirmation page shows name/address, so guests may only open it with a
// signed token for their own order number (no guessing IHC-1000xx).
const sign = (number: string) =>
  createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "dev-secret").update(`receipt:${number}`).digest("base64url").slice(0, 32);

export const receiptToken = sign;

export function verifyReceiptToken(number: string, token: string | undefined) {
  if (!token) return false;
  const a = Buffer.from(sign(number));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
