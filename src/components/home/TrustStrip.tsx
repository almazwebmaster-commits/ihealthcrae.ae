import { Banknote, Lock, PackageCheck, RotateCcw, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

/** One white card with the five store promises in a row (scrolls sideways on phones). */
export function TrustStrip() {
  const t = useTranslations("Home.trust");
  const items = [
    { icon: PackageCheck, title: t("genuine"), body: t("genuineBody") },
    { icon: Truck, title: t("fast"), body: t("fastBody") },
    { icon: Banknote, title: t("cod"), body: t("codBody") },
    { icon: RotateCcw, title: t("returns"), body: t("returnsBody") },
    { icon: Lock, title: t("secure"), body: t("secureBody") },
  ];
  return (
    <section aria-label={t("label")} className="rounded-2xl bg-white shadow-box">
      <ul className="no-scrollbar max-lg:fade-end flex gap-6 overflow-x-auto px-4 py-4 max-lg:pe-10 lg:justify-between">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex shrink-0 items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink-900">{title}</span>
              <span className="block text-xs text-ink-600">{body}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
