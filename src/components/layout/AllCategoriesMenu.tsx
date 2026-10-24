"use client";

import { ChevronDown, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { categoryIcons } from "@/components/catalog/category-icons";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type MenuCategory = {
  slug: string;
  name: string;
  tint: { bg: string; fg: string };
  children: { slug: string; name: string }[];
};

export function AllCategoriesMenu({
  label,
  viewAllLabel,
  categories,
}: {
  label: string;
  viewAllLabel: string;
  categories: MenuCategory[];
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="hidden shrink-0 lg:block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="all-categories"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 rounded-sm px-2 py-1.5 font-bold hover:bg-white/10",
          open && "bg-white/10",
        )}
      >
        <Menu className="size-4" aria-hidden />
        {label}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div
          id="all-categories"
          className="absolute inset-x-0 top-full z-50 border-b border-line bg-white text-ink-900 shadow-pop"
        >
          <div className="container-site grid grid-cols-4 gap-x-6 gap-y-6 py-6 xl:grid-cols-7">
            {categories.map((c) => {
              const Icon = categoryIcons[c.slug];
              return (
                <div key={c.slug}>
                  <Link
                    href={`/c/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="group mb-2 flex items-center gap-2"
                  >
                    <span className={cn("inline-flex size-8 items-center justify-center rounded-sm", c.tint.bg, c.tint.fg)}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="text-sm font-bold group-hover:text-brand-700">{c.name}</span>
                  </Link>
                  <ul className="space-y-1.5 ps-10 text-sm">
                    {c.children.map((s) => (
                      <li key={s.slug}>
                        <Link
                          href={`/c/${s.slug}`}
                          onClick={() => setOpen(false)}
                          className="text-ink-600 hover:text-brand-700 hover:underline"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href={`/c/${c.slug}`}
                        onClick={() => setOpen(false)}
                        className="text-xs font-semibold text-brand-700 hover:underline"
                      >
                        {viewAllLabel}
                      </Link>
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
