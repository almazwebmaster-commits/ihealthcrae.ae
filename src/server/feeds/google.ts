import "server-only";
import { googleCategoryPath } from "@/lib/google-taxonomy";
import { flashLive } from "@/lib/promotions";
import { FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_FEE } from "@/lib/store-settings";
import { db } from "../db";

/** Public site address used for links in the feed (set SITE_URL in production). */
export const siteUrl = () => (process.env.SITE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const money = (n: number) => `${n.toFixed(2)} AED`;
const round2 = (n: number) => Math.round(n * 100) / 100;
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function loadProducts() {
  return db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { id: "asc" },
    include: {
      brand: true,
      category: true,
      subcategory: true,
      variants: { orderBy: { position: "asc" } },
      images: { orderBy: { position: "asc" } },
    },
  });
}

export type FeedProblem = "noImage" | "noGoogleCategory" | "shortDescription" | "longTitle" | "noArabic";

/** Checks against Google's main requirements (missing image = the product is left out of the feed). */
export async function feedHealth() {
  const rows = await loadProducts();
  const items = rows.map((p) => {
    const problems: FeedProblem[] = [];
    if (!p.images.length) problems.push("noImage");
    if (!googleCategoryPath(p.subcategory.googleCategoryId)) problems.push("noGoogleCategory");
    if (p.descEn.trim().length < 50) problems.push("shortDescription");
    if (p.nameEn.length > 150) problems.push("longTitle");
    if (!p.nameAr.trim() || !p.descAr.trim()) problems.push("noArabic");
    return { id: p.id, sku: p.sku, nameEn: p.nameEn, nameAr: p.nameAr, variants: p.variants.length, problems };
  });
  return {
    total: rows.length,
    included: items.filter((i) => !i.problems.includes("noImage")).length,
    offers: items.filter((i) => !i.problems.includes("noImage")).reduce((n, i) => n + Math.max(1, i.variants), 0),
    withProblems: items.filter((i) => i.problems.length),
  };
}

/** Google Merchant Center product feed (RSS 2.0 + g: namespace) in English or Arabic. */
export async function googleFeedXml(lang: "en" | "ar") {
  const site = siteUrl();
  const now = new Date();
  const rows = await loadProducts();
  const items: string[] = [];

  for (const p of rows) {
    if (!p.images.length) continue; // Google rejects products without an image
    const name = lang === "ar" ? p.nameAr || p.nameEn : p.nameEn;
    const desc = (lang === "ar" ? p.descAr || p.descEn : p.descEn).replace(/\s+/g, " ").trim() || name;
    const link = `${site}/${lang}/p/${p.slug}`;
    const images = p.images.map((i) => (i.url.startsWith("http") ? i.url : `${site}${i.url}`));
    const gcat = p.subcategory.googleCategoryId;
    const productType = `${lang === "ar" ? p.category.nameAr : p.category.nameEn} > ${lang === "ar" ? p.subcategory.nameAr : p.subcategory.nameEn}`;
    const flash = flashLive(p, now) ? p.flashPct! : 0;
    const compareAt = p.compareAt == null ? 0 : Number(p.compareAt);

    // Without options the product is one offer; with options each option is its own offer in a group.
    const offers = p.variants.length
      ? p.variants.map((v) => ({ id: v.sku, label: lang === "ar" ? v.labelAr : v.labelEn, base: Number(v.price), group: true }))
      : [{ id: p.sku, label: "", base: Number(p.price), group: false }];

    for (const o of offers) {
      // Regular price, and a sale price for a live flash deal or a "was" price.
      let price = o.base;
      let sale: number | null = null;
      let saleWindow = "";
      if (flash) {
        sale = round2(o.base * (1 - flash / 100));
        saleWindow = `${(p.flashStartsAt ?? now).toISOString()}/${p.flashEndsAt!.toISOString()}`;
      } else if (!o.group && compareAt > o.base) {
        price = compareAt;
        sale = o.base;
      }
      const charged = sale ?? price;
      const fields = [
        ["g:id", o.id],
        ["g:title", clip(o.label ? `${name} — ${o.label}` : name, 150)],
        ["g:description", clip(desc, 5000)],
        ["g:link", link],
        ["g:image_link", images[0]],
        ...images.slice(1, 11).map((u) => ["g:additional_image_link", u]),
        ["g:availability", p.stock > 0 ? "in_stock" : "out_of_stock"],
        ["g:price", money(price)],
        ...(sale != null ? [["g:sale_price", money(sale)]] : []),
        ...(saleWindow ? [["g:sale_price_effective_date", saleWindow]] : []),
        ["g:brand", p.brand.name],
        ["g:condition", "new"],
        ["g:identifier_exists", "no"],
        ...(gcat ? [["g:google_product_category", String(gcat)]] : []),
        ["g:product_type", productType],
        ...(o.group ? [["g:item_group_id", p.sku]] : []),
      ];
      const shipping = `<g:shipping><g:country>AE</g:country><g:service>Standard</g:service><g:price>${money(charged >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE)}</g:price></g:shipping>`;
      items.push(`<item>${fields.map(([k, v]) => `<${k}>${esc(v)}</${k}>`).join("")}${shipping}</item>`);
    }
  }

  const title = lang === "ar" ? "آي هيلثكير — منتجات" : "iHealthcare.ae products";
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>${esc(title)}</title><link>${esc(`${site}/${lang}`)}</link><description>${esc(title)}</description>
${items.join("\n")}
</channel></rss>
`;
}
