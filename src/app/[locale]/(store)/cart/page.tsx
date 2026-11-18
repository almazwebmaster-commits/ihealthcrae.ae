import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartView } from "@/components/cart/CartView";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductRail } from "@/components/catalog/ProductRail";
import { topProducts } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/[locale]/cart">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Cart" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function CartPage({ params }: PageProps<"/[locale]/cart">) {
  setRequestLocale((await params).locale);
  const [th, tc, popular] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Common"),
    topProducts({ tag: "bestseller", inStock: true }, 12),
  ]);

  return (
    <div className="container-site space-y-8 py-4 lg:py-6">
      <CartView />
      {/* Keeps an empty cart from being a dead end, and suggests add-ons for a full one */}
      {popular.length > 0 && (
        <ProductRail title={th("bestTitle")} href="/best-sellers" viewAllLabel={th("seeAll")} prevLabel={tc("previous")} nextLabel={tc("next")}>
          {popular.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </ProductRail>
      )}
    </div>
  );
}
