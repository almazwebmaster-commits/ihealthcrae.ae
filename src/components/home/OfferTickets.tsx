import { ChevronRight, Ticket } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice, tr } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";
import type { OfferCoupon } from "@/server/home-data";
import { CopyCode } from "./CopyCode";

const looks = [
  { stub: "bg-brand-700", ink: "text-brand-700" },
  { stub: "bg-violet-600", ink: "text-violet-700" },
  { stub: "bg-orange-600", ink: "text-orange-700" },
];

/** "Offers for you": coupon tickets — a coloured stub with the discount, the code to copy, and a Shop link. */
export function OfferTickets({ coupons }: { coupons: OfferCoupon[] }) {
  const t = useTranslations("Home.offers");
  const locale = useLocale();
  if (!coupons.length) return null;
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Ticket className="size-5.5" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">{t("title")}</h2>
          <p className="text-sm text-ink-600">{t("subtitle")}</p>
        </div>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:px-0">
        {coupons.map((c, i) => {
          const look = looks[i % looks.length];
          const big = c.type === "PERCENT" ? `${c.value}%` : c.type === "FIXED" ? formatPrice(c.value, locale) : t("free");
          const small = c.type === "FREE_DELIVERY" ? t("delivery") : t("off");
          return (
            <li key={c.code} className="flex w-[22rem] max-w-[85vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-box">
              {/* Stub: the punched circles on its edge read as a tear-off ticket */}
              <div className={cn("relative flex w-28 shrink-0 flex-col items-center justify-center px-2 py-5 text-white", look.stub)}>
                <span className="text-3xl font-extrabold leading-none" dir="ltr">
                  {big}
                </span>
                <span className="mt-1.5 text-xs font-bold uppercase tracking-[0.2em]">{small}</span>
                <span aria-hidden className="absolute -end-2.5 -top-2.5 size-5 rounded-full bg-surface" />
                <span aria-hidden className="absolute -bottom-2.5 -end-2.5 size-5 rounded-full bg-surface" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 border-s-2 border-dashed border-line p-4">
                <p className="line-clamp-2 text-sm font-bold text-ink-900">{tr(c.description, locale) || c.code}</p>
                {c.minSpend != null && <p className="text-xs text-ink-600">{t("minSpend", { amount: formatPrice(c.minSpend, locale) })}</p>}
                <div className={cn("mt-auto flex items-center justify-between gap-2", look.ink)}>
                  <CopyCode code={c.code} labels={{ copy: t("copy"), copied: t("copied") }} />
                  <Link href="/offers" className="inline-flex items-center gap-0.5 text-sm font-bold hover:underline">
                    {t("shop")}
                    <ChevronRight className="flip-rtl size-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
