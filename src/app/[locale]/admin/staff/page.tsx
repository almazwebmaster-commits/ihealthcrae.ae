import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { StaffManager } from "@/components/admin/StaffManager";
import { AdminHeader } from "@/components/admin/ui";
import { requireArea } from "@/server/admin/guard";
import { listStaff } from "@/server/admin/staff";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/staff">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.staff" });
  return { title: t("title") };
}

export default async function StaffPage({ params }: PageProps<"/[locale]/admin/staff">) {
  const me = await requireArea("staff");
  setRequestLocale((await params).locale);
  const t = await getTranslations("AdminUI.staff");
  const members = await listStaff();
  const locale = await getLocale();
  const d = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeZone: "Asia/Dubai" });
  return (
    <div>
      <AdminHeader title={t("title")} subtitle={t("subtitle")} />
      <StaffManager me={me.id} members={members.map((m) => ({ ...m, lastActive: m.lastActive ? d.format(m.lastActive) : null }))} />
    </div>
  );
}
