import { CheckCircle2, ExternalLink, Rss } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { AdminHeader, DataTable, Stat } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Box, BoxHeader } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/i18n-utils";
import { requireArea } from "@/server/admin/guard";
import { feedHealth, siteUrl, type FeedProblem } from "@/server/feeds/google";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/products/feed">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.feed" });
  return { title: t("title") };
}

const tone: Record<FeedProblem, "sale" | "accent" | "neutral"> = { noImage: "sale", noGoogleCategory: "accent", longTitle: "accent", shortDescription: "neutral", noArabic: "neutral" };

export default async function GoogleFeedPage({ params }: PageProps<"/[locale]/admin/products/feed">) {
  await requireArea("products");
  setRequestLocale((await params).locale);
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.feed");
  const h = await feedHealth();
  const site = siteUrl();
  const local = /localhost|127\.0\.0\.1/.test(site);
  const urls = (["en", "ar"] as const).map((l) => ({ l, url: `${site}/feeds/google/${l}.xml` }));

  return (
    <div className="space-y-4">
      <Link href="/admin/products" className="inline-block text-sm font-semibold text-brand-700 hover:underline">← {t("back")}</Link>
      <AdminHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Rss} label={t("inFeed")} value={`${h.included} / ${h.total}`} sub={t("offers", { count: h.offers })} />
        <Stat icon={CheckCircle2} label={t("ready")} value={String(h.total - h.withProblems.length)} />
        <Stat icon={Rss} label={t("needAttention")} value={String(h.withProblems.length)} warn={h.withProblems.length > 0} />
      </div>

      <Box>
        <BoxHeader title={t("urls")} />
        <div className="space-y-3 p-4 text-sm">
          {urls.map(({ l, url }) => (
            <div key={l} className="flex flex-wrap items-center gap-2">
              <span className="w-20 font-semibold">{l === "en" ? "English" : "العربية"}</span>
              <code className="min-w-0 flex-1 break-all rounded-xs bg-surface px-2 py-1 text-xs" dir="ltr">{url}</code>
              <a href={`/feeds/google/${l}.xml`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                {t("open")}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            </div>
          ))}
          {local && <p className="rounded-sm bg-accent-50 px-3 py-2 text-xs text-ink-800">{t("localNote")}</p>}
          <ol className="list-decimal space-y-1 ps-5 text-xs text-ink-700">
            <li>{t("step1")}</li>
            <li>{t("step2")}</li>
            <li>{t("step3")}</li>
          </ol>
        </div>
      </Box>

      <div>
        <h2 className="mb-2 text-lg font-extrabold">{t("problems")}</h2>
        {h.withProblems.length ? (
          <DataTable head={[t("col.product"), t("col.problems"), ""]}>
            {h.withProblems.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2.5">
                  <span className="font-semibold">{tr({ en: p.nameEn, ar: p.nameAr || p.nameEn }, locale)}</span>
                  <span className="block text-xs text-ink-500" dir="ltr">{p.sku}</span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {p.problems.map((x) => <Badge key={x} tone={tone[x]}>{t(`problem.${x}`)}</Badge>)}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-end">
                  <Link href={`/admin/products/${p.id}`} className="text-sm font-semibold text-brand-700 hover:underline">{t("fix")}</Link>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Box className="p-6 text-center text-sm text-success">{t("allGood")}</Box>
        )}
        <p className="mt-2 text-xs text-ink-500">{t("legend")}</p>
      </div>
    </div>
  );
}
