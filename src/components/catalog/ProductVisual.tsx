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
  // Packshots are square (uploads are made 1200×1200); anything else is a lifestyle photo that fills the tile.
  const lifestyle = Math.abs(image.width / image.height - 1) > 0.1;

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
        className={lifestyle ? "object-cover" : "object-contain mix-blend-multiply"}
      />
    </div>
  );
}
