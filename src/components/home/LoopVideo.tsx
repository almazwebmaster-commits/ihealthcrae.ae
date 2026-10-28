"use client";

import { useEffect, useRef } from "react";

/**
 * Silent looping background clip. React doesn't put `muted` in server-rendered HTML, and browsers
 * only autoplay muted video, so it is set and started here. Hidden for visitors who reduce motion
 * (whatever is underneath, the photo or poster, shows instead).
 */
export function LoopVideo({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.muted = true;
    el.play().catch(() => {
      // Autoplay refused (e.g. battery saver): the poster stays.
    });
  }, []);

  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-hidden className={className} />;
}
