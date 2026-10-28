import { createHash } from "node:crypto";

// Cloudinary image storage, via its upload API (no SDK). Configured by one variable from the
// Cloudinary dashboard: CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
// No "server-only" here: the one-off migration script uses it too. Never import it from client code.

export type CloudinaryConfig = { cloud: string; key: string; secret: string };

export function cloudinaryConfig(url = process.env.CLOUDINARY_URL): CloudinaryConfig | null {
  const m = url?.trim().match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)/);
  return m ? { key: m[1], secret: m[2], cloud: m[3] } : null;
}

/**
 * Uploads an already-processed image and returns its HTTPS address. The public ID is the
 * content hash, so uploading the same image twice reuses the existing file.
 */
export async function uploadToCloudinary(file: Buffer, folder: string, publicId: string, cfg: CloudinaryConfig) {
  const params: Record<string, string> = {
    folder: `ihealthcare/${folder}`,
    overwrite: "false",
    public_id: publicId,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const body = new FormData();
  for (const [k, v] of Object.entries(params)) body.append(k, v);
  body.append("api_key", cfg.key);
  body.append("signature", createHash("sha1").update(toSign + cfg.secret).digest("hex"));
  body.append("file", new Blob([new Uint8Array(file)], { type: "image/webp" }), `${publicId}.webp`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`, { method: "POST", body });
  const data = (await res.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
  if (!res.ok || !data?.secure_url) throw new Error(`Cloudinary upload failed (${res.status}): ${data?.error?.message ?? "no response"}`);
  return data.secure_url;
}
