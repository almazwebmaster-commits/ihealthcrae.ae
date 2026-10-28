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

/** Header action: icon over a small label (label from lg up). */
export const headerAction =
  "relative inline-flex h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-ink-900 transition-colors hover:bg-surface-sunken";

export async function Header() {
  const categories = await getCategories();
  const locale = await getLocale();
  const t = await getTranslations("Header");
  const tNav = await getTranslations("Nav");

  const searchCategories = categories.map((c) => ({ slug: c.slug, name: tr(c.name, locale), tint: c.tint }));

  return (
    <div className="border-b border-line bg-white">
      <div className="container-site flex h-16 items-center gap-2 lg:h-20 lg:gap-8">
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
          <Logo className="[&_svg]:size-8 [&>span:last-child]:text-xl sm:[&>span:last-child]:text-2xl" />
        </Link>

        <SearchBox categories={searchCategories} className="hidden min-w-0 flex-1 md:block" />

        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <AccountMenu />

          <Link href="/wishlist" className={`${headerAction} hidden sm:inline-flex`} aria-label={t("wishlist")}>
            <Heart className="size-5.5" strokeWidth={1.9} aria-hidden />
            <span className="hidden text-xs font-medium lg:block">{t("wishlist")}</span>
          </Link>

          <Link href="/cart" className={headerAction} aria-label={t("cart")}>
            <span className="relative">
              <ShoppingBag className="size-5.5" strokeWidth={1.9} aria-hidden />
              <CartCount />
            </span>
            <span className="hidden text-xs font-medium lg:block">{t("cart")}</span>
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
