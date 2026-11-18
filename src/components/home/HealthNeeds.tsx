import {
  Accessibility, Baby, BriefcaseMedical, ChevronRight, Droplet, Heart, Leaf, Pill, ShieldCheck, Sparkles, Thermometer, type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { collectionStyles } from "@/lib/collection-styles";
import type { HomeContent, healthNeedIcons } from "@/lib/home-content";
import { tr } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";

export const healthNeedIcon: Record<(typeof healthNeedIcons)[number], LucideIcon> = {
  drop: Droplet, elderly: Accessibility, baby: Baby, firstAid: BriefcaseMedical, heart: Heart,
  hygiene: Sparkles, pill: Pill, thermometer: Thermometer, leaf: Leaf, shield: ShieldCheck,
};

/** "Shop by health need": tiles linking to a category, with its live product count. */
export function HealthNeeds({ needs, counts }: { needs: HomeContent["healthNeeds"]; counts: Map<string, number> }) {
  const t = useTranslations("Home.healthNeeds");
  const locale = useLocale();
  if (!needs.length) return null;
  return (
    <section>
      <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">{t("title")}</h2>
      <p className="mb-4 mt-0.5 text-sm text-ink-600">{t("subtitle")}</p>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {needs.map((n, i) => {
          const Icon = healthNeedIcon[n.icon];
          const s = collectionStyles[n.tint];
          return (
            <li key={`${n.category}-${i}`}>
              <Link
                href={`/c/${n.category}`}
                className={cn("group relative flex h-full min-h-16 items-center gap-2.5 overflow-hidden rounded-2xl border p-2.5 transition-shadow hover:shadow-card sm:gap-3 sm:p-4", s.tile)}
              >
                <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full sm:size-12", s.icon)}>
                  <Icon className="size-5 sm:size-5.5" aria-hidden />
                </span>
                <span className="relative min-w-0 flex-1">
                  {/* Two lines on phones rather than cutting the name off mid-word */}
                  <span className="line-clamp-2 text-[13px] font-bold leading-tight text-ink-900 sm:line-clamp-1 sm:text-base">
                    {tr({ en: n.labelEn, ar: n.labelAr }, locale)}
                  </span>
                  <span className="mt-0.5 block whitespace-nowrap text-xs text-ink-600 sm:text-sm">{t("count", { count: counts.get(n.category) ?? 0 })}</span>
                </span>
                <ChevronRight
                  className={cn("flip-rtl relative hidden size-5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 sm:block", s.ink)}
                  aria-hidden
                />
                {/* Faint oversized icon as a watermark in the corner */}
                <Icon aria-hidden className={cn("pointer-events-none absolute -bottom-3 end-6 size-16 opacity-[0.07]", s.ink)} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
