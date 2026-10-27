"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { formatPrice } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";

type Day = { day: string; revenue: number; orders: number };

/** Clean axis maximum and ticks (1 / 2 / 5 × 10ⁿ steps). */
function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

const compact = (n: number, locale: string) =>
  new Intl.NumberFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** Daily revenue columns with a per-bar tooltip and a table view. */
export function RevenueChart({ series }: { series: Day[] }) {
  const t = useTranslations("AdminUI.sales");
  const locale = useLocale();
  const [active, setActive] = useState<number | null>(null);
  const ticks = niceTicks(Math.max(...series.map((d) => d.revenue)));
  const top = ticks.at(-1)!;
  const peak = series.reduce((best, d, i) => (d.revenue > series[best].revenue ? i : best), 0);
  const dayFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { day: "numeric", month: "short", timeZone: "UTC" });
  const longFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const date = (d: string) => new Date(`${d}T00:00:00Z`);
  const every = series.length <= 7 ? 1 : series.length <= 31 ? 5 : 15;
  const fmt = (n: number) => formatPrice(n, locale);

  return (
    <div>
      {/* Time runs left → right in both languages, like the numbers on the axis. */}
      <div dir="ltr" className="relative flex gap-2">
        <div className="relative h-52 w-12 shrink-0 text-end text-[11px] tabular-nums text-ink-500" aria-hidden>
          {ticks.map((v) => (
            <span key={v} className="absolute end-1 translate-y-1/2" style={{ bottom: `${(v / top) * 100}%` }}>{compact(v, locale)}</span>
          ))}
        </div>
        <div className="relative h-52 min-w-0 flex-1" role="img" aria-label={t("chartLabel", { days: series.length })}>
          {ticks.map((v) => (
            <span key={v} className="absolute inset-x-0 border-t border-line" style={{ bottom: `${(v / top) * 100}%` }} aria-hidden />
          ))}
          <div className="absolute inset-0 flex items-end">
            {series.map((d, i) => (
              <div
                key={d.day}
                tabIndex={0}
                aria-label={`${longFmt.format(date(d.day))}: ${fmt(d.revenue)}, ${t("ordersCount", { count: d.orders })}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="relative flex h-full min-w-0 flex-1 items-end justify-center px-px outline-none focus-visible:bg-brand-50"
              >
                {i === peak && d.revenue > 0 && (
                  <span className="absolute z-[1] whitespace-nowrap text-[11px] font-semibold tabular-nums text-ink-700" style={{ bottom: `calc(${(d.revenue / top) * 100}% + 4px)` }}>
                    {compact(d.revenue, locale)}
                  </span>
                )}
                <span
                  className={cn("block w-full max-w-6 rounded-t-[4px] transition-colors", active === i ? "bg-brand-800" : "bg-chart-teal")}
                  style={{ height: d.revenue ? `max(2px, ${(d.revenue / top) * 100}%)` : 0 }}
                />
                {active === i && (
                  <span
                    role="tooltip"
                    className={cn(
                      "pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-sm bg-ink-900 px-2.5 py-1.5 text-xs text-white shadow-pop",
                      i < series.length / 3 ? "start-0" : i > (series.length * 2) / 3 ? "end-0" : "start-1/2 -translate-x-1/2",
                    )}
                  >
                    <span className="block font-semibold">{longFmt.format(date(d.day))}</span>
                    <span className="block tabular-nums">{fmt(d.revenue)} · {t("ordersCount", { count: d.orders })}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div dir="ltr" className="ms-14 mt-1 flex text-[11px] text-ink-500" aria-hidden>
        {series.map((d, i) => (
          <span key={d.day} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">{i % every === 0 ? dayFmt.format(date(d.day)) : ""}</span>
        ))}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-brand-700 hover:underline">{t("showTable")}</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-sm border border-line">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface text-ink-600">
              <tr><th className="px-3 py-1.5 text-start">{t("col.day")}</th><th className="px-3 py-1.5 text-end">{t("col.orders")}</th><th className="px-3 py-1.5 text-end">{t("col.revenue")}</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {series.map((d) => (
                <tr key={d.day}><td className="px-3 py-1.5">{longFmt.format(date(d.day))}</td><td className="px-3 py-1.5 text-end tabular-nums">{d.orders}</td><td className="px-3 py-1.5 text-end tabular-nums">{fmt(d.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/** Share of revenue by payment method: one 100% bar, legend with values (identity never by colour alone). */
export function PaymentSplit({ data }: { data: { method: "CARD" | "COD"; revenue: number; orders: number }[] }) {
  const t = useTranslations("AdminUI.sales");
  const locale = useLocale();
  const [active, setActive] = useState<string | null>(null);
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const color = { CARD: "bg-chart-teal", COD: "bg-chart-amber" } as const;
  if (!total) return <p className="text-sm text-ink-500">{t("noSales")}</p>;
  return (
    <div>
      <div className="flex h-6 gap-[2px]" role="img" aria-label={data.map((d) => `${t(`method.${d.method}`)} ${Math.round((d.revenue / total) * 100)}%`).join(", ")}>
        {data.filter((d) => d.revenue > 0).map((d, i, arr) => (
          <span
            key={d.method}
            onMouseEnter={() => setActive(d.method)}
            onMouseLeave={() => setActive(null)}
            className={cn("h-full transition-opacity", color[d.method], i === 0 && "rounded-s-[4px]", i === arr.length - 1 && "rounded-e-[4px]", active && active !== d.method && "opacity-40")}
            style={{ width: `${(d.revenue / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.method} className={cn("flex items-center gap-2", active === d.method && "font-semibold")} onMouseEnter={() => setActive(d.method)} onMouseLeave={() => setActive(null)}>
            <span className={cn("size-3 shrink-0 rounded-xs", color[d.method])} aria-hidden />
            <span className="flex-1 text-ink-800">{t(`method.${d.method}`)}</span>
            <span className="tabular-nums text-ink-600">{t("ordersCount", { count: d.orders })}</span>
            <span className="w-24 text-end font-semibold tabular-nums text-ink-900">{formatPrice(d.revenue, locale)}</span>
            <span className="w-10 text-end tabular-nums text-ink-500">{Math.round((d.revenue / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
