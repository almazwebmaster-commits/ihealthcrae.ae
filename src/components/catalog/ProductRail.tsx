"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { Children, useRef } from "react";
import { Box } from "@/components/ui/Box";
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
    "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-sm border border-line-strong bg-white/95 text-ink-800 shadow-pop hover:bg-white md:inline-flex";

  return (
    <Box className={className}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 className="text-base font-bold text-ink-900 sm:text-lg">{title}</h2>
          {aside}
        </div>
        {href && viewAllLabel && (
          <Link href={href} className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">
            {viewAllLabel}
          </Link>
        )}
      </div>
      <div className="relative">
        <button type="button" aria-label={prevLabel} onClick={() => scroll(false)} className={cn(arrow, "start-2")}>
          {rtl ? <ChevronRight className="size-5" aria-hidden /> : <ChevronLeft className="size-5" aria-hidden />}
        </button>
        <div ref={track} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth p-4">
          {Children.map(children, (child) => (
            <div className="w-[calc(50%-0.375rem)] shrink-0 snap-start sm:w-52">{child}</div>
          ))}
        </div>
        <button type="button" aria-label={nextLabel} onClick={() => scroll(true)} className={cn(arrow, "end-2")}>
          {rtl ? <ChevronLeft className="size-5" aria-hidden /> : <ChevronRight className="size-5" aria-hidden />}
        </button>
      </div>
    </Box>
  );
}
