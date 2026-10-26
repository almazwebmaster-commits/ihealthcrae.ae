"use client";

import { ArrowRight, ChevronDown, Search, TrendingUp, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { CategoryIcon } from "@/components/catalog/CategoryIcon";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import { Link, useRouter } from "@/i18n/navigation";
import type { Product } from "@/lib/catalog-types";
import { formatPrice, tr } from "@/lib/i18n-utils";
import { tintClasses, type TintKey } from "@/lib/tints";
import { cn } from "@/lib/utils";

type Suggestion = Pick<Product, "slug" | "name" | "brandName" | "price" | "category" | "categoryTint" | "images">;
type SearchCategory = { slug: string; name: string; tint: TintKey };

const DEBOUNCE_MS = 150;

export function SearchBox({ categories, className }: { categories: SearchCategory[]; className?: string }) {
  const t = useTranslations("Search");
  const locale = useLocale();
  const router = useRouter();
  const panelId = useId();
  const root = useRef<HTMLFormElement>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ key: string; items: Suggestion[] }>({ key: "", items: [] });

  const term = q.trim();
  const key = `${category}|${term}`;
  // Only show results that belong to the current input (older responses are ignored).
  const suggestions = term.length >= 2 && result.key === key ? result.items : [];

  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: term, ...(category ? { category } : {}) });
        const res = await fetch(`/api/search/suggest?${params}`, { signal: ctrl.signal });
        if (res.ok) setResult({ key: `${category}|${term}`, items: (await res.json()).items });
      } catch {
        // aborted or offline — keep the previous suggestions
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [term, category]);
  const trending = t.raw("trendingTerms") as string[];
  const searchHref = (query: string) =>
    `/search?q=${encodeURIComponent(query)}${category ? `&category=${category}` : ""}`;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <form
      ref={root}
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        router.push(searchHref(term));
      }}
    >
      <div
        className={cn(
          "group flex h-11 items-center rounded-sm text-white ring-1 ring-white/25 transition-colors",
          "bg-white/10 hover:bg-white/15",
          "focus-within:bg-white focus-within:text-ink-900 focus-within:ring-2 focus-within:ring-accent-500",
        )}
      >
        <Search className="ms-3 size-5 shrink-0 opacity-70" aria-hidden />
        <input
          type="search"
          name="q"
          value={q}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          aria-expanded={open}
          aria-controls={panelId}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm placeholder:text-brand-100/80 focus:outline-none group-focus-within:placeholder:text-ink-400 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            aria-label={t("clear")}
            onClick={() => setQ("")}
            className="inline-flex size-8 items-center justify-center rounded-xs opacity-60 hover:opacity-100"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
        <span aria-hidden className="mx-1 hidden h-6 w-px bg-current opacity-20 sm:block" />
        <label className="relative hidden items-center sm:flex">
          <span className="sr-only">{t("inCategory")}</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="max-w-36 cursor-pointer appearance-none bg-transparent py-1 pe-6 ps-2 text-xs font-semibold focus:outline-none"
          >
            <option value="" className="text-ink-900">{t("everywhere")}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug} className="text-ink-900">
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute end-1 size-3.5 opacity-70" aria-hidden />
        </label>
        <button
          type="submit"
          className="m-1 inline-flex h-9 items-center gap-1.5 rounded-xs bg-accent-500 px-3 text-sm font-bold text-ink-900 hover:bg-accent-400"
        >
          <span className="hidden lg:inline">{t("submit")}</span>
          <ArrowRight className="flip-rtl size-4" aria-hidden />
          <span className="sr-only lg:hidden">{t("submit")}</span>
        </button>
      </div>

      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-sm border border-line bg-white text-ink-900 shadow-pop"
        >
          {term.length < 2 ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  <TrendingUp className="size-3.5" aria-hidden />
                  {t("trending")}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {trending.map((word) => (
                    <Link
                      key={word}
                      href={searchHref(word)}
                      onClick={() => setOpen(false)}
                      className="rounded-sm border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink-800 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
                    >
                      {word}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-500">{t("categories")}</h3>
                <ul className="grid grid-cols-2 gap-1">
                  {categories.map((c) => {
                    return (
                      <li key={c.slug}>
                        <Link
                          href={`/c/${c.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 rounded-sm p-1 text-xs font-medium hover:bg-surface"
                        >
                          <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-xs", tintClasses(c.tint).bg, tintClasses(c.tint).fg)}>
                            <CategoryIcon slug={c.slug} className="size-3.5" aria-hidden />
                          </span>
                          <span className="line-clamp-1">{c.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : (
            <div>
              {suggestions.length ? (
                <ul>
                  {suggestions.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/p/${p.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 border-b border-line px-3 py-2 hover:bg-surface"
                      >
                        <ProductVisual product={p} sizes="44px" className="w-11 shrink-0 rounded-xs" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] font-bold uppercase text-brand-600">{p.brandName}</span>
                          <span className="line-clamp-1 text-sm">{tr(p.name, locale)}</span>
                        </span>
                        <span className="shrink-0 text-sm font-bold">{formatPrice(p.price, locale)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-ink-600">{t("noMatches")}</p>
              )}
              <Link
                href={searchHref(term)}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between bg-surface px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                {t("seeAll", { q: term })}
                <ArrowRight className="flip-rtl size-4" aria-hidden />
              </Link>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
