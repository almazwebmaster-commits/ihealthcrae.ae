"use client";

import { ChevronRight, Heart } from "lucide-react";
import { useId, useState } from "react";
import { CategoryIcon } from "@/components/catalog/CategoryIcon";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

export type CategoryTab = { slug: string; name: string; products: Product[] };

/**
 * "Shop by category": a row of tabs ("For you" plus each category, shown with a product photo)
 * over that tab's products. All tabs' products arrive with the page, so switching is instant.
 */
export function CategoryTabs({
  forYou,
  tabs,
  labels,
}: {
  forYou: Product[];
  tabs: CategoryTab[];
  labels: { title: string; subtitle: string; forYou: string; viewAll: string };
}) {
  const all: CategoryTab[] = [{ slug: "", name: labels.forYou, products: forYou }, ...tabs.filter((t) => t.products.length)];
  const [active, setActive] = useState(0);
  const id = useId();
  const current = all[active] ?? all[0];
  if (!current?.products.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">{labels.title}</h2>
          <p className="mt-0.5 text-sm text-ink-600">{labels.subtitle}</p>
        </div>
        {/* Same pill as the product rails' "See all" */}
        <Link
          href="/categories"
          className="group inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-brand-50 px-3.5 text-sm font-semibold text-brand-800 hover:bg-brand-100"
        >
          {labels.viewAll}
          <ChevronRight className="flip-rtl size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden />
        </Link>
      </div>

      <div role="tablist" aria-label={labels.title} className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        {all.map((tab, i) => {
          const selected = i === active;
          const photo = tab.products.find((p) => p.images.length);
          return (
            <button
              key={tab.slug || "for-you"}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              onClick={() => setActive(i)}
              className={cn(
                "flex w-28 shrink-0 flex-col items-center gap-2 border-b-[3px] px-2 pb-3 pt-2 text-center",
                selected ? "border-brand-600 bg-gradient-to-b from-transparent to-brand-50/70" : "border-transparent hover:bg-surface-sunken/60",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-16 items-center justify-center overflow-hidden rounded-2xl border-2 bg-white",
                  selected ? "border-brand-600" : "border-line",
                )}
              >
                {tab.slug === "" ? (
                  <Heart className="size-8 fill-sale text-sale" aria-hidden />
                ) : photo ? (
                  <ProductVisual product={photo} sizes="64px" className="size-full bg-white" />
                ) : (
                  <CategoryIcon slug={tab.slug} className="size-7 text-brand-600" aria-hidden />
                )}
              </span>
              <span className={cn("line-clamp-2 text-xs leading-4", selected ? "font-bold text-brand-800" : "font-medium text-ink-700")}>{tab.name}</span>
            </button>
          );
        })}
      </div>

      <ul id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} className="no-scrollbar -mx-4 mt-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0">
        {current.products.map((p) => (
          <li key={p.slug} className="w-[44%] shrink-0 snap-start sm:w-56">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
