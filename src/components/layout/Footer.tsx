import { Banknote, ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { getCategories } from "@/server/catalog";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/i18n-utils";

const payments = ["VISA", "Mastercard", "Apple Pay", "Google Pay"];

export async function Footer() {
  const categories = await getCategories();
  const locale = await getLocale();
  const t = await getTranslations("Footer");
  const tBrand = await getTranslations("Brand");

  const columns = [
    {
      title: t("shop"),
      links: categories.map((c) => ({ href: `/c/${c.slug}`, label: tr(c.name, locale) })),
    },
    {
      title: t("care"),
      links: [
        { href: "/contact", label: t("contact") },
        { href: "/orders/track", label: t("track") },
        { href: "/returns", label: t("returns") },
        { href: "/shipping", label: t("shipping") },
        { href: "/faq", label: t("faq") },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "/about", label: t("about") },
        { href: "/careers", label: t("careers") },
        { href: "/privacy", label: t("privacy") },
        { href: "/terms", label: t("terms") },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-brand-950 text-sm text-brand-100">
      {/* Newsletter strip */}
      <div className="bg-brand-900">
        <div className="container-site flex flex-col items-start gap-3 py-5 md:flex-row md:items-center md:justify-between">
          <p className="font-semibold text-white">{t("newsletter")}</p>
          <form className="flex w-full max-w-md gap-2">
            <input
              type="email"
              required
              placeholder={t("emailPlaceholder")}
              aria-label={t("emailPlaceholder")}
              className="h-10 min-w-0 flex-1 rounded-full bg-white px-4 text-ink-900 placeholder:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            />
            <Button type="submit" variant="accent">
              {t("subscribe")}
            </Button>
          </form>
        </div>
      </div>

      <div className="container-site grid grid-cols-2 gap-8 py-10 md:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 md:col-span-3 lg:col-span-2">
          <Logo tone="dark" />
          <p className="mt-3 max-w-xs text-brand-200">{tBrand("tagline")}</p>
          <p className="mt-4 inline-flex items-start gap-2 text-xs text-brand-200">
            <ShieldCheck className="size-4 shrink-0 text-accent-500" aria-hidden />
            {t("genuine")}
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-brand-200">
            {t("rights", { year: new Date().getFullYear() })}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="me-1 text-xs text-brand-200">{t("payWith")}</span>
            {payments.map((p) => (
              <span
                key={p}
                dir="ltr"
                className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white"
              >
                {p}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 rounded-md bg-accent-500 px-2.5 py-1 text-[11px] font-bold text-ink-900">
              <Banknote className="size-3.5" aria-hidden />
              {t("cod")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
