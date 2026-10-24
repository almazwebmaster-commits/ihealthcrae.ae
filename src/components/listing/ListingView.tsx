import { PackageSearch, X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ProductCard } from "@/components/catalog/ProductCard";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { sortKeys, type Category, type ProductQuery } from "@/lib/catalog-types";
import { formatNumber, formatPrice } from "@/lib/i18n-utils";
import { buildQuery, parseListingParams, withoutValue, type SearchParams } from "@/lib/listing";
import { cn } from "@/lib/utils";
import { getBrands, queryProducts } from "@/server/catalog";
import { FilterSidebar } from "./FilterSidebar";
import { SortSelect } from "./SortSelect";

const pairs = (sp: SearchParams, omit: string[]) =>
  Object.entries(sp).flatMap(([k, v]) =>
    omit.includes(k) || v == null ? [] : (Array.isArray(v) ? v : [v]).map((x) => [k, x] as [string, string]),
  );

/** Shared listing page: breadcrumbs, filters, sort, product grid, pagination. */
export async function ListingView({
  basePath,
  title,
  subtitle,
  breadcrumbs,
  searchParams,
  fixed,
  category,
  activeSlug,
}: {
  basePath: string;
  title: string;
  subtitle?: string;
  breadcrumbs: { label: string; href?: string }[];
  searchParams: SearchParams;
  /** Constraints set by the route itself (category, tag) */
  fixed: Pick<ProductQuery, "category" | "tag" | "subscribable" | "multibuy">;
  category?: Category;
  activeSlug?: string;
}) {
  const locale = await getLocale();
  const t = await getTranslations("Listing");
  const query = parseListingParams(searchParams);
  const [result, brands] = await Promise.all([queryProducts({ ...query, ...fixed }), getBrands()]);
  const action = `/${locale}${basePath}`;
  const brandName = new Map(brands.map((b) => [b.slug, b.name]));

  // Active filter chips
  const chips: { label: string; href: string }[] = [
    ...(query.brands ?? []).map((b) => ({ label: brandName.get(b) ?? b, href: withoutValue(searchParams, "brand", b) })),
    ...(query.min != null ? [{ label: `≥ ${formatPrice(query.min, locale)}`, href: buildQuery(searchParams, { min: null, page: null }) }] : []),
    ...(query.max != null ? [{ label: `≤ ${formatPrice(query.max, locale)}`, href: buildQuery(searchParams, { max: null, page: null }) }] : []),
    ...(query.rating ? [{ label: t("ratingUp", { rating: query.rating }), href: buildQuery(searchParams, { rating: null, page: null }) }] : []),
    ...(query.sale ? [{ label: t("onSale"), href: buildQuery(searchParams, { sale: null, page: null }) }] : []),
    ...(query.inStock ? [{ label: t("inStock"), href: buildQuery(searchParams, { stock: null, page: null }) }] : []),
    ...(query.subscribable && !fixed.subscribable ? [{ label: t("subscribable"), href: buildQuery(searchParams, { sns: null, page: null }) }] : []),
    ...(query.multibuy && !fixed.multibuy ? [{ label: t("multibuy"), href: buildQuery(searchParams, { multi: null, page: null }) }] : []),
  ];
  const resetHref = basePath + buildQuery(query.q ? { q: query.q } : {});

  return (
    <div className="container-site space-y-4 py-4">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-sm border border-line bg-white px-4 py-3">
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 sm:text-2xl">{title}</h1>
          <p className="mt-0.5 text-sm text-ink-600">
            {subtitle ? `${subtitle} · ` : ""}
            {t("results", { count: result.total, formatted: formatNumber(result.total, locale) })}
          </p>
        </div>
        <SortSelect
          action={action}
          hidden={pairs(searchParams, ["sort", "page"])}
          value={query.sort ?? "featured"}
          options={sortKeys.map((k) => ({ value: k, label: t(`sort.${k}`) }))}
          label={t("sortBy")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <FilterSidebar
          action={action}
          query={query}
          facets={result.facets}
          category={category}
          activeSlug={activeSlug}
          keep={pairs(searchParams, ["brand", "min", "max", "rating", "sale", "stock", "sns", "multi", "page"])}
          resetHref={resetHref}
          lockSubscribe={fixed.subscribable}
          lockMultibuy={fixed.multibuy}
        />

        <div className="min-w-0 space-y-4">
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <Link
                  key={c.label}
                  href={basePath + c.href}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 hover:border-brand-400"
                >
                  {c.label}
                  <X className="size-3" aria-label={t("remove")} />
                </Link>
              ))}
              <Link href={resetHref} className="text-xs font-semibold text-ink-600 underline hover:text-ink-900">
                {t("clearAll")}
              </Link>
            </div>
          )}

          {result.items.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {result.items.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center rounded-sm border border-line bg-white px-6 py-16 text-center">
              <PackageSearch className="size-12 text-ink-300" aria-hidden />
              <h2 className="mt-3 text-lg font-bold">{t("emptyTitle")}</h2>
              <p className="mt-1 text-sm text-ink-600">{t("emptyBody")}</p>
              <Link href={resetHref} className={buttonClass("primary", "md", "mt-5")}>
                {t("clearAll")}
              </Link>
            </div>
          )}

          {result.pages > 1 && (
            <nav aria-label={t("pagination")} className="flex justify-center gap-1">
              {Array.from({ length: result.pages }).map((_, i) => {
                const n = i + 1;
                return (
                  <Link
                    key={n}
                    href={basePath + buildQuery(searchParams, { page: n === 1 ? null : String(n) })}
                    aria-current={n === result.page ? "page" : undefined}
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-sm border text-sm font-semibold",
                      n === result.page
                        ? "border-brand-700 bg-brand-700 text-white"
                        : "border-line-strong bg-white text-ink-800 hover:border-ink-400",
                    )}
                  >
                    {n}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
