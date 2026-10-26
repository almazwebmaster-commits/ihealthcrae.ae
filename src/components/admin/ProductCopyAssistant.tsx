"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { suggestCopyAction } from "@/app/[locale]/admin/products/actions";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type { CopyRequestT, CopySuggestion } from "@/server/ai/product-copy";
import { cn } from "@/lib/utils";

type Field = "nameEn" | "nameAr" | "descEn" | "descAr";
const FIELDS: { key: Field; dir: "ltr" | "rtl"; title: boolean }[] = [
  { key: "nameEn", dir: "ltr", title: true },
  { key: "nameAr", dir: "rtl", title: true },
  { key: "descEn", dir: "ltr", title: false },
  { key: "descAr", dir: "rtl", title: false },
];

/** Google shows roughly this many characters of a title / description. */
const TITLE_MAX = 70;
const SNIPPET_MAX = 160;

const clip = (s: string, n: number) => {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 1).trimEnd()}…` : flat;
};

export function ProductCopyAssistant({
  product,
  slug,
  onApply,
}: {
  product: Omit<CopyRequestT, "instructions">;
  slug: string;
  onApply: (field: Field, value: string) => void;
}) {
  const t = useTranslations("AdminUI.editor.ai");
  const [instructions, setInstructions] = useState("");
  const [suggestion, setSuggestion] = useState<CopySuggestion>();
  const [applied, setApplied] = useState<Set<Field>>(new Set());
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const canAsk = !!(product.nameEn.trim() || product.nameAr.trim());

  function ask() {
    setError(undefined);
    start(async () => {
      const res = await suggestCopyAction({ ...product, instructions }).catch(() => ({ ok: false as const, error: "failed" as const }));
      if (!res.ok) return setError(t(`errors.${res.error}`));
      setSuggestion(res.suggestion);
      setApplied(new Set());
    });
  }

  function apply(fields: Field[]) {
    if (!suggestion) return;
    for (const f of fields) onApply(f, suggestion[f]);
    setApplied((s) => new Set([...s, ...fields]));
  }

  return (
    <Box className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-base font-bold">
            <Sparkles className="size-4 text-accent-600" aria-hidden />
            {t("title")}
          </h2>
          <p className="mt-0.5 max-w-prose text-xs text-ink-500">{t("hint")}</p>
        </div>
      </div>

      {/* How the English listing looks in Google right now */}
      <div className="mt-4 rounded-sm border border-line bg-surface p-3" dir="ltr">
        <p className="mb-1 text-[11px] font-semibold uppercase text-ink-500">{t("preview")}</p>
        <p className="text-xs text-ink-600">ihealthcare.ae › p › {slug || "…"}</p>
        <p className="truncate text-base text-[#1a0dab]">{clip(product.nameEn || product.nameAr || "—", TITLE_MAX)} | iHealthcare.ae</p>
        <p className="line-clamp-2 text-sm text-ink-700">{clip(product.descEn, SNIPPET_MAX) || t("noDescription")}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="ai-instructions">{t("instructions")}</Label>
          <Input id="ai-instructions" placeholder={t("instructionsPlaceholder")} value={instructions} maxLength={500} onChange={(e) => setInstructions(e.target.value)} />
        </div>
        <Button variant="primary" disabled={pending || !canAsk} onClick={ask}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
          {pending ? t("thinking") : suggestion ? t("again") : t("suggest")}
        </Button>
      </div>
      {!canAsk && <p className="mt-1 text-xs text-ink-500">{t("needName")}</p>}
      {error && <p role="alert" className="mt-3 rounded-sm bg-sale-50 px-3 py-2 text-xs text-sale">{error}</p>}

      {suggestion && (
        <div className="mt-5 space-y-4 border-t border-line pt-4" aria-live="polite">
          <div className="grid gap-4 md:grid-cols-2">
            {FIELDS.map(({ key, dir, title }) => {
              const text = suggestion[key];
              const done = applied.has(key);
              const long = title ? text.length > TITLE_MAX + 10 : false;
              return (
                <div key={key} className="flex flex-col rounded-sm border border-line p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink-700">{t(`field.${key}`)}</span>
                    <span className={cn("text-[11px]", long ? "font-semibold text-sale" : "text-ink-500")}>{t("chars", { count: text.length })}</span>
                  </div>
                  <p dir={dir} lang={dir === "rtl" ? "ar" : "en"} className={cn("flex-1 whitespace-pre-line text-sm leading-6", title && "font-semibold")}>{text}</p>
                  <Button variant={done ? "ghost" : "outline"} size="sm" className="mt-2 self-start" disabled={done} onClick={() => apply([key])}>
                    {done && <Check className="size-3.5" aria-hidden />}
                    {done ? t("used") : t("use")}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 text-xs md:grid-cols-2">
            {[suggestion.keywordsEn, suggestion.keywordsAr].map((kw, i) => (
              <div key={i}>
                <p className="mb-1 font-semibold text-ink-700">{t(i ? "keywordsAr" : "keywordsEn")}</p>
                <ul className="flex flex-wrap gap-1.5" dir={i ? "rtl" : "ltr"}>
                  {kw.map((k) => (
                    <li key={k} className="rounded-xs bg-brand-50 px-2 py-0.5 text-brand-800">{k}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {suggestion.missing.length > 0 && (
            <div className="rounded-sm bg-accent-50 px-3 py-2 text-xs text-ink-800">
              <p className="font-semibold">{t("missing")}</p>
              <p className="mt-0.5">{suggestion.missing.join(" · ")}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="accent" size="sm" disabled={applied.size === FIELDS.length} onClick={() => apply(FIELDS.map((f) => f.key))}>
              {t("useAll")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSuggestion(undefined)}>{t("discard")}</Button>
            <p className="text-xs text-ink-500">{t("reviewNote")}</p>
          </div>
        </div>
      )}
    </Box>
  );
}
