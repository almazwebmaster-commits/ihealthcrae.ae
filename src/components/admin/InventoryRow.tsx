"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { StockAdjust } from "@/components/admin/StockAdjust";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";
import { formatPrice, tr } from "@/lib/i18n-utils";
import { stockState } from "@/lib/inventory";
import { cn } from "@/lib/utils";

type Row = { id: number; sku: string; nameEn: string; nameAr: string; stock: number; lowStockAt: number; price: number; status: string; images: { url: string }[] };

export function InventoryRow({ row }: { row: Row }) {
  const t = useTranslations("AdminUI.inventory");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const state = stockState(row.stock, row.lowStockAt);

  return (
    <>
      <tr className={cn("hover:bg-surface/60", open && "bg-surface/60")}>
        <td className="px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-xs border border-line bg-white">
              {row.images[0] && <Image src={row.images[0].url} alt="" fill sizes="40px" className="object-contain" />}
            </span>
            <span className="min-w-0">
              <Link href={`/admin/inventory/${row.id}`} className="line-clamp-1 font-semibold text-ink-900 hover:text-brand-700 hover:underline">{tr({ en: row.nameEn, ar: row.nameAr }, locale)}</Link>
              <span className="block text-xs text-ink-500" dir="ltr">{row.sku}{row.status === "DRAFT" ? ` · ${t("draft")}` : ""}</span>
            </span>
          </div>
        </td>
        <td className="px-3 py-2 text-end text-base font-extrabold tabular-nums">{row.stock}</td>
        <td className="px-3 py-2 text-end tabular-nums text-ink-600">{row.lowStockAt}</td>
        <td className="px-3 py-2">
          <Badge tone={state === "out" ? "sale" : state === "low" ? "accent" : "success"}>{t(`state.${state}`)}</Badge>
        </td>
        <td className="px-3 py-2 text-end tabular-nums text-ink-700">{formatPrice(row.price * row.stock, locale)}</td>
        <td className="px-3 py-2 text-end">
          <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="text-sm font-semibold text-brand-700 hover:underline">
            {open ? t("close") : t("adjust")}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-surface/60">
          <td colSpan={6} className="px-3 pb-4 pt-1">
            <StockAdjust compact productId={row.id} stock={row.stock} lowStockAt={row.lowStockAt} onDone={() => setOpen(false)} />
          </td>
        </tr>
      )}
    </>
  );
}
