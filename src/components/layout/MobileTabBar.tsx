"use client";

import { House, LayoutGrid, ShoppingCart, Tag, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { CartCount } from "./CartCount";

/** App-style floating bottom navigation for phones. */
export function MobileTabBar() {
  const t = useTranslations("TabBar");
  const tHeader = useTranslations("Header");
  const pathname = usePathname();

  const tabs = [
    { href: "/", icon: House, label: t("home") },
    { href: "/offers", icon: Tag, label: t("deals") },
    { href: "/account", icon: UserRound, label: t("account") },
    { href: "/cart", icon: ShoppingCart, label: tHeader("cart"), count: true },
    { href: "/categories", icon: LayoutGrid, label: t("categories") },
  ];

  return (
    <nav
      aria-label={t("home")}
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-full border border-line bg-white/90 p-1.5 shadow-pop backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, icon: Icon, label, count }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold",
                  active ? "bg-brand-50 text-brand-700" : "text-ink-700",
                )}
              >
                <span className="relative">
                  <Icon className={cn("size-6", active && "fill-brand-100")} strokeWidth={active ? 2.2 : 1.9} aria-hidden />
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
