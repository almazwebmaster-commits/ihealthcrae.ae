import type { collectionTints } from "@/lib/home-content";

type Tint = (typeof collectionTints)[number];

/** Classes per tint for featured collections and health-need tiles (literal so Tailwind sees them). */
export const collectionStyles: Record<Tint, { band: string; badge: string; pill: string; tile: string; icon: string; ink: string }> = {
  brand: { band: "bg-pastel-mint", badge: "bg-brand-700 text-white", pill: "bg-brand-100 text-brand-800", tile: "border-brand-100 bg-pastel-mint/60", icon: "bg-brand-600 text-white", ink: "text-brand-700" },
  accent: { band: "bg-pastel-peach", badge: "bg-pastel-peach-ink text-white", pill: "bg-orange-100 text-pastel-peach-ink", tile: "border-orange-100 bg-pastel-peach/60", icon: "bg-orange-500 text-white", ink: "text-pastel-peach-ink" },
  rose: { band: "bg-pastel-blush", badge: "bg-pastel-blush-ink text-white", pill: "bg-rose-100 text-pastel-blush-ink", tile: "border-rose-100 bg-pastel-blush/60", icon: "bg-rose-500 text-white", ink: "text-pastel-blush-ink" },
  violet: { band: "bg-pastel-lavender", badge: "bg-pastel-lavender-ink text-white", pill: "bg-violet-100 text-pastel-lavender-ink", tile: "border-violet-100 bg-pastel-lavender/60", icon: "bg-violet-500 text-white", ink: "text-pastel-lavender-ink" },
  sky: { band: "bg-pastel-sky", badge: "bg-pastel-sky-ink text-white", pill: "bg-sky-100 text-pastel-sky-ink", tile: "border-sky-100 bg-pastel-sky/60", icon: "bg-sky-600 text-white", ink: "text-pastel-sky-ink" },
  red: { band: "bg-pastel-coral", badge: "bg-pastel-coral-ink text-white", pill: "bg-red-100 text-pastel-coral-ink", tile: "border-red-100 bg-pastel-coral/60", icon: "bg-red-500 text-white", ink: "text-pastel-coral-ink" },
  emerald: { band: "bg-pastel-sage", badge: "bg-pastel-sage-ink text-white", pill: "bg-lime-100 text-pastel-sage-ink", tile: "border-lime-100 bg-pastel-sage/60", icon: "bg-emerald-600 text-white", ink: "text-pastel-sage-ink" },
};
