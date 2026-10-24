"use client";

import { useCartCount } from "@/lib/cart-store";

export function CartCount() {
  const count = useCartCount();
  return (
    <span className="absolute -end-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-xs bg-accent-500 px-1 text-[11px] font-bold text-ink-900">
      {count > 99 ? "99+" : count}
    </span>
  );
}
