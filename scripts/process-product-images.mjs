// Turns raw product photos into square, white-background packshots.
//
//   1. Put photos in design/products/ named by product slug:
//        <slug>.jpg            → main image
//        <slug>@2.jpg, @3 …    → extra gallery angles (slugs often end in numbers, so not "-2")
//   2. Run: npm run images:products
//   3. Re-seed (npm run db:seed) so the database picks up the new images.
//
// Output: public/images/products/<slug>[@n].<hash>.webp (1200×1200) and
// prisma/seed-data/product-images.json, which the seed reads.

import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import sharp from "sharp";

const ROOT = join(dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const SRC = join(ROOT, "design", "products");
const OUT_DIR = join(ROOT, "public", "images", "products");
const MANIFEST = join(ROOT, "prisma", "seed-data", "product-images.json");

const SIZE = 1200;
const PADDING = 0.08; // empty margin on each side
const RAW_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

mkdirSync(OUT_DIR, { recursive: true });
for (const f of readdirSync(OUT_DIR)) unlinkSync(join(OUT_DIR, f));

const manifest = {};
for (const file of readdirSync(SRC).sort()) {
  const ext = extname(file).toLowerCase();
  if (!RAW_EXT.has(ext)) continue;
  const stem = file.slice(0, -ext.length);
  const m = stem.match(/^(.*?)(?:@(\d+))?$/);
  const slug = m[1];
  const position = m[2] ? Number(m[2]) - 1 : 0;

  // Flatten transparency onto white, then trim the (near-)uniform backdrop.
  const flat = await sharp(join(SRC, file)).rotate().flatten({ background: "#ffffff" }).png().toBuffer();
  const trimmed = await sharp(flat).trim({ threshold: 24 }).toBuffer();
  const inner = Math.round(SIZE * (1 - PADDING * 2));
  const fitted = await sharp(trimmed)
    .resize(inner, inner, { fit: "inside", withoutEnlargement: false })
    .toBuffer();

  const buffer = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: "#ffffff" } })
    .composite([{ input: fitted, gravity: "centre" }])
    .webp({ quality: 85, effort: 6 })
    .toBuffer();

  const hash = createHash("md5").update(buffer).digest("hex").slice(0, 8);
  const name = `${stem}.${hash}.webp`;
  writeFileSync(join(OUT_DIR, name), buffer);

  (manifest[slug] ??= []).push({ url: `/images/products/${name}`, width: SIZE, height: SIZE, position });
  console.log(`✓ ${file} → ${name}`);
}

for (const list of Object.values(manifest)) list.sort((a, b) => a.position - b.position);
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${Object.keys(manifest).length} product(s) with images → ${MANIFEST}`);
