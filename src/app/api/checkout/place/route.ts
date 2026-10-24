import { NextResponse, type NextRequest } from "next/server";
import { placeOrder } from "@/server/checkout/place";
import { getSession } from "@/server/session";

/** Creates the order (COD: placed immediately; card: awaiting payment + Stripe client secret). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = await placeOrder(body, await getSession());
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
