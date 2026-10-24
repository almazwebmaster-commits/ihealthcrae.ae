"use client";

import { ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string };

export function MobileMenu({
  items,
  menuLabel,
  closeLabel,
}: {
  items: Item[];
  menuLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-sm text-white hover:bg-white/10 lg:hidden"
      >
        <Menu className="size-6" aria-hidden />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-ink-950/60 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <nav
        aria-label={menuLabel}
        className={cn(
          // `invisible` when closed so the off-screen drawer can't be tapped or widen the page
          "fixed inset-y-0 start-0 z-50 flex w-80 max-w-[85vw] flex-col bg-white transition-[translate,visibility] duration-300 lg:hidden",
          open
            ? "visible translate-x-0"
            : "invisible -translate-x-full rtl:translate-x-full",
        )}
      >
        <div className="flex items-center justify-between bg-brand-900 px-4 py-3">
          <Logo tone="dark" showTld={false} className="[&_svg]:size-7 [&>span:last-child]:text-xl" />
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="inline-flex size-9 items-center justify-center rounded-sm text-white hover:bg-white/10"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {items.map((item) => (
            <li key={item.href} className="border-b border-line">
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 text-sm font-medium text-ink-900 hover:bg-surface"
              >
                {item.label}
                <ChevronRight className="flip-rtl size-4 text-ink-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
