import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { AdminHeader } from "@/components/admin/ui";
import { getEditorOptions } from "@/server/admin/products";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/products/new">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.editor" });
  return { title: t("newTitle") };
}

export default async function NewProductPage({ params }: PageProps<"/[locale]/admin/products/new">) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("AdminUI.editor");
  return (
    <>
      <AdminHeader title={t("newTitle")} />
      <ProductEditor options={await getEditorOptions()} />
    </>
  );
}
