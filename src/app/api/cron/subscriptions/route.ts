import { NextResponse, type NextRequest } from "next/server";
import { runRenewals } from "@/server/subscriptions";

/**
 * Subscription renewal runner. Call daily from a scheduler (e.g. Vercel Cron)
 * or locally with `npm run subscriptions:renew`. Requires `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const results = await runRenewals();
  return NextResponse.json({ ran: results.length, results });
}

export const GET = handle;
export const POST = handle;
