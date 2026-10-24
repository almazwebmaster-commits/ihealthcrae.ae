import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartView } from "@/components/cart/CartView";

export async function generateMetadata({ params }: PageProps<"/[locale]/cart">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Cart" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function CartPage({ params }: PageProps<"/[locale]/cart">) {
  setRequestLocale((await params).locale);
  return (
    <div className="container-site py-4">
      <CartView />
    </div>
  );
}
