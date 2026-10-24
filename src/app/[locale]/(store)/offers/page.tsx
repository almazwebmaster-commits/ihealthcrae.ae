import { setRequestLocale } from "next-intl/server";
import { CollectionPage, collectionMetadata } from "@/components/listing/CollectionPage";

export async function generateMetadata({ params }: PageProps<"/[locale]/offers">) {
  return collectionMetadata((await params).locale, "offers");
}

export default async function OffersPage({ params, searchParams }: PageProps<"/[locale]/offers">) {
  setRequestLocale((await params).locale);
  return <CollectionPage basePath="/offers" titleKey="offers" fixed={{ tag: "deal" }} defaultSort="discount" searchParams={await searchParams} />;
}
