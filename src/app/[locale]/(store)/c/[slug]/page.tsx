import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ListingView } from "@/components/listing/ListingView";
import { tr } from "@/lib/i18n-utils";
import { resolveCategory } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/[locale]/c/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await resolveCategory(slug);
  if (!found) return {};
  return { title: tr((found.sub ?? found.category).name, locale) };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/[locale]/c/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const found = await resolveCategory(slug);
  if (!found) notFound();

  const t = await getTranslations("Listing");
  const { category, sub } = found;
  const crumbs = [
    { label: t("home"), href: "/" },
    { label: tr(category.name, locale), href: sub ? `/c/${category.slug}` : undefined },
    ...(sub ? [{ label: tr(sub.name, locale) }] : []),
  ];

  return (
    <ListingView
      basePath={`/c/${slug}`}
      title={tr((sub ?? category).name, locale)}
      breadcrumbs={crumbs}
      searchParams={await searchParams}
      fixed={{ category: slug }}
      category={category}
      activeSlug={slug}
    />
  );
}
