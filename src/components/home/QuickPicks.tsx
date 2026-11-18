import { ChevronRight, Crown, Layers, PackageOpen, Tag, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const picks: { key: "deals" | "new" | "best" | "bulk"; href: string; icon: LucideIcon; card: string; circle: string; title: string; sub: string; badge?: boolean }[] = [
  { key: "deals", href: "/offers", icon: Tag, card: "bg-pastel-peach border-orange-100", circle: "text-orange-500", title: "text-pastel-peach-ink", sub: "text-orange-700" },
  { key: "new", href: "/new-arrivals", icon: PackageOpen, card: "bg-pastel-lavender border-violet-100", circle: "text-violet-500", title: "text-pastel-lavender-ink", sub: "text-violet-700", badge: true },
  { key: "best", href: "/best-sellers", icon: Crown, card: "bg-pastel-butter border-amber-100", circle: "text-amber-500", title: "text-pastel-butter-ink", sub: "text-amber-700" },
  { key: "bulk", href: "/multi-buy", icon: Layers, card: "bg-pastel-sky border-sky-100", circle: "text-sky-600", title: "text-pastel-sky-ink", sub: "text-sky-700" },
];

/**
 * Four pastel shortcuts: deals, new arrivals, best sellers, bulk savings.
 * Phones: a compact 4-up row of icon tiles (no sideways scrolling). Larger screens: icon beside the text.
 */
export function QuickPicks() {
  const t = useTranslations("Home.quickPicks");
  return (
    <section>
      <h2 className="mb-3 text-xl font-extrabold text-ink-900 sm:mb-4 sm:text-2xl">{t("title")}</h2>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
        {picks.map(({ key, href, icon: Icon, card, circle, title, sub, badge }) => (
          <li key={key}>
            <Link
              href={href}
              className={cn(
                "group relative flex h-full flex-col items-center gap-2 rounded-2xl border px-1 pb-3 pt-3 text-center transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-card",
                "sm:flex-row sm:gap-4 sm:rounded-3xl sm:p-4 sm:text-start",
                card,
              )}
            >
              <span className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white/75 sm:size-16">
                <Icon className={cn("size-6 sm:size-8", circle)} strokeWidth={1.7} aria-hidden />
                {badge && (
                  <span className="absolute -end-2 -top-1 rounded-full bg-sale px-1.5 py-0.5 text-[9px] font-extrabold uppercase leading-none text-white sm:text-[10px]">
                    {t("newBadge")}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-xs font-extrabold leading-tight sm:text-lg", title)}>{t(`${key}.title`)}</span>
                <span className={cn("mt-0.5 hidden text-sm font-medium sm:block", sub)}>{t(`${key}.sub`)}</span>
              </span>
              <ChevronRight
                className={cn("flip-rtl hidden size-5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 sm:block", circle)}
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
