import { Heart } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/account/EmptyState";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Box } from "@/components/ui/Box";
import { getWishlistProducts } from "@/server/account";
import { requireUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/wishlist">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Wishlist" });
  return { title: t("title"), robots: { index: false } };
}

export default async function WishlistPage({ params }: PageProps<"/[locale]/account/wishlist">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireUser(locale, "/account/wishlist");
  const t = await getTranslations("Wishlist");
  const ta = await getTranslations("AccountArea");
  const products = await getWishlistProducts(user.id);

  if (!products.length) {
    return (
      <EmptyState icon={Heart} title={ta("wishlistEmptyTitle")} body={ta("wishlistEmptyBody")} cta={{ href: "/", label: ta("startShopping") }} />
    );
  }

  return (
    <div className="space-y-4">
      <Box className="px-5 py-4">
        <h1 className="text-xl font-extrabold">{t("title")}</h1>
        <p className="text-sm text-ink-600">{ta("wishlistCard", { count: products.length })}</p>
      </Box>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <li key={p.slug}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
