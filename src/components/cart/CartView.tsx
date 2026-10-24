"use client";

import { Banknote, Layers, Lock, Minus, Plus, Repeat, ShoppingCart, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { cart, CART_MAX_QTY, useCartLines } from "@/lib/cart-store";
import type { Product } from "@/lib/catalog-types";
import { formatPrice, tr } from "@/lib/i18n-utils";
import { nextTier, priceLine, SUBSCRIBE_FREQUENCIES } from "@/lib/pricing";
import { FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_FEE, VAT_RATE } from "@/lib/store-settings";

const DELIVERY_FEE = STANDARD_DELIVERY_FEE;

export function CartView() {
  const t = useTranslations("Cart");
  const tp = useTranslations("Product");
  const locale = useLocale();
  const cartLines = useCartLines();
  const products = useCartProducts(cartLines.map((l) => l.slug));
  if (cartLines.length && !products) return <CartSkeleton />;

  const lines = cartLines
    .map((l) => {
      const product = products?.get(l.slug);
      if (!product) return null;
      const variant = l.option != null ? product.options?.[l.option] : undefined;
      const key = { slug: l.slug, option: l.option, sub: l.sub };
      return { ...l, key, product, variant, price: priceLine(product, l.option, l.qty, l.sub) };
    })
    .filter((l) => l != null);

  if (!lines.length) {
    return (
      <Box className="flex flex-col items-center px-6 py-16 text-center">
        <ShoppingCart className="size-14 text-ink-300" aria-hidden />
        <h1 className="mt-4 text-xl font-bold">{t("emptyTitle")}</h1>
        <p className="mt-1 text-sm text-ink-600">{t("emptyBody")}</p>
        <Link href="/" className={buttonClass("accent", "lg", "mt-6")}>
          {t("continue")}
        </Link>
      </Box>
    );
  }

  const fmt = (n: number) => formatPrice(n, locale);
  const listTotal = lines.reduce((s, l) => s + l.price.base * l.qty, 0);
  const savings = lines.reduce((s, l) => s + l.price.savings, 0);
  const subtotal = listTotal - savings;
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;
  const vat = total - total / (1 + VAT_RATE);
  const remaining = FREE_DELIVERY_THRESHOLD - subtotal;
  const subscriptions = lines.filter((l) => l.sub).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <Box>
        <h1 className="border-b border-line px-4 py-3 text-xl font-extrabold">
          {t("title", { count: lines.reduce((n, l) => n + l.qty, 0) })}
        </h1>
        <ul>
          {lines.map((l) => {
            const upsell = !l.sub ? nextTier(l.product.tiers, l.qty) : undefined;
            const maxQty = Math.min(CART_MAX_QTY, l.product.stock);
            return (
              <li key={`${l.slug}-${l.option}-${l.sub}`} className="flex gap-3 border-b border-line p-4 last:border-b-0">
                <Link href={`/p/${l.slug}`} className="w-20 shrink-0 overflow-hidden rounded-sm border border-line sm:w-28">
                  <ProductVisual product={l.product} sizes="112px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase text-brand-600">{l.product.brandName}</span>
                  <Link href={`/p/${l.slug}`} className="line-clamp-2 text-sm font-medium hover:text-brand-700 hover:underline">
                    {tr(l.product.name, locale)}
                  </Link>
                  {l.variant && <span className="text-xs text-ink-600">{tr(l.variant.label, locale)}</span>}

                  {/* Purchase type: switch between one-time and subscription */}
                  {l.product.subscribe && (
                    <label className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-sm border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800">
                      <Repeat className="size-3.5" aria-hidden />
                      <span className="sr-only">{tp("purchaseType")}</span>
                      <select
                        value={l.sub ?? ""}
                        onChange={(e) => cart.setSubscription(l.key, e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-transparent focus:outline-none"
                      >
                        <option value="">{tp("oneTime")}</option>
                        {SUBSCRIBE_FREQUENCIES.map((w) => (
                          <option key={w} value={w}>
                            {t("subscribeEvery", { pct: l.product.subscribe!, weeks: tp("weeks", { count: w }) })}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {l.price.kind && (
                    <span className="text-xs font-bold text-success">
                      {l.price.kind === "subscribe"
                        ? t("appliedSubscribe", { pct: l.price.pct })
                        : t("appliedMultibuy", { pct: l.price.pct })}
                    </span>
                  )}
                  {upsell && l.qty < maxQty && (
                    <button
                      type="button"
                      onClick={() => cart.setQty(l.key, upsell.qty)}
                      className="inline-flex w-fit items-center gap-1 text-start text-xs font-semibold text-accent-700 hover:underline"
                    >
                      <Layers className="size-3.5 shrink-0" aria-hidden />
                      {tp("tierUpsell", { more: upsell.qty - l.qty, pct: upsell.pct })}
                    </button>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                    <div className="inline-flex h-9 items-center rounded-sm border border-line-strong">
                      <button
                        type="button"
                        aria-label={t("decrease")}
                        disabled={l.qty <= 1}
                        onClick={() => cart.setQty(l.key, l.qty - 1)}
                        className="inline-flex size-9 items-center justify-center hover:bg-surface disabled:opacity-40"
                      >
                        <Minus className="size-4" aria-hidden />
                      </button>
                      <span className="w-8 text-center text-sm font-bold" aria-live="polite">{l.qty}</span>
                      <button
                        type="button"
                        aria-label={t("increase")}
                        disabled={l.qty >= maxQty}
                        onClick={() => cart.setQty(l.key, l.qty + 1)}
                        className="inline-flex size-9 items-center justify-center hover:bg-surface disabled:opacity-40"
                      >
                        <Plus className="size-4" aria-hidden />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.remove(l.key)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600 hover:text-sale"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      {t("remove")}
                    </button>
                  </div>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-base font-extrabold">{fmt(l.price.total)}</p>
                  {l.price.savings > 0 && <s className="text-xs text-ink-500">{fmt(l.price.base * l.qty)}</s>}
                  {l.qty > 1 && <p className="text-xs text-ink-500">{t("each", { price: fmt(l.price.unit) })}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </Box>

      <div className="space-y-3 self-start lg:sticky lg:top-40">
        <Box className="space-y-3 p-4">
          {remaining > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-ink-800">{t("freeDeliveryRemaining", { amount: fmt(remaining) })}</p>
              <div className="h-2 overflow-hidden rounded-xs bg-surface">
                <div className="h-full bg-accent-500" style={{ width: `${(subtotal / FREE_DELIVERY_THRESHOLD) * 100}%` }} />
              </div>
            </div>
          ) : (
            <p className="rounded-sm bg-success-50 px-3 py-2 text-xs font-bold text-success">{t("freeDeliveryUnlocked")}</p>
          )}
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-600">{t("itemsTotal")}</dt><dd className="font-semibold">{fmt(listTotal)}</dd></div>
            {savings > 0 && (
              <div className="flex justify-between text-success"><dt>{t("savings")}</dt><dd className="font-bold">−{fmt(savings)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-ink-600">{t("delivery")}</dt><dd className="font-semibold">{delivery ? fmt(delivery) : t("free")}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-base"><dt className="font-bold">{t("total")}</dt><dd className="font-extrabold">{fmt(total)}</dd></div>
            <div className="flex justify-between text-xs text-ink-500"><dt>{t("vatIncluded")}</dt><dd>{fmt(vat)}</dd></div>
          </dl>
          {subscriptions > 0 && (
            <p className="flex items-start gap-2 rounded-sm bg-brand-50 p-2.5 text-xs text-brand-800">
              <Repeat className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {t("subscriptionNote", { count: subscriptions })}
            </p>
          )}
          <Link href="/checkout" className={buttonClass("accent", "lg", "w-full")}>
            <Lock className="size-4" aria-hidden />
            {t("checkout")}
          </Link>
        </Box>
        <Box className="flex items-center gap-3 p-4 text-xs text-ink-700">
          <Banknote className="size-5 shrink-0 text-brand-700" aria-hidden />
          {t("codNote")}
        </Box>
      </div>
    </div>
  );
}

/** Loads current product data for the cart's slugs (prices and stock come from the database). */
function useCartProducts(slugs: string[]) {
  const key = [...new Set(slugs)].sort().join(",");
  const [state, setState] = useState<{ key: string; map: Map<string, Product> } | null>(null);

  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    fetch(`/api/products?slugs=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then(({ items }: { items: Product[] }) => setState({ key, map: new Map(items.map((p) => [p.slug, p])) }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [key]);

  if (!key) return new Map<string, Product>();
  return state?.key === key ? state.map : undefined;
}

function CartSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]" aria-busy="true">
      <Box className="space-y-4 p-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="size-20 rounded-sm bg-surface sm:size-28" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-24 rounded-xs bg-surface" />
              <div className="h-4 w-3/4 rounded-xs bg-surface" />
            </div>
          </div>
        ))}
      </Box>
      <Box className="h-64" />
    </div>
  );
}