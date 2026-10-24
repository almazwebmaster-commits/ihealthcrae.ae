/** Category colour keys → Tailwind classes (kept literal so Tailwind can see them). */
export const tints = {
  brand: { bg: "bg-brand-50", fg: "text-brand-600", solid: "bg-brand-600" },
  accent: { bg: "bg-accent-50", fg: "text-accent-700", solid: "bg-accent-500" },
  rose: { bg: "bg-rose-50", fg: "text-rose-600", solid: "bg-rose-600" },
  violet: { bg: "bg-violet-50", fg: "text-violet-600", solid: "bg-violet-600" },
  sky: { bg: "bg-sky-50", fg: "text-sky-600", solid: "bg-sky-600" },
  red: { bg: "bg-red-50", fg: "text-red-600", solid: "bg-red-600" },
  emerald: { bg: "bg-emerald-50", fg: "text-emerald-600", solid: "bg-emerald-600" },
} as const;

export type TintKey = keyof typeof tints;

export function tintClasses(key: string) {
  return tints[key as TintKey] ?? tints.brand;
}
