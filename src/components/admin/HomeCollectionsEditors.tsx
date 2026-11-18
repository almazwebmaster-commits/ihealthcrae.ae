"use client";

import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { collectionTints, healthNeedIcons, type HomeContent } from "@/lib/home-content";
import { tr } from "@/lib/i18n-utils";

export type EditorCat = { slug: string; nameEn: string; nameAr: string; children: { slug: string; nameEn: string; nameAr: string }[] };
export type EditorCoupon = { code: string; descriptionEn: string };

const select = "h-10 w-full rounded-sm border border-line-strong bg-white px-3 text-sm focus:border-brand-500 focus:outline-none";
const MAX_NEEDS = 9;
const MAX_CODES = 6;

/** Category picker: top-level categories, each followed by its subcategories. */
function CategorySelect({ id, value, cats, onChange }: { id: string; value: string; cats: EditorCat[]; onChange: (v: string) => void }) {
  const locale = useLocale();
  const name = (c: { nameEn: string; nameAr: string }) => tr({ en: c.nameEn, ar: c.nameAr }, locale);
  return (
    <select id={id} className={select} value={value} onChange={(e) => onChange(e.target.value)}>
      {cats.map((c) => (
        <optgroup key={c.slug} label={name(c)}>
          <option value={c.slug}>{name(c)}</option>
          {c.children.map((s) => (
            <option key={s.slug} value={s.slug}>
              {"— "}
              {name(s)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

/** "Shop by health need" tiles: label, icon, colour and the category each links to. */
export function HealthNeedsEditor({
  needs,
  cats,
  onChange,
}: {
  needs: HomeContent["healthNeeds"];
  cats: EditorCat[];
  onChange: (needs: HomeContent["healthNeeds"]) => void;
}) {
  const t = useTranslations("AdminUI.homepage");
  const set = (i: number, patch: Partial<HomeContent["healthNeeds"][number]>) => onChange(needs.map((n, j) => (j === i ? { ...n, ...patch } : n)));
  return (
    <Box className="p-5">
      <h2 className="text-base font-bold">{t("needs.title")}</h2>
      <p className="mt-0.5 text-xs text-ink-500">{t("needs.hint")}</p>
      <ul className="mt-4 space-y-3">
        {needs.map((n, i) => (
          <li key={i} className="grid items-end gap-2 rounded-lg border border-line p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_10rem_8rem_1fr_auto]">
            <div>
              <Label htmlFor={`need-${i}-en`}>{t("needs.labelEn")}</Label>
              <Input id={`need-${i}-en`} dir="ltr" maxLength={40} value={n.labelEn} onChange={(e) => set(i, { labelEn: e.target.value })} />
            </div>
            <div>
              <Label htmlFor={`need-${i}-ar`}>{t("needs.labelAr")}</Label>
              <Input id={`need-${i}-ar`} dir="rtl" maxLength={40} value={n.labelAr} onChange={(e) => set(i, { labelAr: e.target.value })} />
            </div>
            <div>
              <Label htmlFor={`need-${i}-icon`}>{t("needs.icon")}</Label>
              <select id={`need-${i}-icon`} className={select} value={n.icon} onChange={(e) => set(i, { icon: e.target.value as typeof n.icon })}>
                {healthNeedIcons.map((k) => (
                  <option key={k} value={k}>
                    {t(`icons.${k}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor={`need-${i}-tint`}>{t("needs.tint")}</Label>
              <select id={`need-${i}-tint`} className={select} value={n.tint} onChange={(e) => set(i, { tint: e.target.value as typeof n.tint })}>
                {collectionTints.map((k) => (
                  <option key={k} value={k}>
                    {t(`tints.${k}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor={`need-${i}-cat`}>{t("needs.category")}</Label>
              <CategorySelect id={`need-${i}-cat`} value={n.category} cats={cats} onChange={(category) => set(i, { category })} />
            </div>
            <Button variant="ghost" size="icon" aria-label={t("needs.remove")} className="text-sale" onClick={() => onChange(needs.filter((_, j) => j !== i))}>
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      {needs.length < MAX_NEEDS && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => onChange([...needs, { labelEn: "", labelAr: "", icon: "pill", tint: "brand", category: cats[0]?.slug ?? "" }])}
        >
          <Plus className="size-4" aria-hidden />
          {t("needs.add")}
        </Button>
      )}
    </Box>
  );
}

/** The two "Featured" collections: badge, title, subtitle, colour and source category. */
export function CollectionsEditor({
  collections,
  cats,
  onChange,
}: {
  collections: HomeContent["collections"];
  cats: EditorCat[];
  onChange: (collections: HomeContent["collections"]) => void;
}) {
  const t = useTranslations("AdminUI.homepage");
  const set = (i: number, patch: Partial<HomeContent["collections"][number]>) => onChange(collections.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const texts = [
    ["badgeEn", 24],
    ["badgeAr", 24],
    ["titleEn", 80],
    ["titleAr", 80],
    ["subtitleEn", 120],
    ["subtitleAr", 120],
  ] as const;
  return (
    <Box className="p-5">
      <h2 className="text-base font-bold">{t("collections.title")}</h2>
      <p className="mt-0.5 text-xs text-ink-500">{t("collections.hint")}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {collections.map((c, i) => (
          <fieldset key={i} className="space-y-3 rounded-lg border border-line p-4">
            <legend className="px-1 text-sm font-semibold">{t("collections.n", { n: i + 1 })}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {texts.map(([k, max]) => (
                <div key={k}>
                  <Label htmlFor={`col-${i}-${k}`}>{t(`collections.${k}`)}</Label>
                  <Input id={`col-${i}-${k}`} dir={k.endsWith("Ar") ? "rtl" : "ltr"} maxLength={max} value={c[k]} onChange={(e) => set(i, { [k]: e.target.value })} />
                </div>
              ))}
              <div>
                <Label htmlFor={`col-${i}-cat`}>{t("collections.category")}</Label>
                <CategorySelect id={`col-${i}-cat`} value={c.category} cats={cats} onChange={(category) => set(i, { category })} />
              </div>
              <div>
                <Label htmlFor={`col-${i}-tint`}>{t("collections.tint")}</Label>
                <select id={`col-${i}-tint`} className={select} value={c.tint} onChange={(e) => set(i, { tint: e.target.value as typeof c.tint })}>
                  {collectionTints.map((k) => (
                    <option key={k} value={k}>
                      {t(`tints.${k}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>
        ))}
      </div>
    </Box>
  );
}

/** Which coupons appear under "Offers for you" (up to 6, in the order ticked). */
export function OfferCodesEditor({ codes, coupons, onChange }: { codes: string[]; coupons: EditorCoupon[]; onChange: (codes: string[]) => void }) {
  const t = useTranslations("AdminUI.homepage");
  return (
    <Box className="p-5">
      <h2 className="text-base font-bold">{t("offerCodes.title")}</h2>
      <p className="mt-0.5 text-xs text-ink-500">{t("offerCodes.hint")}</p>
      {coupons.length ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => {
            const checked = codes.includes(c.code);
            return (
              <li key={c.code}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-brand-600"
                    checked={checked}
                    disabled={!checked && codes.length >= MAX_CODES}
                    aria-label={`${t("offerCodes.pick")}: ${c.code}`}
                    onChange={(e) => onChange(e.target.checked ? [...codes, c.code] : codes.filter((x) => x !== c.code))}
                  />
                  <span className="min-w-0">
                    <span className="block font-mono font-bold" dir="ltr">
                      {c.code}
                    </span>
                    {c.descriptionEn && <span className="block truncate text-xs text-ink-500">{c.descriptionEn}</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-600">{t("offerCodes.none")}</p>
      )}
    </Box>
  );
}
