import type { L } from "@/lib/i18n-utils";

export type BrandSeed = { slug: string; name: string; country?: L };

const UK: L = { en: "United Kingdom", ar: "المملكة المتحدة" };
const US: L = { en: "United States", ar: "الولايات المتحدة" };
const CA: L = { en: "Canada", ar: "كندا" };
const FR: L = { en: "France", ar: "فرنسا" };
const DE: L = { en: "Germany", ar: "ألمانيا" };
const JP: L = { en: "Japan", ar: "اليابان" };
const CH: L = { en: "Switzerland", ar: "سويسرا" };
const NL: L = { en: "Netherlands", ar: "هولندا" };
const CN: L = { en: "China", ar: "الصين" };
const DK: L = { en: "Denmark", ar: "الدنمارك" };

export const brandSeeds: BrandSeed[] = [
  { slug: "panadol", name: "Panadol", country: UK },
  { slug: "strepsils", name: "Strepsils", country: UK },
  { slug: "vicks", name: "Vicks", country: US },
  { slug: "gaviscon", name: "Gaviscon", country: UK },
  { slug: "dettol", name: "Dettol", country: UK },
  { slug: "centrum", name: "Centrum", country: US },
  { slug: "solgar", name: "Solgar", country: US },
  { slug: "natures-bounty", name: "Nature's Bounty", country: US },
  { slug: "jamieson", name: "Jamieson", country: CA },
  { slug: "cetaphil", name: "Cetaphil", country: US },
  { slug: "cerave", name: "CeraVe", country: US },
  { slug: "la-roche-posay", name: "La Roche-Posay", country: FR },
  { slug: "bioderma", name: "Bioderma", country: FR },
  { slug: "neutrogena", name: "Neutrogena", country: US },
  { slug: "sensodyne", name: "Sensodyne", country: UK },
  { slug: "oral-b", name: "Oral-B", country: US },
  { slug: "nivea", name: "NIVEA", country: DE },
  { slug: "gillette", name: "Gillette", country: US },
  { slug: "pampers", name: "Pampers", country: US },
  { slug: "cerelac", name: "Cerelac", country: CH },
  { slug: "mustela", name: "Mustela", country: FR },
  { slug: "philips-avent", name: "Philips Avent", country: NL },
  { slug: "omron", name: "Omron", country: JP },
  { slug: "braun", name: "Braun", country: DE },
  { slug: "accu-chek", name: "Accu-Chek", country: CH },
  { slug: "optimum-nutrition", name: "Optimum Nutrition", country: US },
  { slug: "myprotein", name: "Myprotein", country: UK },
  { slug: "quest", name: "Quest", country: US },
  // Real catalogue (Oct 2026)
  { slug: "sinocare", name: "Sinocare", country: CN },
  { slug: "vms", name: "VMS" },
  { slug: "bambo-nature", name: "Bambo Nature", country: DK },
];
