import { Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductRail } from "@/components/catalog/ProductRail";
import { Rating } from "@/components/catalog/Rating";
import { WishlistButton } from "@/components/catalog/WishlistButton";
import { BuyBox } from "@/components/product/BuyBox";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductVideos } from "@/components/product/ProductVideos";
import { Badge } from "@/components/ui/Badge";
import { Box, BoxHeader } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { discountPct } from "@/lib/catalog-types";
import { formatNumber, tr } from "@/lib/i18n-utils";
import { getProduct, redirectedSlug, relatedProducts } from "@/server/catalog";

// Rendered on first request, then cached and refreshed every 5 minutes.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]/p/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  return { title: tr(p.name, locale), description: snippet(tr(p.desc, locale)) };
}

/** Search engines show ~160 characters; cut at a word boundary. */
function snippet(text: string, max = 160) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 100 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

/** Rating distribution derived from the average (mock until real reviews in Phase 6). */
function distribution(rating: number) {
  const w = [5, 4, 3, 2, 1].map((k) => Math.exp(-Math.abs(k - rating) * 2.2));
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => Math.round((x / sum) * 100));
}

export default async function ProductPage({ params }: PageProps<"/[locale]/p/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = await getProduct(slug);
  if (!product) {
    // Renamed products keep their old links (and Google ranking) via a permanent redirect.
    const moved = await redirectedSlug(slug);
    if (moved) permanentRedirect(`/${locale}/p/${moved}`);
    notFound();
  }

  const t = await getTranslations("Product");
  const tl = await getTranslations("Listing");
  const tc = await getTranslations("Common");
  const brand = { slug: product.brand, name: product.brandName };
  const category = { slug: product.category, name: product.categoryName };
  const sub = { slug: product.sub, name: product.subName };
  const off = discountPct(product);
  const related = await relatedProducts(product);
  const reviews = formatNumber(product.reviews, locale);

  const specs: [string, string][] = [
    [t("specBrand"), brand.name],
    [t("specCategory"), `${tr(category.name, locale)} › ${tr(sub.name, locale)}`],
    ...(product.brandCountry ? [[t("specOrigin"), tr(product.brandCountry, locale)] as [string, string]] : []),
    [t("specSku"), product.sku],
    ...(product.options ? [[t("specOptions"), product.options.map((o) => tr(o.label, locale)).join(" · ")] as [string, string]] : []),
  ];

  return (
    <div className="container-site space-y-4 py-4">
      <Breadcrumbs
        items={[
          { label: tl("home"), href: "/" },
          { label: tr(category.name, locale), href: `/c/${category.slug}` },
          { label: tr(sub.name, locale), href: `/c/${sub.slug}` },
          { label: tr(product.name, locale) },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ProductGallery product={product} viewLabel={t("image")} videoLabel={t("playVideo")} />
        </div>

        <div className="space-y-3 lg:col-span-4">
          <Link href={`/search?brand=${brand.slug}`} className="text-sm font-bold uppercase tracking-wide text-brand-600 hover:underline">
            {t("visitBrand", { brand: brand.name })}
          </Link>
          <div className="flex items-start gap-3">
            <h1 className="flex-1 text-xl font-bold leading-snug text-ink-900 sm:text-2xl">{tr(product.name, locale)}</h1>
            <WishlistButton slug={product.slug} className="size-10 shrink-0" />
          </div>
          <a href="#reviews" className="inline-block">
            <Rating
              value={product.rating}
              count={t("reviewsCount", { count: product.reviews, formatted: reviews })}
              size="md"
              label={t("ratingLabel", { rating: product.rating })}
            />
          </a>
          <div className="flex flex-wrap gap-1.5">
            {off > 0 && <Badge tone="sale">{t("save", { pct: off })}</Badge>}
            {product.tags.includes("bestseller") && <Badge tone="accent">{t("bestseller")}</Badge>}
            {product.tags.includes("new") && <Badge tone="info">{t("new")}</Badge>}
            {product.tags.includes("express") && <Badge tone="brand">{t("express")}</Badge>}
            {product.subscribe && <Badge tone="brand">{t("snsShort", { pct: product.subscribe })}</Badge>}
            {product.tiers && <Badge tone="accent">{t("buyMoreSaveMore")}</Badge>}
          </div>
          <hr className="border-line" />
          <p className="whitespace-pre-line text-sm leading-6 text-ink-800">{tr(product.desc, locale)}</p>
          <div>
            <h2 className="mb-2 text-sm font-bold">{t("highlights")}</h2>
            <ul className="space-y-1.5 text-sm text-ink-800">
              {(["h1", "h2", "h3"] as const).map((k) => (
                <li key={k} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {t(`highlight.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-40">
            <BuyBox product={product} />
          </div>
        </div>
      </div>

      {product.video && (
        <ProductVideos
          src={product.video}
          brand={product.brandName}
          name={tr(product.name, locale)}
          labels={{ title: t("videosTitle"), play: t("playVideo") }}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <Box className="lg:col-span-7">
          <BoxHeader title={t("specifications")} />
          <table className="w-full text-sm">
            <tbody>
              {specs.map(([k, v]) => (
                <tr key={k} className="border-b border-line last:border-b-0">
                  <th scope="row" className="w-1/3 bg-surface px-4 py-2.5 text-start font-semibold text-ink-700">
                    {k}
                  </th>
                  <td className="px-4 py-2.5 text-ink-900">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>

        <Box id="reviews" className="lg:col-span-5">
          <BoxHeader title={t("customerReviews")} />
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-extrabold">{product.rating.toFixed(1)}</span>
              <div>
                <Rating value={product.rating} size="md" label={t("ratingLabel", { rating: product.rating })} />
                <p className="text-xs text-ink-500">{t("reviewsCount", { count: product.reviews, formatted: reviews })}</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {distribution(product.rating).map((pct, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-12 shrink-0 text-ink-700">{t("stars", { count: 5 - i })}</span>
                  <span className="h-3 flex-1 overflow-hidden rounded-xs bg-surface">
                    <span className="block h-full bg-accent-500" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-9 shrink-0 text-end text-ink-600">{pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Box>
      </div>

      {related.length > 0 && (
        <ProductRail
          title={t("related")}
          href={`/c/${category.slug}`}
          viewAllLabel={tc("viewAll")}
          prevLabel={tc("previous")}
          nextLabel={tc("next")}
        >
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </ProductRail>
      )}
    </div>
  );
}
