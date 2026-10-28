import { z } from "zod";
import { heroSlides } from "@/data/home";
import { VIDEO_SRC } from "@/lib/cloudinary-video";
import { IMAGE_SRC } from "@/lib/image-src";
import { slotImage } from "@/lib/images";

/** Homepage blocks staff can reorder and switch on/off, in their default order. */
export const homeSectionKeys = ["hero", "categories", "savings", "mosaic1", "deals", "bento", "bestSellers", "videoAd", "brands", "mosaic2", "newArrivals", "trust"] as const;
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

const clip = z.object({ src: z.string().regex(VIDEO_SRC), start: z.number().int().min(0).max(3600), end: z.number().int().min(0).max(3600) });

/** Sponsored video ad (Amazon Sponsored Brands style): a clip next to the product it advertises. */
const VideoAdInput = z.object({
  video: clip.nullable().default(null),
  productSlug: z.string().max(120).default(""),
  headlineEn: text(120).default(""),
  headlineAr: text(120).default(""),
  /** Also show it in category and search results that include the product's category or brand */
  inListings: z.boolean().default(true),
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
    /** Silent looping clip played over the photo (Cloudinary video, from `start` to `end` seconds) */
    video: clip.nullable().default(null),
  }),
  videoAd: VideoAdInput.default({ video: null, productSlug: "", headlineEn: "", headlineAr: "", inListings: true }),
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
      video: null,
    },
    videoAd: { video: null, productSlug: "", headlineEn: "", headlineAr: "", inListings: true },
  };
}

/**
 * Stored content can be from an older version: keep what is valid, fill the rest from defaults.
 * Each part is checked on its own, so one outdated value never throws away the rest of the page.
 */
export function normalizeHomeContent(raw: unknown): HomeContent {
  const def = defaultHomeContent();
  const stored = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const v = { ...def };
  for (const key of Object.keys(HomeContentInput.shape) as (keyof HomeContent)[]) {
    if (key === "sections" || stored[key] === undefined) continue;
    const parsed = HomeContentInput.shape[key].safeParse(stored[key]);
    if (parsed.success) Object.assign(v, { [key]: parsed.data });
  }
  // Sections: keep the saved order and switches; a block added in a later version goes after the
  // block that precedes it in the default order.
  const saved = (Array.isArray(stored.sections) ? stored.sections : []).filter(
    (s): s is { key: HomeSectionKey; enabled: boolean } =>
      !!s && typeof s === "object" && (homeSectionKeys as readonly string[]).includes((s as { key?: string }).key ?? "") && typeof (s as { enabled?: unknown }).enabled === "boolean",
  );
  const sections = saved.filter((s, i) => saved.findIndex((x) => x.key === s.key) === i);
  homeSectionKeys.forEach((key, i) => {
    if (sections.some((s) => s.key === key)) return;
    const after = i ? sections.findIndex((s) => s.key === homeSectionKeys[i - 1]) : -1;
    sections.splice(after + 1, 0, { key, enabled: true });
  });
  return { ...v, sections };
}
