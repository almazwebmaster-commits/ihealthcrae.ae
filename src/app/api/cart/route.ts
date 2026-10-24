import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCart, saveCart } from "@/server/account";
import { getSession } from "@/server/session";

const Lines = z
  .array(
    z.object({
      slug: z.string().min(1).max(200),
      option: z.number().int().min(0).max(50).optional(),
      sub: z.number().int().min(1).max(52).optional(),
      qty: z.number().int().min(1).max(10),
    }),
  )
  .max(100);

/** Signed-in cart: GET returns the saved lines, PUT replaces them. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ lines: [] }, { status: 401 });
  return NextResponse.json({ lines: await getCart(session.user.id) });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Lines.safeParse((await req.json().catch(() => null))?.lines);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await saveCart(session.user.id, parsed.data);
  return NextResponse.json({ ok: true });
}
