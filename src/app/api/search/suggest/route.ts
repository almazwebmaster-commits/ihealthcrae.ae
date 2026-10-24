import { NextResponse, type NextRequest } from "next/server";
import { topProducts } from "@/server/catalog";

/** Live search suggestions for the header search box. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = req.nextUrl.searchParams.get("category") || undefined;
  if (q.length < 2) return NextResponse.json({ items: [] });

  const items = (await topProducts({ q: q.slice(0, 80), category }, 5)).map((p) => ({
    slug: p.slug,
    name: p.name,
    brandName: p.brandName,
    price: p.price,
    category: p.category,
    categoryTint: p.categoryTint,
    images: p.images.slice(0, 1),
  }));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "public, max-age=30" } });
}
