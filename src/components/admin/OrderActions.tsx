"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { addNoteAction, changeStatusAction, markPaidAction } from "@/app/[locale]/admin/orders/[number]/actions";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { nextStatuses, type OrderStatus } from "@/lib/orders";

const area = "w-full rounded-sm border border-line-strong bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";

export function OrderActions({
  number,
  status,
  paymentMethod,
  paymentStatus,
}: {
  number: string;
  status: OrderStatus;
  paymentMethod: "CARD" | "COD";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
}) {
  const t = useTranslations("AdminUI.order");
  const tStatus = useTranslations("OrderStatus");
  const options = nextStatuses[status];
  const [to, setTo] = useState<OrderStatus | "">(options[0] ?? "");
  const [note, setNote] = useState("");
  const [internal, setInternal] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setError(undefined);
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });

  return (
    <Box className="space-y-5 p-4 print:hidden">
      <h2 className="text-base font-bold">{t("actions")}</h2>
      {error && <p className="rounded-sm bg-sale-50 px-3 py-2 text-xs text-sale">{error}</p>}

      {options.length ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (to) run(async () => {
              await changeStatusAction(number, to, note);
              setNote("");
            });
          }}
        >
          <Label htmlFor="to">{t("moveTo")}</Label>
          <select id="to" value={to} onChange={(e) => setTo(e.target.value as OrderStatus)} className="h-10 w-full rounded-sm border border-line-strong bg-white px-3 text-sm">
            {options.map((s) => (
              <option key={s} value={s}>{tStatus(s)}</option>
            ))}
          </select>
          {to === "CANCELLED" && status !== "PENDING_PAYMENT" && <p className="text-xs text-accent-700">{t("cancelWarning")}</p>}
          {(to === "CANCELLED" || to === "REFUNDED") && paymentMethod === "CARD" && paymentStatus === "PAID" && (
            <p className="text-xs font-semibold text-sale">{t("refundWarning")}</p>
          )}
          {to === "DELIVERED" && paymentMethod === "COD" && <p className="text-xs text-ink-600">{t("codCollected")}</p>}
          <textarea rows={2} placeholder={t("note")} aria-label={t("note")} value={note} onChange={(e) => setNote(e.target.value)} className={area} />
          <Button type="submit" variant={to === "CANCELLED" ? "danger" : "primary"} className="w-full" disabled={pending || !to}>
            {t("update")}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-ink-600">{t("noFurther")}</p>
      )}

      {paymentStatus === "UNPAID" && status !== "CANCELLED" && (
        <Button variant="outline" className="w-full" disabled={pending} onClick={() => run(() => markPaidAction(number))}>
          {t("markPaid")}
        </Button>
      )}

      <form
        className="space-y-2 border-t border-line pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (internal.trim()) run(async () => {
            await addNoteAction(number, internal);
            setInternal("");
          });
        }}
      >
        <Label htmlFor="internal">{t("addNote")}</Label>
        <textarea id="internal" rows={3} placeholder={t("notePlaceholder")} value={internal} onChange={(e) => setInternal(e.target.value)} className={area} />
        <Button type="submit" variant="outline" size="sm" disabled={pending || !internal.trim()}>
          {t("addNote")}
        </Button>
      </form>
    </Box>
  );
}
