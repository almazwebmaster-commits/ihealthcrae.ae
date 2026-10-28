"use client";

import { Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Ad video: plays muted on a loop only while at least half of it is on screen, with a sound toggle.
 * Visitors who reduce motion get the still frame and a play button instead of autoplay.
 */
export function AdVideo({
  src,
  poster,
  labels,
}: {
  src: string;
  poster: string;
  labels: { soundOn: string; soundOff: string; play: string };
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const button =
    "absolute bottom-3 end-3 inline-flex size-11 items-center justify-center rounded-full bg-ink-950/60 text-white backdrop-blur hover:bg-ink-950/80";

  return (
    <div className="relative size-full bg-ink-900">
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="size-full object-cover"
      />
      {/* Reduced motion, not started yet: a play button instead of the sound toggle */}
      {!playing && (
        <button
          type="button"
          aria-label={labels.play}
          className={cn(button, "motion-safe:hidden")}
          onClick={() => ref.current?.play().catch(() => {})}
        >
          <Play className="ms-0.5 size-5 fill-current" aria-hidden />
        </button>
      )}
      <button
        type="button"
        aria-label={muted ? labels.soundOn : labels.soundOff}
        aria-pressed={!muted}
        className={cn(button, !playing && "motion-reduce:hidden")}
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          el.muted = !muted;
          setMuted(!muted);
          if (el.paused) el.play().catch(() => {});
        }}
      >
        {muted ? (
          <VolumeX className="size-5" aria-hidden />
        ) : (
          <Volume2 className="size-5" aria-hidden />
        )}
      </button>
    </div>
  );
}
