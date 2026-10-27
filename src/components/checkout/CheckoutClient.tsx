"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import { Banknote, CreditCard, Lock, Repeat, Tag, Truck, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { FormMessage } from "@/components/auth/AuthCard";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import { Box } from "@/components/ui/Box";
import { Button, buttonClass } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Link, useRouter } from "@/i18n/navigation";
import { useCartLines } from "@/lib/cart-store";
import type { ProductImage } from "@/lib/catalog-types";
import { emirateName, emirates } from "@/lib/emirates";
import { formatPrice, tr, type L } from "@/lib/i18n-utils";
import { formatUaePhone } from "@/lib/phone";
import {
  COD_MAX_ORDER,
  EXPRESS_DELIVERY_FEE,
  expressAvailable,
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
  type DeliveryMethod,
  type PaymentChoice,
} from "@/lib/store-settings";
import type { TintKey } from "@/lib/tints";
import { cn } from "@/lib/utils";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

// Stripe's payment form styled to match the boxy brand.
const appearance: Appearance = {
  theme: "stripe",
  variables: { colorPrimary: "#0b6e69", colorText: "#0e1b2c", colorDanger: "#d92d20", borderRadius: "2px", fontFamily: "Inter, system-ui, sans-serif" },
};

type SavedAddress = {
  id: number; label: string | null; fullName: string; phone: string; emirate: string; area: string;
  street: string | null; building: string; unit: string | null; landmark: string | null; isDefault: boolean;
};

type QuoteLine = {
  key: string; slug: string; name: L; brandName: string; category: string; categoryTint: TintKey; images: ProductImage[];
  optionLabel: L | null; sub: number | null; qty: number; unit: number; total: number; base: number;
};
type Quote = {
  lines: QuoteLine[]; issues: { slug: string; problem: "unavailable" | "stock"; available?: number }[];
  itemsTotal: number; discount: number; subtotal: number; deliveryFee: number; codFee: number; total: number;
  vatAmount: number; hasSubscription: boolean; express: boolean; codAllowed: boolean;
  coupon: { code: string; type: "PERCENT" | "FIXED" | "FREE_DELIVERY"; descriptionEn: string; descriptionAr: string } | null;
  couponDiscount: number;
  couponError: { code: string; error: string; minSpend?: number } | null;
};

type Form = { email: string; fullName: string; phone: string; emirate: string; area: string; street: string; building: string; unit: string; landmark: string };
const EMPTY_FORM: Form = { email: "", fullName: "", phone: "", emirate: "", area: "", street: "", building: "", unit: "", landmark: "" };

const fromSaved = (a: SavedAddress, email: string): Form => ({
  email, fullName: a.fullName, phone: formatUaePhone(a.phone), emirate: a.emirate, area: a.area,
  street: a.street ?? "", building: a.building, unit: a.unit ?? "", landmark: a.landmark ?? "",
});

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Box className="p-5">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
        <span className="inline-flex size-7 items-center justify-center rounded-xs bg-brand-700 text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </Box>
  );
}

function Choice({ checked, disabled, onSelect, icon: Icon, title, detail, aside, name }: {
  checked: boolean; disabled?: boolean; onSelect: () => void; icon: typeof Truck; title: string; detail?: string; aside?: string; name: string;
}) {
  return (
    <label className={cn(
      "flex cursor-pointer items-start gap-3 rounded-sm border p-3.5",
      checked ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-line-strong bg-white hover:border-ink-400",
      disabled && "cursor-not-allowed opacity-50",
    )}>
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onSelect} className="mt-1 accent-brand-600" />
      <Icon className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        {detail && <span className="block text-xs text-ink-600">{detail}</span>}
      </span>
      {aside && <span className="shrink-0 text-sm font-bold">{aside}</span>}
    </label>
  );
}

/** Card step: Stripe Payment Element + confirm. Redirects to the confirmation page (3-D Secure included). */
function PayButton({ total, returnUrl, onError }: { total: string; returnUrl: string; onError: (m: string) => void }) {
  const t = useTranslations("Checkout");
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={!stripe || !elements || busy}
        onClick={async () => {
          if (!stripe || !elements) return;
          setBusy(true);
          const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl } });
          // Only reached if the payment failed immediately (otherwise Stripe redirects).
          setBusy(false);
          if (error) onError(error.message ?? t("errors.payment"));
        }}
      >
        <Lock className="size-4" aria-hidden />
        {busy ? t("processing") : t("payNow", { total })}
      </Button>
    </div>
  );
}

export function CheckoutClient({
  user,
  addresses,
}: {
  user: { name: string; email: string; phone: string | null } | null;
  addresses: SavedAddress[];
}) {
  const t = useTranslations("Checkout");
  const tAuth = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const lines = useCartLines();
  const fmt = (n: number) => formatPrice(n, locale);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<number | "new">(defaultAddress?.id ?? "new");
  const [form, setForm] = useState<Form>(() =>
    defaultAddress ? fromSaved(defaultAddress, user?.email ?? "") : { ...EMPTY_FORM, email: user?.email ?? "", fullName: user?.name ?? "", phone: user?.phone ? formatUaePhone(user.phone) : "" },
  );
  const [saveAddress, setSaveAddress] = useState(true);
  const [delivery, setDelivery] = useState<DeliveryMethod>("standard");
  const [payment, setPayment] = useState<PaymentChoice>("CARD");
  const [note, setNote] = useState("");
  /** Promo code the shopper applied (re-checked by the server on every quote and at placement) */
  const [coupon, setCoupon] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string>();
  const [placing, setPlacing] = useState(false);
  const [pending, setPending] = useState<{ number: string; token: string; clientSecret: string } | null>(null);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const canExpress = expressAvailable(form.emirate);
  const effectiveDelivery: DeliveryMethod = canExpress ? delivery : "standard";
  const linesKey = JSON.stringify(lines);

  // Live server-side price whenever the cart or choices change.
  useEffect(() => {
    if (!lines.length) return;
    const ctrl = new AbortController();
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, emirate: form.emirate || undefined, delivery: effectiveDelivery, payment, coupon: coupon || undefined, email: user?.email }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((q: Quote) => setQuote(q))
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- linesKey is the stable form of `lines`
  }, [linesKey, form.emirate, effectiveDelivery, payment, coupon]);

  const effectivePayment: PaymentChoice = quote && !quote.codAllowed ? "CARD" : payment;
  const returnUrl = useMemo(
    () => (pending && typeof window !== "undefined" ? `${window.location.origin}/${locale}/checkout/complete?order=${pending.number}&t=${pending.token}` : ""),
    [pending, locale],
  );

  if (!lines.length) {
    return (
      <Box className="mx-auto max-w-lg px-6 py-14 text-center">
        <h1 className="text-xl font-bold">{t("emptyTitle")}</h1>
        <Link href="/" className={buttonClass("accent", "md", "mt-5")}>{t("continueShopping")}</Link>
      </Box>
    );
  }

  const fieldErr = (k: string) => (errors.includes(k) ? <p className="mt-1 text-xs font-semibold text-sale">{k === "phone" ? tAuth("errors.invalidPhone") : t("required")}</p> : null);
  const locked = !!pending;

  async function place() {
    setPlacing(true);
    setMessage(undefined);
    setErrors([]);
    const res = await fetch("/api/checkout/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, ...form, note, delivery: effectiveDelivery, payment: effectivePayment, saveAddress: user ? addressId === "new" && saveAddress : false, locale, coupon: quote?.coupon ? coupon : undefined }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, error: "payment" }));
    setPlacing(false);
    if (!res.ok) {
      if (res.fields) setErrors(res.fields);
      setMessage(res.error === "coupon" ? t("couponRejected", { reason: t(`couponErrors.${res.couponError ?? "notFound"}` as "couponErrors.notFound", { min: "" }) }) : t(`errors.${res.error}` as "errors.invalid"));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (res.clientSecret) setPending({ number: res.number, token: res.token, clientSecret: res.clientSecret });
    else router.push(`/checkout/complete?order=${res.number}&t=${res.token}`);
  }

  const standardDetail = quote && quote.subtotal >= FREE_DELIVERY_THRESHOLD ? t("freeDelivery") : t("standardFee", { fee: fmt(STANDARD_DELIVERY_FEE), threshold: fmt(FREE_DELIVERY_THRESHOLD) });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <div className="min-w-0 space-y-4">
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        {message && <FormMessage tone="error">{message}</FormMessage>}
        {quote?.issues.map((i) => (
          <FormMessage key={i.slug} tone="error">
            {i.problem === "stock" ? t("issueStock", { name: quote.lines.find((l) => l.slug === i.slug)?.name.en ?? i.slug, count: i.available ?? 0 }) : t("issueUnavailable")}
          </FormMessage>
        ))}

        <fieldset disabled={locked} className="space-y-4 disabled:opacity-70">
          <Step n={1} title={t("addressStep")}>
            {!user && (
              <p className="mb-4 rounded-sm bg-surface px-3 py-2 text-sm">
                {t("haveAccount")} <Link href="/sign-in?next=/checkout" className="font-bold text-brand-700 hover:underline">{tAuth("signInLink")}</Link>
              </p>
            )}
            {user && addresses.length > 0 && (
              <div className="mb-4 grid gap-2 md:grid-cols-2">
                {addresses.map((a) => (
                  <label key={a.id} className={cn("cursor-pointer rounded-sm border p-3 text-sm", addressId === a.id ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-line-strong hover:border-ink-400")}>
                    <input type="radio" name="addr" className="me-2 accent-brand-600" checked={addressId === a.id} onChange={() => { setAddressId(a.id); setForm(fromSaved(a, user.email)); }} />
                    <span className="font-bold">{a.label || a.fullName}</span>
                    <span className="mt-1 block text-ink-600">{[a.unit, a.building].filter(Boolean).join(", ")} · {a.area}, {emirateName(a.emirate, locale)}</span>
                  </label>
                ))}
                <label className={cn("cursor-pointer rounded-sm border p-3 text-sm font-bold", addressId === "new" ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-line-strong hover:border-ink-400")}>
                  <input type="radio" name="addr" className="me-2 accent-brand-600" checked={addressId === "new"} onChange={() => { setAddressId("new"); setForm({ ...EMPTY_FORM, email: user.email, fullName: user.name, phone: user.phone ? formatUaePhone(user.phone) : "" }); }} />
                  {t("newAddress")}
                </label>
              </div>
            )}
            {(addressId === "new" || !user) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {!user && (
                  <div className="sm:col-span-2">
                    <Label htmlFor="c-email">{tAuth("email")}</Label>
                    <Input id="c-email" type="email" dir="ltr" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={errors.includes("email")} />
                    {fieldErr("email")}
                  </div>
                )}
                {([
                  ["fullName", t("fullName"), { autoComplete: "name" }],
                  ["phone", t("phone"), { type: "tel", dir: "ltr", autoComplete: "tel", placeholder: "050 123 4567" }],
                ] as const).map(([k, label, props]) => (
                  <div key={k}>
                    <Label htmlFor={`c-${k}`}>{label}</Label>
                    <Input id={`c-${k}`} value={form[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={errors.includes(k)} {...props} />
                    {fieldErr(k)}
                  </div>
                ))}
                <div>
                  <Label htmlFor="c-emirate">{t("emirate")}</Label>
                  <select id="c-emirate" value={form.emirate} onChange={(e) => set("emirate", e.target.value)} aria-invalid={errors.includes("emirate")} className="h-10 w-full rounded-sm border border-line-strong bg-white px-3 text-sm aria-invalid:border-sale">
                    <option value="" disabled>{t("chooseEmirate")}</option>
                    {emirates.map((e) => <option key={e.slug} value={e.slug}>{tr(e.name, locale)}</option>)}
                  </select>
                  {fieldErr("emirate")}
                </div>
                {([
                  ["area", t("area")], ["building", t("building")], ["unit", t("unit")], ["street", t("street")], ["landmark", t("landmark")],
                ] as const).map(([k, label]) => (
                  <div key={k}>
                    <Label htmlFor={`c-${k}`}>{label}</Label>
                    <Input id={`c-${k}`} value={form[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={errors.includes(k)} />
                    {fieldErr(k)}
                  </div>
                ))}
                {user && (
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="size-4 accent-brand-600" />
                    {t("saveAddress")}
                  </label>
                )}
              </div>
            )}
            {user && addressId !== "new" && <p className="text-xs text-ink-500" dir="ltr">{form.email} · {form.phone}</p>}
          </Step>

          <Step n={2} title={t("deliveryStep")}>
            <div className="space-y-2">
              <Choice name="delivery" checked={effectiveDelivery === "standard"} onSelect={() => setDelivery("standard")} icon={Truck} title={t("standard")} detail={t("standardEta")} aside={standardDetail} />
              <Choice name="delivery" checked={effectiveDelivery === "express"} disabled={!canExpress} onSelect={() => setDelivery("express")} icon={Zap} title={t("express")}
                detail={canExpress ? t("expressEta") : t("expressDubaiOnly")} aside={`+${fmt(EXPRESS_DELIVERY_FEE)}`} />
            </div>
          </Step>

          <Step n={3} title={t("paymentStep")}>
            <div className="space-y-2">
              <Choice name="payment" checked={effectivePayment === "CARD"} onSelect={() => setPayment("CARD")} icon={CreditCard} title={t("card")} detail={t("cardDetail")} />
              <Choice name="payment" checked={effectivePayment === "COD"} disabled={!!quote && !quote.codAllowed} onSelect={() => setPayment("COD")} icon={Banknote} title={t("cod")}
                detail={quote && !quote.codAllowed ? (quote.hasSubscription ? t("codNoSubscription") : t("codMax", { max: fmt(COD_MAX_ORDER) })) : t("codDetail")} />
            </div>
            {quote?.hasSubscription && (
              <p className="mt-3 flex items-start gap-2 rounded-sm bg-brand-50 p-2.5 text-xs text-brand-800">
                <Repeat className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {user ? t("subscriptionNote") : t("subscriptionSignIn")}
              </p>
            )}
            <div className="mt-4">
              <Label htmlFor="c-note">{t("note")}</Label>
              <textarea id="c-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="w-full rounded-sm border border-line-strong px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
            </div>
          </Step>
        </fieldset>

        {pending && stripePromise && (
          <Box className="p-5">
            <h2 className="mb-1 text-lg font-bold">{t("cardDetailsTitle")}</h2>
            <p className="mb-4 text-xs text-ink-600">{t("orderReserved", { number: pending.number })}</p>
            <Elements stripe={stripePromise} options={{ clientSecret: pending.clientSecret, appearance, locale: locale === "ar" ? "ar" : "en" }}>
              <PayButton total={fmt(quote?.total ?? 0)} returnUrl={returnUrl} onError={setMessage} />
            </Elements>
            <button type="button" onClick={() => setPending(null)} className="mt-3 text-xs font-semibold text-ink-600 underline">{t("editOrder")}</button>
          </Box>
        )}
      </div>

      {/* Order summary */}
      <aside className="space-y-3 self-start lg:sticky lg:top-40">
        <Box className="p-4">
          <h2 className="mb-3 text-base font-bold">{t("summary")}</h2>
          <ul className="space-y-3">
            {quote?.lines.map((l) => (
              <li key={l.key} className="flex gap-3 text-sm">
                <span className="relative w-14 shrink-0 overflow-hidden rounded-xs border border-line">
                  <ProductVisual product={{ brandName: l.brandName, category: l.category, categoryTint: l.categoryTint, images: l.images }} sizes="56px" />
                  <span className="absolute -end-1 -top-1 rounded-xs bg-ink-900 px-1 text-[10px] font-bold text-white">{l.qty}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2">{tr(l.name, locale)}</span>
                  {l.optionLabel && <span className="block text-xs text-ink-500">{tr(l.optionLabel, locale)}</span>}
                  {l.sub && <span className="block text-xs font-semibold text-brand-700">{t("every", { weeks: l.sub })}</span>}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{fmt(l.total)}</span>
              </li>
            ))}
          </ul>

          {/* Promo code */}
          <div className="mt-4 border-t border-line pt-3">
            {quote?.coupon ? (
              <div className="flex items-start justify-between gap-2 rounded-sm border border-success/30 bg-success-50 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 font-bold text-success">
                    <Tag className="size-3.5" aria-hidden />
                    <span dir="ltr">{quote.coupon.code}</span>
                  </p>
                  {(locale === "ar" ? quote.coupon.descriptionAr : quote.coupon.descriptionEn) && (
                    <p className="text-xs text-ink-700">{locale === "ar" ? quote.coupon.descriptionAr : quote.coupon.descriptionEn}</p>
                  )}
                </div>
                {!locked && (
                  <button type="button" className="shrink-0 text-xs font-semibold text-ink-600 hover:text-sale hover:underline" onClick={() => { setCoupon(""); setCodeInput(""); }}>
                    {t("removeCode")}
                  </button>
                )}
              </div>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setCoupon(codeInput.trim());
                }}
              >
                <label htmlFor="c-promo" className="sr-only">{t("promoCode")}</label>
                <Input id="c-promo" dir="ltr" placeholder={t("promoCode")} value={codeInput} disabled={locked} autoComplete="off" className="uppercase placeholder:normal-case"
                  onChange={(e) => setCodeInput(e.target.value)} aria-invalid={!!quote?.couponError} aria-describedby={quote?.couponError ? "c-promo-error" : undefined} />
                <Button type="submit" variant="outline" disabled={locked || !codeInput.trim()}>{t("applyCode")}</Button>
              </form>
            )}
            {quote?.couponError && (
              <p id="c-promo-error" role="alert" className="mt-1.5 text-xs font-semibold text-sale">
                {t(`couponErrors.${quote.couponError.error}` as "couponErrors.notFound", { min: fmt(quote.couponError.minSpend ?? 0) })}
              </p>
            )}
          </div>

          {quote && (
            <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-600">{t("items")}</dt><dd className="tabular-nums">{fmt(quote.itemsTotal)}</dd></div>
              {quote.discount > 0 && <div className="flex justify-between text-success"><dt>{t("savings")}</dt><dd className="tabular-nums">−{fmt(quote.discount)}</dd></div>}
              {quote.coupon && quote.couponDiscount > 0 && (
                <div className="flex justify-between text-success"><dt>{t("promo", { code: quote.coupon.code })}</dt><dd className="tabular-nums">−{fmt(quote.couponDiscount)}</dd></div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-600">{t("delivery")}{quote.coupon?.type === "FREE_DELIVERY" && <span className="ms-1 text-xs font-semibold text-success">({quote.coupon.code})</span>}</dt>
                <dd className="tabular-nums">{quote.deliveryFee ? fmt(quote.deliveryFee) : t("free")}</dd>
              </div>
              {quote.codFee > 0 && <div className="flex justify-between"><dt className="text-ink-600">{t("codFee")}</dt><dd className="tabular-nums">{fmt(quote.codFee)}</dd></div>}
              <div className="flex justify-between border-t border-line pt-2 text-base font-extrabold"><dt>{t("total")}</dt><dd className="tabular-nums">{fmt(quote.total)}</dd></div>
              <div className="flex justify-between text-xs text-ink-500"><dt>{t("vat")}</dt><dd className="tabular-nums">{fmt(quote.vatAmount)}</dd></div>
            </dl>
          )}
          {!pending && (
            <Button variant="accent" size="lg" className="mt-4 w-full" disabled={placing || !quote || quote.issues.length > 0 || (quote.hasSubscription && !user)} onClick={place}>
              <Lock className="size-4" aria-hidden />
              {placing ? t("processing") : effectivePayment === "COD" ? t("placeOrder") : t("continueToPayment")}
            </Button>
          )}
          <p className="mt-2 text-center text-[11px] text-ink-500">{t("secure")}</p>
        </Box>
      </aside>
    </div>
  );
}
