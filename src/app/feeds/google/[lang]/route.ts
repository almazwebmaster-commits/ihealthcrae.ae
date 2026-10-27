import { NextResponse } from "next/server";
import { googleFeedXml } from "@/server/feeds/google";

/** Google Merchant Center feed: /feeds/google/en.xml and /feeds/google/ar.xml */
export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang.replace(/\.xml$/, "");
  if (lang !== "en" && lang !== "ar") return new NextResponse("Not found", { status: 404 });
  return new NextResponse(await googleFeedXml(lang), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Google fetches on a schedule; an hour of caching keeps the feed fast and fresh enough.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
