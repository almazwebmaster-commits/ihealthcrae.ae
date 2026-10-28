import "server-only";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { cloudinaryConfig, uploadToCloudinary } from "@/server/cloudinary";

/** There is nowhere to keep the file, or the image host failed. Nothing was saved. */
export class UploadStorageError extends Error {}

/**
 * Keeps a processed image and returns its address.
 * - CLOUDINARY_URL set: Cloudinary (works everywhere, including Vercel).
 * - Otherwise, local development: public/uploads/<folder> (served by Next.js).
 * - Otherwise, on Vercel: refuse. Its file system is read-only, so a local write would fail.
 */
async function store(out: Buffer, folder: "products" | "banners") {
  const name = createHash("sha256").update(out).digest("hex").slice(0, 16);
  const cloudinary = cloudinaryConfig();
  if (cloudinary) {
    try {
      return await uploadToCloudinary(out, folder, name, cloudinary);
    } catch (e) {
      console.error(e);
      throw new UploadStorageError("Cloudinary upload failed");
    }
  }
  if (process.env.VERCEL) throw new UploadStorageError("CLOUDINARY_URL is not set; Vercel can't store uploads on disk");
  const dir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${name}.webp`), out);
  return `/uploads/${folder}/${name}.webp`;
}

const SIZE = 1200;
const PADDING = 0.08;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Square white-background packshot: trims the backdrop, centres the product, WebP. */
export async function saveProductPhoto(input: Buffer) {
  const flat = await sharp(input, { failOn: "error" }).rotate().flatten({ background: "#ffffff" }).png().toBuffer();
  const trimmed = await sharp(flat).trim({ threshold: 24 }).toBuffer();
  const inner = Math.round(SIZE * (1 - PADDING * 2));
  const fitted = await sharp(trimmed).resize(inner, inner, { fit: "inside" }).toBuffer();
  const out = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: "#ffffff" } })
    .composite([{ input: fitted, gravity: "centre" }])
    .webp({ quality: 85 })
    .toBuffer();
  return { url: await store(out, "products"), width: SIZE, height: SIZE };
}

/** Homepage banner: cropped to the exact slot size (keeps the most eye-catching area), WebP. */
export async function saveBannerImage(input: Buffer, size: { width: number; height: number }) {
  const out = await sharp(input, { failOn: "error" })
    .rotate()
    .resize(size.width, size.height, { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: 82 })
    .toBuffer();
  return { src: await store(out, "banners"), width: size.width, height: size.height };
}
