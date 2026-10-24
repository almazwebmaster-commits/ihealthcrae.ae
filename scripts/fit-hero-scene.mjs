// Shrinks a hero scene so its subject clears the headline zone, filling the
// freed space with the backdrop colour and feathering the seams.
//
//   node scripts/fit-hero-scene.mjs <in> <out> <scale> <anchor: left|right>
//
// The image is anchored bottom-left (or bottom-right). The freed space is
// filled by stretching the image's own edge pixels outward and blurring them,
// so the backdrop's natural shading continues without a visible seam.
// Only works when the top edge and the exposed side are pure backdrop.

import sharp from "sharp";

const [input, output, scaleArg = "0.8", anchor = "left"] = process.argv.slice(2);
const scale = Number(scaleArg);
const FEATHER = 48; // px of soft blend along the exposed edges

const { width: W, height: H } = await sharp(input).metadata();
const w = Math.round(W * scale);
const h = Math.round(H * scale);
const { data: scaled, info } = await sharp(input).resize(w, h).raw().toBuffer({ resolveWithObject: true });

const backdrop = await sharp(scaled, { raw: { width: w, height: h, channels: info.channels } })
  .extend({
    top: H - h,
    left: anchor === "right" ? W - w : 0,
    right: anchor === "left" ? W - w : 0,
    extendWith: "copy",
  })
  .blur(24)
  .removeAlpha()
  .png()
  .toBuffer();

// Alpha mask: opaque, fading to transparent along the top and the exposed side.
const mask = Buffer.alloc(w * h);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const fromTop = y / FEATHER;
    const fromSide = (anchor === "left" ? w - 1 - x : x) / FEATHER;
    mask[y * w + x] = Math.round(255 * Math.min(1, fromTop, fromSide));
  }
}
const layer = await sharp(scaled, { raw: { width: w, height: h, channels: info.channels } })
  .removeAlpha()
  .joinChannel(mask, { raw: { width: w, height: h, channels: 1 } })
  .png()
  .toBuffer();

await sharp(backdrop)
  .composite([{ input: layer, left: anchor === "left" ? 0 : W - w, top: H - h }])
  .jpeg({ quality: 95 })
  .toFile(output);

console.log(`✓ ${output}  ${W}×${H}, scene at ${Math.round(scale * 100)}% anchored bottom-${anchor}`);
