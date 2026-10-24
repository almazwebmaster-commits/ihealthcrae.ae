import { Heart, ShoppingBag } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { getCategories } from "@/server/catalog";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/i18n-utils";
import { AccountMenu } from "./AccountMenu";
import { CartCount } from "./CartCount";
import { MobileMenu } from "./MobileMenu";
import { SearchBox } from "./SearchBox";

export async function Header() {
  const categories = await getCategories();
  const locale = await getLocale();
  const t = await getTranslations("Header");
  const tNav = await getTranslations("Nav");

  const searchCategories = categories.map((c) => ({ slug: c.slug, name: tr(c.name, locale), tint: c.tint }));

  const tile =
    "relative inline-flex h-10 items-center gap-2 rounded-sm border border-white/25 px-2.5 text-white transition-colors hover:bg-white/10";

  return (
    <div className="bg-brand-900">
      <div className="container-site flex h-16 items-center gap-2 lg:gap-5">
        <MobileMenu
          items={[
            { href: "/offers", label: tNav("offers") },
            { href: "/subscribe-and-save", label: tNav("subscribe") },
            { href: "/multi-buy", label: tNav("multibuy") },
            { href: "/best-sellers", label: tNav("bestSellers") },
            { href: "/new-arrivals", label: tNav("newArrivals") },
            ...categories.map((c) => ({ href: `/c/${c.slug}`, label: tr(c.name, locale) })),
          ]}
          menuLabel={t("menu")}
          closeLabel={t("close")}
        />

        <Link href="/" className="shrink-0" aria-label="iHealthcare.ae">
          <Logo
            tone="dark"
            className="[&_svg]:size-8 [&>span:last-child]:text-xl sm:[&>span:last-child]:text-2xl"
          />
        </Link>

        <SearchBox categories={searchCategories} className="hidden min-w-0 flex-1 md:block" />

        <div className="ms-auto flex items-center gap-1.5 md:ms-0">
          <AccountMenu />

          <Link href="/wishlist" className={`${tile} hidden sm:inline-flex`} aria-label={t("wishlist")}>
            <Heart className="size-5" aria-hidden />
          </Link>

          <Link href="/cart" className={tile} aria-label={t("cart")}>
            <span className="relative">
              <ShoppingBag className="size-5" aria-hidden />
              <CartCount />
            </span>
            <span className="hidden text-sm font-bold xl:inline">{t("cart")}</span>
          </Link>
        </div>
      </div>

      {/* Mobile search row */}
      <div className="container-site pb-3 md:hidden">
        <SearchBox categories={searchCategories} />
      </div>
    </div>
  );
}
