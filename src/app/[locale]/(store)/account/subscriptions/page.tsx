import { Repeat } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/account/EmptyState";
import { SubscriptionCard } from "@/components/account/SubscriptionCard";
import { Box } from "@/components/ui/Box";
import { requireUser } from "@/server/session";
import { listSubscriptions } from "@/server/subscriptions";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/subscriptions">): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "AccountArea" });
  return { title: t("subscriptions"), robots: { index: false } };
}

export default async function SubscriptionsPage({ params }: PageProps<"/[locale]/account/subscriptions">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireUser(locale, "/account/subscriptions");
  const t = await getTranslations("AccountArea");
  const ts = await getTranslations("Subscriptions");
  const subs = await listSubscriptions(user.id);

  if (!subs.length) {
    return <EmptyState icon={Repeat} title={t("subsEmptyTitle")} body={t("subsEmptyBody")} cta={{ href: "/subscribe-and-save", label: t("browseSubscribe") }} />;
  }

  return (
    <div className="space-y-3">
      <Box className="px-5 py-4">
        <h1 className="text-xl font-extrabold">{t("subscriptions")}</h1>
        <p className="text-sm text-ink-600">{ts("intro")}</p>
      </Box>
      {subs.map((s) => {
        const variant = s.option >= 0 ? s.product.variants[s.option] : undefined;
        const base = Number(variant?.price ?? s.product.price);
        const pct = s.product.subscribePct ?? 0;
        return (
          <SubscriptionCard
            key={s.id}
            sub={{
              id: s.id,
              status: s.status as "ACTIVE" | "PAUSED",
              qty: s.qty,
              intervalWeeks: s.intervalWeeks,
              nextDeliveryAt: s.nextDeliveryAt,
              lastError: s.lastError,
              unitPrice: Math.round(base * (1 - pct / 100) * 100) / 100,
              slug: s.product.slug,
              name: { en: s.product.nameEn, ar: s.product.nameAr },
              option: variant ? { en: variant.labelEn, ar: variant.labelAr } : null,
              image: s.product.images[0]?.url ?? null,
            }}
          />
        );
      })}
    </div>
  );
}
