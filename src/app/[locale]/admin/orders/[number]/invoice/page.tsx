import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { PrintButton } from "@/components/admin/PrintButton";
import { Logo } from "@/components/brand/Logo";
import { OrderItemsTable } from "@/components/orders/OrderItemsTable";
import { emirateName } from "@/lib/emirates";
import { formatUaePhone } from "@/lib/phone";
import { getOrder } from "@/server/admin/orders";
import { requireArea } from "@/server/admin/guard";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/orders/[number]/invoice">): Promise<Metadata> {
  const { locale, number } = await params;
  const t = await getTranslations({ locale, namespace: "AdminUI.invoice" });
  return { title: `${t("title")} ${number}` };
}

/** Printable tax invoice (the admin shell is hidden when printing). */
export default async function InvoicePage({ params }: PageProps<"/[locale]/admin/orders/[number]/invoice">) {
  await requireArea("orders");
  const { locale: loc, number } = await params;
  setRequestLocale(loc);
  const order = await getOrder(number);
  if (!order) notFound();
  const locale = await getLocale();
  const t = await getTranslations("AdminUI.invoice");
  const tPay = await getTranslations("Payment");
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { dateStyle: "long" }).format(order.placedAt);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex justify-end print:hidden">
        <PrintButton label={t("print")} />
      </div>
      <article className="rounded-sm border border-line bg-white p-8 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <Logo />
            <p className="mt-2 text-xs text-ink-500">{t("trn")}</p>
          </div>
          <div className="text-end">
            <h1 className="text-2xl font-extrabold">{t("title")}</h1>
            <dl className="mt-2 text-sm">
              <div><dt className="inline text-ink-500">{t("invoiceNo")}: </dt><dd className="inline font-semibold" dir="ltr">{order.number}</dd></div>
              <div><dt className="inline text-ink-500">{t("date")}: </dt><dd className="inline">{date}</dd></div>
              <div><dt className="inline text-ink-500">{t("paymentMethod")}: </dt><dd className="inline">{tPay(order.paymentMethod)} · {tPay(order.paymentStatus)}</dd></div>
            </dl>
          </div>
        </header>
        <section className="py-6 text-sm">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-500">{t("billTo")}</h2>
          <p className="font-semibold">{order.fullName}</p>
          <p>{[order.unit, order.building, order.street].filter(Boolean).join(", ")}</p>
          <p>{order.area}, {emirateName(order.emirate, locale)}</p>
          <p dir="ltr" className="text-start">{formatUaePhone(order.phone)} · {order.email}</p>
        </section>
        <OrderItemsTable items={order.items} totals={order} />
        <p className="mt-8 border-t border-line pt-4 text-center text-xs text-ink-500">{t("thanks")}</p>
      </article>
    </div>
  );
}
