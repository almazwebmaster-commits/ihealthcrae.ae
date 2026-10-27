import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { PrintButton } from "@/components/admin/PrintButton";
import { Logo } from "@/components/brand/Logo";
import { emirateName } from "@/lib/emirates";
import { formatPrice, tr } from "@/lib/i18n-utils";
import { formatUaePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { getOrder } from "@/server/admin/orders";
import { requireArea } from "@/server/admin/guard";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/orders/[number]/packing-slip">): Promise<Metadata> {
  const { locale, number } = await params;
  const t = await getTranslations({ locale, namespace: "AdminUI.packingSlip" });
  return { title: `${t("title")} ${number}` };
}

/** Printable picking / packing sheet for the warehouse: no prices except cash to collect. */
export default async function PackingSlipPage({ params }: PageProps<"/[locale]/admin/orders/[number]/packing-slip">) {
  await requireArea("orders");
  const { locale: loc, number } = await params;
  setRequestLocale(loc);
  const order = await getOrder(number);
  if (!order) notFound();
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.packingSlip");
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" }).format(order.placedAt);
  const units = order.items.reduce((n, i) => n + i.qty, 0);
  const express = order.deliveryMethod === "express";
  const collect = order.paymentMethod === "COD" && order.paymentStatus === "UNPAID";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex justify-end print:hidden">
        <PrintButton label={t("print")} />
      </div>
      <article className="rounded-sm border border-line bg-white p-8 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink-900 pb-4">
          <div>
            <Logo />
            <h1 className="mt-3 text-2xl font-extrabold">{t("title")}</h1>
          </div>
          <div className="text-end">
            <p className="font-mono text-2xl font-extrabold" dir="ltr">{order.number}</p>
            <p className="text-sm text-ink-600">{date}</p>
            <p className={cn("mt-2 inline-block rounded-xs px-2 py-1 text-sm font-extrabold uppercase", express ? "bg-ink-900 text-white" : "border border-ink-900")}>
              {express ? t("express") : t("standard")}
            </p>
          </div>
        </header>

        <section className="grid gap-6 py-5 text-sm sm:grid-cols-2">
          <div>
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-500">{t("shipTo")}</h2>
            <p className="text-base font-bold">{order.fullName}</p>
            <p>{[order.unit, order.building, order.street].filter(Boolean).join(", ")}</p>
            <p>{order.area}, {emirateName(order.emirate, locale)}</p>
            {order.landmark && <p className="text-ink-600">{order.landmark}</p>}
            <p className="mt-1 font-semibold" dir="ltr">{formatUaePhone(order.phone)}</p>
          </div>
          <div className="space-y-2">
            {collect ? (
              <div className="rounded-xs border-2 border-ink-900 p-3">
                <p className="text-xs font-bold uppercase tracking-wide">{t("collectCash")}</p>
                <p className="text-2xl font-extrabold tabular-nums">{formatPrice(Number(order.total), locale)}</p>
              </div>
            ) : (
              <p className="rounded-xs border border-line p-3 text-xs font-bold uppercase tracking-wide">{t("prepaid")}</p>
            )}
            {order.customerNote && (
              <p className="rounded-xs bg-surface p-3 text-sm print:border print:border-ink-400">
                <span className="font-bold">{t("customerNote")}: </span>
                {order.customerNote}
              </p>
            )}
          </div>
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y-2 border-ink-900 text-xs font-bold uppercase tracking-wide">
              <th className="w-10 py-2" aria-label={t("picked")} />
              <th className="py-2 text-start">{t("item")}</th>
              <th className="w-40 py-2 text-start">{t("sku")}</th>
              <th className="w-16 py-2 text-center">{t("qty")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-line align-top">
                <td className="py-3">
                  <span className="inline-block size-5 rounded-xs border-2 border-ink-900" aria-hidden />
                </td>
                <td className="py-3 pe-3">
                  <span className="font-semibold">{tr({ en: i.nameEn, ar: i.nameAr }, locale)}</span>
                  {(i.optionEn || i.optionAr) && <span className="block text-ink-600">{tr({ en: i.optionEn ?? "", ar: i.optionAr ?? i.optionEn ?? "" }, locale)}</span>}
                  {i.subWeeks && <span className="block text-xs font-semibold">{t("subscription")}</span>}
                </td>
                <td className="py-3 font-mono text-xs" dir="ltr">{i.sku}</td>
                <td className="py-3 text-center text-lg font-extrabold tabular-nums">{i.qty}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td />
              <td className="py-2 text-end font-semibold" colSpan={2}>{t("totalUnits")}</td>
              <td className="py-2 text-center text-lg font-extrabold tabular-nums">{units}</td>
            </tr>
          </tfoot>
        </table>

        <footer className="mt-10 grid grid-cols-2 gap-8 text-sm">
          <p className="border-t border-ink-900 pt-1 text-ink-600">{t("packedBy")}</p>
          <p className="border-t border-ink-900 pt-1 text-ink-600">{t("checkedBy")}</p>
        </footer>
      </article>
    </div>
  );
}
