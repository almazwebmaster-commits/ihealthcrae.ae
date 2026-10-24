import { Heart, MapPin, Package, Repeat, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FormMessage } from "@/components/auth/AuthCard";
import { Box } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { getAddresses, getWishlistSlugs } from "@/server/account";
import { requireUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/account">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AccountArea" });
  return { title: t("title"), robots: { index: false } };
}

function Card({ href, icon: Icon, title, body }: { href: string; icon: LucideIcon; title: string; body: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-sm border border-line bg-white p-4 hover:border-ink-400">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
        <Icon className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block font-bold group-hover:text-brand-700">{title}</span>
        <span className="block text-sm text-ink-600">{body}</span>
      </span>
    </Link>
  );
}

export default async function AccountOverview({ params, searchParams }: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireUser(locale, "/account");
  const t = await getTranslations("AccountArea");
  const tAuth = await getTranslations("Auth");
  const [addresses, wishlist] = await Promise.all([getAddresses(user.id), getWishlistSlugs(user.id)]);
  const since = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { month: "long", year: "numeric" }).format(user.createdAt);

  return (
    <div className="space-y-4">
      {(await searchParams).welcome && (
        <FormMessage tone="success">{tAuth(user.emailVerified ? "welcomeVerified" : "welcomeNew")}</FormMessage>
      )}
      <Box className="p-5">
        <h1 className="text-2xl font-extrabold">{t("hi", { name: user.name.split(/\s+/)[0] })}</h1>
        <p className="mt-1 text-sm text-ink-600">
          <bdi dir="ltr">{user.email}</bdi> · {t("memberSince", { date: since })}
        </p>
      </Box>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card href="/account/orders" icon={Package} title={t("orders")} body={t("ordersCard")} />
        <Card href="/account/subscriptions" icon={Repeat} title={t("subscriptions")} body={t("subsCard")} />
        <Card href="/account/wishlist" icon={Heart} title={t("wishlist")} body={t("wishlistCard", { count: wishlist.length })} />
        <Card href="/account/addresses" icon={MapPin} title={t("addresses")} body={t("addressesCard", { count: addresses.length })} />
      </div>
    </div>
  );
}
