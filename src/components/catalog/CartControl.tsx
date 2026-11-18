"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CART_MAX_QTY, cart, useCartLines } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

/**
 * Card add-to-cart: "+ Add", which becomes a quantity stepper once the product is in the cart.
 * Products with options can't be added blind, so they link to the product page instead.
 * `overlay` is the compact white version that sits on the product photo (featured collections).
 */
export function CartControl({
  slug,
  hasOptions,
  soldOut,
  variant = "pill",
  className,
}: {
  slug: string;
  hasOptions?: boolean;
  soldOut?: boolean;
  variant?: "pill" | "overlay";
  className?: string;
}) {
  const t = useTranslations("Product");
  const lines = useCartLines();
  const key = { slug };
  const qty = lines.find((l) => l.slug === slug && l.option == null && l.sub == null)?.qty ?? 0;
  const overlay = variant === "overlay";

  const shell = overlay
    ? "h-10 rounded-xl border-2 border-brand-600 bg-white px-4 text-sm font-extrabold uppercase tracking-wide text-brand-700 shadow-card hover:bg-brand-50"
    : "h-11 w-full rounded-full text-sm font-bold";

  if (soldOut)
    return (
      <span className={cn("inline-flex items-center justify-center bg-surface-sunken text-ink-500", shell, overlay && "border-line text-ink-500", className)}>
        {t("outOfStock")}
      </span>
    );

  if (hasOptions)
    return (
      <Link
        href={`/p/${slug}`}
        className={cn("inline-flex items-center justify-center gap-1.5", shell, !overlay && "border-[1.5px] border-brand-600 bg-white text-brand-700 hover:bg-brand-50", className)}
      >
        {overlay ? t("optionsShort") : t("chooseOptions")}
      </Link>
    );

  if (!qty)
    return (
      <button
        type="button"
        onClick={() => cart.add(key, 1)}
        className={cn("inline-flex items-center justify-center gap-1.5", shell, !overlay && "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900", className)}
      >
        {!overlay && <Plus className="size-4" strokeWidth={2.5} aria-hidden />}
        {overlay ? t("addShort") : t("add")}
      </button>
    );

  const step = "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-brand-800 hover:bg-white/70 disabled:opacity-40";
  return (
    <div
      role="group"
      aria-label={t("inCart", { count: qty })}
      className={cn(
        "flex items-center justify-between gap-1 border-2 border-brand-600 bg-brand-50 px-0.5",
        overlay ? "h-11 min-w-32 rounded-xl" : "h-11 w-full rounded-full",
        className,
      )}
    >
      <button type="button" className={step} aria-label={qty === 1 ? t("removeFromCart") : t("decrease")} onClick={() => (qty === 1 ? cart.remove(key) : cart.setQty(key, qty - 1))}>
        {qty === 1 ? <Trash2 className="size-4.5" aria-hidden /> : <Minus className="size-4.5" aria-hidden />}
      </button>
      <span className="min-w-6 text-center text-base font-bold tabular-nums text-ink-900" aria-live="polite">
        {qty}
      </span>
      <button type="button" className={step} aria-label={t("increase")} disabled={qty >= CART_MAX_QTY} onClick={() => cart.setQty(key, qty + 1)}>
        <Plus className="size-4.5" aria-hidden />
      </button>
    </div>
  );
}
