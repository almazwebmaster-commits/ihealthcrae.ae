// Builds the "Monitor your health at home" hero (slot H3) from real product
// photos in design/products/ — logos, packaging and screens stay 100% accurate.
//
//   node scripts/compose-hero-devices.mjs --all && npm run images
//
// Layout: navy field, empty headline zone, and a boxy mosaic of white product
// tiles plus one amber brand tile. The live H3 banners currently use Gemini
// staging (design/raw/H3-*.jpg/png), so this only runs with --all, which
// replaces them with the mosaic (H3-D.png, H3-DR.png, H3-M.png). Remove the
// Gemini files from design/raw first so the pipeline picks up the PNGs.

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";

const ROOT = join(dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const P = (f) => join(ROOT, "design", "products", f);
const OUT = join(ROOT, "design", "raw");

const NAVY = "#0E1B2C";
const AMBER = "#FFB400";
const TEAL = "#0B6E69";
const RADIUS = 8;
const GAP = 16;

const rect = (w, h, fill) =>
  Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${RADIUS}" fill="${fill}"/></svg>`);

/** Product trimmed to its own bounds and fitted (contain) inside a white tile. */
async function productTile(file, w, h, pad) {
  const product = await sharp(P(file))
    .ensureAlpha()
    .trim({ background: "#ffffff", threshold: 12 })
    .resize(w - pad * 2, h - pad * 2, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp(rect(w, h, "#ffffff"))
    .composite([{ input: product, gravity: "centre" }])
    .png()
    .toBuffer();
}

/** Photo that has its own studio backdrop: cover-cropped to fill the tile, corners rounded. */
async function photoTile(file, w, h) {
  const photo = await sharp(P(file)).resize(w, h, { fit: "cover", position: "centre" }).png().toBuffer();
  return sharp(photo)
    .composite([{ input: rect(w, h, "#000"), blend: "dest-in" }])
    .png()
    .toBuffer();
}

/** Amber tile carrying the iHealthcare mosaic-cross mark in navy/white. */
function brandTile(w, h) {
  const cell = Math.round(Math.min(w, h) * 0.16);
  const g = Math.round(cell * 0.33);
  const size = cell * 3 + g * 2;
  const ox = Math.round((w - size) / 2);
  const oy = Math.round((h - size) / 2);
  const sq = (cx, cy, fill) =>
    `<rect x="${ox + cx * (cell + g)}" y="${oy + cy * (cell + g)}" width="${cell}" height="${cell}" rx="${Math.round(cell * 0.12)}" fill="${fill}"/>`;
  return Buffer.from(
    `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${RADIUS}" fill="${AMBER}"/>` +
      sq(1, 0, "#ffffff") + sq(0, 1, NAVY) + sq(1, 1, TEAL) + sq(2, 1, NAVY) + sq(1, 2, NAVY) +
      `</svg>`,
  );
}

/**
 * Mosaic inside region (x, y, w, h):
 *   [ BP monitor (wide) ][ test strips ]
 *   [ meter ][ brand   ][ CGM         ]
 */
async function mosaic(x, y, w, h) {
  const c1 = Math.round(w * 0.564);
  const c2 = w - c1 - GAP;
  const r1 = Math.round(h * 0.59);
  const r2 = h - r1 - GAP;
  const half = Math.round((c1 - GAP) / 2);

  return [
    { input: await productTile("vms-wrist-bp-monitor.png", c1, r1, Math.round(r1 * 0.08)), left: x, top: y },
    { input: await photoTile("sinocare-safe-aq-max-strips.png", c2, r1), left: x + c1 + GAP, top: y },
    { input: await productTile("sinocare-glucose-meter.webp", half, r2, Math.round(r2 * 0.08)), left: x, top: y + r1 + GAP },
    { input: brandTile(c1 - half - GAP, r2), left: x + half + GAP, top: y + r1 + GAP },
    { input: await productTile("sinocare-ican-i6-cgm.png", c2, r2, Math.round(r2 * 0.06)), left: x + c1 + GAP, top: y + r1 + GAP },
  ];
}

async function compose(name, width, height, region) {
  const layers = await mosaic(...region);
  const file = join(OUT, `${name}.png`);
  await sharp({ create: { width, height, channels: 3, background: NAVY } })
    .composite(layers)
    .png()
    .toFile(file);
  console.log(`✓ ${name}.png  ${width}×${height}`);
}

mkdirSync(OUT, { recursive: true });

// Desktop 21:9 — headline zone = left 47%, mosaic on the right.
// The photos contain real logos, so Arabic gets its own composition (mosaic on
// the left) instead of a mirrored image.
if (!process.argv.includes("--all")) {
  console.log("Live H3 banners use Gemini images. Pass --all to regenerate the mosaic versions.");
  process.exit(0);
}
const mosaicW = 1848 - Math.round(1848 * 0.47) - 56;
{
  await compose("H3-D", 1848, 792, [1848 - 56 - mosaicW, 56, mosaicW, 792 - 112]);
  await compose("H3-DR", 1848, 792, [56, 56, mosaicW, 792 - 112]);
  // Mobile 4:5 — headline zone = top 45%, mosaic in the bottom 55%.
  await compose("H3-M", 1080, 1350, [48, Math.round(1350 * 0.45), 1080 - 96, 1350 - Math.round(1350 * 0.45) - 48]);
}
