import { z } from "zod";
import { heroSlides } from "@/data/home";
import { IMAGE_SRC } from "@/lib/image-src";
import { slotImage } from "@/lib/images";

/** Homepage blocks staff can reorder and switch on/off, in their default order. */
export const homeSectionKeys = ["hero", "categories", "savings", "mosaic1", "deals", "bento", "bestSellers", "brands", "mosaic2", "newArrivals", "trust"] as const;
export type HomeSectionKey = (typeof homeSectionKeys)[number];

export const heroThemes = ["teal", "rose", "ink", "amber"] as const;

/** Banner image sizes the homepage uses (pixels). */
export const BANNER_SIZES = { desktop: { width: 1568, height: 672 }, mobile: { width: 1080, height: 1350 }, promo: { width: 1200, height: 1200 } } as const;
export type BannerKind = keyof typeof BANNER_SIZES;

const image = z.object({ src: z.string().regex(IMAGE_SRC), width: z.number().int().positive(), height: z.number().int().positive() }).nullable();
const text = (max: number) => z.string().trim().max(max);
const link = z.string().trim().max(300).regex(/^\/[^\s]*$/, "link");

export const HeroSlideInput = z.object({
  id: z.string().min(1).max(40),
  enabled: z.boolean(),
  titleEn: text(120).min(1),
  titleAr: text(120).min(1),
  subtitleEn: text(200),
  subtitleAr: text(200),
  ctaEn: text(40).min(1),
  ctaAr: text(40).min(1),
  href: link,
  theme: z.enum(heroThemes),
  /** Top-level category: decorative icon and the "{pct}" value in titles */
  category: z.string().max(80),
  desktop: image,
  desktopRtl: image,
  mobile: image,
});

export const HomeContentInput = z.object({
  sections: z.array(z.object({ key: z.enum(homeSectionKeys), enabled: z.boolean() })).length(homeSectionKeys.length),
  heroSlides: z.array(HeroSlideInput).min(1).max(8),
  /** Category boxes: first mosaic row (3 boxes + cash-on-delivery promo) and second row (4 boxes) */
  quadRow1: z.array(z.string().max(80)).length(3),
  quadRow2: z.array(z.string().max(80)).length(4),
  /** Product web addresses for the 4 spotlight tiles */
  spotlights: z.array(z.string().max(120)).length(4),
  promo: z.object({
    eyebrowEn: text(60), eyebrowAr: text(60),
    titleEn: text(120).min(1), titleAr: text(120).min(1),
    href: link,
    /** Category whose best discount fills "{pct}" */
    category: z.string().max(80),
    /** Square background photo; text sits on its lower part. Arabic falls back to `image`. */
    image: image.default(null),
    imageRtl: image.default(null),
  }),
});

export type HomeContent = z.infer<typeof HomeContentInput>;
export type HeroSlideContent = z.infer<typeof HeroSlideInput>;

/** What the homepage showed before it became editable — used until staff save changes. */
export function defaultHomeContent(): HomeContent {
  return {
    sections: homeSectionKeys.map((key) => ({ key, enabled: true })),
    heroSlides: heroSlides.map((s) => ({
      id: s.id,
      enabled: true,
      titleEn: s.title.en, titleAr: s.title.ar,
      subtitleEn: s.subtitle.en, subtitleAr: s.subtitle.ar,
      ctaEn: s.cta.en, ctaAr: s.cta.ar,
      href: s.href,
      theme: s.theme,
      category: s.category,
      desktop: slotImage(`${s.slot}-D`) ?? null,
      desktopRtl: slotImage(`${s.slot}-DR`) ?? null,
      mobile: slotImage(`${s.slot}-M`) ?? null,
    })),
    quadRow1: ["vitamins-supplements", "beauty-skincare", "mother-baby"],
    quadRow2: ["medical-devices", "sports-nutrition", "personal-care", "health-medicine"],
    spotlights: ["vms-wrist-blood-pressure-monitor", "on-gold-standard-whey", "oral-b-io-series-5", "dettol-first-aid-kit"],
    promo: {
      eyebrowEn: "Dermatologist favourites", eyebrowAr: "المفضلة لدى أطباء الجلد",
      titleEn: "Up to {pct}% off the skincare edit", titleAr: "خصم يصل إلى {pct}% على تشكيلة العناية بالبشرة",
      href: "/c/beauty-skincare?sale=1",
      category: "beauty-skincare",
      image: null,
      imageRtl: null,
    },
  };
}

/** Stored content can be from an older version: keep what is valid, fill the rest from defaults. */
export function normalizeHomeContent(raw: unknown): HomeContent {
  const def = defaultHomeContent();
  const parsed = HomeContentInput.partial().safeParse(raw);
  if (!parsed.success) return def;
  const v = { ...def, ...Object.fromEntries(Object.entries(parsed.data).filter(([, x]) => x !== undefined)) } as HomeContent;
  // Sections: keep saved order, append any blocks added in a later version.
  const known = v.sections.filter((s) => (homeSectionKeys as readonly string[]).includes(s.key));
  for (const key of homeSectionKeys) if (!known.some((s) => s.key === key)) known.push({ key, enabled: true });
  return { ...v, sections: known };
}
