import type { L } from "./i18n-utils";

export const emirates = [
  { slug: "abu-dhabi", name: { en: "Abu Dhabi", ar: "أبوظبي" } },
  { slug: "dubai", name: { en: "Dubai", ar: "دبي" } },
  { slug: "sharjah", name: { en: "Sharjah", ar: "الشارقة" } },
  { slug: "ajman", name: { en: "Ajman", ar: "عجمان" } },
  { slug: "umm-al-quwain", name: { en: "Umm Al Quwain", ar: "أم القيوين" } },
  { slug: "ras-al-khaimah", name: { en: "Ras Al Khaimah", ar: "رأس الخيمة" } },
  { slug: "fujairah", name: { en: "Fujairah", ar: "الفجيرة" } },
] as const satisfies readonly { slug: string; name: L }[];

export type EmirateSlug = (typeof emirates)[number]["slug"];

export const emirateSlugs = emirates.map((e) => e.slug) as [EmirateSlug, ...EmirateSlug[]];

export function emirateName(slug: string, locale: string) {
  const e = emirates.find((x) => x.slug === slug);
  return e ? (locale === "ar" ? e.name.ar : e.name.en) : slug;
}
