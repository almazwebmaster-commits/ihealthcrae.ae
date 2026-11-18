import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Fragment } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductRail } from "@/components/catalog/ProductRail";
import { CategoryTabs } from "@/components/home/CategoryTabs";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { HealthNeeds } from "@/components/home/HealthNeeds";
import { BulkQuoteBanner, HelpCard } from "@/components/home/HelpBanners";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { OfferTickets } from "@/components/home/OfferTickets";
import { QuickPicks } from "@/components/home/QuickPicks";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { ReminderBanner } from "@/components/home/ReminderBanner";
import { TrustStrip } from "@/components/home/TrustStrip";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/i18n-utils";
import type { HomeSectionKey } from "@/lib/home-content";
import { featuredBrands, getCategories, maxDiscount, topProducts } from "@/server/catalog";
import { getHomeContent } from "@/server/home-content";
import { healthNeedCounts, offerCoupons } from "@/server/home-data";

// Homepage content comes from the database; re-render at most every 5 minutes.
export const revalidate = 300;

/** Morning / afternoon / evening in UAE time. */
function greetingKey() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Dubai" }).format(new Date()));
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = await getLocale();
  const t = await getTranslations("Home");
  const tc = await getTranslations("Common");

  // Layout, banners, health needs, collections and coupons are edited in Admin > Homepage.
  const home = await getHomeContent();
  const heroSlides = home.heroSlides.filter((s) => s.enabled);
  const on = new Set(home.sections.filter((s) => s.enabled).map((s) => s.key));
  const pct = (slug: string) => (slug ? maxDiscount(slug) : Promise.resolve(0));

  const [categories, deals, bestSellers, newArrivals, forYou, brands, heroPcts, needCounts, coupons, collectionLists] = await Promise.all([
    getCategories(),
    topProducts({ tag: "deal", sort: "discount", inStock: true }, 12),
    topProducts({ tag: "bestseller", inStock: true }, 12),
    topProducts({ tag: "new", sort: "newest", inStock: true }, 12),
    on.has("categoryTabs") ? topProducts({ inStock: true }, 12) : Promise.resolve([]),
    featuredBrands(16),
    Promise.all(heroSlides.map((s) => pct(s.category))),
    on.has("healthNeeds") ? healthNeedCounts(home.healthNeeds) : Promise.resolve(new Map<string, number>()),
    on.has("offers") ? offerCoupons(home.offerCodes) : Promise.resolve([]),
    Promise.all(home.collections.map((c, i) => (on.has(i ? "featured2" : "featured1") ? topProducts({ category: c.category }, 10) : Promise.resolve([])))),
  ]);
  const tabProducts = on.has("categoryTabs") ? await Promise.all(categories.map((c) => topProducts({ category: c.slug, inStock: true }, 10))) : [];

  const rail = { prevLabel: tc("previous"), nextLabel: tc("next"), viewAllLabel: t("seeAll") };
  const ar = loc === "ar";
  const withPct = (text: string, n: number) => text.replace("{pct}", String(n));
  // Banner label above the headline: the category (or sub-category) the banner promotes
  const categoryNames = new Map(categories.flatMap((c) => [[c.slug, tr(c.name, loc)] as const, ...c.children.map((s) => [s.slug, tr(s.name, loc)] as const)]));

  const blocks: Record<HomeSectionKey, React.ReactNode> = {
    hero: heroSlides.length ? (
      <HeroCarousel
        slides={heroSlides.map((s, i) => ({
          id: s.id,
          title: withPct(ar ? s.titleAr : s.titleEn, heroPcts[i]),
          subtitle: ar ? s.subtitleAr : s.subtitleEn,
          cta: ar ? s.ctaAr : s.ctaEn,
          href: s.href,
          theme: s.theme,
          category: s.category,
          categoryName: categoryNames.get(s.category),
          desktopImage: s.desktop ?? undefined,
          desktopImageRtl: s.desktopRtl ?? undefined,
          mobileImage: s.mobile ?? undefined,
        }))}
        prevLabel={tc("previous")}
        nextLabel={tc("next")}
        goToLabel={t("goToSlide")}
        trust={[t("trust.genuine"), t("trust.fast"), t("trust.cod")]}
      />
    ) : null,

    quickPicks: <QuickPicks />,
    healthNeeds: <HealthNeeds needs={home.healthNeeds} counts={needCounts} />,
    trust: <TrustStrip />,
    offers: <OfferTickets coupons={coupons} />,
    featured1: home.collections[0] ? <FeaturedCollection collection={home.collections[0]} products={collectionLists[0] ?? []} /> : null,

    deals: deals.length ? (
      <ProductRail title={t("dealsTitle")} href="/offers" {...rail}>
        {deals.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </ProductRail>
    ) : null,

    reminder: <ReminderBanner />,

    bestSellers: bestSellers.length ? (
      <ProductRail title={t("bestTitle")} href="/best-sellers" {...rail}>
        {bestSellers.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </ProductRail>
    ) : null,

    categoryTabs: (
      <CategoryTabs
        forYou={forYou}
        tabs={categories.map((c, i) => ({ slug: c.slug, name: tr(c.name, loc), products: tabProducts[i] ?? [] }))}
        labels={{ title: t("categoryTabs.title"), subtitle: t("categoryTabs.subtitle"), forYou: t("categoryTabs.forYou"), viewAll: t("viewAll") }}
      />
    ),

    featured2: home.collections[1] ? <FeaturedCollection collection={home.collections[1]} products={collectionLists[1] ?? []} /> : null,
    recentlyViewed: <RecentlyViewed labels={{ title: t("recentlyViewed"), prevLabel: tc("previous"), nextLabel: tc("next") }} />,

    newArrivals: newArrivals.length ? (
      <ProductRail title={t("newTitle")} href="/new-arrivals" {...rail}>
        {newArrivals.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </ProductRail>
    ) : null,

    brands: brands.length ? (
      <section>
        <h2 className="mb-4 text-xl font-extrabold text-ink-900 sm:text-2xl">{t("brandsTitle")}</h2>
        <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {brands.map((b) => (
            <li key={b.slug} className="shrink-0">
              <Link
                href={`/search?brand=${b.slug}`}
                className="flex h-full min-w-40 flex-col items-center justify-center rounded-xl border border-line bg-white px-3 py-3.5 text-center shadow-box transition-shadow hover:shadow-card"
              >
                <span className="text-base font-bold text-ink-900" dir="ltr">
                  {b.name}
                </span>
                <span className="mt-0.5 line-clamp-1 text-xs text-ink-500">{tr(b.category, loc)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    ) : null,

    help: <HelpCard />,
    bulkQuote: <BulkQuoteBanner />,
  };

  return (
    <div className="container-site space-y-8 py-5 lg:space-y-10 lg:py-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{t(`greeting.${greetingKey()}`)}</h1>
        <p className="mt-0.5 text-sm text-ink-600 sm:text-base">{t("greeting.sub")}</p>
      </header>
      {home.sections
        .filter((sec) => sec.enabled)
        .map((sec) => (
          <Fragment key={sec.key}>{blocks[sec.key]}</Fragment>
        ))}
    </div>
  );
}
