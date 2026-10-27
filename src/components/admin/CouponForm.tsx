"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { saveCouponAction, setCouponActiveAction } from "@/app/[locale]/admin/promotions/actions";
import { FormMessage } from "@/components/auth/AuthCard";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Link, useRouter } from "@/i18n/navigation";
import { formatPrice } from "@/lib/i18n-utils";
import { couponTypes, normalizeCode, type CouponType } from "@/lib/promotions";
import { cn } from "@/lib/utils";

export type CouponFormValues = {
  id?: number;
  code: string;
  descriptionEn: string;
  descriptionAr: string;
  type: CouponType;
  value: string;
  maxDiscount: string;
  minSpend: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perCustomerLimit: string;
  active: boolean;
};

export const EMPTY_COUPON: CouponFormValues = {
  code: "", descriptionEn: "", descriptionAr: "", type: "PERCENT", value: "10", maxDiscount: "", minSpend: "",
  startsAt: "", endsAt: "", usageLimit: "", perCustomerLimit: "1", active: true,
};

const optNum = (s: string) => (s.trim() === "" ? null : Number(s));

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="mt-1 text-xs font-semibold text-sale">{error}</p> : hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

export function CouponForm({ initial }: { initial: CouponFormValues }) {
  const t = useTranslations("AdminUI.promotions");
  const locale = useLocale();
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string }>();
  const [saving, start] = useTransition();
  const set = <K extends keyof CouponFormValues>(k: K, value: CouponFormValues[K]) => setV((s) => ({ ...s, [k]: value }));
  const err = (k: string) => (errors[k] ? t(`errors.${errors[k]}` as "errors.required") : undefined);
  const fmt = (n: number) => formatPrice(n, locale);
  const isNew = !v.id;

  function submit() {
    setMessage(undefined);
    start(async () => {
      const res = await saveCouponAction({
        id: v.id,
        code: v.code,
        descriptionEn: v.descriptionEn,
        descriptionAr: v.descriptionAr,
        type: v.type,
        value: Number(v.value) || 0,
        maxDiscount: optNum(v.maxDiscount),
        minSpend: optNum(v.minSpend),
        startsAt: v.startsAt,
        endsAt: v.endsAt,
        usageLimit: optNum(v.usageLimit),
        perCustomerLimit: optNum(v.perCustomerLimit),
        active: v.active,
      });
      if (!res.ok) {
        setErrors(res.errors);
        setMessage({ tone: "error", text: t("errors.generic") });
        return;
      }
      setErrors({});
      setMessage({ tone: "success", text: t("saved") });
      if (isNew) router.replace(`/admin/promotions/${res.id}`);
      else router.refresh();
    });
  }

  // Plain-language summary of the offer, so staff can check it before saving.
  const value = Number(v.value) || 0;
  const offer =
    v.type === "PERCENT"
      ? t("summary.percent", { pct: value }) + (optNum(v.maxDiscount) ? ` ${t("summary.cap", { max: fmt(Number(v.maxDiscount)) })}` : "")
      : v.type === "FIXED"
        ? t("summary.fixed", { amount: fmt(value) })
        : t("summary.freeDelivery");
  const conditions = [
    optNum(v.minSpend) ? t("summary.minSpend", { min: fmt(Number(v.minSpend)) }) : null,
    optNum(v.perCustomerLimit) ? t("summary.perCustomer", { count: Number(v.perCustomerLimit) }) : null,
    optNum(v.usageLimit) ? t("summary.limit", { count: Number(v.usageLimit) }) : null,
  ].filter(Boolean);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}

      <Box className="space-y-4 p-5">
        <h2 className="text-base font-bold">{t("form.code")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field id="cp-code" label={t("form.code")} hint={t("form.codeHint")} error={err("code")}>
            <Input id="cp-code" dir="ltr" className="font-mono uppercase" value={v.code} maxLength={30} aria-invalid={!!errors.code} onChange={(e) => set("code", normalizeCode(e.target.value))} />
          </Field>
          <Field id="cp-descriptionEn" label={t("form.descriptionEn")} hint={t("form.descriptionHint")}>
            <Input id="cp-descriptionEn" dir="ltr" value={v.descriptionEn} maxLength={200} onChange={(e) => set("descriptionEn", e.target.value)} />
          </Field>
          <Field id="cp-descriptionAr" label={t("form.descriptionAr")}>
            <Input id="cp-descriptionAr" dir="rtl" lang="ar" value={v.descriptionAr} maxLength={200} onChange={(e) => set("descriptionAr", e.target.value)} />
          </Field>
        </div>
      </Box>

      <Box className="space-y-4 p-5">
        <h2 className="text-base font-bold">{t("form.discount")}</h2>
        <div role="radiogroup" aria-label={t("form.type")} className="grid gap-2 sm:grid-cols-3">
          {couponTypes.map((type) => (
            <label
              key={type}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-sm border p-3 text-sm",
                v.type === type ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-line-strong bg-white hover:border-ink-400",
              )}
            >
              <input type="radio" name="type" className="mt-0.5 accent-brand-600" checked={v.type === type} onChange={() => set("type", type)} />
              <span>
                <span className="block font-semibold">{t(`type.${type}`)}</span>
                <span className="text-xs text-ink-600">{t(`typeHint.${type}`)}</span>
              </span>
            </label>
          ))}
        </div>
        {v.type !== "FREE_DELIVERY" && (
          <div className="grid gap-4 md:grid-cols-3">
            <Field id="cp-value" label={v.type === "PERCENT" ? t("form.percent") : t("form.amount")} error={err("value")}>
              <Input id="cp-value" dir="ltr" inputMode="decimal" value={v.value} aria-invalid={!!errors.value} onChange={(e) => set("value", e.target.value)} />
            </Field>
            {v.type === "PERCENT" && (
              <Field id="cp-maxDiscount" label={t("form.maxDiscount")} hint={t("form.optional")} error={err("maxDiscount")}>
                <Input id="cp-maxDiscount" dir="ltr" inputMode="decimal" value={v.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} />
              </Field>
            )}
          </div>
        )}
      </Box>

      <Box className="space-y-4 p-5">
        <h2 className="text-base font-bold">{t("form.rules")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field id="cp-minSpend" label={t("form.minSpend")} hint={t("form.minSpendHint")} error={err("minSpend")}>
            <Input id="cp-minSpend" dir="ltr" inputMode="decimal" value={v.minSpend} onChange={(e) => set("minSpend", e.target.value)} />
          </Field>
          <Field id="cp-usageLimit" label={t("form.usageLimit")} hint={t("form.unlimitedHint")} error={err("usageLimit")}>
            <Input id="cp-usageLimit" dir="ltr" inputMode="numeric" value={v.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} />
          </Field>
          <Field id="cp-perCustomerLimit" label={t("form.perCustomerLimit")} hint={t("form.unlimitedHint")} error={err("perCustomerLimit")}>
            <Input id="cp-perCustomerLimit" dir="ltr" inputMode="numeric" value={v.perCustomerLimit} onChange={(e) => set("perCustomerLimit", e.target.value)} />
          </Field>
          <Field id="cp-startsAt" label={t("form.startsAt")} hint={t("form.startsHint")} error={err("startsAt")}>
            <Input id="cp-startsAt" type="datetime-local" dir="ltr" value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          </Field>
          <Field id="cp-endsAt" label={t("form.endsAt")} hint={t("form.endsHint")} error={err("endsAt")}>
            <Input id="cp-endsAt" type="datetime-local" dir="ltr" value={v.endsAt} aria-invalid={!!errors.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
            <input type="checkbox" className="size-4 accent-brand-600" checked={v.active} onChange={(e) => set("active", e.target.checked)} />
            {t("form.active")}
          </label>
        </div>
      </Box>

      <Box className="flex flex-wrap items-center gap-3 p-4">
        <p className="me-auto text-sm">
          <span className="font-mono font-bold" dir="ltr">{v.code || "CODE"}</span> — {offer}
          {conditions.length > 0 && <span className="text-ink-600"> · {conditions.join(" · ")}</span>}
        </p>
        <Link href="/admin/promotions" className="text-sm font-semibold text-ink-600 hover:underline">{t("back")}</Link>
        {!isNew && (
          <Button variant="outline" disabled={saving} onClick={() => start(async () => {
            await setCouponActiveAction(v.id!, !initial.active);
            router.refresh();
          })}>
            {initial.active ? t("disable") : t("enable")}
          </Button>
        )}
        <Button type="submit" variant="accent" disabled={saving}>{saving ? t("saving") : t("save")}</Button>
      </Box>
    </form>
  );
}
