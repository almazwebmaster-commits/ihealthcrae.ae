import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { finalizeCardOrder } from "@/server/checkout/place";
import { stripe } from "@/server/stripe";

/**
 * Stripe → server notifications. The checkout return page also finalises orders,
 * so this is the safety net (customer closed the tab, 3-D Secure in another window…).
 * Set STRIPE_WEBHOOK_SECRET from the Stripe dashboard (or `stripe listen`).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook secret not configured" }, { status: 503 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
    await finalizeCardOrder((event.data.object as Stripe.PaymentIntent).id);
  }
  return NextResponse.json({ received: true });
}
