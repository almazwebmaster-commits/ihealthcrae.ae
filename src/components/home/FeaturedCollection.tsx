import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/catalog-types";
import { collectionStyles } from "@/lib/collection-styles";
import type { HomeContent } from "@/lib/home-content";
import { tr } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";

/** "Featured" collection: a full-width tinted band with a badge, a product row and View all. */
export function FeaturedCollection({ collection: c, products }: { collection: HomeContent["collections"][number]; products: Product[] }) {
  const t = useTranslations("Home");
  const locale = useLocale();
  if (!products.length) return null;
  const s = collectionStyles[c.tint];
  const badge = tr({ en: c.badgeEn, ar: c.badgeAr }, locale);
  const subtitle = tr({ en: c.subtitleEn, ar: c.subtitleAr }, locale);
  return (
    // Bleeds to the screen edges on phones; a rounded band inside the page on larger screens
    <section className={cn("-mx-4 px-4 py-6 sm:mx-0 sm:rounded-3xl sm:px-6 lg:px-8", s.band)}>
      {badge && <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider", s.badge)}>{badge}</span>}
      <h2 className="mt-2 text-xl font-extrabold text-ink-900 sm:text-2xl">{tr({ en: c.titleEn, ar: c.titleAr }, locale)}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-ink-600">{subtitle}</p>}
      <ul className="no-scrollbar -mx-4 mt-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:gap-4 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8">
        {products.map((p) => (
          <li key={p.slug} className="w-60 shrink-0 snap-start sm:w-64">
            <ProductCard product={p} variant="featured" accent={s.pill} />
          </li>
        ))}
      </ul>
      <Link
        href={`/c/${c.category}`}
        className="mt-4 flex h-12 items-center justify-center gap-1 rounded-2xl bg-white text-sm font-bold text-ink-900 shadow-box hover:shadow-card"
      >
        {t("viewAll")}
        <ChevronRight className="flip-rtl size-4" aria-hidden />
      </Link>
    </section>
  );
}
