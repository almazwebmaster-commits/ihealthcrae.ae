import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ListingView } from "@/components/listing/ListingView";
import { resolveCategory } from "@/server/catalog";
import { tr } from "@/lib/i18n-utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/search">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Listing" });
  return { title: t("searchTitle"), robots: { index: false } };
}

export default async function SearchPage({ params, searchParams }: PageProps<"/[locale]/search">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Listing");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const catSlug = typeof sp.category === "string" ? sp.category : "";
  const found = catSlug ? await resolveCategory(catSlug) : undefined;

  return (
    <ListingView
      basePath="/search"
      title={q ? t("searchFor", { q }) : t("searchTitle")}
      subtitle={found ? tr((found.sub ?? found.category).name, locale) : undefined}
      breadcrumbs={[{ label: t("home"), href: "/" }, { label: t("searchTitle") }]}
      searchParams={sp}
      fixed={{ category: found ? catSlug : undefined }}
    />
  );
}
