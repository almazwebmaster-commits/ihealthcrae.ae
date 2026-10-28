"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import type { Product } from "@/lib/catalog-types";
import { playerVideo } from "@/lib/cloudinary-video";
import { cn } from "@/lib/utils";

type GalleryProduct = Pick<Product, "brandName" | "category" | "categoryTint" | "images" | "video">;

export function ProductGallery({ product, viewLabel, videoLabel }: { product: GalleryProduct; viewLabel: string; videoLabel: string }) {
  const [active, setActive] = useState(0);
  // Real photos when available; otherwise four placeholder variations. The video, if any, comes last.
  const views = product.images.length ? product.images.map((_, i) => i) : [0, 1, 2, 3];
  const video = product.video ? playerVideo(product.video) : null;
  const videoIndex = views.length;
  const showingVideo = video && active === videoIndex;

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {views.length + (video ? 1 : 0) > 1 && (
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
                "w-16 overflow-hidden rounded-lg border-2 bg-white",
                active === v ? "border-brand-600" : "border-line hover:border-ink-400",
              )}
            >
              <ProductVisual product={product} index={v} sizes="64px" />
            </button>
          ))}
          {video && (
            <button
              type="button"
              role="tab"
              aria-selected={showingVideo ? true : false}
              aria-label={videoLabel}
              onClick={() => setActive(videoIndex)}
              className={cn(
                "relative aspect-square w-16 overflow-hidden rounded-lg border-2 bg-ink-900",
                showingVideo ? "border-brand-600" : "border-line hover:border-ink-400",
              )}
            >
              <Image src={video.poster} alt="" fill sizes="64px" className="object-cover opacity-80" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-ink-900">
                  <Play className="ms-0.5 size-3.5 fill-current" aria-hidden />
                </span>
              </span>
            </button>
          )}
        </div>
      )}
      <div className="flex-1 overflow-hidden rounded-2xl bg-white shadow-box" role="tabpanel">
        {showingVideo ? (
          // Loads only once shown; plays with sound and controls (no autoplay).
          <video
            key={video.video}
            src={video.video}
            poster={video.poster}
            controls
            playsInline
            preload="metadata"
            aria-label={videoLabel}
            className="aspect-square w-full bg-ink-900 object-contain"
          />
        ) : (
          <ProductVisual product={product} index={active} sizes="(min-width: 1024px) 520px, 100vw" priority />
        )}
      </div>
    </div>
  );
}
