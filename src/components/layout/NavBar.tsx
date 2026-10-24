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
    <nav className="relative border-b border-brand-950 bg-brand-800 text-sm text-white">
      <div className="container-site flex h-10 items-center gap-1">
        <AllCategoriesMenu label={t("allCategories")} viewAllLabel={tc("viewAll")} categories={menu} />

        <ul className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto">
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
                className="inline-block rounded-sm px-2 py-1.5 font-medium text-brand-50 hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/offers"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-accent-500 px-2.5 py-1 font-bold text-ink-900 hover:bg-accent-400"
        >
          <Tag className="size-3.5" aria-hidden />
          {t("offers")}
        </Link>
      </div>
    </nav>
  );
}
