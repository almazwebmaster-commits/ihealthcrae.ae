import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { StockAdjust } from "@/components/admin/StockAdjust";
import { AdminHeader, DataTable } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Box, BoxHeader } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/i18n-utils";
import { stockState } from "@/lib/inventory";
import { cn } from "@/lib/utils";
import { productMovements } from "@/server/inventory";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/inventory/[id]">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.inventory" });
  return { title: t("historyTitle") };
}

export default async function StockHistoryPage({ params }: PageProps<"/[locale]/admin/inventory/[id]">) {
  const { locale: loc, id } = await params;
  setRequestLocale(loc);
  const data = Number.isInteger(Number(id)) ? await productMovements(Number(id)) : null;
  if (!data) notFound();
  const { product, movements } = data;
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.inventory");
  const dt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });
  const state = stockState(product.stock, product.lowStockAt);

  return (
    <div className="space-y-4">
      <Link href="/admin/inventory" className="inline-block text-sm font-semibold text-brand-700 hover:underline">← {t("back")}</Link>
      <AdminHeader
        title={tr({ en: product.nameEn, ar: product.nameAr }, locale)}
        subtitle={<span dir="ltr">{product.sku}</span>}
        actions={
          <>
            <Badge tone={state === "out" ? "sale" : state === "low" ? "accent" : "success"}>{t(`state.${state}`)}</Badge>
            <Link href={`/admin/products/${product.id}`} className="text-sm font-semibold text-brand-700 hover:underline">{t("editProduct")}</Link>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <Box className="space-y-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{t("inStock")}</p>
          <p className="text-4xl font-extrabold tabular-nums">{product.stock}</p>
          <p className="text-xs text-ink-600">{t("lowAtHint", { count: product.lowStockAt })}</p>
        </Box>
        <Box>
          <BoxHeader title={t("adjustTitle")} />
          <div className="p-4">
            <StockAdjust key={`${product.stock}-${product.lowStockAt}`} productId={product.id} stock={product.stock} lowStockAt={product.lowStockAt} />
          </div>
        </Box>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-extrabold">{t("history")}</h2>
        {movements.length ? (
          <DataTable head={[t("col.date"), t("col.reason"), <span key="c" className="block text-end">{t("col.change")}</span>, <span key="b" className="block text-end">{t("col.balance")}</span>, t("col.details"), t("col.by")]}>
            {movements.map((m) => (
              <tr key={m.id}>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-600">{dt.format(m.createdAt)}</td>
                <td className="px-3 py-2.5">{t(`reasons.${m.reason}`)}</td>
                <td className={cn("px-3 py-2.5 text-end font-bold tabular-nums", m.change > 0 ? "text-success" : "text-sale")} dir="ltr">{m.change > 0 ? `+${m.change}` : m.change}</td>
                <td className="px-3 py-2.5 text-end tabular-nums">{m.balance}</td>
                <td className="px-3 py-2.5 text-xs">
                  {m.orderNumber && <Link href={`/admin/orders/${m.orderNumber}`} className="font-semibold text-brand-700 hover:underline" dir="ltr">{m.orderNumber}</Link>}
                  {m.note && <span className="block text-ink-600">{m.note}</span>}
                </td>
                <td className="px-3 py-2.5 text-xs text-ink-600">{m.actorName ?? (m.reason === "ORDER" ? t("customer") : t("system"))}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Box className="p-6 text-center text-sm text-ink-600">{t("noHistory")}</Box>
        )}
      </div>
    </div>
  );
}
