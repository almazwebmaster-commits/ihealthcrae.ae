import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard, FormMessage } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Auth" });
  return { title: t("resetTitle"), robots: { index: false } };
}

/** Landing page for the emailed reset link (Better Auth redirects here with ?token= or ?error=). */
export default async function ResetPasswordPage({ params, searchParams }: PageProps<"/[locale]/reset-password">) {
  setRequestLocale((await params).locale);
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const t = await getTranslations("Auth");

  return (
    <AuthCard title={t("resetTitle")}>
      {token && !sp.error ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <FormMessage tone="error">{t("resetInvalid")}</FormMessage>
          <Link href="/forgot-password" className={buttonClass("primary", "lg", "w-full")}>
            {t("requestNew")}
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
