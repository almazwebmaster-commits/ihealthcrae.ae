import { BellRing, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** "Never run out" strip pointing to Subscribe & save. */
export function ReminderBanner() {
  const t = useTranslations("Home.reminder");
  return (
    <Link
      href="/subscribe-and-save"
      className="group flex items-center gap-4 rounded-2xl border border-brand-100 bg-pastel-mint p-4 transition-shadow hover:shadow-card sm:p-5"
    >
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-box">
        <BellRing className="size-5.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-ink-900">{t("title")}</span>
        <span className="block text-sm text-ink-600">{t("body")}</span>
      </span>
      <ChevronRight className="flip-rtl size-5 shrink-0 text-brand-700 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden />
    </Link>
  );
}
