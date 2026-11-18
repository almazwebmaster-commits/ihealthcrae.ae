import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CategoryIcon } from "@/components/catalog/CategoryIcon";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/i18n-utils";
import { tintClasses } from "@/lib/tints";
import { cn } from "@/lib/utils";
import { getCategories } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/[locale]/categories">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Categories" });
  return { title: t("title") };
}

/** Every category with its subcategories (the phone tab bar's Categories tab). */
export default async function CategoriesPage({ params }: PageProps<"/[locale]/categories">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Categories");
  const categories = await getCategories();

  return (
    <div className="container-site space-y-5 py-5 lg:py-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{t("title")}</h1>
        <p className="mt-0.5 text-sm text-ink-600">{t("subtitle")}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const tint = tintClasses(c.tint);
          return (
            <li key={c.slug} className="rounded-2xl bg-white p-4 shadow-box">
              <Link href={`/c/${c.slug}`} className="group flex items-center gap-3">
                <span className={cn("inline-flex size-12 shrink-0 items-center justify-center rounded-full", tint.bg, tint.fg)}>
                  <CategoryIcon slug={c.slug} className="size-6" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-base font-bold text-ink-900 group-hover:text-brand-700">{tr(c.name, locale)}</span>
                <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-700">
                  {t("viewAll")}
                  <ChevronRight className="flip-rtl size-4" aria-hidden />
                </span>
              </Link>
              {c.children.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {c.children.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/c/${s.slug}`} className="inline-block rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-800 hover:border-brand-400 hover:bg-brand-50">
                        {tr(s.name, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
