import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ImportForm } from "@/components/admin/ImportForm";
import { AdminHeader } from "@/components/admin/ui";
import { Box } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { CSV_COLUMNS } from "@/server/admin/products";
import { requireArea } from "@/server/admin/guard";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/products/import">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.importer" });
  return { title: t("title") };
}

export default async function ImportPage({ params }: PageProps<"/[locale]/admin/products/import">) {
  await requireArea("products");
  setRequestLocale((await params).locale);
  const t = await getTranslations("AdminUI.importer");
  return (
    <div className="max-w-3xl space-y-4">
      <AdminHeader title={t("title")} actions={<Link href="/admin/products" className="text-sm font-semibold text-brand-700 hover:underline">{t("back")}</Link>} />
      <Box className="space-y-3 p-5 text-sm text-ink-700">
        <p>{t("intro")}</p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
        <a href="/api/admin/products/export" className="inline-block font-semibold text-brand-700 hover:underline">{t("template")}</a>
        <p className="text-xs text-ink-500">
          {t("columns")}: <code dir="ltr" className="break-words">{CSV_COLUMNS.join(", ")}</code>
        </p>
      </Box>
      <ImportForm />
    </div>
  );
}
