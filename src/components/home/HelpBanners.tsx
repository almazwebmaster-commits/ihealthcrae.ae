import { ChevronRight, MessagesSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { whatsappUrl } from "@/lib/whatsapp";

/** "Not sure what to choose?" card opening a WhatsApp chat. Hidden until a WhatsApp number is set. */
export function HelpCard() {
  const t = useTranslations("Home.help");
  const href = whatsappUrl(t("message"));
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener" className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-box hover:shadow-card sm:p-5">
      <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-white">
        <MessagesSquare className="size-7" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold text-ink-900">{t("title")}</span>
        <span className="block text-sm text-ink-600">{t("body")}</span>
      </span>
      <ChevronRight className="flip-rtl size-5 shrink-0 text-ink-500" aria-hidden />
    </a>
  );
}

/** Clinic / pharmacy / care-home bulk pricing banner. Its button opens WhatsApp; hidden until a number is set. */
export function BulkQuoteBanner() {
  const t = useTranslations("Home.bulk");
  const href = whatsappUrl(t("message"));
  if (!href) return null;
  return (
    <section className="overflow-hidden rounded-3xl bg-brand-800 p-6 text-white sm:p-8">
      <h2 className="text-xl font-extrabold sm:text-2xl">{t("title")}</h2>
      <p className="mt-2 max-w-xl text-sm text-brand-100 sm:text-base">{t("body")}</p>
      <a href={href} target="_blank" rel="noopener" className="mt-5 inline-flex h-12 items-center rounded-full bg-white px-6 text-base font-bold text-brand-800 hover:bg-brand-50">
        {t("cta")}
      </a>
    </section>
  );
}

/** Round WhatsApp button floating above the page (and the phone tab bar). Hidden until a number is set. */
export function WhatsAppFab() {
  const t = useTranslations("Home");
  const label = t("whatsapp");
  const href = whatsappUrl(t("help.message"));
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={label}
      className="fixed bottom-24 end-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-pop transition-transform hover:scale-105 md:bottom-6 md:end-6"
    >
      <MessagesSquare className="size-7" aria-hidden />
    </a>
  );
}
