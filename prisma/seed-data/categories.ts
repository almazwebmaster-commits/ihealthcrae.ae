import type { L } from "@/lib/i18n-utils";
import type { TintKey } from "@/lib/tints";

export type CategorySeed = {
  slug: string;
  name: L;
  tint: TintKey;
  children: { slug: string; name: L }[];
};

export const categorySeeds: CategorySeed[] = [
  {
    slug: "health-medicine",
    name: { en: "Health & medicine", ar: "الصحة والأدوية" },
    tint: "brand",
    children: [
      { slug: "pain-fever", name: { en: "Pain & fever", ar: "الألم والحمى" } },
      { slug: "cold-flu", name: { en: "Cold & flu", ar: "البرد والإنفلونزا" } },
      { slug: "digestive", name: { en: "Digestive health", ar: "صحة الجهاز الهضمي" } },
      { slug: "first-aid", name: { en: "First aid", ar: "الإسعافات الأولية" } },
    ],
  },
  {
    slug: "vitamins-supplements",
    name: { en: "Vitamins & supplements", ar: "الفيتامينات والمكملات" },
    tint: "accent",
    children: [
      { slug: "multivitamins", name: { en: "Multivitamins", ar: "الفيتامينات المتعددة" } },
      { slug: "vitamin-d", name: { en: "Vitamin D & calcium", ar: "فيتامين د والكالسيوم" } },
      { slug: "omega-3", name: { en: "Omega-3 & fish oil", ar: "أوميغا 3 وزيت السمك" } },
      { slug: "immunity", name: { en: "Immunity", ar: "المناعة" } },
    ],
  },
  {
    slug: "beauty-skincare",
    name: { en: "Beauty & skincare", ar: "التجميل والعناية بالبشرة" },
    tint: "rose",
    children: [
      { slug: "cleansers", name: { en: "Cleansers", ar: "الغسولات" } },
      { slug: "moisturisers", name: { en: "Moisturisers", ar: "المرطبات" } },
      { slug: "sun-care", name: { en: "Sun care", ar: "الحماية من الشمس" } },
      { slug: "serums", name: { en: "Serums", ar: "السيروم" } },
    ],
  },
  {
    slug: "personal-care",
    name: { en: "Personal care", ar: "العناية الشخصية" },
    tint: "violet",
    children: [
      { slug: "oral-care", name: { en: "Oral care", ar: "العناية بالفم" } },
      { slug: "bath-body", name: { en: "Bath & body", ar: "الاستحمام والجسم" } },
      { slug: "deodorants", name: { en: "Deodorants", ar: "مزيلات العرق" } },
      { slug: "shaving", name: { en: "Shaving", ar: "الحلاقة" } },
    ],
  },
  {
    slug: "mother-baby",
    name: { en: "Mother & baby", ar: "الأم والطفل" },
    tint: "sky",
    children: [
      { slug: "diapers", name: { en: "Diapers & wipes", ar: "الحفاضات والمناديل" } },
      { slug: "baby-food", name: { en: "Baby food", ar: "طعام الأطفال" } },
      { slug: "baby-skincare", name: { en: "Baby skincare", ar: "العناية ببشرة الطفل" } },
      { slug: "feeding", name: { en: "Feeding", ar: "الرضاعة والتغذية" } },
    ],
  },
  {
    slug: "medical-devices",
    name: { en: "Medical devices", ar: "الأجهزة الطبية" },
    tint: "red",
    children: [
      { slug: "blood-pressure", name: { en: "Blood pressure monitors", ar: "أجهزة قياس الضغط" } },
      { slug: "thermometers", name: { en: "Thermometers", ar: "موازين الحرارة" } },
      { slug: "glucose", name: { en: "Glucose monitoring", ar: "قياس السكر" } },
      { slug: "nebulizers", name: { en: "Nebulizers", ar: "أجهزة البخار" } },
    ],
  },
  {
    slug: "sports-nutrition",
    name: { en: "Sports nutrition", ar: "التغذية الرياضية" },
    tint: "emerald",
    children: [
      { slug: "protein", name: { en: "Protein", ar: "البروتين" } },
      { slug: "pre-workout", name: { en: "Pre-workout & creatine", ar: "ما قبل التمرين والكرياتين" } },
      { slug: "hydration", name: { en: "Energy & hydration", ar: "الطاقة والترطيب" } },
      { slug: "bars", name: { en: "Bars & snacks", ar: "ألواح ووجبات خفيفة" } },
    ],
  },
];
