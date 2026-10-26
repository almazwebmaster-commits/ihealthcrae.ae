"use client";

import { Check, FolderTree, Info, Sparkles, WandSparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { suggestCopyAction } from "@/app/[locale]/admin/products/actions";
import { Input, Label } from "@/components/ui/Input";
import { tr } from "@/lib/i18n-utils";
import type { CopyRequestT, CopySuggestion } from "@/server/ai/product-copy";
import { cn } from "@/lib/utils";

type Field = "nameEn" | "nameAr" | "descEn" | "descAr";
type Applied = Field | "category";
const FIELDS: { key: Field; dir: "ltr" | "rtl"; title: boolean }[] = [
  { key: "nameEn", dir: "ltr", title: true },
  { key: "nameAr", dir: "rtl", title: true },
  { key: "descEn", dir: "ltr", title: false },
  { key: "descAr", dir: "rtl", title: false },
];
type Categories = { slug: string; nameEn: string; nameAr: string; children: { slug: string; nameEn: string; nameAr: string }[] }[];

/** Google shows roughly this many characters of a title / description. */
const TITLE_MAX = 70;
const SNIPPET_MAX = 160;

const clip = (s: string, n: number) => {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 1).trimEnd()}…` : flat;
};

const gradient = "bg-linear-to-r from-violet-600 via-fuchsia-500 to-indigo-600";

/** Small "use this" button in the AI style. */
function UseButton({ done, onClick, label, doneLabel }: { done: boolean; onClick: () => void; label: string; doneLabel: string }) {
  return (
    <button
      type="button"
      disabled={done}
      onClick={onClick}
      className={cn(
        "mt-3 inline-flex h-8 items-center gap-1.5 self-start rounded-sm px-3 text-xs font-bold transition",
        done ? "bg-success-50 text-success" : "border border-violet-300 bg-white text-violet-700 hover:border-violet-500 hover:bg-violet-50",
      )}
    >
      {done ? <Check className="size-3.5" aria-hidden /> : <WandSparkles className="size-3.5" aria-hidden />}
      {done ? doneLabel : label}
    </button>
  );
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xs bg-linear-to-r from-violet-100 via-fuchsia-100 to-violet-100 bg-size-[200%_100%] animate-ai-shimmer motion-reduce:animate-none",
        className,
      )}
    />
  );
}

export function ProductCopyAssistant({
  product,
  slug,
  categories,
  currentSubcategory,
  onApply,
  onCategory,
}: {
  product: Omit<CopyRequestT, "instructions">;
  slug: string;
  categories: Categories;
  currentSubcategory: string;
  onApply: (field: Field, value: string) => void;
  onCategory: (category: string, subcategory: string) => void;
}) {
  const t = useTranslations("AdminUI.editor.ai");
  const locale = useLocale();
  const [instructions, setInstructions] = useState("");
  const [suggestion, setSuggestion] = useState<CopySuggestion>();
  const [applied, setApplied] = useState<Set<Applied>>(new Set());
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const canAsk = !!(product.nameEn.trim() || product.nameAr.trim());

  const parent = suggestion && categories.find((c) => c.slug === suggestion.category);
  const sub = parent?.children.find((s) => s.slug === suggestion?.subcategory);
  const sameCategory = suggestion?.subcategory === currentSubcategory;
  const total = FIELDS.length + (sameCategory ? 0 : 1);

  function ask() {
    setError(undefined);
    start(async () => {
      const res = await suggestCopyAction({ ...product, instructions }).catch(() => ({ ok: false as const, error: "failed" as const }));
      if (!res.ok) return setError(t(`errors.${res.error}`));
      setSuggestion(res.suggestion);
      setApplied(new Set());
    });
  }

  function apply(items: Applied[]) {
    if (!suggestion) return;
    for (const f of items) {
      if (f === "category") onCategory(suggestion.category, suggestion.subcategory);
      else onApply(f, suggestion[f]);
    }
    setApplied((s) => new Set([...s, ...items]));
  }

  return (
    <section aria-labelledby="ai-title" className={cn("rounded-md p-px shadow-ai", gradient)}>
      <div className="rounded-[5px] bg-linear-to-br from-violet-50 via-white to-fuchsia-50 p-5">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-3">
          <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-md text-white shadow-ai", gradient)}>
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="ai-title" className="flex flex-wrap items-center gap-2 text-base font-extrabold">
              <span className="bg-linear-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">{t("title")}</span>
              <span className="rounded-xs bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">AI</span>
            </h2>
            <p className="mt-0.5 max-w-prose text-xs text-ink-600">{t("hint")}</p>
          </div>
        </div>

        {/* How the English listing looks in Google right now */}
        <div className="mt-4 rounded-sm border border-violet-100 bg-white p-3" dir="ltr">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-violet-500">{t("preview")}</p>
          <p className="text-xs text-ink-600">ihealthcare.ae › p › {slug || "…"}</p>
          <p className="truncate text-base text-[#1a0dab]">{clip(product.nameEn || product.nameAr || "—", TITLE_MAX)} | iHealthcare.ae</p>
          <p className="line-clamp-2 text-sm text-ink-700">{clip(product.descEn, SNIPPET_MAX) || t("noDescription")}</p>
        </div>

        {/* Prompt */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="ai-instructions">{t("instructions")}</Label>
            <Input
              id="ai-instructions"
              className="border-violet-200 focus:border-violet-500"
              placeholder={t("instructionsPlaceholder")}
              value={instructions}
              maxLength={500}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={ask}
            disabled={pending || !canAsk}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-sm px-5 text-sm font-bold text-white shadow-ai transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
              gradient,
            )}
          >
            <Sparkles className={cn("size-4", pending && "animate-pulse")} aria-hidden />
            {pending ? t("thinking") : suggestion ? t("again") : t("suggest")}
          </button>
        </div>
        {!canAsk && <p className="mt-1 text-xs text-ink-500">{t("needName")}</p>}
        {error && <p role="alert" className="mt-3 rounded-sm bg-sale-50 px-3 py-2 text-xs text-sale">{error}</p>}

        {/* Writing… placeholder */}
        {pending && (
          <div className="mt-5 grid gap-4 md:grid-cols-2" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 rounded-sm border border-violet-100 bg-white p-3">
                <Shimmer className="h-3 w-24" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-4/5" />
                {i > 1 && <Shimmer className="h-4 w-2/3" />}
              </div>
            ))}
          </div>
        )}

        {suggestion && !pending && (
          <div className="mt-5 space-y-4 border-t border-violet-100 pt-4" aria-live="polite">
            {/* Category */}
            <div className="flex flex-col rounded-sm border border-violet-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-800">
                  <FolderTree className="size-3.5" aria-hidden />
                  {t("categoryTitle")}
                </span>
                <span
                  className={cn(
                    "rounded-xs px-1.5 py-0.5 text-[11px] font-bold",
                    suggestion.categoryConfidence === "high" && "bg-success-50 text-success",
                    suggestion.categoryConfidence === "medium" && "bg-accent-50 text-accent-700",
                    suggestion.categoryConfidence === "low" && "bg-surface text-ink-600",
                  )}
                >
                  {t(`confidence.${suggestion.categoryConfidence}`)}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold">
                {parent && tr({ en: parent.nameEn, ar: parent.nameAr }, locale)}
                <span className="mx-1.5 text-violet-400">›</span>
                {sub && tr({ en: sub.nameEn, ar: sub.nameAr }, locale)}
              </p>
              <p className="mt-1 text-xs text-ink-600">{locale === "ar" ? suggestion.categoryReasonAr : suggestion.categoryReasonEn}</p>
              {sameCategory ? (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                  <Check className="size-3.5" aria-hidden />
                  {t("categorySame")}
                </p>
              ) : (
                <UseButton done={applied.has("category")} onClick={() => apply(["category"])} label={t("use")} doneLabel={t("used")} />
              )}
            </div>

            {/* Titles and descriptions */}
            <div className="grid gap-4 md:grid-cols-2">
              {FIELDS.map(({ key, dir, title }) => {
                const text = suggestion[key];
                const long = title && text.length > TITLE_MAX + 10;
                return (
                  <div key={key} className="flex flex-col rounded-sm border border-violet-200 bg-white p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-800">
                        <Sparkles className="size-3" aria-hidden />
                        {t(`field.${key}`)}
                      </span>
                      <span className={cn("text-[11px]", long ? "font-semibold text-sale" : "text-ink-500")}>{t("chars", { count: text.length })}</span>
                    </div>
                    <p dir={dir} lang={dir === "rtl" ? "ar" : "en"} className={cn("flex-1 whitespace-pre-line text-sm leading-6", title && "font-semibold")}>
                      {text}
                    </p>
                    <UseButton done={applied.has(key)} onClick={() => apply([key])} label={t("use")} doneLabel={t("used")} />
                  </div>
                );
              })}
            </div>

            {/* Search phrases */}
            <div className="grid gap-3 text-xs md:grid-cols-2">
              {[suggestion.keywordsEn, suggestion.keywordsAr].map((kw, i) => (
                <div key={i}>
                  <p className="mb-1 font-semibold text-ink-700">{t(i ? "keywordsAr" : "keywordsEn")}</p>
                  <ul className="flex flex-wrap gap-1.5" dir={i ? "rtl" : "ltr"}>
                    {kw.map((k) => (
                      <li key={k} className="rounded-xs border border-violet-200 bg-violet-50 px-2 py-0.5 text-violet-800">{k}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {suggestion.missing.length > 0 && (
              <div className="flex gap-2 rounded-sm border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-ink-800">
                <Info className="mt-0.5 size-3.5 shrink-0 text-violet-600" aria-hidden />
                <div>
                  <p className="font-semibold">{t("missing")}</p>
                  <p className="mt-0.5">{suggestion.missing.join(" · ")}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={applied.size >= total}
                onClick={() => apply([...FIELDS.map((f) => f.key), ...(sameCategory ? [] : (["category"] as const))])}
                className={cn("inline-flex h-9 items-center gap-1.5 rounded-sm px-4 text-sm font-bold text-white shadow-ai transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none", gradient)}
              >
                <WandSparkles className="size-4" aria-hidden />
                {t("useAll")}
              </button>
              <button type="button" onClick={() => setSuggestion(undefined)} className="h-9 rounded-sm px-3 text-sm font-semibold text-ink-600 hover:bg-violet-50">
                {t("discard")}
              </button>
              <p className="text-xs text-ink-500">{t("reviewNote")}</p>
            </div>
          </div>
        )}

        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-ink-500">
          <Sparkles className="size-3 text-violet-400" aria-hidden />
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
}
