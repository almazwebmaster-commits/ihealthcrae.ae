import { Tag } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getCategories } from "@/server/catalog";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/i18n-utils";
import { tintClasses } from "@/lib/tints";
import { AllCategoriesMenu } from "./AllCategoriesMenu";

export async function NavBar() {
  const categories = await getCategories();
  const locale = await getLocale();
  const t = await getTranslations("Nav");
  const tc = await getTranslations("Common");

  const menu = categories.map((c) => ({
    slug: c.slug,
    name: tr(c.name, locale),
    tint: { bg: tintClasses(c.tint).bg, fg: tintClasses(c.tint).fg },
    children: c.children.map((s) => ({ slug: s.slug, name: tr(s.name, locale) })),
  }));

  return (
    <nav className="relative border-b border-line bg-white text-sm text-ink-800 shadow-box">
      <div className="container-site flex h-12 items-center gap-1.5">
        <AllCategoriesMenu label={t("allCategories")} viewAllLabel={tc("viewAll")} categories={menu} />

        <ul className="no-scrollbar flex flex-1 items-center gap-0.5 overflow-x-auto">
          {[
            { href: "/subscribe-and-save", label: t("subscribe") },
            { href: "/multi-buy", label: t("multibuy") },
            { href: "/best-sellers", label: t("bestSellers") },
            { href: "/new-arrivals", label: t("newArrivals") },
            ...categories.map((c) => ({ href: `/c/${c.slug}`, label: tr(c.name, locale) })),
          ].map((item) => (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className="inline-block rounded-full px-3 py-2 font-medium text-ink-700 transition-colors hover:bg-surface-sunken hover:text-ink-900"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/offers"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sale-50 px-3.5 py-2 font-bold text-pastel-coral-ink transition-colors hover:bg-pastel-coral"
        >
          <Tag className="size-3.5" aria-hidden />
          {t("offers")}
        </Link>
      </div>
    </nav>
  );
}
