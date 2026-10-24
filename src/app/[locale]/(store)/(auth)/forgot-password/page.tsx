import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Auth" });
  return { title: t("forgotTitle"), robots: { index: false } };
}

export default async function ForgotPasswordPage({ params }: PageProps<"/[locale]/forgot-password">) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("Auth");
  return (
    <AuthCard
      title={t("forgotTitle")}
      subtitle={t("forgotSubtitle")}
      footer={
        <Link href="/sign-in" className="font-bold text-brand-700 hover:underline">
          {t("backToSignIn")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
