import "server-only";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

// Storage: local disk under public/uploads (served by Next.js). Fine for a single
// server; before deploying to serverless hosting, swap this function for object
// storage (S3-compatible / Vercel Blob) — callers only depend on the return shape.
const DIR = join(process.cwd(), "public", "uploads", "products");
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

  const name = `${createHash("sha256").update(out).digest("hex").slice(0, 16)}.webp`;
  await mkdir(DIR, { recursive: true });
  await writeFile(join(DIR, name), out);
  return { url: `/uploads/products/${name}`, width: SIZE, height: SIZE };
}

const BANNER_DIR = join(process.cwd(), "public", "uploads", "banners");

/** Homepage banner: cropped to the exact slot size (keeps the most eye-catching area), WebP. */
export async function saveBannerImage(input: Buffer, size: { width: number; height: number }) {
  const out = await sharp(input, { failOn: "error" })
    .rotate()
    .resize(size.width, size.height, { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: 82 })
    .toBuffer();
  const name = `${createHash("sha256").update(out).digest("hex").slice(0, 16)}.webp`;
  await mkdir(BANNER_DIR, { recursive: true });
  await writeFile(join(BANNER_DIR, name), out);
  return { src: `/uploads/banners/${name}`, width: size.width, height: size.height };
}
