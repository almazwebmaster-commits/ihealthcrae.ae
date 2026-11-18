import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { discountPct, type Product } from "@/lib/catalog-types";
import { formatPrice, tr } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";
import { CartControl } from "./CartControl";
import { Price } from "./Price";
import { ProductVisual } from "./ProductVisual";
import { WishlistButton } from "./WishlistButton";

/**
 * Product card. `featured` is the collection style: the add control sits on the photo and a tinted
 * pill below says how much you save, or links to more from the brand.
 */
export function ProductCard({
  product,
  variant = "default",
  accent = "bg-brand-50 text-brand-800",
  className,
}: {
  product: Product;
  variant?: "default" | "featured";
  /** Classes for the featured card's bottom pill (matches the collection's colour) */
  accent?: string;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("Product");
  const href = `/p/${product.slug}`;
  const off = discountPct(product);
  const soldOut = product.stock === 0;
  const options = product.options?.length ?? 0;
  const fromPrice = options ? Math.min(...product.options!.map((o) => o.price)) : product.price;
  const featured = variant === "featured";

  const price = options ? (
    <span className="text-sm text-ink-600">
      {t("from")} <span className="text-base font-extrabold text-ink-900">{formatPrice(fromPrice, locale)}</span>
    </span>
  ) : (
    <Price price={product.price} was={product.was} showPct={false} />
  );

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-box transition-shadow hover:shadow-card",
        featured ? "p-0" : "p-2.5",
        className,
      )}
    >
      <div className="relative">
        <Link href={href} className={cn("block overflow-hidden", featured ? "" : "rounded-xl")} tabIndex={-1} aria-hidden>
          <ProductVisual
            product={product}
            className={cn("bg-surface-sunken transition-transform duration-300 group-hover:scale-[1.03]", soldOut && "opacity-50 grayscale")}
          />
        </Link>
        {off > 0 &&
          (featured ? (
            // Ribbon-style corner flag on featured cards
            <span className="absolute start-0 top-0 rounded-ee-xl bg-brand-700 px-2.5 py-1.5 text-center text-xs font-extrabold leading-tight text-white">
              {t("pctOff", { pct: off })}
            </span>
          ) : (
            <span className="absolute start-2 top-2 rounded-full bg-sale px-2.5 py-1 text-[11px] font-bold text-white">{t("save", { pct: off })}</span>
          ))}
        <WishlistButton slug={product.slug} className={cn("absolute", featured ? "end-3 top-3" : "end-2 top-2")} />
        {featured && <CartControl slug={product.slug} hasOptions={options > 0} soldOut={soldOut} variant="overlay" className="absolute bottom-3 end-3" />}
      </div>

      <div className={cn("flex flex-1 flex-col gap-1", featured ? "p-3.5" : "px-1 pb-1 pt-3")}>
        {featured ? (
          <>
            <Link href={href} className="line-clamp-2 min-h-12 text-[15px] leading-6 text-ink-900 hover:text-brand-700">
              {tr(product.name, locale)}
            </Link>
            <span className="text-xs text-ink-500">{product.brandName}</span>
            <div className="mt-1">{price}</div>
            <div className="mt-auto pt-3">
              {product.was != null && !options ? (
                <span className={cn("flex h-9 items-center justify-between gap-2 rounded-full px-3.5 text-sm font-semibold", accent)}>
                  {t("youSave", { amount: formatPrice(product.was - product.price, locale) })}
                  <ChevronRight className="flip-rtl size-4 shrink-0" aria-hidden />
                </span>
              ) : (
                <Link href={`/search?brand=${product.brand}`} className={cn("flex h-9 items-center justify-between gap-2 rounded-full px-3.5 text-sm font-semibold hover:brightness-95", accent)}>
                  <span className="truncate">{t("moreFrom", { brand: product.brandName })}</span>
                  <ChevronRight className="flip-rtl size-4 shrink-0" aria-hidden />
                </Link>
              )}
            </div>
          </>
        ) : (
          <>
            <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-500">{product.brandName}</span>
            <Link href={href} className="line-clamp-2 min-h-10 text-sm leading-5 text-ink-900 hover:text-brand-700">
              {tr(product.name, locale)}
            </Link>
            <div className="mt-1">{price}</div>
            {options > 0 && <span className="text-xs font-semibold text-brand-700">{t("optionsAvailable", { count: options })}</span>}
            <div className="mt-auto pt-3">
              <CartControl slug={product.slug} hasOptions={options > 0} soldOut={soldOut} />
            </div>
          </>
        )}
      </div>
    </article>
  );
}
