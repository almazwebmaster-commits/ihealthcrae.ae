import "server-only";
import Stripe from "stripe";

let client: Stripe | undefined;

export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { appInfo: { name: "iHealthcare.ae" } });
  return client;
}

/** AED amounts → Stripe's smallest unit (fils). */
export const toFils = (aed: number) => Math.round(aed * 100);

/** Returns the user's Stripe customer id, creating the customer on first use. */
export async function ensureStripeCustomer(user: { id: string; email: string; name: string; stripeCustomerId?: string | null }) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const { db } = await import("./db");
  const existing = await db.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const customer = await stripe().customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
  await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}
