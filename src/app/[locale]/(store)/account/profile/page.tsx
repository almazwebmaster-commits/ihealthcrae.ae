import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProfileForm, SecurityForms } from "@/components/account/ProfileForms";
import { Box } from "@/components/ui/Box";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/profile">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AccountArea" });
  return { title: t("profile"), robots: { index: false } };
}

export default async function ProfilePage({ params }: PageProps<"/[locale]/account/profile">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireUser(locale, "/account/profile");
  const t = await getTranslations("AccountArea");
  const hasPassword = (await db.account.count({ where: { userId: user.id, providerId: "credential" } })) > 0;

  return (
    <div className="space-y-4">
      <Box className="px-5 py-4">
        <h1 className="text-xl font-extrabold">{t("profile")}</h1>
      </Box>
      <ProfileForm
        user={{
          name: user.name,
          email: user.email,
          phone: user.phone ?? null,
          locale: user.locale ?? "en",
          emailVerified: user.emailVerified,
        }}
      />
      <SecurityForms hasPassword={hasPassword} />
    </div>
  );
}
