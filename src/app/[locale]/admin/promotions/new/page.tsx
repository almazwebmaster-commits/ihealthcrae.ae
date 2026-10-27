import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CouponForm, EMPTY_COUPON } from "@/components/admin/CouponForm";
import { AdminHeader } from "@/components/admin/ui";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/promotions/new">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AdminUI.promotions" });
  return { title: t("newCode") };
}

export default async function NewCouponPage({ params }: PageProps<"/[locale]/admin/promotions/new">) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("AdminUI.promotions");
  return (
    <>
      <AdminHeader title={t("newCode")} />
      <CouponForm initial={EMPTY_COUPON} />
    </>
  );
}
