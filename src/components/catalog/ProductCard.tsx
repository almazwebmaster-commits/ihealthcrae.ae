import { Layers, Repeat, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";
import { discountPct, type Product } from "@/lib/catalog-types";
import { formatNumber, tr } from "@/lib/i18n-utils";
import { maxTierPct } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./AddToCartButton";
import { Price } from "./Price";
import { ProductVisual } from "./ProductVisual";
import { Rating } from "./Rating";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const locale = useLocale();
  const t = useTranslations("Product");
  const href = `/p/${product.slug}`;
  const off = discountPct(product);
  const soldOut = product.stock === 0;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-sm border border-line bg-white transition-shadow hover:border-line-strong hover:shadow-pop",
        className,
      )}
    >
      <Link href={href} className="relative block overflow-hidden rounded-t-sm" tabIndex={-1} aria-hidden>
        <ProductVisual product={product} className={cn("transition-transform duration-300 group-hover:scale-[1.03]", soldOut && "opacity-50 grayscale")} />
        <span className="absolute start-2 top-2 flex flex-col items-start gap-1">
          {off > 0 && <Badge tone="sale">-{off}%</Badge>}
          {product.tags.includes("bestseller") && <Badge tone="accent">{t("bestseller")}</Badge>}
          {product.tags.includes("new") && <Badge tone="info">{t("new")}</Badge>}
        </span>
      </Link>
      <WishlistButton slug={product.slug} className="absolute end-2 top-2" />

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
          {product.brandName}
        </span>
        <Link href={href} className="line-clamp-2 min-h-10 text-sm leading-5 text-ink-900 hover:text-brand-700 hover:underline">
          {tr(product.name, locale)}
        </Link>
        <Rating
          value={product.rating}
          count={formatNumber(product.reviews, locale)}
          label={t("ratingLabel", { rating: product.rating })}
        />
        <Price price={product.price} was={product.was} />

        <div className="min-h-4 text-[11px] font-semibold">
          {product.subscribe ? (
            <span className="inline-flex items-center gap-1 text-brand-700">
              <Repeat className="size-3.5" aria-hidden />
              {t("snsShort", { pct: product.subscribe })}
            </span>
          ) : product.tiers ? (
            <span className="inline-flex items-center gap-1 text-accent-700">
              <Layers className="size-3.5" aria-hidden />
              {t("multibuyShort", { qty: product.tiers[0].qty, pct: maxTierPct(product.tiers) })}
            </span>
          ) : null}
        </div>

        <div className="min-h-4 text-[11px]">
          {soldOut ? (
            <span className="font-semibold text-sale">{t("outOfStock")}</span>
          ) : product.stock < 5 ? (
            <span className="font-semibold text-sale">{t("onlyLeft", { count: product.stock })}</span>
          ) : product.tags.includes("express") ? (
            <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
              <Truck className="size-3.5" aria-hidden />
              {t("expressToday")}
            </span>
          ) : (
            <span className="text-ink-500">{t("deliveryTomorrow")}</span>
          )}
        </div>

        <AddToCartButton
          slug={product.slug}
          option={product.options ? 0 : undefined}
          disabled={soldOut}
          label={t("addToCart")}
          addedLabel={t("added")}
          className="mt-auto w-full"
        />
      </div>
    </article>
  );
}
