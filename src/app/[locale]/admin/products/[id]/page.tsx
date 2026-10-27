import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { AdminHeader, ProductStatusBadge } from "@/components/admin/ui";
import { tr } from "@/lib/i18n-utils";
import { getEditorOptions, getProductForEdit } from "@/server/admin/products";
import { requireArea } from "@/server/admin/guard";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/products/[id]">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.editor" });
  return { title: t("editTitle") };
}

export default async function EditProductPage({ params }: PageProps<"/[locale]/admin/products/[id]">) {
  await requireArea("products");
  const { locale, id } = await params;
  setRequestLocale(locale);
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();
  const [product, options] = await Promise.all([getProductForEdit(productId), getEditorOptions()]);
  if (!product) notFound();
  const t = await getTranslations("AdminUI.products.status");
  const loc = await getLocale();

  return (
    <>
      <AdminHeader
        title={tr({ en: product.nameEn, ar: product.nameAr }, loc)}
        subtitle={<span dir="ltr">{product.sku}</span>}
        actions={<ProductStatusBadge status={product.status} label={t(product.status)} />}
      />
      {/* key: remount after save so the form reflects stored values */}
      <ProductEditor key={JSON.stringify(product)} initial={product} options={options} />
    </>
  );
}
