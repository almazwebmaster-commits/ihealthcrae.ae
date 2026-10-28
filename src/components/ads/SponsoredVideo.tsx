import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { Price } from "@/components/catalog/Price";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import { Rating } from "@/components/catalog/Rating";
import { Link } from "@/i18n/navigation";
import { formatNumber, tr } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";
import type { VideoAd } from "@/server/ads";
import { AdVideo } from "./AdVideo";

/** Sponsored video strip: the brand's clip beside the product it advertises (Amazon Sponsored Brands style). */
export function SponsoredVideo({ ad, className }: { ad: VideoAd; className?: string }) {
  const t = useTranslations("Ads");
  const tp = useTranslations("Product");
  const locale = useLocale();
  const p = ad.product;
  const href = `/p/${p.slug}`;
  const brandHref = `/search?brand=${p.brand}`;
  const headline = tr(ad.headline, locale);

  return (
    <section aria-label={t("sponsoredBy", { brand: p.brandName })} className={cn("overflow-hidden rounded-2xl bg-white shadow-box", className)}>
      <div className="grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="aspect-video md:aspect-auto md:min-h-80">
          <AdVideo src={ad.video.video} poster={ad.video.poster} labels={{ soundOn: t("soundOn"), soundOff: t("soundOff"), play: t("play") }} />
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <Link href={brandHref} className="text-sm font-extrabold uppercase tracking-wide text-brand-700 hover:text-brand-800" dir="ltr">
              {p.brandName}
            </Link>
            <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-[11px] font-semibold text-ink-600">{t("sponsored")}</span>
          </div>
          {headline && <h2 className="text-xl font-extrabold leading-snug text-ink-900 sm:text-2xl">{headline}</h2>}

          <div className="flex gap-4">
            <Link href={href} className="w-24 shrink-0 overflow-hidden rounded-xl sm:w-28" tabIndex={-1} aria-hidden>
              <ProductVisual product={p} sizes="112px" className="bg-surface-sunken" />
            </Link>
            <div className="flex min-w-0 flex-col gap-1">
              <Link href={href} className="line-clamp-2 text-sm leading-5 text-ink-900 hover:text-brand-700">
                {tr(p.name, locale)}
              </Link>
              <Rating value={p.rating} count={formatNumber(p.reviews, locale)} label={tp("ratingLabel", { rating: p.rating })} />
              <Price price={p.price} was={p.was} />
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2">
            <AddToCartButton
              slug={p.slug}
              option={p.options ? 0 : undefined}
              disabled={p.stock === 0}
              label={tp("addToCart")}
              addedLabel={tp("added")}
              size="md"
            />
            <Link href={brandHref} className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
              {t("shopBrand", { brand: p.brandName })}
              <ArrowRight className="flip-rtl size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
