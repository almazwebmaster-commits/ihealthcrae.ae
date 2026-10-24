import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getWishlistSlugs, setWishlisted } from "@/server/account";
import { getSession } from "@/server/session";

const Body = z.object({ slug: z.string().min(1).max(200), on: z.boolean() });

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ slugs: [] }, { status: 401 });
  return NextResponse.json({ slugs: await getWishlistSlugs(session.user.id) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const ok = await setWishlisted(session.user.id, parsed.data.slug, parsed.data.on);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
