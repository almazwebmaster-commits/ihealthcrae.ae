/** Category colour keys → Tailwind classes (kept literal so Tailwind can see them). */
export const tints = {
  brand: { bg: "bg-pastel-mint", fg: "text-pastel-mint-ink", solid: "bg-brand-500" },
  accent: { bg: "bg-pastel-butter", fg: "text-pastel-butter-ink", solid: "bg-accent-500" },
  rose: { bg: "bg-pastel-blush", fg: "text-pastel-blush-ink", solid: "bg-rose-400" },
  violet: { bg: "bg-pastel-lavender", fg: "text-pastel-lavender-ink", solid: "bg-violet-400" },
  sky: { bg: "bg-pastel-sky", fg: "text-pastel-sky-ink", solid: "bg-sky-400" },
  red: { bg: "bg-pastel-peach", fg: "text-pastel-peach-ink", solid: "bg-orange-400" },
  emerald: { bg: "bg-pastel-sage", fg: "text-pastel-sage-ink", solid: "bg-lime-500" },
} as const;

export type TintKey = keyof typeof tints;

export function tintClasses(key: string) {
  return tints[key as TintKey] ?? tints.brand;
}
