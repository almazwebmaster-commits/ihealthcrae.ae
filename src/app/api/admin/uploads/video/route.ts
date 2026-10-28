import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/server/admin/audit";
import { staffActor } from "@/server/admin/guard";
import { cloudinaryConfig, importVideoToCloudinary } from "@/server/cloudinary";

// Cloudinary downloads and processes the whole file before answering; large videos take a while.
export const maxDuration = 60;

/** Imports a video from a web address into Cloudinary (JSON { url, area: "homepage" | "products" }). */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { url?: unknown; area?: unknown } | null;
  const area = body?.area === "products" ? "products" : "homepage";
  let actor;
  try {
    actor = await staffActor(area);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!/^https:\/\/\S+$/.test(url) || url.length > 1000) return NextResponse.json({ error: "url" }, { status: 400 });
  const cfg = cloudinaryConfig();
  if (!cfg) return NextResponse.json({ error: "storage" }, { status: 503 });
  try {
    // Same address → same file, so importing twice reuses the first copy.
    const video = await importVideoToCloudinary(url, createHash("sha256").update(url).digest("hex").slice(0, 16), cfg);
    await audit(actor, "upload.video", "upload", video.src, url);
    return NextResponse.json({ video });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "import" }, { status: 502 });
  }
}
