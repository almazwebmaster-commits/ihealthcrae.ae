import { z } from "zod";
import { heroSlides } from "@/data/home";
import { VIDEO_SRC } from "@/lib/cloudinary-video";
import { IMAGE_SRC } from "@/lib/image-src";
import { slotImage } from "@/lib/images";

/** Homepage blocks staff can reorder and switch on/off, in their default order. */
export const homeSectionKeys = [
  "hero", "quickPicks", "healthNeeds", "trust", "offers", "featured1", "deals", "reminder", "bestSellers",
  "categoryTabs", "featured2", "recentlyViewed", "newArrivals", "brands", "help", "bulkQuote",
] as const;
export type HomeSectionKey = (typeof homeSectionKeys)[number];

/**
 * Bumped when the default homepage layout changes. Saved content from an older layout gets the
 * new default section order; once staff save in the editor, their order is kept.
 */
export const HOME_LAYOUT_VERSION = 2;

/** Icons available for "Shop by health need" tiles (mapped to lucide icons in the storefront). */
export const healthNeedIcons = ["drop", "elderly", "baby", "firstAid", "heart", "hygiene", "pill", "thermometer", "leaf", "shield"] as const;
export const collectionTints = ["brand", "accent", "rose", "violet", "sky", "red", "emerald"] as const;

export const heroThemes = ["teal", "rose", "ink", "amber", "light"] as const;

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

const HealthNeedInput = z.object({
  labelEn: text(40).min(1),
  labelAr: text(40).min(1),
  icon: z.enum(healthNeedIcons),
  tint: z.enum(collectionTints),
  /** Top-level or subcategory slug the tile links to (its product count is shown) */
  category: z.string().min(1).max(80),
});

/** "Featured" product collection: a tinted band with a product rail from one category. */
const CollectionInput = z.object({
  badgeEn: text(24), badgeAr: text(24),
  titleEn: text(80).min(1), titleAr: text(80).min(1),
  subtitleEn: text(120), subtitleAr: text(120),
  category: z.string().min(1).max(80),
  tint: z.enum(collectionTints),
});

export const HomeContentInput = z.object({
  layoutVersion: z.number().int().optional(),
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
    /** Product spotlight: when set, the tile shows this product's photo, price and the feature chips instead of the photo above */
    productSlug: z.string().max(120).default(""),
    featuresEn: z.array(text(30)).max(3).default([]),
    featuresAr: z.array(text(30)).max(3).default([]),
  }),
  videoAd: VideoAdInput.default({ video: null, productSlug: "", headlineEn: "", headlineAr: "", inListings: true }),
  healthNeeds: z.array(HealthNeedInput).max(9),
  collections: z.array(CollectionInput).length(2),
  /** Coupon codes shown under "Offers for you" (only active, valid ones appear) */
  offerCodes: z.array(z.string().trim().max(40)).max(6),
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
      productSlug: "",
      featuresEn: [],
      featuresAr: [],
    },
    videoAd: { video: null, productSlug: "", headlineEn: "", headlineAr: "", inListings: true },
    layoutVersion: HOME_LAYOUT_VERSION,
    healthNeeds: [
      { labelEn: "Diabetes care", labelAr: "رعاية السكري", icon: "drop", tint: "sky", category: "glucose" },
      { labelEn: "Elderly care", labelAr: "رعاية كبار السن", icon: "elderly", tint: "emerald", category: "incontinence-care" },
      { labelEn: "Baby & mum", labelAr: "الطفل والأم", icon: "baby", tint: "rose", category: "mother-baby" },
      { labelEn: "First aid", labelAr: "الإسعافات الأولية", icon: "firstAid", tint: "accent", category: "first-aid" },
      { labelEn: "Heart & BP", labelAr: "القلب والضغط", icon: "heart", tint: "red", category: "blood-pressure" },
      { labelEn: "Hygiene", labelAr: "النظافة الشخصية", icon: "hygiene", tint: "violet", category: "personal-care" },
    ],
    collections: [
      {
        badgeEn: "Featured", badgeAr: "مميّز",
        titleEn: "Diabetes Care Essentials", titleAr: "أساسيات رعاية السكري",
        subtitleEn: "Glucose meters, CGM sensors & test strips", subtitleAr: "أجهزة قياس السكر وحساسات المراقبة المستمرة وشرائط الاختبار",
        category: "glucose", tint: "sky",
      },
      {
        badgeEn: "Featured", badgeAr: "مميّز",
        titleEn: "First Aid & Wound Care", titleAr: "الإسعافات الأولية والعناية بالجروح",
        subtitleEn: "Dressings, plasters & antiseptics for every home", subtitleAr: "ضمادات ولصقات ومطهرات لكل منزل",
        category: "first-aid", tint: "accent",
      },
    ],
    offerCodes: [],
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
  const sameLayout = stored.layoutVersion === HOME_LAYOUT_VERSION;
  const saved = (sameLayout && Array.isArray(stored.sections) ? stored.sections : []).filter(
    (s): s is { key: HomeSectionKey; enabled: boolean } =>
      !!s && typeof s === "object" && (homeSectionKeys as readonly string[]).includes((s as { key?: string }).key ?? "") && typeof (s as { enabled?: unknown }).enabled === "boolean",
  );
  const sections = saved.filter((s, i) => saved.findIndex((x) => x.key === s.key) === i);
  homeSectionKeys.forEach((key, i) => {
    if (sections.some((s) => s.key === key)) return;
    const after = i ? sections.findIndex((s) => s.key === homeSectionKeys[i - 1]) : -1;
    sections.splice(after + 1, 0, { key, enabled: true });
  });
  return { ...v, layoutVersion: HOME_LAYOUT_VERSION, sections };
}
