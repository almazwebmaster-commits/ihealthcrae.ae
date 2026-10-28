"use client";

import { Banknote, Layers, Lock, PackageCheck, Repeat, RotateCcw, Truck, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { Countdown } from "@/components/catalog/Countdown";
import { Price } from "@/components/catalog/Price";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import type { Product } from "@/lib/catalog-types";
import { useRouter } from "@/i18n/navigation";
import { cart } from "@/lib/cart-store";
import { formatPrice, tr } from "@/lib/i18n-utils";
import { basePrice, DEFAULT_FREQUENCY, nextTier, priceLine, SUBSCRIBE_FREQUENCIES, tierFor } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const choice = (active: boolean) =>
  cn(
    "block w-full rounded-sm border p-3 text-start transition-colors",
    active ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-line-strong bg-white hover:border-ink-400",
  );

export function BuyBox({ product }: { product: Product }) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const router = useRouter();
  const [option, setOption] = useState(0);
  const [qty, setQty] = useState(1);
  const [subscribe, setSubscribe] = useState(false);
  const [every, setEvery] = useState<number>(DEFAULT_FREQUENCY);

  const optionIdx = product.options ? option : undefined;
  const sub = subscribe && product.subscribe ? every : undefined;
  const line = priceLine(product, optionIdx, qty, sub);
  const base = basePrice(product, optionIdx);
  const fmt = (n: number) => formatPrice(n, locale);
  // Strike-through: the applied discount, else the product's list price.
  const was = line.pct > 0 ? base : base === product.price ? product.was : undefined;
  const soldOut = product.stock === 0;
  const express = product.tags.includes("express");
  const maxQty = Math.min(10, product.stock);
  const activeTier = tierFor(product.tiers, qty);
  const upsell = nextTier(product.tiers, qty);
  const key = { slug: product.slug, option: optionIdx, sub };

  return (
    <Box className="space-y-4 p-4">
      {product.flashEndsAt && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-sale px-3 py-2 text-white">
          <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
            <Zap className="size-4" aria-hidden />
            {t("flashDeal")}
          </span>
          <span className="[&_*]:text-white [&_span.rounded-xs]:bg-white/20">
            <Countdown label={t("flashEndsIn")} until={product.flashEndsAt} />
          </span>
        </div>
      )}
      <div>
        <Price price={line.unit} was={was} size="lg" />
        <p className="mt-1 text-xs text-ink-500">
          {t("vatIncluded")}
          {qty > 1 && <> · {t("lineTotal", { total: fmt(line.total) })}</>}
        </p>
        {line.savings > 0 && (
          <p className="mt-1 text-xs font-bold text-success">
            {line.kind === "subscribe" ? t("savingSubscribe", { amount: fmt(line.savings) }) : t("savingMultibuy", { amount: fmt(line.savings) })}
          </p>
        )}
      </div>

      {product.options && (
        <fieldset>
          <legend className="mb-2 text-xs font-bold text-ink-800">{t("chooseOption")}</legend>
          <div className="flex flex-wrap gap-2">
            {product.options.map((o, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={option === i}
                onClick={() => setOption(i)}
                className={cn(
                  "rounded-sm border px-3 py-2 text-start text-xs font-semibold",
                  option === i
                    ? "border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-600"
                    : "border-line-strong bg-white text-ink-800 hover:border-ink-400",
                )}
              >
                {tr(o.label, locale)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Purchase type */}
      {product.subscribe && !soldOut && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-bold text-ink-800">{t("purchaseType")}</legend>
          <label className={choice(!subscribe)}>
            <span className="flex items-center gap-2">
              <input type="radio" name="purchase" checked={!subscribe} onChange={() => setSubscribe(false)} className="accent-brand-600" />
              <span className="flex-1 text-sm font-bold">{t("oneTime")}</span>
              <span className="text-sm font-bold">{fmt(priceLine(product, optionIdx, qty).unit)}</span>
            </span>
          </label>
          <div className={choice(subscribe)}>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="purchase" checked={subscribe} onChange={() => setSubscribe(true)} className="accent-brand-600" />
              <Repeat className="size-4 text-brand-700" aria-hidden />
              <span className="flex-1 text-sm font-bold">{t("subscribeSave", { pct: product.subscribe })}</span>
              <span className="text-sm font-bold text-brand-700">{fmt(priceLine(product, optionIdx, qty, every).unit)}</span>
            </label>
            {subscribe && (
              <div className="mt-3 space-y-2 border-t border-brand-200 pt-3 ps-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-ink-800">
                  {t("deliverEvery")}
                  <select
                    value={every}
                    onChange={(e) => setEvery(Number(e.target.value))}
                    className="h-8 rounded-sm border border-line-strong bg-white px-2 text-xs focus:border-brand-500 focus:outline-none"
                  >
                    {SUBSCRIBE_FREQUENCIES.map((w) => (
                      <option key={w} value={w}>
                        {t("weeks", { count: w })}
                      </option>
                    ))}
                  </select>
                </label>
                <ul className="space-y-1 text-xs text-ink-600">
                  <li>✓ {t("snsPerk1")}</li>
                  <li>✓ {t("snsPerk2")}</li>
                </ul>
              </div>
            )}
          </div>
        </fieldset>
      )}

      {/* Buy more, save more */}
      {product.tiers && !soldOut && (
        <fieldset>
          <legend className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-ink-800">
            <Layers className="size-4 text-accent-700" aria-hidden />
            {t("buyMoreSaveMore")}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {[{ qty: 1, pct: 0 }, ...product.tiers].map((tier) => {
              const active = (activeTier?.qty ?? 1) === tier.qty;
              const unit = Math.round(base * (1 - tier.pct / 100) * 100) / 100;
              return (
                <button
                  key={tier.qty}
                  type="button"
                  aria-pressed={active}
                  disabled={tier.qty > maxQty}
                  onClick={() => setQty(tier.qty)}
                  className={cn(
                    "rounded-sm border px-2 py-2 text-center disabled:opacity-40",
                    active ? "border-accent-600 bg-accent-50 ring-1 ring-accent-600" : "border-line-strong bg-white hover:border-ink-400",
                  )}
                >
                  <span className="block text-xs font-bold text-ink-900">
                    {tier === product.tiers!.at(-1) ? t("tierPlus", { qty: tier.qty }) : t("tierQty", { qty: tier.qty })}
                  </span>
                  <span className="block text-[11px] text-ink-600">{fmt(unit)}</span>
                  <span className={cn("block text-[11px] font-bold", tier.pct ? "text-sale" : "text-ink-400")}>
                    {tier.pct ? t("tierSave", { pct: tier.pct }) : t("tierFull")}
                  </span>
                </button>
              );
            })}
          </div>
          {upsell && qty < maxQty && (
            <p className="mt-2 text-xs text-ink-600">
              {t("tierUpsell", { more: upsell.qty - qty, pct: upsell.pct })}
            </p>
          )}
          {subscribe && product.subscribe && (
            <p className="mt-2 text-[11px] text-ink-500">{t("noStacking")}</p>
          )}
        </fieldset>
      )}

      <div className="flex items-start gap-2 rounded-sm bg-surface p-3 text-sm">
        <Truck className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden />
        <div>
          <p className="font-bold text-ink-900">{express ? t("deliveryTodayTitle") : t("deliveryTomorrowTitle")}</p>
          <p className="text-xs text-ink-600">{t("freeDeliveryNote")}</p>
        </div>
      </div>

      <p className={cn("text-sm font-bold", soldOut || product.stock < 5 ? "text-sale" : "text-success")}>
        {soldOut ? t("outOfStock") : product.stock < 5 ? t("onlyLeft", { count: product.stock }) : t("inStock")}
      </p>

      {!soldOut && (
        <>
          <div className="flex items-center gap-2">
            <label htmlFor="qty" className="text-xs font-bold text-ink-800">
              {t("quantity")}
            </label>
            <select
              id="qty"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="h-9 rounded-sm border border-line-strong bg-white px-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              {Array.from({ length: maxQty }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <AddToCartButton
              slug={product.slug}
              option={optionIdx}
              sub={sub}
              qty={qty}
              label={sub ? t("subscribeNow") : t("addToCart")}
              addedLabel={t("added")}
              size="lg"
              className="w-full"
            />
            {!sub && (
              <button
                type="button"
                className={buttonClass("soft", "lg", "w-full")}
                onClick={() => {
                  cart.add(key, qty);
                  router.push("/cart");
                }}
              >
                {t("buyNow")}
              </button>
            )}
          </div>
        </>
      )}

      <ul className="space-y-2 border-t border-line pt-4 text-xs text-ink-700">
        <li className="flex items-center gap-2"><Banknote className="size-4 text-brand-700" aria-hidden />{t("codAvailable")}</li>
        <li className="flex items-center gap-2"><RotateCcw className="size-4 text-brand-700" aria-hidden />{t("returns")}</li>
        <li className="flex items-center gap-2"><PackageCheck className="size-4 text-brand-700" aria-hidden />{t("genuine")}</li>
        <li className="flex items-center gap-2"><Lock className="size-4 text-brand-700" aria-hidden />{t("securePayment")}</li>
      </ul>
    </Box>
  );
}
