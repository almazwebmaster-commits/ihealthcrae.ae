import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResendVerification } from "@/components/auth/AuthForms";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: PageProps<"/[locale]/check-email">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Auth" });
  return { title: t("checkEmailTitle"), robots: { index: false } };
}

export default async function CheckEmailPage({ params, searchParams }: PageProps<"/[locale]/check-email">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";
  const t = await getTranslations("Auth");

  return (
    <AuthCard title={t("checkEmailTitle")}>
      <div className="space-y-4">
        <span className="inline-flex size-12 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <p className="text-sm leading-6 text-ink-800">{t("checkEmailBody", { email })}</p>
        <p className="text-xs text-ink-500">{t("checkEmailHint")}</p>
        <ResendVerification email={email} />
        <Link href="/sign-in" className="block text-center text-sm font-semibold text-brand-700 hover:underline">
          {t("backToSignIn")}
        </Link>
      </div>
    </AuthCard>
  );
}
