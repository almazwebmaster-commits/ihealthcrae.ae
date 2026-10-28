"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { Children, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function ProductRail({
  title,
  href,
  viewAllLabel,
  prevLabel,
  nextLabel,
  aside,
  children,
  className,
}: {
  title: React.ReactNode;
  href?: string;
  viewAllLabel?: string;
  prevLabel: string;
  nextLabel: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const rtl = useLocale() === "ar";

  // "forward" follows reading direction: right in LTR, left in RTL.
  const scroll = (forward: boolean) => {
    const el = track.current;
    if (!el) return;
    const distance = el.clientWidth * 0.85 * (forward ? 1 : -1) * (rtl ? -1 : 1);
    el.scrollBy({ left: distance, behavior: "smooth" });
  };

  const arrow =
    "absolute top-[38%] z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-800 shadow-pop hover:text-brand-700 md:inline-flex";

  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">{title}</h2>
          {aside}
        </div>
        {href && viewAllLabel && (
          <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            {viewAllLabel}
            <ChevronRight className="flip-rtl size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>
      <div className="relative">
        <button type="button" aria-label={prevLabel} onClick={() => scroll(false)} className={cn(arrow, "-start-3")}>
          {rtl ? <ChevronRight className="size-5" aria-hidden /> : <ChevronLeft className="size-5" aria-hidden />}
        </button>
        <div ref={track} className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2 pt-1">
          {Children.map(children, (child) => (
            <div className="w-[calc(50%-0.5rem)] shrink-0 snap-start sm:w-56">{child}</div>
          ))}
        </div>
        <button type="button" aria-label={nextLabel} onClick={() => scroll(true)} className={cn(arrow, "-end-3")}>
          {rtl ? <ChevronLeft className="size-5" aria-hidden /> : <ChevronRight className="size-5" aria-hidden />}
        </button>
      </div>
    </section>
  );
}
