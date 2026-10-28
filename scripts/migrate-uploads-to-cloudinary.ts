// Moves images uploaded to local disk (public/uploads/…) onto Cloudinary and points the database at them.
//   npm run uploads:migrate              → dry run: lists what would move
//   npm run uploads:migrate -- --apply   → uploads and updates the database
// Covers product photos, order line photos and the homepage banners. Safe to re-run: files are named
// by content hash, so an image already on Cloudinary is reused.

import "dotenv/config";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { cloudinaryConfig, uploadToCloudinary } from "../src/server/cloudinary";

const LOCAL = /^\/uploads\/(products|banners)\/[A-Za-z0-9_-]+\.webp$/;

async function main() {
  const apply = process.argv.includes("--apply");
  const cfg = cloudinaryConfig();
  if (!cfg) {
    console.error("CLOUDINARY_URL is missing or invalid in .env (cloudinary://<api_key>:<api_secret>@<cloud_name>).");
    process.exit(1);
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED! }) });
  const moved = new Map<string, string>(); // local path → Cloudinary URL
  const missing = new Set<string>();

  async function remote(src: string) {
    if (!LOCAL.test(src)) return null;
    if (moved.has(src)) return moved.get(src)!;
    const file = join(process.cwd(), "public", src);
    if (!existsSync(file)) {
      missing.add(src);
      return null;
    }
    const url = apply
      ? await uploadToCloudinary(await readFile(file), basename(dirname(src)), basename(src, ".webp"), cfg!)
      : `(cloudinary) ${src}`;
    moved.set(src, url);
    return url;
  }

  try {
    let products = 0;
    for (const img of await db.productImage.findMany({ where: { url: { startsWith: "/uploads/" } } })) {
      const url = await remote(img.url);
      if (!url) continue;
      products++;
      if (apply) await db.productImage.update({ where: { id: img.id }, data: { url } });
    }

    let orderLines = 0;
    for (const item of await db.orderItem.findMany({ where: { imageUrl: { startsWith: "/uploads/" } }, select: { id: true, imageUrl: true } })) {
      const url = await remote(item.imageUrl!);
      if (!url) continue;
      orderLines++;
      if (apply) await db.orderItem.update({ where: { id: item.id }, data: { imageUrl: url } });
    }

    // Homepage settings are one JSON document: swap every { src: "/uploads/…" } inside it.
    let banners = 0;
    const home = await db.siteContent.findUnique({ where: { key: "home" } });
    if (home) {
      const swap = async (v: unknown): Promise<unknown> => {
        if (Array.isArray(v)) return Promise.all(v.map(swap));
        if (v && typeof v === "object") {
          const o = Object.fromEntries(await Promise.all(Object.entries(v).map(async ([k, x]) => [k, await swap(x)])));
          if (typeof o.src === "string") {
            const url = await remote(o.src);
            if (url) {
              banners++;
              o.src = url;
            }
          }
          return o;
        }
        return v;
      };
      const value = await swap(home.value);
      if (apply && banners) await db.siteContent.update({ where: { key: "home" }, data: { value: value as object } });
    }

    console.log(`${apply ? "Moved" : "Would move"} ${moved.size} file(s) to Cloudinary (cloud "${cfg.cloud}").`);
    console.log(`  product photos: ${products} · order lines: ${orderLines} · homepage images: ${banners}`);
    if (missing.size) {
      console.log(`  Not found on this computer (re-upload these in the admin):`);
      for (const m of missing) console.log(`    ${m}`);
    }
    if (!apply && moved.size) console.log("Dry run only. Run again with --apply to upload and update the database.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
