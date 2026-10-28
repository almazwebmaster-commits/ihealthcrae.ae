"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";
import { playerVideo } from "@/lib/cloudinary-video";

/**
 * "Product videos" section: a wide player with the brand and product name over the still frame and
 * a large play button. Nothing downloads until the shopper presses play; then it plays with sound
 * and the browser's own controls (seek, volume, fullscreen).
 */
export function ProductVideos({
  src,
  brand,
  name,
  labels,
}: {
  src: string;
  brand: string;
  name: string;
  labels: { title: string; play: string };
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const video = playerVideo(src);

  function start() {
    setStarted(true);
    ref.current?.play().catch(() => {});
  }

  return (
    <section aria-labelledby="product-videos">
      <h2 id="product-videos" className="mb-3 text-xl font-extrabold text-ink-900">
        {labels.title}
      </h2>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink-950">
        <video
          ref={ref}
          src={video.video}
          poster={video.poster}
          controls={started}
          playsInline
          preload="none"
          aria-label={`${brand} · ${name}`}
          className="size-full object-contain"
        />
        {!started && (
          <button type="button" onClick={start} aria-label={`${labels.play}: ${name}`} className="group absolute inset-0 text-start">
            {/* Darkened top and bottom edges keep the white text readable on any frame */}
            <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-transparent to-ink-950/40" />
            <span className="absolute start-5 top-4 max-w-[80%] text-white sm:start-6 sm:top-5">
              <span className="block text-sm font-extrabold sm:text-base" dir="ltr">
                {brand}
              </span>
              <span className="mt-0.5 line-clamp-1 block text-xs text-white/90 sm:text-sm">{name}</span>
            </span>
            <span
              aria-hidden
              className="absolute inset-0 m-auto inline-flex size-16 items-center justify-center rounded-full border-2 border-white bg-ink-950/30 text-white transition-transform group-hover:scale-110 sm:size-20"
            >
              <Play className="ms-1 size-7 fill-current sm:size-8" />
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
