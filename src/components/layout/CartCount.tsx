"use client";

import { useCartCount } from "@/lib/cart-store";

export function CartCount() {
  const count = useCartCount();
  return (
    <span className="absolute -end-2.5 -top-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-ink-900 ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
