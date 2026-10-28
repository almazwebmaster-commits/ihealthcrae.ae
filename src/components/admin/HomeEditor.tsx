"use client";

import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { resetHomeAction, saveHomeAction } from "@/app/[locale]/admin/homepage/actions";
import { VideoField } from "@/components/admin/VideoField";
import { FormMessage } from "@/components/auth/AuthCard";
import { Badge } from "@/components/ui/Badge";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Link, useRouter } from "@/i18n/navigation";
import { heroThemes, type BannerKind, type HeroSlideContent, type HomeContent } from "@/lib/home-content";
import { tr } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";

type Cat = { slug: string; nameEn: string; nameAr: string };
type Prod = { slug: string; nameEn: string; nameAr: string; category: string };
type Img = HeroSlideContent["desktop"];

const select = "h-10 w-full rounded-sm border border-line-strong bg-white px-3 text-sm focus:border-brand-500 focus:outline-none";
const swatch: Record<(typeof heroThemes)[number], string> = { teal: "bg-brand-700", rose: "bg-rose-700", ink: "bg-ink-900", amber: "bg-accent-500" };

function move<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function MoveButtons({ i, n, onMove, labels }: { i: number; n: number; onMove: (dir: -1 | 1) => void; labels: { up: string; down: string } }) {
  const btn = "inline-flex size-8 items-center justify-center rounded-xs border border-line hover:bg-surface disabled:opacity-30";
  return (
    <span className="flex gap-1">
      <button type="button" className={btn} aria-label={labels.up} disabled={i === 0} onClick={() => onMove(-1)}><ArrowUp className="size-4" aria-hidden /></button>
      <button type="button" className={btn} aria-label={labels.down} disabled={i === n - 1} onClick={() => onMove(1)}><ArrowDown className="size-4" aria-hidden /></button>
    </span>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-5 w-9 rounded-full bg-ink-300 transition-colors after:absolute after:start-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-brand-600 peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600" aria-hidden />
      <span className={checked ? "text-ink-900" : "text-ink-500"}>{label}</span>
    </label>
  );
}

/** One banner image slot: preview + upload/replace + remove. */
function ImageSlot({ id, label, hint, image, kind, onChange }: { id: string; label: string; hint: string; image: Img; kind: BannerKind; onChange: (img: Img) => void }) {
  const t = useTranslations("AdminUI.homepage");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(undefined);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/api/admin/uploads/banner?kind=${kind}`, { method: "POST", body }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const e = ((await res?.json().catch(() => null)) as { error?: string } | null)?.error;
      return setError(t(e === "type" ? "errors.uploadType" : e === "size" ? "errors.uploadSize" : e === "storage" ? "errors.uploadStorage" : "errors.upload"));
    }
    onChange(((await res.json()) as { image: Img }).image);
  }
  return (
    <div>
      <p className="mb-1 text-sm font-semibold">{label}</p>
      <div className={cn("relative overflow-hidden rounded-sm border border-dashed border-line-strong bg-surface", kind === "mobile" ? "aspect-[4/5] max-w-40" : kind === "promo" ? "aspect-square max-w-48" : "aspect-[21/9]")}>
        {image ? <Image src={image.src} alt="" fill sizes="320px" className="object-cover" /> : <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-ink-500">{t("noImage")}</span>}
      </div>
      <p className="mt-1 text-[11px] text-ink-500">{hint}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        <label htmlFor={id} className={cn("inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-line-strong bg-white px-2.5 text-xs font-semibold hover:border-ink-400", busy && "pointer-events-none opacity-60")}>
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <ImagePlus className="size-3.5" aria-hidden />}
          {image ? t("replace") : t("upload")}
        </label>
        <input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
        {image && <button type="button" className="text-xs font-semibold text-sale hover:underline" onClick={() => onChange(null)}>{t("removeImage")}</button>}
      </div>
      {error && <p role="alert" className="mt-1 text-xs font-semibold text-sale">{error}</p>}
    </div>
  );
}

function BannerCard({ slide, i, n, cats, update, remove, onMove }: {
  slide: HeroSlideContent; i: number; n: number; cats: Cat[]; update: (patch: Partial<HeroSlideContent>) => void; remove: () => void; onMove: (dir: -1 | 1) => void;
}) {
  const t = useTranslations("AdminUI.homepage");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const id = (k: string) => `hb-${slide.id}-${k}`;
  const field = (k: "titleEn" | "titleAr" | "subtitleEn" | "subtitleAr" | "ctaEn" | "ctaAr", label: string, rtl = false, max = 120) => (
    <div>
      <Label htmlFor={id(k)}>{label}</Label>
      <Input id={id(k)} dir={rtl ? "rtl" : "ltr"} lang={rtl ? "ar" : "en"} maxLength={max} value={slide[k]} aria-invalid={k.startsWith("title") || k.startsWith("cta") ? !slide[k].trim() : undefined} onChange={(e) => update({ [k]: e.target.value })} />
    </div>
  );
  return (
    <li className={cn("rounded-sm border border-line bg-white", !slide.enabled && "opacity-70")}>
      <div className="flex flex-wrap items-center gap-3 p-3">
        <span className="relative aspect-[21/9] w-28 shrink-0 overflow-hidden rounded-xs border border-line">
          {slide.desktop ? <Image src={slide.desktop.src} alt="" fill sizes="112px" className="object-cover" /> : <span className={cn("absolute inset-0", swatch[slide.theme])} />}
        </span>
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-2 text-start">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{locale === "ar" ? slide.titleAr : slide.titleEn}</span>
            <span className="block truncate text-xs text-ink-500" dir="ltr">{slide.href}</span>
          </span>
          <ChevronDown className={cn("ms-auto size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        <Toggle checked={slide.enabled} onChange={(enabled) => update({ enabled })} label={slide.enabled ? t("shown") : t("hidden")} />
        <MoveButtons i={i} n={n} onMove={onMove} labels={{ up: t("moveUp"), down: t("moveDown") }} />
      </div>
      {open && (
        <div className="space-y-4 border-t border-line p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {field("titleEn", t("banner.titleEn"))}
            {field("titleAr", t("banner.titleAr"), true)}
            {field("subtitleEn", t("banner.subtitleEn"), false, 200)}
            {field("subtitleAr", t("banner.subtitleAr"), true, 200)}
            {field("ctaEn", t("banner.ctaEn"), false, 40)}
            {field("ctaAr", t("banner.ctaAr"), true, 40)}
          </div>
          <p className="text-xs text-ink-500">{t("banner.pctHint")}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor={id("href")}>{t("banner.link")}</Label>
              <Input id={id("href")} dir="ltr" value={slide.href} list="home-links" aria-invalid={!/^\/\S*$/.test(slide.href)} onChange={(e) => update({ href: e.target.value.trim() })} />
            </div>
            <div>
              <Label htmlFor={id("category")}>{t("banner.category")}</Label>
              <select id={id("category")} className={select} value={slide.category} onChange={(e) => update({ category: e.target.value })}>
                <option value="">{t("none")}</option>
                {cats.map((c) => <option key={c.slug} value={c.slug}>{tr({ en: c.nameEn, ar: c.nameAr }, locale)}</option>)}
              </select>
            </div>
            <fieldset>
              <legend className="mb-1 text-sm font-semibold">{t("banner.theme")}</legend>
              <div className="flex gap-2">
                {heroThemes.map((th) => (
                  <label key={th} className="cursor-pointer">
                    <input type="radio" name={id("theme")} className="peer sr-only" checked={slide.theme === th} onChange={() => update({ theme: th })} />
                    <span className={cn("block size-9 rounded-sm ring-offset-2 peer-checked:ring-2 peer-checked:ring-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400", swatch[th])} title={t(`themes.${th}`)} />
                    <span className="sr-only">{t(`themes.${th}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_10rem]">
            <ImageSlot id={id("img-d")} kind="desktop" label={t("banner.desktop")} hint={t("banner.desktopHint")} image={slide.desktop} onChange={(desktop) => update({ desktop })} />
            <ImageSlot id={id("img-dr")} kind="desktop" label={t("banner.desktopRtl")} hint={t("banner.desktopRtlHint")} image={slide.desktopRtl} onChange={(desktopRtl) => update({ desktopRtl })} />
            <ImageSlot id={id("img-m")} kind="mobile" label={t("banner.mobile")} hint={t("banner.mobileHint")} image={slide.mobile} onChange={(mobile) => update({ mobile })} />
          </div>
          <p className="text-xs text-ink-500">{t("banner.noImageHint")}</p>
          <Button variant="ghost" size="sm" className="text-sale" disabled={n <= 1} onClick={remove}>
            <Trash2 className="size-4" aria-hidden />
            {t("banner.delete")}
          </Button>
        </div>
      )}
    </li>
  );
}

export function HomeEditor({ initial, cats, products, savedInfo }: { initial: HomeContent; cats: Cat[]; products: Prod[]; savedInfo: string | null }) {
  const t = useTranslations("AdminUI.homepage");
  const tv = useTranslations("AdminUI.video");
  const locale = useLocale();
  const router = useRouter();
  const [v, setV] = useState<HomeContent>(initial);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string }>();
  const [saving, start] = useTransition();
  const change = (fn: (s: HomeContent) => HomeContent) => {
    setV(fn);
    setDirty(true);
  };
  const name = (c: { nameEn: string; nameAr: string }) => tr({ en: c.nameEn, ar: c.nameAr }, locale);
  const catSelect = (value: string, onChange: (v: string) => void, id: string, label: string) => (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={select} value={value} onChange={(e) => onChange(e.target.value)}>
        {cats.map((c) => <option key={c.slug} value={c.slug}>{name(c)}</option>)}
      </select>
    </div>
  );

  function save() {
    setMessage(undefined);
    start(async () => {
      const res = await saveHomeAction(v);
      if (!res.ok) return setMessage({ tone: "error", text: res.errors.includes("heroSlides.noneEnabled") ? t("errors.noBanner") : t("errors.generic", { fields: res.errors.join(", ") }) });
      setDirty(false);
      setMessage({ tone: "success", text: t("saved") });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 pb-24">
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
      <datalist id="home-links">
        {["/offers", "/new-arrivals", "/best-sellers", "/subscribe-and-save", "/multi-buy", ...cats.map((c) => `/c/${c.slug}`)].map((l) => <option key={l} value={l} />)}
      </datalist>

      {/* Layout */}
      <Box className="p-5">
        <h2 className="text-base font-bold">{t("layout")}</h2>
        <p className="mt-0.5 text-xs text-ink-500">{t("layoutHint")}</p>
        <ol className="mt-4 divide-y divide-line rounded-sm border border-line">
          {v.sections.map((sec, i) => (
            <li key={sec.key} className={cn("flex flex-wrap items-center gap-3 px-3 py-2.5", !sec.enabled && "bg-surface")}>
              <span className="w-6 text-center text-xs font-bold tabular-nums text-ink-500">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-semibold", !sec.enabled && "text-ink-500 line-through")}>{t(`sections.${sec.key}.name`)}</span>
                <span className="block text-xs text-ink-500">{t(`sections.${sec.key}.hint`)}</span>
              </span>
              <Toggle checked={sec.enabled} label={sec.enabled ? t("shown") : t("hidden")} onChange={(enabled) => change((s) => ({ ...s, sections: s.sections.map((x, j) => (j === i ? { ...x, enabled } : x)) }))} />
              <MoveButtons i={i} n={v.sections.length} labels={{ up: t("moveUp"), down: t("moveDown") }} onMove={(dir) => change((s) => ({ ...s, sections: move(s.sections, i, dir) }))} />
            </li>
          ))}
        </ol>
      </Box>

      {/* Hero banners */}
      <Box className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">{t("banners")}</h2>
            <p className="mt-0.5 text-xs text-ink-500">{t("bannersHint")}</p>
          </div>
          <Badge tone="neutral">{t("bannerCount", { shown: v.heroSlides.filter((s) => s.enabled).length, total: v.heroSlides.length })}</Badge>
        </div>
        <ul className="mt-4 space-y-2">
          {v.heroSlides.map((slide, i) => (
            <BannerCard
              key={slide.id}
              slide={slide}
              i={i}
              n={v.heroSlides.length}
              cats={cats}
              update={(patch) => change((s) => ({ ...s, heroSlides: s.heroSlides.map((x, j) => (j === i ? { ...x, ...patch } : x)) }))}
              remove={() => change((s) => ({ ...s, heroSlides: s.heroSlides.filter((_, j) => j !== i) }))}
              onMove={(dir) => change((s) => ({ ...s, heroSlides: move(s.heroSlides, i, dir) }))}
            />
          ))}
        </ul>
        {v.heroSlides.length < 8 && (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => change((s) => ({
            ...s,
            heroSlides: [...s.heroSlides, {
              id: `b${Date.now().toString(36)}`, enabled: false, titleEn: "New banner", titleAr: "بانر جديد", subtitleEn: "", subtitleAr: "",
              ctaEn: "Shop now", ctaAr: "تسوّق الآن", href: "/offers", theme: "teal", category: "", desktop: null, desktopRtl: null, mobile: null,
            }],
          }))}>
            <Plus className="size-4" aria-hidden />
            {t("addBanner")}
          </Button>
        )}
      </Box>

      {/* Category boxes */}
      <Box className="p-5">
        <h2 className="text-base font-bold">{t("boxes")}</h2>
        <p className="mt-0.5 text-xs text-ink-500">{t("boxesHint")}</p>
        <p className="mt-4 text-sm font-semibold">{t("row1")}</p>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          {v.quadRow1.map((slug, i) => <div key={i}>{catSelect(slug, (val) => change((s) => ({ ...s, quadRow1: s.quadRow1.map((x, j) => (j === i ? val : x)) })), `q1-${i}`, t("box", { n: i + 1 }))}</div>)}
        </div>
        <p className="mt-4 text-sm font-semibold">{t("row2")}</p>
        <div className="mt-2 grid gap-3 md:grid-cols-4">
          {v.quadRow2.map((slug, i) => <div key={i}>{catSelect(slug, (val) => change((s) => ({ ...s, quadRow2: s.quadRow2.map((x, j) => (j === i ? val : x)) })), `q2-${i}`, t("box", { n: i + 1 }))}</div>)}
        </div>
      </Box>

      {/* Promo tile + spotlights */}
      <Box className="p-5">
        <h2 className="text-base font-bold">{t("bento")}</h2>
        <p className="mt-0.5 text-xs text-ink-500">{t("bentoHint")}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(["eyebrowEn", "eyebrowAr", "titleEn", "titleAr"] as const).map((k) => (
            <div key={k}>
              <Label htmlFor={`promo-${k}`}>{t(`promo.${k}`)}</Label>
              <Input id={`promo-${k}`} dir={k.endsWith("Ar") ? "rtl" : "ltr"} maxLength={k.startsWith("title") ? 120 : 60} value={v.promo[k]} onChange={(e) => change((s) => ({ ...s, promo: { ...s.promo, [k]: e.target.value } }))} />
            </div>
          ))}
          <div>
            <Label htmlFor="promo-href">{t("banner.link")}</Label>
            <Input id="promo-href" dir="ltr" list="home-links" value={v.promo.href} onChange={(e) => change((s) => ({ ...s, promo: { ...s.promo, href: e.target.value.trim() } }))} />
          </div>
          {catSelect(v.promo.category, (val) => change((s) => ({ ...s, promo: { ...s.promo, category: val } })), "promo-category", t("promo.category"))}
          <ImageSlot id="promo-img" kind="promo" label={t("promo.image")} hint={t("promo.imageHint")} image={v.promo.image} onChange={(image) => change((s) => ({ ...s, promo: { ...s.promo, image } }))} />
          <ImageSlot id="promo-img-rtl" kind="promo" label={t("promo.imageRtl")} hint={t("promo.imageRtlHint")} image={v.promo.imageRtl} onChange={(imageRtl) => change((s) => ({ ...s, promo: { ...s.promo, imageRtl } }))} />
          <div className="md:col-span-2">
            <p className="mb-1 text-sm font-semibold">{t("promo.video")}</p>
            <VideoField
              area="homepage"
              value={v.promo.video?.src ?? null}
              hint={tv("promoHint")}
              onChange={(src) => change((s) => ({ ...s, promo: { ...s.promo, video: src ? { src, start: s.promo.video?.start ?? 0, end: s.promo.video?.end ?? 20 } : null } }))}
            />
            {v.promo.video && (
              <div className="mt-3 flex flex-wrap items-end gap-3">
                {(["start", "end"] as const).map((k) => (
                  <div key={k} className="w-40">
                    <Label htmlFor={`promo-video-${k}`}>{tv(k === "start" ? "loopStart" : "loopEnd")}</Label>
                    <Input
                      id={`promo-video-${k}`}
                      type="number"
                      min={0}
                      max={3600}
                      inputMode="numeric"
                      value={v.promo.video?.[k] ?? 0}
                      onChange={(e) => {
                        const n = Math.max(0, Math.min(3600, Math.round(Number(e.target.value) || 0)));
                        change((s) => ({ ...s, promo: { ...s.promo, video: s.promo.video && { ...s.promo.video, [k]: n } } }));
                      }}
                    />
                  </div>
                ))}
                <p className="pb-2 text-xs text-ink-500">{tv("loopHint")}</p>
              </div>
            )}
          </div>
        </div>
        <p className="mt-5 text-sm font-semibold">{t("spotlights")}</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {v.spotlights.map((slug, i) => (
            <div key={i}>
              <Label htmlFor={`spot-${i}`}>{t("spotlight", { n: i + 1 })}</Label>
              <select id={`spot-${i}`} className={select} value={slug} onChange={(e) => change((s) => ({ ...s, spotlights: s.spotlights.map((x, j) => (j === i ? e.target.value : x)) }))}>
                {!products.some((p) => p.slug === slug) && <option value={slug}>{slug ? t("unavailable", { slug }) : t("none")}</option>}
                {cats.map((c) => (
                  <optgroup key={c.slug} label={name(c)}>
                    {products.filter((p) => p.category === c.slug).map((p) => <option key={p.slug} value={p.slug}>{name(p)}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Box>

      {/* Sponsored video ad */}
      <Box className="p-5">
        <h2 className="text-base font-bold">{t("videoAd.title")}</h2>
        <p className="mt-0.5 text-xs text-ink-500">{t("videoAd.hint")}</p>
        <div className="mt-4 space-y-4">
          <VideoField
            area="homepage"
            value={v.videoAd.video?.src ?? null}
            hint={t("videoAd.videoHint")}
            onChange={(src) => change((s) => ({ ...s, videoAd: { ...s.videoAd, video: src ? { src, start: s.videoAd.video?.start ?? 0, end: s.videoAd.video?.end ?? 20 } : null } }))}
          />
          {v.videoAd.video && (
            <div className="flex flex-wrap gap-3">
              {(["start", "end"] as const).map((k) => (
                <div key={k} className="w-40">
                  <Label htmlFor={`ad-video-${k}`}>{tv(k === "start" ? "loopStart" : "loopEnd")}</Label>
                  <Input
                    id={`ad-video-${k}`}
                    type="number"
                    min={0}
                    max={3600}
                    inputMode="numeric"
                    value={v.videoAd.video?.[k] ?? 0}
                    onChange={(e) => {
                      const n = Math.max(0, Math.min(3600, Math.round(Number(e.target.value) || 0)));
                      change((s) => ({ ...s, videoAd: { ...s.videoAd, video: s.videoAd.video && { ...s.videoAd.video, [k]: n } } }));
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="ad-product">{t("videoAd.product")}</Label>
              <select id="ad-product" className={select} value={v.videoAd.productSlug} onChange={(e) => change((s) => ({ ...s, videoAd: { ...s.videoAd, productSlug: e.target.value } }))}>
                {!products.some((p) => p.slug === v.videoAd.productSlug) && (
                  <option value={v.videoAd.productSlug}>{v.videoAd.productSlug ? t("unavailable", { slug: v.videoAd.productSlug }) : t("none")}</option>
                )}
                {cats.map((c) => (
                  <optgroup key={c.slug} label={name(c)}>
                    {products.filter((p) => p.category === c.slug).map((p) => <option key={p.slug} value={p.slug}>{name(p)}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            {(["headlineEn", "headlineAr"] as const).map((k) => (
              <div key={k}>
                <Label htmlFor={`ad-${k}`}>{t(`videoAd.${k}`)}</Label>
                <Input id={`ad-${k}`} dir={k === "headlineAr" ? "rtl" : "ltr"} maxLength={120} value={v.videoAd[k]} onChange={(e) => change((s) => ({ ...s, videoAd: { ...s.videoAd, [k]: e.target.value } }))} />
              </div>
            ))}
          </div>
          <div>
            <Toggle checked={v.videoAd.inListings} label={t("videoAd.inListings")} onChange={(inListings) => change((s) => ({ ...s, videoAd: { ...s.videoAd, inListings } }))} />
            <p className="mt-1 text-xs text-ink-500">{t("videoAd.inListingsHint")}</p>
          </div>
          {(!v.videoAd.video || !v.videoAd.productSlug) && <p className="text-xs font-semibold text-accent-700">{t("videoAd.needsVideo")}</p>}
        </div>
      </Box>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:start-60">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <p className="me-auto text-xs text-ink-500">{dirty ? t("unsaved") : savedInfo ?? t("defaults")}</p>
          <Button variant="ghost" disabled={saving} onClick={() => { if (confirm(t("confirmReset"))) start(async () => { await resetHomeAction(); router.refresh(); }); }}>
            {t("reset")}
          </Button>
          <Link href="/" target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            {t("viewHomepage")}
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
          <Button variant="accent" disabled={saving || !dirty} onClick={save}>{saving ? t("saving") : t("save")}</Button>
        </div>
      </div>
    </div>
  );
}
