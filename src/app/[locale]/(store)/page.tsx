import {
  ArrowRight,
  Banknote,
  Layers,
  Lock,
  PackageCheck,
  PackageOpen,
  Repeat,
  RotateCcw,
  Tag,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { CategoryIcon } from "@/components/catalog/CategoryIcon";
import { Countdown } from "@/components/catalog/Countdown";
import { Price } from "@/components/catalog/Price";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductRail } from "@/components/catalog/ProductRail";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { QuadBox } from "@/components/home/QuadBox";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { heroSlides } from "@/data/home";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/catalog-types";
import { tr } from "@/lib/i18n-utils";
import { slotImage } from "@/lib/images";
import { tintClasses } from "@/lib/tints";
import { cn } from "@/lib/utils";
import { featuredBrands, getCategories, getProduct, maxDiscount, topProducts } from "@/server/catalog";

// Homepage content comes from the database; re-render at most every 5 minutes.
export const revalidate = 300;

const QUAD_CATEGORIES = [
  "vitamins-supplements",
  "beauty-skincare",
  "mother-baby",
  "medical-devices",
  "sports-nutrition",
  "personal-care",
  "health-medicine",
];
const SPOTLIGHTS = [
  ["vms-wrist-blood-pressure-monitor", "medical-devices"],
  ["on-gold-standard-whey", "sports-nutrition"],
  ["oral-b-io-series-5", "personal-care"],
  ["dettol-first-aid-kit", "health-medicine"],
] as const;

function SpotlightTile({ product, label, locale }: { product?: Product; label: string; locale: string }) {
  if (!product) return null;
  return (
    <Link
      href={`/p/${product.slug}`}
      className="group flex h-full flex-col rounded-sm border border-line bg-white p-3 transition-shadow hover:shadow-pop"
    >
      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{label}</span>
      <ProductVisual
        product={product}
        sizes="(min-width: 1024px) 320px, 50vw"
        className="my-2 rounded-sm transition-transform group-hover:scale-[1.02]"
      />
      <span className="line-clamp-2 text-sm text-ink-900 group-hover:text-brand-700">{tr(product.name, locale)}</span>
      <Price price={product.price} was={product.was} size="sm" className="mt-1" />
    </Link>
  );
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = await getLocale();
  const t = await getTranslations("Home");
  const tc = await getTranslations("Common");
  const tNav = await getTranslations("Nav");

  const [categories, quadLists, deals, bestSellers, newArrivals, brands, heroPcts, skincarePct, spotlightList] =
    await Promise.all([
      getCategories(),
      Promise.all(QUAD_CATEGORIES.map((slug) => topProducts({ category: slug, inStock: true }, 4))),
      topProducts({ tag: "deal", sort: "discount", inStock: true }, 12),
      topProducts({ tag: "bestseller", inStock: true }, 12),
      topProducts({ tag: "new", sort: "newest", inStock: true }, 12),
      featuredBrands(16),
      Promise.all(heroSlides.map((s) => maxDiscount(s.category))),
      maxDiscount("beauty-skincare"),
      Promise.all(SPOTLIGHTS.map(([slug]) => getProduct(slug))),
    ]);

  const rail = { prevLabel: tc("previous"), nextLabel: tc("next"), viewAllLabel: tc("viewAll") };
  const catName = new Map(categories.map((c) => [c.slug, tr(c.name, loc)]));
  const cat = (slug: string) => catName.get(slug) ?? slug;
  const quadProducts = new Map(QUAD_CATEGORIES.map((slug, i) => [slug, quadLists[i]]));
  const quad = (slug: string) => ({
    title: cat(slug),
    href: `/c/${slug}`,
    linkLabel: t("shopAll"),
    products: quadProducts.get(slug) ?? [],
  });
  const spotlights = new Map(SPOTLIGHTS.map(([slug], i) => [slug, spotlightList[i]]));

  return (
    <div className="container-site space-y-4 py-4">
      {/* 1 — Hero mosaic */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-2">
        <div className="min-w-0 lg:col-span-8 lg:row-span-2">
          <HeroCarousel
            slides={heroSlides.map((s, i) => ({
              id: s.id,
              title: tr(s.title, loc).replace("{pct}", String(heroPcts[i])),
              subtitle: tr(s.subtitle, loc),
              cta: tr(s.cta, loc),
              href: s.href,
              theme: s.theme,
              category: s.category,
              desktopImage: slotImage(`${s.slot}-D`),
              desktopImageRtl: slotImage(`${s.slot}-DR`),
              mobileImage: slotImage(`${s.slot}-M`),
            }))}
            prevLabel={tc("previous")}
            nextLabel={tc("next")}
            goToLabel={t("goToSlide")}
          />
        </div>
        <Link
          href="/new-arrivals"
          className="group flex items-center gap-4 rounded-sm border border-accent-600 bg-accent-500 p-5 text-ink-900 lg:col-span-4"
        >
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-sm bg-ink-900 text-accent-500">
            <PackageOpen className="size-7" aria-hidden />
          </span>
          <span>
            <span className="block text-lg font-extrabold">{t("newTitle")}</span>
            <span className="block text-sm">{t("newBody")}</span>
          </span>
          <ArrowRight className="flip-rtl ms-auto size-5 shrink-0" aria-hidden />
        </Link>
        <Link
          href="/best-sellers"
          className="group flex items-center gap-4 rounded-sm bg-ink-900 p-5 text-white lg:col-span-4"
        >
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-sm bg-brand-600">
            <TrendingUp className="size-7" aria-hidden />
          </span>
          <span>
            <span className="block text-lg font-extrabold">{t("bestTitle")}</span>
            <span className="block text-sm text-ink-300">{t("bestBody")}</span>
          </span>
          <ArrowRight className="flip-rtl ms-auto size-5 shrink-0" aria-hidden />
        </Link>
      </section>

      {/* 2 — Category strip */}
      <nav aria-label={tNav("allCategories")} className="no-scrollbar grid grid-flow-col auto-cols-[6.5rem] gap-3 overflow-x-auto sm:auto-cols-fr">
        {categories.map((c) => {
          return (
            <Link key={c.slug} href={`/c/${c.slug}`} className="group flex flex-col items-center gap-2 rounded-sm border border-line bg-white p-3 text-center hover:border-ink-400">
              <span className={cn("inline-flex size-14 items-center justify-center rounded-sm transition-transform group-hover:scale-105", tintClasses(c.tint).bg, tintClasses(c.tint).fg)}>
                <CategoryIcon slug={c.slug} className="size-7" aria-hidden />
              </span>
              <span className="line-clamp-2 text-xs font-semibold leading-4 text-ink-800">{tr(c.name, loc)}</span>
            </Link>
          );
        })}
        <Link href="/offers" className="group flex flex-col items-center gap-2 rounded-sm border border-accent-600 bg-accent-500 p-3 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-sm bg-ink-900 text-accent-500 transition-transform group-hover:scale-105">
            <Tag className="size-7" aria-hidden />
          </span>
          <span className="text-xs font-bold leading-4 text-ink-900">{tNav("offers")}</span>
        </Link>
      </nav>

      {/* Savings programmes */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Link
          href="/subscribe-and-save"
          className="group relative flex items-center gap-4 overflow-hidden rounded-sm border border-brand-200 bg-brand-50 p-5"
        >
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-sm bg-brand-700 text-white">
            <Repeat className="size-7" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-brand-700">{t("snsEyebrow")}</span>
            <span className="block text-lg font-extrabold text-ink-900">{t("snsTitle")}</span>
            <span className="block text-sm text-ink-700">{t("snsBody")}</span>
          </span>
          <ArrowRight className="flip-rtl ms-auto size-5 shrink-0 text-brand-700 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden />
        </Link>
        <Link
          href="/multi-buy"
          className="group relative flex items-center gap-4 overflow-hidden rounded-sm border border-accent-300 bg-accent-50 p-5"
        >
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-sm bg-accent-500 text-ink-900">
            <Layers className="size-7" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-accent-700">{t("multiEyebrow")}</span>
            <span className="block text-lg font-extrabold text-ink-900">{t("multiTitle")}</span>
            <span className="block text-sm text-ink-700">{t("multiBody")}</span>
          </span>
          <ArrowRight className="flip-rtl ms-auto size-5 shrink-0 text-accent-700 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden />
        </Link>
      </section>

      {/* 3 — Mosaic row: quad boxes + promo */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuadBox {...quad("vitamins-supplements")} />
        <QuadBox {...quad("beauty-skincare")} />
        <div className="flex flex-col justify-between gap-6 rounded-sm bg-brand-700 p-6 text-white">
          <div className="space-y-3">
            <span className="inline-flex size-12 items-center justify-center rounded-sm bg-accent-500 text-ink-900">
              <Banknote className="size-6" aria-hidden />
            </span>
            <h2 className="text-2xl font-extrabold leading-tight">{t("codTitle")}</h2>
            <p className="text-sm text-brand-100">{t("codBody")}</p>
          </div>
          <div className="grid grid-cols-3 gap-2" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className={cn("aspect-square rounded-xs", i === 1 ? "bg-accent-500" : "bg-white/10")} />
            ))}
          </div>
          <Link href="/offers" className={buttonClass("accent", "md", "self-start")}>
            {t("startShopping")}
            <ArrowRight className="flip-rtl size-4" aria-hidden />
          </Link>
        </div>
        <QuadBox {...quad("mother-baby")} />
      </section>

      {/* 4 — Deals of the day */}
      <ProductRail
        title={
          <span className="inline-flex items-center gap-2">
            <Zap className="size-5 fill-accent-500 text-accent-600" aria-hidden />
            {t("dealsTitle")}
          </span>
        }
        aside={<Countdown label={t("endsIn")} />}
        href="/offers"
        {...rail}
      >
        {deals.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </ProductRail>

      {/* 5 — Bento: big promo + spotlights */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <Link
          href="/c/beauty-skincare?sale=1"
          className="group relative flex min-h-64 flex-col justify-end overflow-hidden rounded-sm bg-rose-700 p-6 text-white sm:col-span-2 lg:row-span-2"
        >
          <div aria-hidden className="absolute -end-6 -top-6 grid grid-cols-4 gap-2 opacity-25">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className={cn("size-14 rounded-xs", i === 5 ? "bg-accent-400" : "bg-white")} />
            ))}
          </div>
          <span className="relative text-xs font-bold uppercase tracking-widest text-rose-100">{t("skincareEyebrow")}</span>
          <h2 className="relative mt-2 max-w-sm text-3xl font-extrabold leading-tight">{t("skincareTitle", { pct: skincarePct })}</h2>
          <span className={buttonClass("accent", "md", "relative mt-5 self-start")}>
            {t("shopAll")}
            <ArrowRight className="flip-rtl size-4" aria-hidden />
          </span>
        </Link>
        {SPOTLIGHTS.map(([slug, category]) => (
          <SpotlightTile key={slug} product={spotlights.get(slug)} label={cat(category)} locale={loc} />
        ))}
      </section>

      {/* 6 — Best sellers */}
      <ProductRail title={t("bestTitle")} href="/best-sellers" {...rail}>
        {bestSellers.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </ProductRail>

      {/* 7 — Brands */}
      <Box>
        <h2 className="border-b border-line px-4 py-3 text-base font-bold sm:text-lg">{t("brandsTitle")}</h2>
        <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {brands.map((b) => (
            <li key={b.slug} className="border-b border-e border-line">
              <Link
                href={`/search?brand=${b.slug}`}
                dir="ltr"
                className="flex h-20 items-center justify-center px-2 text-center text-sm font-extrabold uppercase tracking-tight text-ink-700 transition-colors hover:bg-surface hover:text-brand-700"
              >
                {b.name}
              </Link>
            </li>
          ))}
        </ul>
      </Box>

      {/* 8 — Second quad row */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuadBox {...quad("medical-devices")} />
        <QuadBox {...quad("sports-nutrition")} />
        <QuadBox {...quad("personal-care")} />
        <QuadBox {...quad("health-medicine")} />
      </section>

      {/* 9 — New arrivals */}
      <ProductRail title={t("newTitle")} href="/new-arrivals" {...rail}>
        {newArrivals.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </ProductRail>

      {/* 10 — Trust strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { icon: PackageCheck, title: t("trust.genuine"), body: t("trust.genuineBody") },
          { icon: Truck, title: t("trust.fast"), body: t("trust.fastBody") },
          { icon: Banknote, title: t("trust.cod"), body: t("trust.codBody") },
          { icon: Lock, title: t("trust.secure"), body: t("trust.secureBody") },
          { icon: RotateCcw, title: t("trust.returns"), body: t("trust.returnsBody") },
        ].map(({ icon: Icon, title, body }, i) => (
          <div key={title} className={cn("flex items-start gap-3 rounded-sm border border-line bg-white p-4", i === 4 && "col-span-2 lg:col-span-1")}>
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
              <Icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-bold">{title}</span>
              <span className="block text-xs text-ink-600">{body}</span>
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
