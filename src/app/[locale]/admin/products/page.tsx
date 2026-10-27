import { Download, Plus, Rss, Upload } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { AdminHeader, DataTable, field, Pager, ProductStatusBadge, qs } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { formatPrice, tr } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";
import { getEditorOptions, listProducts } from "@/server/admin/products";
import { requireArea } from "@/server/admin/guard";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/products">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.products" });
  return { title: t("title") };
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function AdminProducts({ params, searchParams }: PageProps<"/[locale]/admin/products">) {
  await requireArea("products");
  setRequestLocale((await params).locale);
  const locale = await getLocale();
  const sp = await searchParams;
  const t = await getTranslations("AdminUI.products");
  const query = { q: str(sp.q), status: str(sp.status), category: str(sp.category), lowStock: sp.lowStock === "1", page: Number(str(sp.page)) || 1 };
  const [{ rows, total, page, pages }, { categories }] = await Promise.all([listProducts(query), getEditorOptions()]);
  const dt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium" });

  return (
    <div>
      <AdminHeader
        title={t("title")}
        subtitle={t("results", { count: total })}
        actions={
          <>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
            <a href="/api/admin/products/export" className={buttonClass("outline", "md")}>
              <Download className="size-4" aria-hidden />
              {t("export")}
            </a>
            <Link href="/admin/products/feed" className={buttonClass("outline", "md")}>
              <Rss className="size-4" aria-hidden />
              {t("googleFeed")}
            </Link>
            <Link href="/admin/products/import" className={buttonClass("outline", "md")}>
              <Upload className="size-4" aria-hidden />
              {t("import")}
            </Link>
            <Link href="/admin/products/new" className={buttonClass("accent", "md")}>
              <Plus className="size-4" aria-hidden />
              {t("new")}
            </Link>
          </>
        }
      />

      <form className="mb-3 grid gap-2 rounded-sm border border-line bg-white p-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_14rem_auto_auto]">
        <input name="q" defaultValue={query.q} placeholder={t("search")} aria-label={t("search")} className={field} />
        <select name="status" defaultValue={query.status ?? ""} aria-label={t("col.status")} className={field}>
          <option value="">{t("allStatuses")}</option>
          {(["ACTIVE", "DRAFT", "ARCHIVED"] as const).map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
        <select name="category" defaultValue={query.category ?? ""} aria-label={t("col.category")} className={field}>
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <optgroup key={c.slug} label={tr({ en: c.nameEn, ar: c.nameAr }, locale)}>
              <option value={c.slug}>{tr({ en: c.nameEn, ar: c.nameAr }, locale)}</option>
              {c.children.map((s) => (
                <option key={s.slug} value={s.slug}>— {tr({ en: s.nameEn, ar: s.nameAr }, locale)}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <label className="flex items-center gap-2 px-1 text-sm">
          <input type="checkbox" name="lowStock" value="1" defaultChecked={query.lowStock} className="size-4 accent-brand-600" />
          {t("lowStockOnly")}
        </label>
        <button type="submit" className={buttonClass("primary", "md")}>{t("filter")}</button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-sm border border-line bg-white px-4 py-10 text-center text-sm text-ink-600">{t("empty")}</p>
      ) : (
        <DataTable head={[t("col.product"), t("col.sku"), t("col.category"), t("col.price"), t("col.stock"), t("col.status"), t("col.updated")]}>
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-surface">
              <td className="px-3 py-2">
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-xs border border-line bg-white">
                    {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="44px" className="object-contain" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-xs truncate font-semibold hover:text-brand-700">{tr({ en: p.nameEn, ar: p.nameAr }, locale)}</span>
                    <span className="block text-xs text-ink-500">{p.brand.name}</span>
                  </span>
                </Link>
              </td>
              <td className="px-3 py-2 text-xs text-ink-600" dir="ltr">{p.sku}</td>
              <td className="px-3 py-2 text-xs">{tr({ en: p.subcategory.nameEn, ar: p.subcategory.nameAr }, locale)}</td>
              <td className="px-3 py-2 tabular-nums">
                {formatPrice(Number(p.price), locale)}
                {p.compareAt && <s className="block text-xs text-ink-400">{formatPrice(Number(p.compareAt), locale)}</s>}
              </td>
              <td className={cn("px-3 py-2 font-bold tabular-nums", p.stock === 0 ? "text-sale" : p.stock < 5 ? "text-accent-700" : "")}>{p.stock}</td>
              <td className="px-3 py-2"><ProductStatusBadge status={p.status} label={t(`status.${p.status}`)} /></td>
              <td className="px-3 py-2 text-xs text-ink-500">{dt.format(p.updatedAt)}</td>
            </tr>
          ))}
        </DataTable>
      )}
      <Pager page={page} pages={pages} prev={t("previous")} next={t("next")} href={(n) => `/admin/products${qs({ ...query, lowStock: query.lowStock ? 1 : undefined, page: n })}`} />
    </div>
  );
}
