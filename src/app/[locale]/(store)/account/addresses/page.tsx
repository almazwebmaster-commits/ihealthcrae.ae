import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AddressBook } from "@/components/account/AddressBook";
import { getAddresses } from "@/server/account";
import { requireUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/addresses">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AccountArea" });
  return { title: t("addresses"), robots: { index: false } };
}

export default async function AddressesPage({ params }: PageProps<"/[locale]/account/addresses">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireUser(locale, "/account/addresses");
  const addresses = (await getAddresses(user.id)).map(({ id, label, fullName, phone, emirate, area, street, building, unit, landmark, isDefault }) => ({
    id, label, fullName, phone, emirate, area, street, building, unit, landmark, isDefault,
  }));
  return <AddressBook addresses={addresses} />;
}
