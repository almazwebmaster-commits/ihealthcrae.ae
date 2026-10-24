import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/server/admin/audit";
import { staffActor } from "@/server/admin/guard";
import { ACCEPTED_TYPES, MAX_UPLOAD_BYTES, saveProductPhoto } from "@/server/admin/uploads";

/** Staff-only product photo upload (multipart field "file", one or more). */
export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await staffActor();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const files = (form?.getAll("file") ?? []).filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "no_file" }, { status: 400 });

  const images = [];
  const errors = [];
  for (const file of files.slice(0, 12)) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errors.push({ name: file.name, error: "type" });
      continue;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      errors.push({ name: file.name, error: "size" });
      continue;
    }
    try {
      images.push(await saveProductPhoto(Buffer.from(await file.arrayBuffer())));
    } catch {
      errors.push({ name: file.name, error: "unreadable" });
    }
  }
  if (images.length) await audit(actor, "upload.create", "upload", images.map((i) => i.url).join(","), `${images.length} photo(s)`);
  return NextResponse.json({ images, errors });
}
