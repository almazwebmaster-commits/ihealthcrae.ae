import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignInForm } from "@/components/auth/AuthForms";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Link } from "@/i18n/navigation";
import { safeNext } from "@/lib/auth-errors";
import { googleEnabled } from "@/server/auth";
import { getSession } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Auth" });
  return { title: t("signInTitle"), robots: { index: false } };
}

export default async function SignInPage({ params, searchParams }: PageProps<"/[locale]/sign-in">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined, "/account");
  if (await getSession()) redirect(`/${locale}${next}`);
  const t = await getTranslations("Auth");

  return (
    <AuthCard
      title={t("signInTitle")}
      subtitle={t("signInSubtitle")}
      footer={
        <>
          {t("newHere")}{" "}
          <Link href="/register" className="font-bold text-brand-700 hover:underline">
            {t("createAccount")}
          </Link>
        </>
      }
    >
      <SignInForm next={next} />
      {googleEnabled && <GoogleButton callbackURL={`/${locale}${next}`} />}
    </AuthCard>
  );
}
