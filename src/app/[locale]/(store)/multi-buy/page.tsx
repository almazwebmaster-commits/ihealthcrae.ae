import { setRequestLocale } from "next-intl/server";
import { CollectionPage, collectionMetadata } from "@/components/listing/CollectionPage";

export async function generateMetadata({ params }: PageProps<"/[locale]/multi-buy">) {
  return collectionMetadata((await params).locale, "multibuy");
}

export default async function MultiBuyPage({ params, searchParams }: PageProps<"/[locale]/multi-buy">) {
  setRequestLocale((await params).locale);
  return <CollectionPage basePath="/multi-buy" titleKey="multibuy" fixed={{ multibuy: true }} defaultSort="featured" searchParams={await searchParams} />;
}
