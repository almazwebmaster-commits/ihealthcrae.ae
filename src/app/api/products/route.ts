import { NextResponse, type NextRequest } from "next/server";
import { getProductsBySlugs } from "@/server/catalog";

/** Current product data for the slugs in a (browser-stored) cart. */
export async function GET(req: NextRequest) {
  const slugs = (req.nextUrl.searchParams.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
  return NextResponse.json({ items: await getProductsBySlugs(slugs) });
}
