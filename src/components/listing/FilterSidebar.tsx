import { SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Category, ProductPage, ProductQuery } from "@/lib/catalog-types";
import { Link } from "@/i18n/navigation";
import { formatPrice, tr } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line px-4 py-4 last:border-b-0">
      <legend className="sr-only">{title}</legend>
      <h3 aria-hidden className="mb-2.5 text-xs font-bold uppercase tracking-wider text-ink-900">
        {title}
      </h3>
      {children}
    </fieldset>
  );
}

const check =
  "size-4 shrink-0 rounded-xs border-line-strong accent-brand-600";

export function FilterSidebar({
  action,
  query,
  facets,
  category,
  activeSlug,
  keep,
  resetHref,
  lockSubscribe,
  lockMultibuy,
}: {
  action: string;
  resetHref: string;
  /** Hide filters already fixed by the route */
  lockSubscribe?: boolean;
  lockMultibuy?: boolean;
  query: ProductQuery;
  facets: ProductPage["facets"];
  category?: Category;
  activeSlug?: string;
  /** Params to carry through (e.g. q, sort) */
  keep: [string, string][];
}) {
  const t = useTranslations("Listing");
  const locale = useLocale();

  const body = (
    <form action={action}>
      {keep.map(([k, v], i) => (
        <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
      ))}

      {category && (
        <Section title={t("category")}>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link
                href={`/c/${category.slug}`}
                className={cn("hover:text-brand-700", activeSlug === category.slug ? "font-bold text-brand-700" : "text-ink-700")}
              >
                {t("allIn", { name: tr(category.name, locale) })}
              </Link>
            </li>
            {category.children.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/c/${s.slug}`}
                  className={cn("block ps-3 hover:text-brand-700", activeSlug === s.slug ? "font-bold text-brand-700" : "text-ink-700")}
                >
                  {tr(s.name, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {facets.brands.length > 0 && (
        <Section title={t("brand")}>
          <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
            {facets.brands.map((b) => (
              <li key={b.slug}>
                <label className="flex cursor-pointer items-center gap-2 text-ink-800">
                  <input
                    type="checkbox"
                    name="brand"
                    value={b.slug}
                    defaultChecked={query.brands?.includes(b.slug)}
                    className={check}
                  />
                  <span dir="ltr" className="flex-1">{b.name}</span>
                  <span className="text-xs text-ink-500">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={t("price")}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            name="min"
            min={0}
            inputMode="numeric"
            aria-label={t("min")}
            placeholder={String(facets.price.min)}
            defaultValue={query.min}
            className="h-9"
          />
          <span className="text-ink-400">–</span>
          <Input
            type="number"
            name="max"
            min={0}
            inputMode="numeric"
            aria-label={t("max")}
            placeholder={String(facets.price.max)}
            defaultValue={query.max}
            className="h-9"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-ink-500">
          {formatPrice(facets.price.min, locale)} – {formatPrice(facets.price.max, locale)}
        </p>
      </Section>

      <Section title={t("rating")}>
        <div className="space-y-2 text-sm">
          {[4.5, 4, 0].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-ink-800">
              <input
                type="radio"
                name="rating"
                value={r || ""}
                defaultChecked={(query.rating ?? 0) === r}
                className={check}
              />
              {r ? t("ratingUp", { rating: r }) : t("any")}
            </label>
          ))}
        </div>
      </Section>

      <Section title={t("availability")}>
        <div className="space-y-2 text-sm">
          {!lockSubscribe && (
            <label className="flex cursor-pointer items-center gap-2 text-ink-800">
              <input type="checkbox" name="sns" value="1" defaultChecked={query.subscribable} className={check} />
              {t("subscribable")}
            </label>
          )}
          {!lockMultibuy && (
            <label className="flex cursor-pointer items-center gap-2 text-ink-800">
              <input type="checkbox" name="multi" value="1" defaultChecked={query.multibuy} className={check} />
              {t("multibuy")}
            </label>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-ink-800">
            <input type="checkbox" name="sale" value="1" defaultChecked={query.sale} className={check} />
            {t("onSale")}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-ink-800">
            <input type="checkbox" name="stock" value="1" defaultChecked={query.inStock} className={check} />
            {t("inStock")}
          </label>
        </div>
      </Section>

      <div className="flex gap-2 p-4">
        <Button type="submit" variant="primary" className="flex-1">
          {t("apply")}
        </Button>
        <Link href={resetHref} className="inline-flex h-10 items-center px-2 text-sm font-semibold text-ink-600 hover:text-ink-900">
          {t("reset")}
        </Link>
      </div>
    </form>
  );

  return (
    <>
      {/* Mobile: collapsible */}
      <details className="group rounded-sm border border-line bg-white lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold">
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("filters")}
        </summary>
        <div className="border-t border-line">{body}</div>
      </details>
      {/* Desktop: sidebar */}
      <aside aria-label={t("filters")} className="hidden self-start rounded-sm border border-line bg-white lg:sticky lg:top-40 lg:block">
        <h2 className="flex items-center gap-2 border-b border-line px-4 py-3 text-sm font-bold">
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("filters")}
        </h2>
        {body}
      </aside>
    </>
  );
}
