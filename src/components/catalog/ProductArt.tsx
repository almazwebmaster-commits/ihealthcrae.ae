import type { Product } from "@/lib/catalog-types";
import { tintClasses } from "@/lib/tints";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";

export type ArtProduct = Pick<Product, "brandName" | "category" | "categoryTint">;

/**
 * Placeholder packshot drawn from the product's brand and category —
 * used until a product has real photos (see ProductVisual).
 */
export function ProductArt({
  product,
  view = 0,
  className,
}: {
  product: ArtProduct;
  view?: number;
  className?: string;
}) {
  const tint = tintClasses(product.categoryTint);

  if (view === 2) {
    return (
      <div className={cn("@container relative flex aspect-square items-center justify-center overflow-hidden", tint.bg, className)}>
        <CategoryIcon slug={product.category} className={cn("size-[45cqw]", tint.fg)} strokeWidth={1.25} aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "@container relative flex aspect-square items-center justify-center overflow-hidden",
        tint.bg,
        className,
      )}
    >
      <div
        className={cn(
          "flex aspect-[3/4] w-[52cqw] flex-col overflow-hidden rounded-[1.5cqw] border border-black/5 bg-white shadow-[0_2cqw_5cqw_-2cqw_rgb(14_27_44/0.25)]",
          view === 1 && "-rotate-6",
          view === 3 && "translate-x-[-10cqw] rotate-3",
        )}
      >
        <div className={cn("h-[16%]", tint.solid)} />
        <div className="flex flex-1 flex-col items-center justify-center gap-[3cqw] p-[3cqw] text-center">
          <CategoryIcon slug={product.category} className={cn("size-[16cqw]", tint.fg)} strokeWidth={1.75} aria-hidden />
          <span
            dir="ltr"
            className="line-clamp-2 text-[5.5cqw] font-extrabold uppercase leading-tight tracking-tight text-ink-900"
          >
            {product.brandName}
          </span>
        </div>
        <div className={cn("h-[5%] opacity-40", tint.solid)} />
      </div>
      {view === 3 && (
        <div className="absolute aspect-[3/4] w-[40cqw] translate-x-[18cqw] translate-y-[8cqw] overflow-hidden rounded-[1.5cqw] border border-black/5 bg-white shadow-md">
          <div className={cn("h-[16%]", tint.solid)} />
        </div>
      )}
    </div>
  );
}
