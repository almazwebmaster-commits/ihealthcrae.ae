"use client";

import { Heart, House, ShoppingBag, Tag, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { CartCount } from "./CartCount";

/** App-style bottom navigation for phones. */
export function MobileTabBar() {
  const t = useTranslations("TabBar");
  const tNav = useTranslations("Nav");
  const tHeader = useTranslations("Header");
  const pathname = usePathname();

  const tabs = [
    { href: "/", icon: House, label: t("home") },
    { href: "/offers", icon: Tag, label: tNav("offers") },
    { href: "/wishlist", icon: Heart, label: tHeader("wishlist") },
    { href: "/account", icon: UserRound, label: t("account") },
    { href: "/cart", icon: ShoppingBag, label: tHeader("cart"), count: true },
  ];

  return (
    <nav
      aria-label={t("home")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {tabs.map(({ href, icon: Icon, label, count }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                  active ? "text-brand-600" : "text-ink-600",
                )}
              >
                <span className="relative">
                  <Icon className="size-5.5" strokeWidth={active ? 2.2 : 1.9} aria-hidden />
                  {count && <CartCount />}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
