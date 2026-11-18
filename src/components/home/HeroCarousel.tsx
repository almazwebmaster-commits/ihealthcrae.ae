"use client";

import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useRef, useState, useSyncExternalStore } from "react";
import { CategoryIcon } from "@/components/catalog/CategoryIcon";
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
  /** Shown as a small label above the headline on desktop */
  categoryName?: string;
  /** 21:9, shown from md up */
  desktopImage?: SlotImage;
  /** Arabic composition (subject on the left). Without it, Arabic desktop shows the fallback design. */
  desktopImageRtl?: SlotImage;
  /** 4:5, shown below md */
  mobileImage?: SlotImage;
};

const themes: Record<HeroTheme, { bg: string; text: string; sub: string; tile: string; dot: string; cta: "accent" | "dark" | "primary"; light?: boolean }> = {
  teal: { bg: "bg-brand-800", text: "text-white", sub: "text-brand-100", tile: "bg-white", dot: "bg-accent-500", cta: "accent" },
  rose: { bg: "bg-rose-700", text: "text-white", sub: "text-rose-100", tile: "bg-white", dot: "bg-accent-400", cta: "accent" },
  ink: { bg: "bg-ink-900", text: "text-white", sub: "text-ink-300", tile: "bg-brand-400", dot: "bg-accent-500", cta: "accent" },
  amber: { bg: "bg-accent-500", text: "text-ink-900", sub: "text-ink-800", tile: "bg-white", dot: "bg-brand-700", cta: "dark" },
  // For bright lifestyle photos with empty space on the text side: dark text and a green button
  light: { bg: "bg-[#f4f1ea]", text: "text-ink-900", sub: "text-ink-700", tile: "bg-brand-600", dot: "bg-accent-500", cta: "primary", light: true },
};

// Each slide shows for 6.5s: that's the duration in the progress bar's animate-[hero-progress_6500ms_…] class below.
const SWIPE_MIN = 40; // px of horizontal travel before a drag counts as a swipe

/** Staggered fade-up for the slide copy as a slide arrives (no delay when it leaves). */
const revealDelay = ["delay-150", "delay-200", "delay-300", "delay-[400ms]", "delay-500"];
const reveal = (on: boolean, step: number) =>
  cn(
    "transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none",
    on ? cn("translate-y-0 opacity-100", revealDelay[step]) : "translate-y-3 opacity-0",
  );

const noop = () => () => {};

export function HeroCarousel({
  slides,
  prevLabel,
  nextLabel,
  goToLabel,
  trust = [],
}: {
  slides: HeroSlideView[];
  prevLabel: string;
  nextLabel: string;
  goToLabel: string;
  /** Short store promises listed under the button on large screens */
  trust?: string[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const rtl = useLocale() === "ar";
  // False while hydrating, then true: lets the first slide's slow zoom start after load instead of
  // being painted already zoomed in.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const many = slides.length > 1;
  const go = (i: number) => setIndex((i + slides.length) % slides.length);
  // Dark slide indicators on light banners (phones; desktop controls sit in a white pill)
  const lightSlide = !!themes[slides[index]?.theme]?.light;
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

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
    "pointer-events-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-ink-900/[0.07] active:bg-ink-900/10";

  return (
    <section
      aria-roledescription="carousel"
      className="relative aspect-[4/5] touch-pan-y select-none overflow-hidden rounded-2xl md:aspect-[21/9] md:rounded-3xl"
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
        className="flex h-full transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(${(rtl ? 1 : -1) * index * 100}%)` }}
      >
        {slides.map((s, i) => {
          const th = themes[s.theme];
          const active = i === index;
          // Light banners without their own phone photo reuse the desktop photo on phones, cropped towards the subject.
          const phoneFromDesktop = th.light && !s.mobileImage;
          const desktop = rtl ? s.desktopImageRtl : s.desktopImage;
          // Slow "Ken Burns" push-in on the showing slide; snaps back only once it has slid out of view.
          const zoom = cn(
            "transition-transform ease-out motion-reduce:transition-none",
            active && hydrated ? "scale-[1.06] duration-[9000ms]" : "scale-100 duration-0 delay-700",
          );
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-hidden={!active}
              inert={!active}
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
                  sizes="(min-width: 1360px) 1312px, 100vw"
                  priority={i === 0}
                  className={cn("object-cover", zoom, phoneFromDesktop ? "max-md:object-[78%_center]" : "hidden md:block")}
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
                  className={cn("object-cover object-bottom md:hidden", zoom)}
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
                        "flex size-20 items-center justify-center rounded-2xl lg:size-24",
                        k === 4 ? th.dot : k % 2 ? `${th.tile} opacity-20` : `${th.tile} opacity-10`,
                      )}
                    >
                      {k === 4 && <CategoryIcon slug={s.category} className="size-12 text-white" strokeWidth={1.5} />}
                    </span>
                  ))}
                </div>
              </div>

              {/* Desktop: wash the text side of the photo so the headline reads cleanly */}
              {desktop && <div aria-hidden className={cn("absolute inset-0 hidden md:block", th.light ? "hero-scrim-light" : "hero-scrim-dark")} />}
              {phoneFromDesktop && desktop && (
                // Phones: the headline sits over the photo's top; fade it to the banner colour for legibility
                <div aria-hidden className="absolute inset-x-0 top-0 h-3/5 bg-gradient-to-b from-[#f4f1ea] via-[#f4f1ea]/85 to-transparent md:hidden" />
              )}

              <div
                className={cn(
                  "relative max-w-xl px-6 py-10 sm:px-12 lg:px-14 xl:px-16",
                  // Keep copy inside the image's empty side (top 45% on mobile)
                  desktop && "md:max-w-[48%] md:pe-0",
                  (s.mobileImage || (phoneFromDesktop && desktop)) && "max-md:self-start max-md:pt-8",
                )}
              >
                {s.categoryName && (
                  <div className={reveal(active, 0)}>
                    <span
                      className={cn(
                        "mb-5 hidden h-8 items-center gap-1.5 rounded-full ps-1 pe-3.5 text-sm font-bold lg:inline-flex",
                        th.light ? "bg-white/85 text-brand-800 shadow-box ring-1 ring-ink-900/5 backdrop-blur" : "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur",
                      )}
                    >
                      <span className={cn("inline-flex size-6 items-center justify-center rounded-full", th.light ? "bg-brand-50 text-brand-700" : "bg-white/20")}>
                        <CategoryIcon slug={s.category} className="size-3.5" strokeWidth={2.2} aria-hidden />
                      </span>
                      {s.categoryName}
                    </span>
                  </div>
                )}
                <h2
                  className={cn(
                    reveal(active, 1),
                    "text-balance text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl lg:leading-[1.06] lg:tracking-[-0.025em] xl:text-[3.5rem]",
                  )}
                >
                  {s.title}
                </h2>
                <p className={cn(reveal(active, 2), "mt-3 text-base sm:text-lg lg:mt-5 lg:max-w-md lg:text-xl lg:leading-relaxed", th.sub)}>{s.subtitle}</p>
                <div className={reveal(active, 3)}>
                  <Link
                    href={s.href}
                    draggable={false}
                    className={buttonClass(
                      th.cta,
                      "lg",
                      cn("group/cta mt-6 lg:mt-8 lg:h-14 lg:px-8 lg:text-[17px]", th.cta === "primary" && "shadow-[0_10px_24px_-10px_rgb(7_128_110/0.6)]"),
                    )}
                  >
                    {s.cta}
                    <ArrowRight className="flip-rtl size-4 transition-transform group-hover/cta:translate-x-1 rtl:group-hover/cta:-translate-x-1 lg:size-5" aria-hidden />
                  </Link>
                </div>
                {trust.length > 0 && (
                  <ul className={cn(reveal(active, 4), "mt-7 hidden flex-wrap gap-x-5 gap-y-2 text-sm font-semibold lg:flex", th.light ? "text-ink-700" : "text-white/90")}>
                    {trust.map((item) => (
                      <li key={item} className="inline-flex items-center gap-1.5">
                        <span className={cn("inline-flex size-[18px] items-center justify-center rounded-full", th.light ? "bg-brand-600 text-white" : "bg-white text-ink-900")}>
                          <Check className="size-3" strokeWidth={3.2} aria-hidden />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls. Phones: progress bars centred along the bottom edge (each a 44px-tall touch target).
          Desktop: a frosted pill in the bottom corner over the photo, with arrows and a slide counter. */}
      {many && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center",
            "md:pointer-events-auto md:inset-x-auto md:bottom-5 md:end-5 md:gap-1 md:rounded-full md:bg-white/85 md:p-1 md:shadow-pop md:ring-1 md:ring-ink-900/5 md:backdrop-blur-md",
            "lg:bottom-6 lg:end-6",
          )}
        >
          <button type="button" aria-label={prevLabel} onClick={() => go(index - 1)} className={cn(arrow, "hidden md:inline-flex")}>
            {rtl ? <ChevronRight className="size-5" aria-hidden /> : <ChevronLeft className="size-5" aria-hidden />}
          </button>
          <span aria-hidden className="hidden px-1.5 text-xs font-bold tabular-nums text-ink-800 md:block">
            {String(index + 1).padStart(2, "0")}
            <span className="text-ink-400"> / {String(slides.length).padStart(2, "0")}</span>
          </span>
          <div className="flex items-center md:px-1">
            {slides.map((s, i) => {
              const on = i === index;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`${goToLabel} ${i + 1}`}
                  aria-current={on}
                  onClick={() => go(i)}
                  className="group pointer-events-auto flex h-11 items-center px-1 md:h-9"
                >
                  <span
                    className={cn(
                      "relative block h-1.5 overflow-hidden rounded-full transition-[width] duration-300 md:h-1",
                      on ? "w-8 md:w-12" : "w-3 md:w-5",
                      lightSlide ? "bg-ink-900/25 group-hover:bg-ink-900/40" : "bg-white/50 group-hover:bg-white/80",
                      "md:bg-ink-900/15 md:group-hover:bg-ink-900/30",
                    )}
                  >
                    {on && (
                      // The fill is the slideshow timer: hovering or focusing pauses it in place, and its end moves on.
                      // It keeps running under reduced motion (a thin bar filling is not motion that triggers
                      // discomfort) — there the slides just switch instantly, without the slide, zoom or fade.
                      <span
                        key={index}
                        onAnimationEnd={() => go(index + 1)}
                        style={{ animationPlayState: paused ? "paused" : "running" }}
                        className={cn(
                          "absolute inset-0 origin-left animate-[hero-progress_6500ms_linear_forwards] rounded-full rtl:origin-right",
                          lightSlide ? "bg-ink-900" : "bg-white",
                          "md:bg-brand-600",
                        )}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <button type="button" aria-label={nextLabel} onClick={() => go(index + 1)} className={cn(arrow, "hidden md:inline-flex")}>
            {rtl ? <ChevronLeft className="size-5" aria-hidden /> : <ChevronRight className="size-5" aria-hidden />}
          </button>
        </div>
      )}
    </section>
  );
}
