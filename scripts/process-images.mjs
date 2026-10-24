// Processes raw generated images into homepage-ready WebP files.
//
//   1. Drop raw files into design/raw/ named by slot ID, e.g. H3-D.jpg
//   2. Run: npm run images
//
// Each image is cropped to its slot's exact aspect ratio (trimming from the
// empty side, never the subject), downscaled to the export width (never
// upscaled), saved as WebP, and recorded in src/data/image-manifest.json.
// See docs/homepage-image-plan.md for the slot list.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import sharp from "sharp";

const ROOT = join(dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const RAW = join(ROOT, "design", "raw");
const PUBLIC = join(ROOT, "public");
const MANIFEST = join(ROOT, "src", "data", "image-manifest.json");

// keep = which side survives the crop (the subject side)
// -DR = optional right-to-left desktop variant, for images that contain text/logos
// and therefore can't simply be mirrored for Arabic.
const hero = (id, name) => [
  [`${id}-D`, { out: `images/home/hero/${name}-desktop.webp`, ratio: 21 / 9, width: 1848, keep: "right" }],
  [`${id}-DR`, { out: `images/home/hero/${name}-desktop-rtl.webp`, ratio: 21 / 9, width: 1848, keep: "left" }],
  [`${id}-M`, { out: `images/home/hero/${name}-mobile.webp`, ratio: 4 / 5, width: 1080, keep: "bottom" }],
];
const tile = (id, slug) => [id, { out: `images/home/categories/${slug}.webp`, ratio: 1, width: 400, keep: "centre" }];

const SLOTS = new Map([
  ...hero("H1", "vitamins"),
  ...hero("H2", "skincare"),
  ...hero("H3", "devices"),
  ...hero("H4", "baby"),
  tile("C1", "health-medicine"),
  tile("C2", "vitamins-supplements"),
  tile("C3", "beauty-skincare"),
  tile("C4", "personal-care"),
  tile("C5", "mother-baby"),
  tile("C6", "medical-devices"),
  tile("C7", "sports-nutrition"),
  ["B1-D", { out: "images/home/promo/skincare-desktop.webp", ratio: 4 / 5, width: 1380, keep: "top" }],
  ["B1-M", { out: "images/home/promo/skincare-mobile.webp", ratio: 16 / 9, width: 1600, keep: "right" }],
  ["P1", { out: "images/home/promo/cod.webp", ratio: 4 / 3, width: 880, keep: "centre" }],
  ["S1", { out: "images/home/promo/subscribe.webp", ratio: 1, width: 448, keep: "centre" }],
  ["S2", { out: "images/home/promo/multibuy.webp", ratio: 1, width: 448, keep: "centre" }],
]);

const RAW_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

async function processSlot(id, file, slot) {
  const input = sharp(join(RAW, file)).rotate();
  const { width: w, height: h } = await input.metadata();

  // Largest box of the target ratio that fits inside the source.
  let cw = w;
  let ch = Math.round(w / slot.ratio);
  if (ch > h) {
    ch = h;
    cw = Math.round(h * slot.ratio);
  }
  const left = slot.keep === "right" ? w - cw : slot.keep === "left" ? 0 : Math.round((w - cw) / 2);
  const top = slot.keep === "bottom" ? h - ch : slot.keep === "top" ? 0 : Math.round((h - ch) / 2);

  const outWidth = Math.min(slot.width, cw);
  const outHeight = Math.round(outWidth / slot.ratio);

  const buffer = await input
    .extract({ left, top, width: cw, height: ch })
    .resize(outWidth, outHeight)
    .webp({ quality: 82, effort: 6 })
    .toBuffer();

  // Content-hashed file name: a new image always gets a new URL, so browsers
  // and the Next.js image cache can never serve a stale version.
  const hash = createHash("md5").update(buffer).digest("hex").slice(0, 8);
  const stem = slot.out.replace(/\.webp$/, "");
  const out = `${stem}.${hash}.webp`;
  const dir = join(PUBLIC, dirname(out));
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) {
    const name = basename(stem);
    if (f === `${name}.webp` || (f.startsWith(`${name}.`) && /^[\w-]+\.[0-9a-f]{8}\.webp$/.test(f) && f.split(".")[0] === name)) {
      unlinkSync(join(dir, f));
    }
  }
  writeFileSync(join(PUBLIC, out), buffer);

  const note = outWidth < slot.width ? `  (source smaller than ${slot.width}px target — kept at native size)` : "";
  console.log(`✓ ${id.padEnd(5)} ${w}×${h} → ${outWidth}×${outHeight}  ${out}${note}`);
  return { src: `/${out.replace(/\\/g, "/")}`, width: outWidth, height: outHeight };
}

if (!existsSync(RAW)) {
  console.error(`No ${RAW} folder. Create it and add images named by slot ID (e.g. H3-D.jpg).`);
  process.exit(1);
}

const manifest = {};
for (const file of readdirSync(RAW).sort()) {
  const ext = extname(file).toLowerCase();
  if (!RAW_EXT.has(ext)) continue;
  const id = file.slice(0, -ext.length).toUpperCase();
  const slot = SLOTS.get(id);
  if (!slot) {
    console.warn(`! Skipping ${file}: "${id}" is not a known slot ID`);
    continue;
  }
  manifest[id] = await processSlot(id, file, slot);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
const missing = [...SLOTS.keys()].filter((id) => !manifest[id]);
console.log(`\nManifest: ${Object.keys(manifest).length} slot(s) ready. Still missing: ${missing.join(", ") || "none"}`);
