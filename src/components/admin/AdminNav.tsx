"use client";

import { LayoutDashboard, Package, ShoppingBag, Tag } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", icon: LayoutDashboard, key: "dashboard" },
  { href: "/admin/orders", icon: ShoppingBag, key: "orders" },
  { href: "/admin/products", icon: Package, key: "products" },
  { href: "/admin/promotions", icon: Tag, key: "promotions" },
] as const;

export function AdminNav({ labels, openOrders }: { labels: Record<string, string>; openOrders: number }) {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar flex overflow-x-auto lg:flex-col lg:gap-0.5">
      {ITEMS.map(({ href, icon: Icon, key }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm font-semibold",
              active ? "bg-brand-700 text-white" : "text-ink-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {labels[key]}
            {key === "orders" && openOrders > 0 && (
              <span className="ms-auto rounded-xs bg-accent-500 px-1.5 py-0.5 text-[11px] font-bold text-ink-900">{openOrders}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
