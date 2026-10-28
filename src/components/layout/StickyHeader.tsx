"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const REVEAL_AFTER = 160; // px scrolled before the category bar may hide

/**
 * Pins the header. The category bar (passed as `bar`) slides away behind the
 * header while scrolling down and returns on any scroll up.
 */
export function StickyHeader({ header, bar }: { header: React.ReactNode; bar: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > REVEAL_AFTER);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <div className="relative z-10">{header}</div>
      <div
        inert={hidden}
        className={cn(
          "relative transition-[translate,opacity] duration-300",
          hidden && "pointer-events-none -translate-y-full opacity-0",
        )}
      >
        {bar}
      </div>
    </header>
  );
}
