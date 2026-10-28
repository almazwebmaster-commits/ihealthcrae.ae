"use client";

import { ArrowLeft, ArrowRight, ExternalLink, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { saveProductAction, setProductStatusAction } from "@/app/[locale]/admin/products/actions";
import { ProductCopyAssistant } from "@/components/admin/ProductCopyAssistant";
import { FormMessage } from "@/components/auth/AuthCard";
import { Badge } from "@/components/ui/Badge";
import { Box } from "@/components/ui/Box";
import { Button, buttonClass } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Link, useRouter } from "@/i18n/navigation";
import { productStatuses, productTags, slugify, type ProductInputT } from "@/lib/admin/product-input";
import { formatPrice, tr } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";

type Options = {
  brands: { slug: string; name: string }[];
  categories: { slug: string; nameEn: string; nameAr: string; children: { slug: string; nameEn: string; nameAr: string; googleCategoryId?: number | null }[] }[];
};

type Initial = ProductInputT & { sku?: string; rating?: number; reviews?: number };

const EMPTY: Initial = {
  slug: "", status: "DRAFT", nameEn: "", nameAr: "", descEn: "", descAr: "", brandSlug: "", newBrand: "",
  subcategory: "", price: 0, compareAt: null, stock: 0, lowStockAt: 5, tags: [], subscribePct: null, flashPct: null, flashStartsAt: "", flashEndsAt: "", tiers: [], variants: [], images: [],
};

const select = "h-10 w-full rounded-sm border border-line-strong bg-white px-3 text-sm focus:border-brand-500 focus:outline-none aria-invalid:border-sale";
const area = "w-full rounded-sm border border-line-strong bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Box className="p-5">
      <h2 className="text-base font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </Box>
  );
}

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

const NAME_MAX = 200;

/** Live / scheduled / ended badge for the flash deal being edited (times in UAE). */
function FlashStatus({ startsAt, endsAt }: { startsAt: string; endsAt: string }) {
  const t = useTranslations("AdminUI.editor.flash");
  // Compare as UAE-local strings to avoid timezone surprises in the browser.
  const [nowUae] = useState(() => new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 16));
  const state = !endsAt ? "noEnd" : endsAt <= nowUae ? "ended" : startsAt && startsAt > nowUae ? "scheduled" : "live";
  const tone = { live: "success", scheduled: "info", ended: "neutral", noEnd: "sale" } as const;
  return <Badge tone={tone[state]}>{t(`state.${state}`)}</Badge>;
}

/** Character count for product names; appears as a name gets long, turns red past the limit. */
function NameLength({ text }: { text: string }) {
  const t = useTranslations("AdminUI.editor");
  if (text.length <= 120) return null;
  const over = text.length > NAME_MAX;
  return (
    <p className={cn("mt-1 text-xs", over ? "font-semibold text-sale" : "text-ink-500")}>
      {t("nameLength", { count: text.length, max: NAME_MAX })}
      {over && ` ${t("nameTooLong")}`}
    </p>
  );
}

export function ProductEditor({ initial, options }: { initial?: Initial; options: Options }) {
  const t = useTranslations("AdminUI.editor");
  const tStatus = useTranslations("AdminUI.products.status");
  const locale = useLocale();
  const router = useRouter();
  const start = initial ?? EMPTY;
  const isNew = !start.id;

  const [v, setV] = useState<Initial>(start);
  // Money/number fields are edited as text so users can type freely.
  const [price, setPrice] = useState(start.price ? String(start.price) : "");
  const [compareAt, setCompareAt] = useState(start.compareAt != null ? String(start.compareAt) : "");
  const [stock, setStock] = useState(String(start.stock ?? 0));
  const [variantPrices, setVariantPrices] = useState(start.variants.map((o) => String(o.price)));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [category, setCategory] = useState(options.categories.find((c) => c.children.some((s) => s.slug === start.subcategory))?.slug ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string }>();
  const [saving, startSaving] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Initial>(k: K, value: Initial[K]) => setV((s) => ({ ...s, [k]: value }));
  const err = (k: string) => (errors[k] ? <p className="mt-1 text-xs font-semibold text-sale">{t(`errors.${errors[k]}` as "errors.required")}</p> : null);
  const name = (en: string, ar: string) => tr({ en, ar }, locale);
  const subs = options.categories.find((c) => c.slug === category)?.children ?? [];

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setMessage(undefined);
    const body = new FormData();
    for (const f of Array.from(files)) body.append("file", f);
    const res = await fetch("/api/admin/uploads", { method: "POST", body }).catch(() => null);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!res?.ok) return setMessage({ tone: "error", text: t("errors.uploadUnreadable") });
    const data = (await res.json()) as { images: Initial["images"]; errors: { error: string }[] };
    setV((s) => ({ ...s, images: [...s.images, ...data.images].slice(0, 12) }));
    if (data.errors.length) {
      const e = data.errors[0].error;
      setMessage({ tone: "error", text: t(e === "type" ? "errors.uploadType" : e === "size" ? "errors.uploadSize" : e === "storage" ? "errors.uploadStorage" : "errors.uploadUnreadable") });
    }
  }

  function moveImage(i: number, dir: -1 | 1) {
    setV((s) => {
      const imgs = [...s.images];
      const j = i + dir;
      if (j < 0 || j >= imgs.length) return s;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return { ...s, images: imgs };
    });
  }

  function submit() {
    const payload: ProductInputT = {
      ...v,
      price: num(price),
      compareAt: compareAt.trim() ? num(compareAt) : null,
      stock: Math.trunc(num(stock)),
      variants: v.variants.map((o, i) => ({ ...o, price: num(variantPrices[i] ?? "") })),
    };
    delete (payload as Partial<Initial>).sku;
    delete (payload as Partial<Initial>).rating;
    delete (payload as Partial<Initial>).reviews;
    setMessage(undefined);
    startSaving(async () => {
      const res = await saveProductAction(payload);
      if (!res.ok) {
        setErrors(res.errors);
        setMessage({ tone: "error", text: t("errors.generic") });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErrors({});
      setMessage({ tone: "success", text: t("saved") });
      if (isNew) router.replace(`/admin/products/${res.id}`);
      else router.refresh();
    });
  }

  return (
    <form
      className="space-y-4 pb-24"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}

      <Section title={t("basics")}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="nameEn">{t("nameEn")}</Label>
            <Input
              id="nameEn"
              dir="ltr"
              value={v.nameEn}
              aria-invalid={!!errors.nameEn}
              onChange={(e) => {
                const nameEn = e.target.value;
                setV((s) => ({ ...s, nameEn, slug: slugTouched ? s.slug : slugify(nameEn) }));
              }}
            />
            {err("nameEn") ?? <NameLength text={v.nameEn} />}
          </div>
          <div>
            <Label htmlFor="nameAr">{t("nameAr")}</Label>
            <Input id="nameAr" dir="rtl" lang="ar" value={v.nameAr} aria-invalid={!!errors.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
            {err("nameAr") ?? <NameLength text={v.nameAr} />}
          </div>
          <div>
            <Label htmlFor="slug">{t("slug")}</Label>
            <div className="flex items-center rounded-sm border border-line-strong bg-white focus-within:border-brand-500" dir="ltr">
              <span className="ps-3 text-xs text-ink-500">/p/</span>
              <input
                id="slug"
                value={v.slug}
                aria-invalid={!!errors.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                className="h-10 min-w-0 flex-1 bg-transparent px-1 text-sm focus:outline-none"
              />
            </div>
            {err("slug")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("sku")}</Label>
              <p className="flex h-10 items-center rounded-sm border border-line bg-surface px-3 text-sm text-ink-600" dir="ltr">
                {start.sku ?? t("skuAuto")}
              </p>
            </div>
            <div>
              <Label htmlFor="status">{t("status")}</Label>
              <select id="status" className={select} value={v.status} onChange={(e) => set("status", e.target.value as Initial["status"])}>
                {productStatuses.map((s) => (
                  <option key={s} value={s}>{tStatus(s)}</option>
                ))}
              </select>
            </div>
            <p className="col-span-2 -mt-2 text-xs text-ink-500">{t("statusHint")}</p>
          </div>
        </div>
      </Section>

      <Section title={t("descriptions")}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="descEn">{t("descEn")}</Label>
            <textarea id="descEn" dir="ltr" rows={8} className={area} value={v.descEn} onChange={(e) => set("descEn", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="descAr">{t("descAr")}</Label>
            <textarea id="descAr" dir="rtl" lang="ar" rows={8} className={area} value={v.descAr} onChange={(e) => set("descAr", e.target.value)} />
          </div>
        </div>
      </Section>

      <ProductCopyAssistant
        isLive={!isNew && start.status === "ACTIVE"}
        categories={options.categories}
        currentCategory={category}
        currentSubcategory={v.subcategory}
        onCategory={(cat, sub) => {
          setCategory(cat);
          set("subcategory", sub);
        }}
        product={{
          id: start.id,
          slug: v.slug,
          nameEn: v.nameEn,
          nameAr: v.nameAr,
          descEn: v.descEn,
          descAr: v.descAr,
          brand: v.newBrand || options.brands.find((b) => b.slug === v.brandSlug)?.name || "",
          category: options.categories.find((c) => c.slug === category)?.nameEn ?? "",
          subcategory: subs.find((s) => s.slug === v.subcategory)?.nameEn ?? "",
          options: v.variants.map((o) => o.labelEn).filter(Boolean),
          price: Number.isFinite(num(price)) ? num(price) : null,
        }}
        onApply={(field, value) => {
          if (field === "slug") setSlugTouched(true);
          setV((s) => ({
            ...s,
            [field]: value,
            // New products keep their URL in step with the title; live products keep theirs.
            ...(field === "nameEn" && !slugTouched ? { slug: slugify(value) } : {}),
          }));
        }}
      />

      <Section title={t("organisation")}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="brand">{t("brand")}</Label>
            <select id="brand" className={select} aria-invalid={!!errors.brandSlug} value={v.brandSlug} onChange={(e) => setV((s) => ({ ...s, brandSlug: e.target.value, newBrand: "" }))}>
              <option value="">{t("chooseBrand")}</option>
              {options.brands.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </select>
            <Input
              className="mt-2"
              placeholder={t("newBrand")}
              aria-label={t("newBrand")}
              value={v.newBrand}
              onChange={(e) => setV((s) => ({ ...s, newBrand: e.target.value, brandSlug: e.target.value ? "" : s.brandSlug }))}
            />
            {err("brandSlug")}
          </div>
          <div>
            <Label htmlFor="category">{t("category")}</Label>
            <select
              id="category"
              className={select}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                set("subcategory", "");
              }}
            >
              <option value="">{t("chooseCategory")}</option>
              {options.categories.map((c) => (
                <option key={c.slug} value={c.slug}>{name(c.nameEn, c.nameAr)}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="subcategory">{t("subcategory")}</Label>
            <select id="subcategory" className={select} aria-invalid={!!errors.subcategory} value={v.subcategory} disabled={!category} onChange={(e) => set("subcategory", e.target.value)}>
              <option value="">{t("chooseSubcategory")}</option>
              {subs.map((s) => (
                <option key={s.slug} value={s.slug}>{name(s.nameEn, s.nameAr)}</option>
              ))}
            </select>
            {err("subcategory")}
          </div>
        </div>
      </Section>

      <Section title={t("pricing")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="price">{t("price")}</Label>
            <Input id="price" inputMode="decimal" dir="ltr" value={price} aria-invalid={!!errors.price} onChange={(e) => setPrice(e.target.value)} />
            {err("price")}
          </div>
          <div>
            <Label htmlFor="compareAt">{t("compareAt")}</Label>
            <Input id="compareAt" inputMode="decimal" dir="ltr" value={compareAt} aria-invalid={!!errors.compareAt} onChange={(e) => setCompareAt(e.target.value)} />
            {errors.compareAt ? err("compareAt") : <p className="mt-1 text-xs text-ink-500">{t("compareAtHint")}</p>}
          </div>
          <div>
            <Label htmlFor="stock">{t("stock")}</Label>
            <Input id="stock" inputMode="numeric" dir="ltr" value={stock} aria-invalid={!!errors.stock} onChange={(e) => setStock(e.target.value)} />
            {err("stock")}
            <div className="mt-2 flex items-center gap-2">
              <Label htmlFor="lowStockAt" className="mb-0 shrink-0 text-xs font-normal text-ink-600">{t("lowStockAt")}</Label>
              <Input id="lowStockAt" inputMode="numeric" dir="ltr" className="h-8 w-20" value={v.lowStockAt}
                onChange={(e) => set("lowStockAt", Math.max(0, Math.trunc(Number(e.target.value) || 0)))} />
            </div>
            {!isNew && (
              <Link href={`/admin/inventory/${start.id}`} className="mt-1 inline-block text-xs font-semibold text-brand-700 hover:underline">{t("stockHistory")}</Link>
            )}
          </div>
        </div>
        {start.reviews ? <p className="mt-3 text-xs text-ink-500">{t("rating", { rating: start.rating ?? 0, count: start.reviews })}</p> : null}
      </Section>

      <Section title={t("photos")} hint={t("photosHint")}>
        <ul className="flex flex-wrap gap-3">
          {v.images.map((img, i) => (
            <li key={img.url} className="w-32">
              <div className="relative aspect-square overflow-hidden rounded-sm border border-line bg-white">
                <Image src={img.url} alt="" fill sizes="128px" className="object-contain" />
                {i === 0 && <span className="absolute start-1 top-1 rounded-xs bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white">{t("main")}</span>}
              </div>
              <div className="mt-1 flex justify-between">
                <button type="button" aria-label={t("moveEarlier")} disabled={i === 0} onClick={() => moveImage(i, -1)} className="inline-flex size-7 items-center justify-center rounded-xs hover:bg-surface disabled:opacity-30">
                  <ArrowLeft className="flip-rtl size-4" aria-hidden />
                </button>
                <button type="button" aria-label={t("remove")} onClick={() => setV((s) => ({ ...s, images: s.images.filter((_, j) => j !== i) }))} className="inline-flex size-7 items-center justify-center rounded-xs text-sale hover:bg-sale-50">
                  <Trash2 className="size-4" aria-hidden />
                </button>
                <button type="button" aria-label={t("moveLater")} disabled={i === v.images.length - 1} onClick={() => moveImage(i, 1)} className="inline-flex size-7 items-center justify-center rounded-xs hover:bg-surface disabled:opacity-30">
                  <ArrowRight className="flip-rtl size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
          {v.images.length < 12 && (
            <li className="w-32">
              <label className={cn("flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-line-strong bg-surface text-center text-xs font-semibold text-ink-600 hover:border-brand-400 hover:text-brand-700", uploading && "pointer-events-none opacity-60")}>
                {uploading ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <ImagePlus className="size-6" aria-hidden />}
                {uploading ? t("uploading") : t("upload")}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
              </label>
            </li>
          )}
        </ul>
      </Section>

      <Section title={t("options")} hint={t("optionsHint")}>
        {v.variants.length > 0 && (
          <div className="mb-3 space-y-2">
            {v.variants.map((o, i) => (
              <div key={i} className="grid items-start gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
                <Input dir="ltr" placeholder={t("optionLabelEn")} aria-label={t("optionLabelEn")} value={o.labelEn} aria-invalid={!!errors[`variants.${i}.labelEn`]}
                  onChange={(e) => setV((s) => ({ ...s, variants: s.variants.map((x, j) => (j === i ? { ...x, labelEn: e.target.value } : x)) }))} />
                <Input dir="rtl" lang="ar" placeholder={t("optionLabelAr")} aria-label={t("optionLabelAr")} value={o.labelAr} aria-invalid={!!errors[`variants.${i}.labelAr`]}
                  onChange={(e) => setV((s) => ({ ...s, variants: s.variants.map((x, j) => (j === i ? { ...x, labelAr: e.target.value } : x)) }))} />
                <Input dir="ltr" inputMode="decimal" placeholder={t("optionPrice")} aria-label={t("optionPrice")} value={variantPrices[i] ?? ""} aria-invalid={!!errors[`variants.${i}.price`]}
                  onChange={(e) => setVariantPrices((p) => p.map((x, j) => (j === i ? e.target.value : x)))} />
                <Button variant="ghost" className="text-sale" aria-label={t("remove")} onClick={() => {
                  setV((s) => ({ ...s, variants: s.variants.filter((_, j) => j !== i) }));
                  setVariantPrices((p) => p.filter((_, j) => j !== i));
                }}>
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => {
          setV((s) => ({ ...s, variants: [...s.variants, { labelEn: "", labelAr: "", price: 0 }] }));
          setVariantPrices((p) => [...p, price]);
        }}>
          <Plus className="size-4" aria-hidden />
          {t("addOption")}
        </Button>
      </Section>

      <Section title={t("offers")}>
        <div className="grid gap-6 lg:grid-cols-3">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t("labels")}</legend>
            <div className="space-y-2">
              {productTags.map((tag) => (
                <label key={tag} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-brand-600" checked={v.tags.includes(tag)}
                    onChange={(e) => set("tags", e.target.checked ? [...v.tags, tag] : v.tags.filter((x) => x !== tag))} />
                  {t(`tag.${tag}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <Label htmlFor="subscribe">{t("subscribe")}</Label>
            <select id="subscribe" className={select} value={v.subscribePct ?? ""} onChange={(e) => set("subscribePct", e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t("subscribeOff")}</option>
              {[5, 10, 15, 20, 25].map((p) => (
                <option key={p} value={p}>{t("subscribePct", { pct: p })}</option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t("multibuy")}</legend>
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-brand-600" checked={v.tiers.length > 0}
                onChange={(e) => set("tiers", e.target.checked ? [{ minQty: 2, pct: 5 }, { minQty: 3, pct: 10 }] : [])} />
              {t("multibuyEnable")}
            </label>
            {v.tiers.map((tier, i) => (
              <div key={i} className="mb-2 flex items-center gap-2 text-sm">
                <span className="w-24 text-xs text-ink-600">{t("tierQty")}</span>
                <Input className="h-9 w-16" dir="ltr" inputMode="numeric" value={tier.minQty} aria-label={t("tierQty")}
                  onChange={(e) => set("tiers", v.tiers.map((x, j) => (j === i ? { ...x, minQty: Number(e.target.value) || 0 } : x)))} />
                <Input className="h-9 w-16" dir="ltr" inputMode="numeric" value={tier.pct} aria-label={t("tierPct")}
                  onChange={(e) => set("tiers", v.tiers.map((x, j) => (j === i ? { ...x, pct: Number(e.target.value) || 0 } : x)))} />
                <span className="text-xs text-ink-600">{t("tierPct")}</span>
                <button type="button" aria-label={t("remove")} className="text-sale" onClick={() => set("tiers", v.tiers.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
            {v.tiers.length > 0 && v.tiers.length < 5 && (
              <Button variant="ghost" size="sm" onClick={() => set("tiers", [...v.tiers, { minQty: (v.tiers.at(-1)?.minQty ?? 1) + 1, pct: (v.tiers.at(-1)?.pct ?? 0) + 5 }])}>
                <Plus className="size-4" aria-hidden />
                {t("addTier")}
              </Button>
            )}
            {err("tiers")}
          </fieldset>
        </div>
      </Section>

      <Section title={t("flash.title")} hint={t("flash.hint")}>
        <div className="grid gap-4 md:grid-cols-[10rem_1fr_1fr]">
          <div>
            <Label htmlFor="flashPct">{t("flash.pct")}</Label>
            <select id="flashPct" className={select} value={v.flashPct ?? ""} onChange={(e) => set("flashPct", e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t("flash.off")}</option>
              {[5, 10, 15, 20, 25, 30, 40, 50, 60, 70].map((p) => (
                <option key={p} value={p}>{t("flash.pctOption", { pct: p })}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="flashStartsAt">{t("flash.starts")}</Label>
            <Input id="flashStartsAt" type="datetime-local" dir="ltr" disabled={v.flashPct == null} value={v.flashStartsAt} onChange={(e) => set("flashStartsAt", e.target.value)} />
            <p className="mt-1 text-xs text-ink-500">{t("flash.startsHint")}</p>
          </div>
          <div>
            <Label htmlFor="flashEndsAt">{t("flash.ends")}</Label>
            <Input id="flashEndsAt" type="datetime-local" dir="ltr" disabled={v.flashPct == null} value={v.flashEndsAt} aria-invalid={!!errors.flashEndsAt} onChange={(e) => set("flashEndsAt", e.target.value)} />
            {err("flashEndsAt")}
          </div>
        </div>
        {v.flashPct != null && Number.isFinite(num(price)) && (
          <p className="mt-3 text-sm">
            <FlashStatus startsAt={v.flashStartsAt} endsAt={v.flashEndsAt} />{" "}
            <span className="text-ink-700">{t("flash.preview", { price: formatPrice(Math.round(num(price) * (100 - v.flashPct)) / 100, locale), was: formatPrice(num(price), locale) })}</span>
          </p>
        )}
      </Section>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur print:hidden lg:start-60">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link href="/admin/products" className="me-auto text-sm font-semibold text-ink-600 hover:underline">{t("back")}</Link>
          {!isNew && v.status === "ACTIVE" && (
            <Link href={`/p/${start.slug}`} target="_blank" className={buttonClass("ghost", "md")}>
              {t("viewInStore")}
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          )}
          {!isNew && (
            <Button variant="outline" disabled={saving} onClick={() => startSaving(async () => {
              const next = start.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED";
              await setProductStatusAction(start.id!, next);
              set("status", next);
              router.refresh();
            })}>
              {start.status === "ARCHIVED" ? t("restore") : t("archive")}
            </Button>
          )}
          <Button type="submit" variant="accent" disabled={saving || uploading}>
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </form>
  );
}
