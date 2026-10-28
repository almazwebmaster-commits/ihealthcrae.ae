import Image from "next/image";
import type { Product } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";
import { ProductArt, type ArtProduct } from "./ProductArt";

/** Real packshot when the product has photos, otherwise the drawn placeholder. */
export function ProductVisual({
  product,
  index = 0,
  sizes = "(min-width: 640px) 208px, 50vw",
  priority,
  className,
}: {
  product: ArtProduct & Pick<Product, "images">;
  /** Which photo (or placeholder variation) to show */
  index?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const image = product.images[index];
  if (!image) return <ProductArt product={product} view={index} className={className} />;

  return (
    <div className={cn("relative aspect-square overflow-hidden bg-white", className)}>
      <Image
        src={image.url}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        draggable={false}
        // multiply lets white packshot backgrounds take on the tile colour
        className="object-contain mix-blend-multiply"
      />
    </div>
  );
}
