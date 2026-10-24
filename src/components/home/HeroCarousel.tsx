"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { categoryIcons } from "@/components/catalog/category-icons";
import { buttonClass } from "@/components/ui/Button";
import type { HeroTheme } from "@/data/home";
import { Link } from "@/i18n/navigation";
import type { SlotImage } from "@/lib/images";
import { cn } from "@/lib/utils";

export type HeroSlideView = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  theme: HeroTheme;
  category: string;
  /** 21:9, shown from md up */
  desktopImage?: SlotImage;
  /** Arabic composition (subject on the left). Without it, Arabic desktop shows the fallback design. */
  desktopImageRtl?: SlotImage;
  /** 4:5, shown below md */
  mobileImage?: SlotImage;
};

const themes: Record<HeroTheme, { bg: string; text: string; sub: string; tile: string; dot: string; cta: "accent" | "dark" }> = {
  teal: { bg: "bg-brand-700", text: "text-white", sub: "text-brand-100", tile: "bg-white", dot: "bg-accent-500", cta: "accent" },
  rose: { bg: "bg-rose-700", text: "text-white", sub: "text-rose-100", tile: "bg-white", dot: "bg-accent-400", cta: "accent" },
  ink: { bg: "bg-ink-900", text: "text-white", sub: "text-ink-300", tile: "bg-brand-400", dot: "bg-accent-500", cta: "accent" },
  amber: { bg: "bg-accent-500", text: "text-ink-900", sub: "text-ink-800", tile: "bg-white", dot: "bg-brand-700", cta: "dark" },
};

const INTERVAL = 6000;
const SWIPE_MIN = 40; // px of horizontal travel before a drag counts as a swipe

export function HeroCarousel({
  slides,
  prevLabel,
  nextLabel,
  goToLabel,
}: {
  slides: HeroSlideView[];
  prevLabel: string;
  nextLabel: string;
  goToLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const rtl = useLocale() === "ar";
  const go = (i: number) => setIndex((i + slides.length) % slides.length);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  // Restarts on every slide change, so a manual tap/swipe always gets a full interval.
  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % slides.length), INTERVAL);
    return () => clearTimeout(id);
  }, [paused, index, slides.length]);

  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    swiped.current = true;
    // Swiping toward the reading start advances: leftwards in LTR, rightwards in RTL.
    const forward = rtl ? dx > 0 : dx < 0;
    go(index + (forward ? 1 : -1));
  };

  const arrow =
    "pointer-events-auto inline-flex size-11 items-center justify-center rounded-sm bg-white/90 text-ink-900 shadow-pop hover:bg-white active:bg-white";

  return (
    <section
      aria-roledescription="carousel"
      className="relative aspect-[4/5] touch-pan-y select-none overflow-hidden rounded-sm md:aspect-[21/9]"
      // Hover-pause is for mouse only: on iPad a "hover" from a tap can swallow the tap itself.
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        swipe.current = { x: e.clientX, y: e.clientY };
        swiped.current = false;
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipe.current = null)}
      // A swipe that ends over the CTA must not also follow the link.
      onClickCapture={(e) => {
        if (swiped.current) {
          e.preventDefault();
          e.stopPropagation();
          swiped.current = false;
        }
      }}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(${(rtl ? 1 : -1) * index * 100}%)` }}
      >
        {slides.map((s, i) => {
          const th = themes[s.theme];
          const Icon = categoryIcons[s.category];
          const desktop = rtl ? s.desktopImageRtl : s.desktopImage;
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-hidden={i !== index}
              inert={i !== index}
              className={cn("relative flex h-full w-full shrink-0 items-center overflow-hidden", th.bg, th.text)}
            >
              {/* Desktop: each direction needs its own composition. Images are never mirrored
                  automatically — product packaging text would read backwards. */}
              {desktop && (
                <Image
                  src={desktop.src}
                  alt=""
                  fill
                  draggable={false}
                  sizes="(min-width: 1024px) 924px, 100vw"
                  priority={i === 0}
                  className="hidden object-cover md:block"
                />
              )}
              {/* Mobile: headline on top, subject below — identical in both directions, never mirrored. */}
              {s.mobileImage && (
                <Image
                  src={s.mobileImage.src}
                  alt=""
                  fill
                  draggable={false}
                  sizes="100vw"
                  priority={i === 0}
                  className="object-cover object-bottom md:hidden"
                />
              )}

              {/* Decorative mosaic — fallback until the slot has a photo */}
              <div
                aria-hidden
                className={cn(
                  "absolute inset-y-0 end-0 hidden w-1/2 items-center justify-center",
                  !desktop && "md:flex",
                )}
              >
                <div className="grid grid-cols-3 gap-3 opacity-95">
                  {Array.from({ length: 9 }).map((_, k) => (
                    <span
                      key={k}
                      className={cn(
                        "flex size-20 items-center justify-center rounded-sm lg:size-24",
                        k === 4 ? th.dot : k % 2 ? `${th.tile} opacity-20` : `${th.tile} opacity-10`,
                      )}
                    >
                      {k === 4 && <Icon className="size-12 text-white" strokeWidth={1.5} />}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className={cn(
                  "relative max-w-xl px-6 py-10 sm:px-12",
                  // Keep copy inside the image's empty 45% (top 45% on mobile)
                  desktop && "md:max-w-[42%] md:pe-0",
                  s.mobileImage && "max-md:self-start max-md:pt-8",
                )}
              >
                <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">{s.title}</h2>
                <p className={cn("mt-3 text-base sm:text-lg", th.sub)}>{s.subtitle}</p>
                <Link href={s.href} draggable={false} className={buttonClass(th.cta, "lg", "mt-6")}>
                  {s.cta}
                  <ArrowRight className="flip-rtl size-4" aria-hidden />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrows sit in the bottom corner, clear of the headline (44px touch targets) */}
      <div className="pointer-events-none absolute bottom-3 end-3 z-10 hidden gap-1.5 sm:flex">
        <button type="button" aria-label={prevLabel} onClick={() => go(index - 1)} className={arrow}>
          {rtl ? <ChevronRight className="size-5" aria-hidden /> : <ChevronLeft className="size-5" aria-hidden />}
        </button>
        <button type="button" aria-label={nextLabel} onClick={() => go(index + 1)} className={arrow}>
          {rtl ? <ChevronLeft className="size-5" aria-hidden /> : <ChevronRight className="size-5" aria-hidden />}
        </button>
      </div>

      {/* Dots: thin bars visually, but each button is a 44px-tall touch target */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`${goToLabel} ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className="group pointer-events-auto flex h-11 min-w-8 items-center justify-center px-1"
          >
            <span
              className={cn(
                "block h-1.5 rounded-xs transition-all",
                i === index ? "w-8 bg-white" : "w-3 bg-white/50 group-hover:bg-white/80",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
