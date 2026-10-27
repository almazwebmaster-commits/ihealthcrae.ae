import { NextResponse, type NextRequest } from "next/server";
import { BANNER_SIZES } from "@/lib/home-content";
import { audit } from "@/server/admin/audit";
import { staffActor } from "@/server/admin/guard";
import { ACCEPTED_TYPES, MAX_UPLOAD_BYTES, saveBannerImage } from "@/server/admin/uploads";

/** Homepage banner upload (multipart "file"; ?kind=desktop|mobile picks the crop size). */
export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await staffActor("homepage");
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const kind = req.nextUrl.searchParams.get("kind") === "mobile" ? "mobile" : "desktop";
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (!ACCEPTED_TYPES.includes(file.type)) return NextResponse.json({ error: "type" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "size" }, { status: 400 });
  try {
    const image = await saveBannerImage(Buffer.from(await file.arrayBuffer()), BANNER_SIZES[kind]);
    await audit(actor, "homepage.banner", "upload", image.src, `${kind} ${file.name}`);
    return NextResponse.json({ image });
  } catch {
    return NextResponse.json({ error: "unreadable" }, { status: 400 });
  }
}
