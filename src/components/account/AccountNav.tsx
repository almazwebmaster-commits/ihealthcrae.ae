"use client";

import { Heart, LayoutDashboard, LayoutGrid, MapPin, Package, Repeat, ShieldCheck } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", icon: LayoutGrid, key: "overview" },
  { href: "/account/orders", icon: Package, key: "orders" },
  { href: "/account/subscriptions", icon: Repeat, key: "subscriptions" },
  { href: "/account/wishlist", icon: Heart, key: "wishlist" },
  { href: "/account/addresses", icon: MapPin, key: "addresses" },
  { href: "/account/profile", icon: ShieldCheck, key: "profile" },
] as const;

export function AccountNav({ labels, isStaff }: { labels: Record<string, string>; isStaff: boolean }) {
  const pathname = usePathname();
  const items = [...ITEMS, ...(isStaff ? [{ href: "/admin", icon: LayoutDashboard, key: "admin" } as const] : [])];

  return (
    <nav aria-label={labels.title} className="rounded-sm border border-line bg-white">
      <ul className="no-scrollbar flex overflow-x-auto lg:flex-col">
        {items.map(({ href, icon: Icon, key }) => {
          const active = href === "/account" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0 lg:border-b lg:border-line">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 border-b-2 px-4 py-3 text-sm font-semibold lg:border-b-0 lg:border-s-4",
                  active ? "border-brand-600 bg-brand-50 text-brand-800" : "border-transparent text-ink-700 hover:bg-surface",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {labels[key]}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0">
          <SignOutButton label={labels.signOut} className="w-full px-4 py-3 text-sm font-semibold text-ink-600 hover:bg-surface hover:text-sale" />
        </li>
      </ul>
    </nav>
  );
}
