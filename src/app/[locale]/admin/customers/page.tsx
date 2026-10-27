import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { AdminHeader, DataTable, field, Pager, qs } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Box } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { emirateName } from "@/lib/emirates";
import { formatPrice } from "@/lib/i18n-utils";
import { formatUaePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { listCustomers, listGuests } from "@/server/admin/customers";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/customers">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.customers" });
  return { title: t("title") };
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const TABS = ["accounts", "blocked", "guests"] as const;

export default async function CustomersPage({ params, searchParams }: PageProps<"/[locale]/admin/customers">) {
  setRequestLocale((await params).locale);
  const locale = await getLocale();
  const sp = await searchParams;
  const t = await getTranslations("AdminUI.customers");
  const tab = (TABS as readonly string[]).includes(str(sp.tab) ?? "") ? (str(sp.tab) as (typeof TABS)[number]) : "accounts";
  const q = str(sp.q);
  const page = Number(str(sp.page)) || 1;
  const fmt = (n: number) => formatPrice(n, locale);
  const d = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeZone: "Asia/Dubai" });
  const href = (p: Record<string, string | number | undefined>) => `/admin/customers${qs({ tab: tab === "accounts" ? undefined : tab, q, ...p })}`;

  const accounts = tab !== "guests" ? await listCustomers({ q, status: tab === "blocked" ? "blocked" : undefined, page }) : null;
  const guests = tab === "guests" ? await listGuests({ q, page }) : null;
  const total = accounts?.total ?? guests?.total ?? 0;

  return (
    <div className="space-y-4">
      <AdminHeader title={t("title")} subtitle={t("results", { count: total })} />

      <div className="flex flex-wrap items-center gap-2">
        <nav aria-label={t("title")} className="flex gap-1 rounded-sm border border-line bg-white p-1">
          {TABS.map((k) => (
            <Link
              key={k}
              href={`/admin/customers${qs({ tab: k === "accounts" ? undefined : k, q })}`}
              aria-current={tab === k ? "page" : undefined}
              className={cn("rounded-xs px-3 py-1.5 text-sm font-semibold", tab === k ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-surface")}
            >
              {t(`tabs.${k}`)}
              {k === "blocked" && accounts && accounts.blocked > 0 && <span className="ms-1.5 tabular-nums">({accounts.blocked})</span>}
            </Link>
          ))}
        </nav>
        <form className="flex min-w-64 flex-1">
          {tab !== "accounts" && <input type="hidden" name="tab" value={tab} />}
          <input name="q" defaultValue={q} placeholder={t("search")} aria-label={t("search")} className={field} />
        </form>
      </div>

      {accounts &&
        (accounts.rows.length ? (
          <DataTable head={[t("col.customer"), t("col.phone"), t("col.joined"), <span key="o" className="block text-end">{t("col.orders")}</span>, <span key="s" className="block text-end">{t("col.spent")}</span>, t("col.lastOrder"), t("col.status")]}>
            {accounts.rows.map((u) => (
              <tr key={u.id} className="hover:bg-surface/60">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/customers/${u.id}`} className="font-semibold text-brand-700 hover:underline">{u.name}</Link>
                  <span className="block text-xs text-ink-500" dir="ltr">{u.email}</span>
                </td>
                <td className="px-3 py-2.5 text-xs" dir="ltr">{u.phone ? formatUaePhone(u.phone) : "—"}</td>
                <td className="px-3 py-2.5 text-xs text-ink-600">{d.format(u.createdAt)}</td>
                <td className="px-3 py-2.5 text-end tabular-nums">{u.orders}</td>
                <td className="px-3 py-2.5 text-end font-semibold tabular-nums">{fmt(u.spent)}</td>
                <td className="px-3 py-2.5 text-xs text-ink-600">{u.lastOrderAt ? d.format(u.lastOrderAt) : "—"}</td>
                <td className="px-3 py-2.5">{u.banned ? <Badge tone="sale">{t("blocked")}</Badge> : <Badge tone="success">{t("active")}</Badge>}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Box className="p-8 text-center text-sm text-ink-600">{t("empty")}</Box>
        ))}

      {guests &&
        (guests.rows.length ? (
          <DataTable head={[t("col.customer"), t("col.phone"), t("col.emirate"), <span key="o" className="block text-end">{t("col.orders")}</span>, <span key="s" className="block text-end">{t("col.spent")}</span>, t("col.lastOrder")]}>
            {guests.rows.map((g) => (
              <tr key={g.email} className="hover:bg-surface/60">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/orders${qs({ q: g.email })}`} className="font-semibold text-brand-700 hover:underline">{g.name}</Link>
                  <span className="block text-xs text-ink-500" dir="ltr">{g.email}</span>
                </td>
                <td className="px-3 py-2.5 text-xs" dir="ltr">{g.phone ? formatUaePhone(g.phone) : "—"}</td>
                <td className="px-3 py-2.5 text-xs">{g.emirate ? emirateName(g.emirate, locale) : "—"}</td>
                <td className="px-3 py-2.5 text-end tabular-nums">{g.orders}</td>
                <td className="px-3 py-2.5 text-end font-semibold tabular-nums">{fmt(g.spent)}</td>
                <td className="px-3 py-2.5 text-xs text-ink-600">{g.lastOrderAt ? d.format(g.lastOrderAt) : "—"}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Box className="p-8 text-center text-sm text-ink-600">{t("emptyGuests")}</Box>
        ))}

      <Pager page={accounts?.page ?? guests?.page ?? 1} pages={accounts?.pages ?? guests?.pages ?? 1} prev={t("previous")} next={t("next")} href={(n) => href({ page: n })} />
    </div>
  );
}
