import { setRequestLocale } from "next-intl/server";
import { CollectionPage, collectionMetadata } from "@/components/listing/CollectionPage";

export async function generateMetadata({ params }: PageProps<"/[locale]/subscribe-and-save">) {
  return collectionMetadata((await params).locale, "subscribe");
}

export default async function SubscribeAndSavePage({ params, searchParams }: PageProps<"/[locale]/subscribe-and-save">) {
  setRequestLocale((await params).locale);
  return <CollectionPage basePath="/subscribe-and-save" titleKey="subscribe" fixed={{ subscribable: true }} defaultSort="featured" searchParams={await searchParams} />;
}
