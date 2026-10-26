"use client";

import { Check, Info, Loader2, Plus, RotateCcw, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { createCategoryAction, linkGoogleCategoryAction, suggestCopyAction } from "@/app/[locale]/admin/products/actions";
import { Badge } from "@/components/ui/Badge";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useRouter } from "@/i18n/navigation";
import { googleCategoryPath } from "@/lib/google-taxonomy";
import { tr } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";
import type { CopyRequestT, CopySuggestion } from "@/server/ai/product-copy";

type TextField = "nameEn" | "nameAr" | "descEn" | "descAr";
type Field = TextField | "slug";
type Row = Field | "category";
type Categories = {
  slug: string;
  nameEn: string;
  nameAr: string;
  children: { slug: string; nameEn: string; nameAr: string; googleCategoryId?: number | null }[];
}[];

const TEXT_ROWS: { key: TextField; dir: "ltr" | "rtl"; limit: number }[] = [
  { key: "nameEn", dir: "ltr", limit: 70 },
  { key: "nameAr", dir: "rtl", limit: 70 },
  { key: "descEn", dir: "ltr", limit: 0 },
  { key: "descAr", dir: "rtl", limit: 0 },
];

/** Google shows roughly this many characters of a title / description. */
const TITLE_MAX = 70;
const SNIPPET_MAX = 160;

const clip = (s: string, n: number) => {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 1).trimEnd()}…` : flat;
};

/** One "current → suggested" review row. */
function ReviewRow({ label, meta, children, action }: { label: string; meta?: React.ReactNode; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <li className="grid gap-x-5 gap-y-2 border-t border-line py-4 first:border-t-0 md:grid-cols-[9rem_minmax(0,1fr)_8.5rem]">
      <div>
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        {meta && <div className="mt-1 text-xs text-ink-500">{meta}</div>}
      </div>
      <div className="min-w-0">{children}</div>
      <div className="flex items-start md:justify-end">{action}</div>
    </li>
  );
}

function Current({ text, dir, empty }: { text: string; dir?: "ltr" | "rtl"; empty: string }) {
  return (
    <p className="mt-2 line-clamp-2 border-s-2 border-line ps-2 text-xs text-ink-500" dir={dir}>
      {text.trim() ? text : <span className="italic">{empty}</span>}
    </p>
  );
}

export function ProductCopyAssistant({
  product,
  isLive,
  categories,
  currentCategory,
  currentSubcategory,
  onApply,
  onCategory,
}: {
  product: Omit<CopyRequestT, "instructions">;
  /** Published product: changing its address adds a redirect from the old one */
  isLive: boolean;
  categories: Categories;
  currentCategory: string;
  currentSubcategory: string;
  onApply: (field: Field, value: string) => void;
  onCategory: (category: string, subcategory: string) => void;
}) {
  const t = useTranslations("AdminUI.editor.ai");
  const locale = useLocale();
  const router = useRouter();
  const [instructions, setInstructions] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [suggestion, setSuggestion] = useState<CopySuggestion>();
  /** Accepted rows → the value they replaced, so each can be undone. */
  const [accepted, setAccepted] = useState<Partial<Record<Row, string>>>({});
  const [expanded, setExpanded] = useState<Partial<Record<TextField, boolean>>>({});
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const [creating, startCreating] = useTransition();
  const canAsk = !!(product.nameEn.trim() || product.nameAr.trim());

  const name = (n: { nameEn: string; nameAr: string }) => tr({ en: n.nameEn, ar: n.nameAr }, locale);
  const findSub = (subSlug: string) => {
    for (const c of categories) {
      const s = c.children.find((x) => x.slug === subSlug);
      if (s) return { parent: c, sub: s };
    }
  };
  const current = findSub(currentSubcategory);
  const cat = suggestion?.category ?? null;
  const pick = cat?.pick;
  const pickedExisting = pick?.kind === "existing" ? findSub(pick.subcategory) : undefined;
  const categoryChanges = !!pick && !(pick.kind === "existing" && pick.subcategory === currentSubcategory);
  const pendingRows: Row[] = suggestion
    ? [...(categoryChanges ? (["category"] as const) : []), ...([...TEXT_ROWS.map((r) => r.key), "slug"] as Field[]) /* slug last: a new product's title would otherwise overwrite it */.filter((k) => suggestion[k] !== product[k])].filter((r) => !(r in accepted))
    : [];

  function ask() {
    setError(undefined);
    start(async () => {
      const res = await suggestCopyAction({ ...product, instructions }).catch(() => ({ ok: false as const, error: "failed" as const }));
      if (!res.ok) return setError(t(`errors.${res.error}`));
      setSuggestion(res.suggestion);
      setAccepted({});
      setExpanded({});
    });
  }

  function acceptText(key: Field) {
    if (!suggestion) return;
    setAccepted((a) => ({ ...a, [key]: product[key] }));
    onApply(key, suggestion[key]);
  }

  function acceptCategory() {
    if (!cat || !pick) return;
    const before = `${currentCategory}|${currentSubcategory}`;
    if (pick.kind === "existing") {
      setAccepted((a) => ({ ...a, category: before }));
      onCategory(pick.category, pick.subcategory);
      if (cat.google && !pickedExisting?.sub.googleCategoryId) linkGoogleCategoryAction(pick.subcategory, cat.google.id).catch(() => {});
      return;
    }
    setError(undefined);
    startCreating(async () => {
      try {
        const res = await createCategoryAction({ parent: pick.parent, nameEn: pick.nameEn, nameAr: pick.nameAr, googleCategoryId: cat.google?.id ?? null });
        setAccepted((a) => ({ ...a, category: before }));
        onCategory(res.category, res.subcategory);
        router.refresh(); // load the new category into the dropdowns
      } catch {
        setError(t("errors.createCategory"));
      }
    });
  }

  function undo(row: Row) {
    const prev = accepted[row];
    if (prev === undefined) return;
    if (row === "category") {
      const [c, s] = prev.split("|");
      onCategory(c, s);
    } else onApply(row, prev);
    setAccepted((a) => {
      const next = { ...a };
      delete next[row];
      return next;
    });
  }

  function acceptAll() {
    for (const r of pendingRows) {
      if (r === "category") acceptCategory();
      else acceptText(r);
    }
  }

  const actionFor = (row: Row, onAccept: () => void, acceptLabel = t("accept"), busy = false) =>
    row in accepted ? (
      <div className="flex flex-col items-start gap-1 md:items-end">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
          <Check className="size-3.5" aria-hidden />
          {t("accepted")}
        </span>
        <button type="button" onClick={() => undo(row)} className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600 hover:text-ink-900 hover:underline">
          <RotateCcw className="size-3" aria-hidden />
          {t("undo")}
        </button>
      </div>
    ) : (
      <Button variant="outline" size="sm" disabled={busy} onClick={onAccept}>
        {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
        {acceptLabel}
      </Button>
    );

  return (
    <Box role="region" aria-labelledby="ai-title">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
          <Sparkles className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="ai-title" className="text-base font-bold">{t("title")}</h2>
          <p className="text-xs text-ink-500">{t("hint")}</p>
        </div>
        <Button variant={suggestion ? "outline" : "primary"} className="w-full sm:w-auto" disabled={pending || !canAsk} onClick={ask}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
          {pending ? t("thinking") : suggestion ? t("again") : t("suggest")}
        </Button>
      </div>

      <div className="space-y-4 px-5 py-4">
        {/* Options */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {!canAsk ? <p className="text-ink-500">{t("needName")}</p> : <span />}
          {!showInstructions && (
            <button type="button" onClick={() => setShowInstructions(true)} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
              <Plus className="size-3.5" aria-hidden />
              {t("addInstructions")}
            </button>
          )}
        </div>
        {showInstructions && (
          <div>
            <Label htmlFor="ai-instructions">{t("instructions")}</Label>
            <Input id="ai-instructions" placeholder={t("instructionsPlaceholder")} value={instructions} maxLength={500} onChange={(e) => setInstructions(e.target.value)} autoFocus />
          </div>
        )}

        {error && <p role="alert" className="rounded-sm bg-sale-50 px-3 py-2 text-xs text-sale">{error}</p>}

        {/* Loading skeleton in the shape of the results */}
        {pending && (
          <ul aria-hidden className="animate-pulse motion-reduce:animate-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="grid gap-5 border-t border-line py-4 first:border-t-0 md:grid-cols-[9rem_minmax(0,1fr)_8.5rem]">
                <div className="h-3.5 w-20 rounded-xs bg-surface" />
                <div className="space-y-2">
                  <div className="h-3.5 w-11/12 rounded-xs bg-surface" />
                  {i > 2 && <div className="h-3.5 w-3/4 rounded-xs bg-surface" />}
                </div>
                <div className="h-8 w-20 rounded-sm bg-surface md:justify-self-end" />
              </li>
            ))}
          </ul>
        )}

        {suggestion && !pending && (
          <div aria-live="polite">
            <ul>
              {/* Category */}
              {cat && pick && (
                <ReviewRow
                  label={t("categoryTitle")}
                  meta={<Badge tone={cat.confidence === "high" ? "success" : cat.confidence === "medium" ? "info" : "neutral"}>{t(`confidence.${cat.confidence}`)}</Badge>}
                  action={
                    categoryChanges ? actionFor("category", acceptCategory, pick.kind === "new" ? t("createAndUse") : t("accept"), creating) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                        <Check className="size-3.5" aria-hidden />
                        {t("categorySame")}
                      </span>
                    )
                  }
                >
                  <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-semibold">
                    {pick.kind === "existing" && pickedExisting ? (
                      <>
                        {name(pickedExisting.parent)}
                        <span className="text-ink-400">›</span>
                        {name(pickedExisting.sub)}
                      </>
                    ) : pick.kind === "new" ? (
                      <>
                        {"slug" in pick.parent ? name(categories.find((c) => c.slug === (pick.parent as { slug: string }).slug) ?? { nameEn: "", nameAr: "" }) : name(pick.parent)}
                        {!("slug" in pick.parent) && <Badge tone="brand">{t("new")}</Badge>}
                        <span className="text-ink-400">›</span>
                        {name(pick)}
                        <Badge tone="brand">{t("new")}</Badge>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-ink-600">{locale === "ar" ? cat.reasonAr : cat.reasonEn}</p>
                  {cat.google && (
                    <p className="mt-1.5 text-xs text-ink-600" dir="ltr">
                      <span className="font-semibold">{t("googleCategory")}</span> {cat.google.path} <span className="text-ink-400">#{cat.google.id}</span>
                    </p>
                  )}
                  <Current
                    empty={t("none")}
                    text={current ? `${name(current.parent)} › ${name(current.sub)}${current.sub.googleCategoryId ? ` · Google: ${googleCategoryPath(current.sub.googleCategoryId)?.split(" > ").at(-1)}` : ""}` : ""}
                  />
                </ReviewRow>
              )}

              {/* Web address */}
              <ReviewRow
                label={t("field.slug")}
                meta={t("charsOf", { count: suggestion.slug.length, limit: 60 })}
                action={suggestion.slug === product.slug && !("slug" in accepted) ? <span className="text-xs text-ink-500">{t("noChange")}</span> : actionFor("slug", () => acceptText("slug"))}
              >
                <p className="break-all text-sm font-semibold text-ink-900" dir="ltr">
                  <span className="font-normal text-ink-500">ihealthcare.ae/p/</span>
                  {suggestion.slug}
                </p>
                {(suggestion.slug !== product.slug || "slug" in accepted) && (
                  <>
                    <Current text={`ihealthcare.ae/p/${"slug" in accepted ? accepted.slug : product.slug}`} dir="ltr" empty={t("none")} />
                    {isLive && <p className="mt-2 text-xs text-ink-600">{t("slugRedirect")}</p>}
                  </>
                )}
              </ReviewRow>

              {/* Titles and descriptions */}
              {TEXT_ROWS.map(({ key, dir, limit }) => {
                const text = suggestion[key];
                const unchanged = text === product[key] && !(key in accepted);
                const isDesc = !limit;
                return (
                  <ReviewRow
                    key={key}
                    label={t(`field.${key}`)}
                    meta={
                      limit ? (
                        <span className={cn(text.length > limit + 10 && "font-semibold text-sale")}>{t("charsOf", { count: text.length, limit })}</span>
                      ) : (
                        t("words", { count: text.split(/\s+/).filter(Boolean).length })
                      )
                    }
                    action={unchanged ? <span className="text-xs text-ink-500">{t("noChange")}</span> : actionFor(key, () => acceptText(key))}
                  >
                    <p
                      dir={dir}
                      lang={dir === "rtl" ? "ar" : "en"}
                      className={cn("whitespace-pre-line text-sm leading-6 text-ink-900", !isDesc && "font-semibold", isDesc && !expanded[key] && "line-clamp-4")}
                    >
                      {text}
                    </p>
                    {isDesc && (
                      <button type="button" onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))} className="mt-1 text-xs font-semibold text-brand-700 hover:underline">
                        {expanded[key] ? t("showLess") : t("showMore")}
                      </button>
                    )}
                    {!unchanged && <Current text={key in accepted ? (accepted[key] ?? "") : product[key]} dir={dir} empty={t("none")} />}
                  </ReviewRow>
                );
              })}
            </ul>

            {/* Extras */}
            <div className="mt-2 grid gap-4 border-t border-line pt-4 text-xs md:grid-cols-2">
              {[suggestion.keywordsEn, suggestion.keywordsAr].map((kw, i) => (
                <div key={i}>
                  <p className="mb-1.5 font-semibold text-ink-700">{t(i ? "keywordsAr" : "keywordsEn")}</p>
                  <ul className="flex flex-wrap gap-1.5" dir={i ? "rtl" : "ltr"}>
                    {kw.map((k) => (
                      <li key={k} className="rounded-xs border border-line bg-surface px-2 py-0.5 text-ink-700">{k}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {suggestion.missing.length > 0 && (
              <p className="mt-4 flex gap-2 rounded-sm bg-accent-50 px-3 py-2 text-xs text-ink-800">
                <Info className="mt-0.5 size-3.5 shrink-0 text-accent-700" aria-hidden />
                <span>
                  <span className="font-semibold">{t("missing")}</span> {suggestion.missing.join(" · ")}
                </span>
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Button variant="primary" size="sm" disabled={!pendingRows.length || creating} onClick={acceptAll}>
                {t("acceptAll")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSuggestion(undefined)}>{t("discard")}</Button>
              <p className="text-xs text-ink-500">{t("reviewNote")}</p>
            </div>
          </div>
        )}

        {/* Live search preview of the form as it stands */}
        <div className="rounded-sm border border-line p-3" dir="ltr">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">{t("preview")}</p>
          <p className="text-xs text-ink-600">ihealthcare.ae › p › {product.slug || "…"}</p>
          <p className="truncate text-base text-[#1a0dab]">{clip(product.nameEn || product.nameAr || "—", TITLE_MAX)} | iHealthcare.ae</p>
          <p className="line-clamp-2 text-sm text-ink-700">{clip(product.descEn, SNIPPET_MAX) || t("noDescription")}</p>
        </div>

        <p className="text-[11px] text-ink-500">{t("disclaimer")}</p>
      </div>
    </Box>
  );
}
