import { setRequestLocale } from "next-intl/server";
import { CollectionPage, collectionMetadata } from "@/components/listing/CollectionPage";

export async function generateMetadata({ params }: PageProps<"/[locale]/best-sellers">) {
  return collectionMetadata((await params).locale, "bestSellers");
}

export default async function BestSellersPage({ params, searchParams }: PageProps<"/[locale]/best-sellers">) {
  setRequestLocale((await params).locale);
  return <CollectionPage basePath="/best-sellers" titleKey="bestSellers" fixed={{ tag: "bestseller" }} defaultSort="featured" searchParams={await searchParams} />;
}
