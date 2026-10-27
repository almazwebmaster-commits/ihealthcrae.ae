"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { adjustStockAction, setLowStockAtAction } from "@/app/[locale]/admin/inventory/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const REASONS = ["RECEIVE", "ADJUST", "RETURN", "DAMAGE"] as const;
type Reason = (typeof REASONS)[number];

/**
 * Stock adjustment form. "Stock count" (ADJUST) sets the exact number counted on the
 * shelf; the other reasons add or remove a quantity.
 */
export function StockAdjust({ productId, stock, lowStockAt, compact, onDone }: { productId: number; stock: number; lowStockAt: number; compact?: boolean; onDone?: () => void }) {
  const t = useTranslations("AdminUI.inventory");
  const router = useRouter();
  const [reason, setReason] = useState<Reason>("RECEIVE");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [low, setLow] = useState(String(lowStockAt));
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const n = Math.trunc(Number(qty));
  const valid = qty.trim() !== "" && Number.isFinite(n) && (reason === "ADJUST" ? n >= 0 : n > 0);
  const change = !valid ? 0 : reason === "ADJUST" ? n - stock : reason === "DAMAGE" ? -n : n;
  const after = stock + change;
  const id = (k: string) => `sa-${productId}-${k}`;

  function save() {
    setError(undefined);
    start(async () => {
      const res = await adjustStockAction({ productId, change, setTo: reason === "ADJUST" ? n : null, reason, note });
      if (!res.ok) return setError(t(`errors.${res.error}`));
      if (Number(low) !== lowStockAt) await setLowStockAtAction(productId, Number(low));
      setQty("");
      setNote("");
      router.refresh();
      onDone?.();
    });
  }

  return (
    <form
      className={cn("grid gap-3", compact ? "md:grid-cols-[13rem_8rem_1fr_8rem_auto]" : "sm:grid-cols-2")}
      onSubmit={(e) => {
        e.preventDefault();
        if (valid || Number(low) !== lowStockAt) save();
      }}
    >
      <div>
        <Label htmlFor={id("reason")}>{t("reason")}</Label>
        <select id={id("reason")} value={reason} onChange={(e) => setReason(e.target.value as Reason)} className="h-10 w-full rounded-sm border border-line-strong bg-white px-3 text-sm">
          {REASONS.map((r) => (
            <option key={r} value={r}>{t(`reasons.${r}`)}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={id("qty")}>{reason === "ADJUST" ? t("counted") : t("quantity")}</Label>
        <Input id={id("qty")} inputMode="numeric" dir="ltr" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))} />
      </div>
      <div>
        <Label htmlFor={id("note")}>{t("note")}</Label>
        <Input id={id("note")} value={note} maxLength={200} placeholder={t("notePlaceholder")} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div>
        <Label htmlFor={id("low")}>{t("lowStockAt")}</Label>
        <Input id={id("low")} inputMode="numeric" dir="ltr" value={low} onChange={(e) => setLow(e.target.value.replace(/[^\d]/g, ""))} />
      </div>
      <div className={cn("flex flex-col justify-end gap-1", !compact && "sm:col-span-2")}>
        {valid && (
          <p className={cn("text-xs font-semibold tabular-nums", after < 0 ? "text-sale" : "text-ink-700")}>
            {t("preview", { from: stock, to: after, change: `${change > 0 ? "+" : ""}${change}` })}
          </p>
        )}
        {error && <p role="alert" className="text-xs font-semibold text-sale">{error}</p>}
        <Button type="submit" variant="primary" disabled={pending || after < 0 || (!valid && Number(low) === lowStockAt)}>
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
