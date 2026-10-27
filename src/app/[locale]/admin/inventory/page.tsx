import { AlertTriangle, Boxes, PackageX, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { InventoryRow } from "@/components/admin/InventoryRow";
import { AdminHeader, DataTable, field, Pager, qs, Stat } from "@/components/admin/ui";
import { Box } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { formatNumber, formatPrice } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";
import { inventorySummary, listInventory, stockFilters, type StockFilter } from "@/server/inventory";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/inventory">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.inventory" });
  return { title: t("title") };
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function InventoryPage({ params, searchParams }: PageProps<"/[locale]/admin/inventory">) {
  setRequestLocale((await params).locale);
  const locale = await getLocale();
  const sp = await searchParams;
  const t = await getTranslations("AdminUI.inventory");
  const filter = (stockFilters as readonly string[]).includes(str(sp.filter) ?? "") ? (str(sp.filter) as StockFilter) : "all";
  const query = { q: str(sp.q), filter, page: Number(str(sp.page)) || 1 };
  const [{ rows, total, page, pages }, s] = await Promise.all([listInventory(query), inventorySummary()]);

  return (
    <div className="space-y-4">
      <AdminHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Boxes} label={t("units")} value={formatNumber(s.units, locale)} sub={t("skus", { count: s.skus })} />
        <Stat icon={Wallet} label={t("value")} value={formatPrice(s.value, locale)} sub={t("valueHint")} />
        <Stat icon={AlertTriangle} label={t("lowCount")} value={String(s.low)} href="/admin/inventory?filter=low" warn={s.low > 0} />
        <Stat icon={PackageX} label={t("outCount")} value={String(s.out)} href="/admin/inventory?filter=out" warn={s.out > 0} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <nav aria-label={t("filter")} className="flex gap-1 rounded-sm border border-line bg-white p-1">
          {stockFilters.map((f) => (
            <Link
              key={f}
              href={`/admin/inventory${qs({ filter: f === "all" ? undefined : f, q: query.q })}`}
              aria-current={filter === f ? "page" : undefined}
              className={cn("rounded-xs px-3 py-1.5 text-sm font-semibold", filter === f ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-surface")}
            >
              {t(`filters.${f}`)}
            </Link>
          ))}
        </nav>
        <form className="flex min-w-64 flex-1 gap-2">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <input name="q" defaultValue={query.q} placeholder={t("search")} aria-label={t("search")} className={field} />
        </form>
        <p className="text-sm text-ink-600">{t("results", { count: total })}</p>
      </div>

      {rows.length ? (
        <DataTable head={[t("col.product"), <span key="s" className="block text-end">{t("col.stock")}</span>, <span key="l" className="block text-end">{t("col.lowAt")}</span>, t("col.state"), <span key="v" className="block text-end">{t("col.value")}</span>, ""]}>
          {rows.map((r) => (
            <InventoryRow key={`${r.id}-${r.stock}-${r.lowStockAt}`} row={r} />
          ))}
        </DataTable>
      ) : (
        <Box className="p-8 text-center text-sm text-ink-600">{t("empty")}</Box>
      )}
      <Pager page={page} pages={pages} prev={t("previous")} next={t("next")} href={(n) => `/admin/inventory${qs({ filter: filter === "all" ? undefined : filter, q: query.q, page: n })}`} />
    </div>
  );
}
