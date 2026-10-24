import { setRequestLocale } from "next-intl/server";
import { CollectionPage, collectionMetadata } from "@/components/listing/CollectionPage";

export async function generateMetadata({ params }: PageProps<"/[locale]/new-arrivals">) {
  return collectionMetadata((await params).locale, "newArrivals");
}

export default async function NewArrivalsPage({ params, searchParams }: PageProps<"/[locale]/new-arrivals">) {
  setRequestLocale((await params).locale);
  return <CollectionPage basePath="/new-arrivals" titleKey="newArrivals" fixed={{ tag: "new" }} defaultSort="newest" searchParams={await searchParams} />;
}
