import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/AuthForms";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Link } from "@/i18n/navigation";
import { googleEnabled } from "@/server/auth";
import { getSession } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/register">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Auth" });
  return { title: t("registerTitle"), robots: { index: false } };
}

export default async function RegisterPage({ params }: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getSession()) redirect(`/${locale}/account`);
  const t = await getTranslations("Auth");

  return (
    <AuthCard
      title={t("registerTitle")}
      subtitle={t("registerSubtitle")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link href="/sign-in" className="font-bold text-brand-700 hover:underline">
            {t("signInLink")}
          </Link>
        </>
      }
    >
      <RegisterForm />
      {googleEnabled && <GoogleButton callbackURL={`/${locale}/account?welcome=1`} />}
    </AuthCard>
  );
}
