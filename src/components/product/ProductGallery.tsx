"use client";

import { useState } from "react";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import type { Product } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

type GalleryProduct = Pick<Product, "brandName" | "category" | "categoryTint" | "images">;

export function ProductGallery({ product, viewLabel }: { product: GalleryProduct; viewLabel: string }) {
  const [active, setActive] = useState(0);
  // Real photos when available; otherwise four placeholder variations.
  const views = product.images.length ? product.images.map((_, i) => i) : [0, 1, 2, 3];

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {views.length > 1 && (
        <div className="flex gap-2 sm:flex-col" role="tablist" aria-label={viewLabel}>
          {views.map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={active === v}
              aria-label={`${viewLabel} ${v + 1}`}
              onClick={() => setActive(v)}
              onMouseEnter={() => setActive(v)}
              className={cn(
                "w-16 overflow-hidden rounded-sm border-2 bg-white",
                active === v ? "border-brand-600" : "border-line hover:border-ink-400",
              )}
            >
              <ProductVisual product={product} index={v} sizes="64px" />
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-hidden rounded-sm border border-line bg-white" role="tabpanel">
        <ProductVisual product={product} index={active} sizes="(min-width: 1024px) 520px, 100vw" priority />
      </div>
    </div>
  );
}
