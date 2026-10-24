import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { getAddresses } from "@/server/account";
import { getSession } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Checkout" });
  return { title: t("title"), robots: { index: false } };
}

export default async function CheckoutPage({ params }: PageProps<"/[locale]/checkout">) {
  setRequestLocale((await params).locale);
  const session = await getSession();
  const addresses = session
    ? (await getAddresses(session.user.id)).map(({ id, label, fullName, phone, emirate, area, street, building, unit, landmark, isDefault }) => ({
        id, label, fullName, phone, emirate, area, street, building, unit, landmark, isDefault,
      }))
    : [];

  return (
    <div className="container-site py-4">
      <CheckoutClient
        user={session ? { name: session.user.name, email: session.user.email, phone: session.user.phone ?? null } : null}
        addresses={addresses}
      />
    </div>
  );
}
