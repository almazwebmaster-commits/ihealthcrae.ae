import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { HomeEditor } from "@/components/admin/HomeEditor";
import { AdminHeader } from "@/components/admin/ui";
import { db } from "@/server/db";
import { requireArea } from "@/server/admin/guard";
import { getHomeContent } from "@/server/home-content";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/homepage">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.homepage" });
  return { title: t("title") };
}

export default async function HomepageEditorPage({ params }: PageProps<"/[locale]/admin/homepage">) {
  await requireArea("homepage");
  setRequestLocale((await params).locale);
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.homepage");
  const [{ updatedAt, updatedBy, ...content }, cats, coupons] = await Promise.all([
    getHomeContent(),
    db.category.findMany({
      where: { parentId: null },
      orderBy: { position: "asc" },
      select: { slug: true, nameEn: true, nameAr: true, children: { orderBy: { position: "asc" }, select: { slug: true, nameEn: true, nameAr: true } } },
    }),
    db.coupon.findMany({ where: { active: true }, orderBy: { code: "asc" }, select: { code: true, descriptionEn: true } }),
  ]);
  const dt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });

  return (
    <div>
      <AdminHeader title={t("title")} subtitle={t("subtitle")} />
      <HomeEditor
        key={updatedAt?.toISOString() ?? "defaults"}
        initial={content}
        cats={cats}
        coupons={coupons}
        savedInfo={updatedAt ? t("lastSaved", { date: dt.format(updatedAt), name: updatedBy ?? "" }) : null}
      />
    </div>
  );
}
