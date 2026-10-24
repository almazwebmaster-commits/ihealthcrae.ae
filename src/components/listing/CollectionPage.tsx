import { getTranslations } from "next-intl/server";
import type { ProductQuery, SortKey } from "@/lib/catalog-types";
import type { SearchParams } from "@/lib/listing";
import { ListingView } from "./ListingView";

type CollectionKey = "offers" | "newArrivals" | "bestSellers" | "subscribe" | "multibuy";

/** Curated collections: offers, new arrivals, best sellers, Subscribe & save, multi-buy. */
export async function CollectionPage({
  basePath,
  titleKey,
  fixed,
  defaultSort,
  searchParams,
}: {
  basePath: string;
  titleKey: CollectionKey;
  fixed: Pick<ProductQuery, "tag" | "subscribable" | "multibuy">;
  defaultSort: SortKey;
  searchParams: SearchParams;
}) {
  const t = await getTranslations("Listing");
  const sp = { sort: defaultSort, ...searchParams };
  return (
    <ListingView
      basePath={basePath}
      title={t(`collections.${titleKey}`)}
      subtitle={titleKey === "subscribe" || titleKey === "multibuy" ? t(`collections.${titleKey}Sub`) : undefined}
      breadcrumbs={[{ label: t("home"), href: "/" }, { label: t(`collections.${titleKey}`) }]}
      searchParams={sp}
      fixed={fixed}
    />
  );
}

export async function collectionMetadata(locale: string, titleKey: CollectionKey) {
  const t = await getTranslations({ locale, namespace: "Listing" });
  return { title: t(`collections.${titleKey}`) };
}
