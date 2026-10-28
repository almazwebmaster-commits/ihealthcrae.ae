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
import Image from "next/image";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { SponsoredVideo } from "@/components/ads/SponsoredVideo";
import { CategoryIcon } from "@/components/catalog/CategoryIcon";
import { Countdown } from "@/components/catalog/Countdown";
import { Price } from "@/components/catalog/Price";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductRail } from "@/components/catalog/ProductRail";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { LoopVideo } from "@/components/home/LoopVideo";
import { QuadBox } from "@/components/home/QuadBox";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/catalog-types";
import { loopClip } from "@/lib/cloudinary-video";
import { tr } from "@/lib/i18n-utils";
import type { HomeSectionKey } from "@/lib/home-content";
import { tintClasses } from "@/lib/tints";
import { cn } from "@/lib/utils";
import { Fragment } from "react";
import { featuredBrands, getCategories, getProduct, maxDiscount, topProducts } from "@/server/catalog";
import { getVideoAd } from "@/server/ads";
import { getHomeContent } from "@/server/home-content";

// Homepage content comes from the database; re-render at most every 5 minutes.
export const revalidate = 300;


function SpotlightTile({ product, label, locale }: { product?: Product; label: string; locale: string }) {
  if (!product) return null;
  return (
    <Link
      href={`/p/${product.slug}`}
      className="group flex h-full flex-col rounded-2xl bg-white p-4 shadow-box transition-shadow hover:shadow-card"
    >
      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{label}</span>
      <ProductVisual
        product={product}
        sizes="(min-width: 1024px) 320px, 50vw"
        className="my-3 rounded-xl bg-surface-sunken transition-transform group-hover:scale-[1.02]"
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

  // Layout, banners, category boxes and spotlights are edited in Admin > Homepage.
  const home = await getHomeContent();
  const heroSlides = home.heroSlides.filter((s) => s.enabled);
  const quadCategories = [...new Set([...home.quadRow1, ...home.quadRow2])];
  const pct = (slug: string) => (slug ? maxDiscount(slug) : Promise.resolve(0));

  const [categories, quadLists, deals, bestSellers, newArrivals, brands, heroPcts, promoPct, spotlightList, videoAd] =
    await Promise.all([
      getCategories(),
      Promise.all(quadCategories.map((slug) => topProducts({ category: slug, inStock: true }, 4))),
      topProducts({ tag: "deal", sort: "discount", inStock: true }, 12),
      topProducts({ tag: "bestseller", inStock: true }, 12),
      topProducts({ tag: "new", sort: "newest", inStock: true }, 12),
      featuredBrands(16),
      Promise.all(heroSlides.map((s) => pct(s.category))),
      pct(home.promo.category),
      Promise.all(home.spotlights.map((slug) => (slug ? getProduct(slug) : undefined))),
      getVideoAd(),
    ]);

  const rail = { prevLabel: tc("previous"), nextLabel: tc("next"), viewAllLabel: tc("viewAll") };
  const catName = new Map(categories.map((c) => [c.slug, tr(c.name, loc)]));
  const cat = (slug: string) => catName.get(slug) ?? slug;
  const quadProducts = new Map(quadCategories.map((slug, i) => [slug, quadLists[i]]));
  const quad = (slug: string) => ({
    title: cat(slug),
    href: `/c/${slug}`,
    linkLabel: t("shopAll"),
    products: quadProducts.get(slug) ?? [],
  });
  const ar = loc === "ar";
  const withPct = (text: string, n: number) => text.replace("{pct}", String(n));
  const promoImage = (ar && home.promo.imageRtl) || home.promo.image;
  const promoVideo = home.promo.video ? loopClip(home.promo.video.src, home.promo.video.start, home.promo.video.end) : null;
  // Under the video: the photo, or else the clip's first frame (also what reduced-motion visitors see).
  const promoBase = promoImage?.src ?? promoVideo?.poster;

  const blocks: Record<HomeSectionKey, React.ReactNode> = {
    hero: (
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-2">
        <div className="min-w-0 lg:col-span-8 lg:row-span-2">
          <HeroCarousel
            slides={heroSlides.map((s, i) => ({
              id: s.id,
              title: withPct(ar ? s.titleAr : s.titleEn, heroPcts[i]),
              subtitle: ar ? s.subtitleAr : s.subtitleEn,
              cta: ar ? s.ctaAr : s.ctaEn,
              href: s.href,
              theme: s.theme,
              category: s.category,
              desktopImage: s.desktop ?? undefined,
              desktopImageRtl: s.desktopRtl ?? undefined,
              mobileImage: s.mobile ?? undefined,
            }))}
            prevLabel={tc("previous")}
            nextLabel={tc("next")}
            goToLabel={t("goToSlide")}
          />
        </div>
        <Link
          href="/new-arrivals"
          className="group flex items-center gap-4 rounded-2xl bg-pastel-peach p-6 text-ink-900 lg:col-span-4"
        >
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-white text-pastel-peach-ink">
            <PackageOpen className="size-7" aria-hidden />
          </span>
          <span>
            <span className="block font-display text-xl font-extrabold">{t("newTitle")}</span>
            <span className="block text-sm text-ink-700">{t("newBody")}</span>
          </span>
          <ArrowRight className="flip-rtl ms-auto size-5 shrink-0 text-pastel-peach-ink transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden />
        </Link>
        <Link
          href="/best-sellers"
          className="group flex items-center gap-4 rounded-2xl bg-pastel-lavender p-6 text-ink-900 lg:col-span-4"
        >
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-white text-pastel-lavender-ink">
            <TrendingUp className="size-7" aria-hidden />
          </span>
          <span>
            <span className="block font-display text-xl font-extrabold">{t("bestTitle")}</span>
            <span className="block text-sm text-ink-700">{t("bestBody")}</span>
          </span>
          <ArrowRight className="flip-rtl ms-auto size-5 shrink-0 text-pastel-lavender-ink transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden />
        </Link>
      </section>
    ),

    categories: (
      <nav aria-label={tNav("allCategories")} className="no-scrollbar grid grid-flow-col auto-cols-[5.5rem] gap-3 overflow-x-auto sm:auto-cols-fr sm:gap-4">
        {categories.map((c) => {
          return (
            <Link key={c.slug} href={`/c/${c.slug}`} className="group flex flex-col items-center gap-2.5 text-center">
              <span className={cn("inline-flex aspect-square w-full max-w-32 items-center justify-center rounded-full transition-transform group-hover:scale-105", tintClasses(c.tint).bg, tintClasses(c.tint).fg)}>
                <CategoryIcon slug={c.slug} className="size-[38%]" strokeWidth={1.6} aria-hidden />
              </span>
              <span className="line-clamp-2 text-xs font-semibold leading-4 text-ink-800 group-hover:text-brand-700 sm:text-sm sm:leading-5">{tr(c.name, loc)}</span>
            </Link>
          );
        })}
        <Link href="/offers" className="group flex flex-col items-center gap-2.5 text-center">
          <span className="inline-flex aspect-square w-full max-w-32 items-center justify-center rounded-full bg-pastel-coral text-pastel-coral-ink transition-transform group-hover:scale-105">
            <Tag className="size-[38%]" strokeWidth={1.6} aria-hidden />
          </span>
          <span className="text-xs font-bold leading-4 text-pastel-coral-ink sm:text-sm sm:leading-5">{tNav("offers")}</span>
        </Link>
      </nav>
    ),

    savings: (
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/subscribe-and-save"
          className="group relative flex items-center gap-5 overflow-hidden rounded-2xl bg-pastel-mint p-6 sm:px-8"
        >
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Repeat className="size-7" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-brand-700">{t("snsEyebrow")}</span>
            <span className="block font-display text-xl font-extrabold text-ink-900">{t("snsTitle")}</span>
            <span className="block text-sm text-ink-700">{t("snsBody")}</span>
          </span>
          <ArrowRight className="flip-rtl ms-auto size-5 shrink-0 text-brand-700 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden />
        </Link>
        <Link
          href="/multi-buy"
          className="group relative flex items-center gap-5 overflow-hidden rounded-2xl bg-pastel-butter p-6 sm:px-8"
        >
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-accent-500 text-ink-900">
            <Layers className="size-7" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-accent-700">{t("multiEyebrow")}</span>
            <span className="block font-display text-xl font-extrabold text-ink-900">{t("multiTitle")}</span>
            <span className="block text-sm text-ink-700">{t("multiBody")}</span>
          </span>
          <ArrowRight className="flip-rtl ms-auto size-5 shrink-0 text-accent-700 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden />
        </Link>
      </section>
    ),

    mosaic1: (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuadBox {...quad(home.quadRow1[0])} />
        <QuadBox {...quad(home.quadRow1[1])} />
        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-[#d4e8e0] p-6 text-ink-900">
          <div className="space-y-3">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Banknote className="size-7" aria-hidden />
            </span>
            <h2 className="text-2xl font-extrabold leading-tight text-brand-950">{t("codTitle")}</h2>
            <p className="text-sm text-ink-700">{t("codBody")}</p>
          </div>
          {/* Card colour matches the photo's backdrop; the radial mask fades its edges into the card */}
          <div className="relative -mx-4 min-h-48 flex-1 max-xl:aspect-square" aria-hidden>
            <Image
              src="/images/home/cod.jpg"
              alt=""
              fill
              sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 90vw"
              className="object-cover [mask-image:radial-gradient(closest-side,#000_72%,transparent)]"
            />
          </div>
          <Link href="/offers" className={buttonClass("primary", "md", "self-start")}>
            {t("startShopping")}
            <ArrowRight className="flip-rtl size-4" aria-hidden />
          </Link>
        </div>
        <QuadBox {...quad(home.quadRow1[2])} />
      </section>
    ),

    deals: (
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
    ),

    bento: (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <Link
          href={home.promo.href}
          className={cn(
            "group relative flex min-h-64 flex-col justify-end overflow-hidden rounded-2xl p-8 text-ink-900 sm:col-span-2 lg:row-span-2",
            promoBase ? "bg-pastel-sky max-sm:aspect-square" : "bg-pastel-blush",
            promoVideo && "text-white",
          )}
        >
          {/* Photos keep the product to the right, so crop from the left when the tile is taller than wide */}
          {promoBase ? (
            <Image
              src={promoBase}
              alt=""
              fill
              sizes="(min-width: 1024px) 680px, (min-width: 640px) 100vw, 100vw"
              className="object-cover object-right transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div aria-hidden className="absolute -end-6 -top-6 grid grid-cols-4 gap-3">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className={cn("size-14 rounded-2xl", i === 5 ? "bg-accent-400" : i % 3 ? "bg-white/60" : "bg-white")} />
              ))}
            </div>
          )}
          {promoVideo && (
            <>
              <LoopVideo src={promoVideo.video} poster={promoVideo.poster} className="absolute inset-0 size-full object-cover motion-reduce:hidden" />
              {/* Keeps the white text readable over moving footage */}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink-950/85 via-ink-950/45 to-transparent" />
            </>
          )}
          <span className={cn("relative text-xs font-bold uppercase tracking-widest", promoVideo ? "text-brand-200" : promoImage ? "text-brand-700" : "text-pastel-blush-ink")}>{ar ? home.promo.eyebrowAr : home.promo.eyebrowEn}</span>
          <h2 className="relative mt-2 max-w-sm text-3xl font-extrabold leading-tight">{withPct(ar ? home.promo.titleAr : home.promo.titleEn, promoPct)}</h2>
          <span className={buttonClass("primary", "lg", "relative mt-6 self-start")}>
            {t("shopAll")}
            <ArrowRight className="flip-rtl size-4" aria-hidden />
          </span>
        </Link>
        {spotlightList.map((p, i) => (
          <SpotlightTile key={`${home.spotlights[i]}-${i}`} product={p} label={p ? cat(p.category) : ""} locale={loc} />
        ))}
      </section>
    ),

    bestSellers: (
      <ProductRail title={t("bestTitle")} href="/best-sellers" {...rail}>
        {bestSellers.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </ProductRail>
    ),

    videoAd: videoAd ? <SponsoredVideo ad={videoAd} /> : null,

    brands: (
      <section>
        <h2 className="mb-4 text-xl font-extrabold sm:text-2xl">{t("brandsTitle")}</h2>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {brands.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/search?brand=${b.slug}`}
                dir="ltr"
                className="flex h-20 items-center justify-center rounded-xl bg-white px-2 text-center text-sm font-extrabold tracking-tight text-ink-700 shadow-box transition-[color,box-shadow] hover:text-brand-700 hover:shadow-card"
              >
                {b.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    ),

    mosaic2: (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {home.quadRow2.map((slug, i) => (
          <QuadBox key={`${slug}-${i}`} {...quad(slug)} />
        ))}
      </section>
    ),

    newArrivals: (
      <ProductRail title={t("newTitle")} href="/new-arrivals" {...rail}>
        {newArrivals.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </ProductRail>
    ),

    trust: (
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { icon: PackageCheck, title: t("trust.genuine"), body: t("trust.genuineBody") },
          { icon: Truck, title: t("trust.fast"), body: t("trust.fastBody") },
          { icon: Banknote, title: t("trust.cod"), body: t("trust.codBody") },
          { icon: Lock, title: t("trust.secure"), body: t("trust.secureBody") },
          { icon: RotateCcw, title: t("trust.returns"), body: t("trust.returnsBody") },
        ].map(({ icon: Icon, title, body }, i) => (
          <div key={title} className={cn("flex items-center gap-3 rounded-xl bg-white p-4 shadow-box", i === 4 && "col-span-2 lg:col-span-1")}>
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-ink-600">{body}</span>
            </span>
          </div>
        ))}
      </section>
    ),
  };

  return (
    <div className="container-site space-y-8 py-5 lg:space-y-12 lg:py-6">
      {home.sections
        .filter((sec) => sec.enabled && (sec.key !== "hero" || heroSlides.length))
        .map((sec) => (
          <Fragment key={sec.key}>{blocks[sec.key]}</Fragment>
        ))}
    </div>
  );
}
