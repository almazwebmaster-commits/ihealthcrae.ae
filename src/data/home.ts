import type { L } from "@/lib/i18n-utils";

export type HeroTheme = "teal" | "rose" | "ink" | "amber";

export type HeroSlide = {
  id: string;
  /** "{pct}" is replaced with the category's real maximum discount at render time. */
  title: L;
  subtitle: L;
  cta: L;
  href: string;
  theme: HeroTheme;
  category: string; // drives the decorative icon
  /** Image slot prefix: `${slot}-D` (desktop) and `${slot}-M` (mobile) in the image manifest. */
  slot: string;
};

// Original homepage banners: the defaults for Admin › Homepage until staff publish their own (src/lib/home-content.ts).
export const heroSlides: HeroSlide[] = [
  {
    id: "vitamins",
    title: { en: "Your daily vitamins, up to {pct}% off", ar: "فيتاميناتك اليومية بخصم يصل إلى {pct}%" },
    subtitle: { en: "Centrum, Solgar, Jamieson and more", ar: "سنتروم وسولجار وجاميسون والمزيد" },
    cta: { en: "Shop vitamin deals", ar: "تسوّق عروض الفيتامينات" },
    href: "/c/vitamins-supplements?sale=1",
    theme: "teal",
    category: "vitamins-supplements",
    slot: "H1",
  },
  {
    id: "skincare",
    title: { en: "Skincare dermatologists recommend", ar: "عناية بالبشرة يوصي بها أطباء الجلد" },
    subtitle: { en: "CeraVe, La Roche-Posay, Cetaphil & Bioderma", ar: "سيرافي ولاروش بوزيه وسيتافيل وبيوديرما" },
    cta: { en: "Shop skincare", ar: "تسوّق العناية بالبشرة" },
    href: "/c/beauty-skincare",
    theme: "rose",
    category: "beauty-skincare",
    slot: "H2",
  },
  {
    id: "devices",
    title: { en: "Monitor your health at home", ar: "راقب صحتك في المنزل" },
    subtitle: { en: "Blood pressure monitors, glucose meters & CGM", ar: "أجهزة قياس الضغط والسكر والمراقبة المستمرة للسكر" },
    cta: { en: "Shop devices", ar: "تسوّق الأجهزة" },
    href: "/c/medical-devices",
    theme: "ink",
    category: "medical-devices",
    slot: "H3",
  },
  {
    id: "baby",
    title: { en: "Everything for mum & baby", ar: "كل ما تحتاجه الأم والطفل" },
    subtitle: { en: "Diapers, wipes & baby essentials — with cash on delivery", ar: "حفاضات ومناديل ومستلزمات الأطفال — مع الدفع عند الاستلام" },
    cta: { en: "Shop mother & baby", ar: "تسوّق الأم والطفل" },
    href: "/c/mother-baby",
    theme: "amber",
    category: "mother-baby",
    slot: "H4",
  },
];
