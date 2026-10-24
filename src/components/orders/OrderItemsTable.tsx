import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { formatPrice, tr } from "@/lib/i18n-utils";

type Item = {
  id: number;
  nameEn: string;
  nameAr: string;
  optionEn: string | null;
  optionAr: string | null;
  sku: string;
  imageUrl: string | null;
  unitPrice: unknown;
  qty: number;
  lineTotal: unknown;
  subWeeks: number | null;
};
type Totals = { itemsTotal: unknown; discount: unknown; deliveryFee: unknown; total: unknown; vatAmount: unknown };

/** Items + totals block shared by admin order page, invoice and the customer's order page. */
export async function OrderItemsTable({ items, totals, compact }: { items: Item[]; totals: Totals; compact?: boolean }) {
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.order");
  const fmt = (n: unknown) => formatPrice(Number(n), locale);
  const discount = Number(totals.discount);
  const delivery = Number(totals.deliveryFee);

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="border-b border-line text-xs font-bold uppercase tracking-wide text-ink-600">
          <tr>
            <th className="py-2 text-start">{t("items")}</th>
            <th className="w-14 py-2 text-center">{t("qty")}</th>
            {!compact && <th className="w-28 py-2 text-end">{t("unitPrice")}</th>}
            <th className="w-28 py-2 text-end">{t("lineTotal")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((i) => (
            <tr key={i.id}>
              <td className="py-2.5">
                <div className="flex items-center gap-3">
                  {i.imageUrl && !compact && (
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xs border border-line bg-white print:hidden">
                      <Image src={i.imageUrl} alt="" fill sizes="48px" className="object-contain" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-medium">{tr({ en: i.nameEn, ar: i.nameAr }, locale)}</span>
                    {i.optionEn && <span className="block text-xs text-ink-600">{tr({ en: i.optionEn, ar: i.optionAr ?? i.optionEn }, locale)}</span>}
                    {i.subWeeks && <span className="block text-xs font-semibold text-brand-700">{t("every", { weeks: i.subWeeks })}</span>}
                    <span className="block text-[11px] text-ink-400" dir="ltr">{i.sku}</span>
                  </span>
                </div>
              </td>
              <td className="py-2.5 text-center tabular-nums">{i.qty}</td>
              {!compact && <td className="py-2.5 text-end tabular-nums">{fmt(i.unitPrice)}</td>}
              <td className="py-2.5 text-end font-semibold tabular-nums">{fmt(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ms-auto mt-3 max-w-xs space-y-1.5 border-t border-line pt-3 text-sm">
        <div className="flex justify-between"><dt className="text-ink-600">{t("itemsTotal")}</dt><dd className="tabular-nums">{fmt(totals.itemsTotal)}</dd></div>
        {discount > 0 && <div className="flex justify-between text-success"><dt>{t("discount")}</dt><dd className="tabular-nums">−{fmt(discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-ink-600">{t("deliveryFee")}</dt><dd className="tabular-nums">{delivery ? fmt(delivery) : t("free")}</dd></div>
        <div className="flex justify-between border-t border-line pt-1.5 text-base font-extrabold"><dt>{t("total")}</dt><dd className="tabular-nums">{fmt(totals.total)}</dd></div>
        <div className="flex justify-between text-xs text-ink-500"><dt>{t("vat")}</dt><dd className="tabular-nums">{fmt(totals.vatAmount)}</dd></div>
      </dl>
    </div>
  );
}
