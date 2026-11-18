import { useLocale } from "next-intl";
import { formatPrice } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";

export function Price({
  price,
  was,
  size = "md",
  showPct = true,
  className,
}: {
  price: number;
  was?: number;
  size?: "sm" | "md" | "lg";
  /** The "-20%" next to the old price (off when a card already shows a Save badge) */
  showPct?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const main = { sm: "text-sm", md: "text-base", lg: "text-2xl" }[size];
  const off = was ? Math.round((1 - price / was) * 100) : 0;

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      {/* Sale prices in brand green, like the "Save" badge they pair with */}
      <span className={cn("font-extrabold", was != null ? "text-brand-700" : "text-ink-900", main)}>{formatPrice(price, locale)}</span>
      {was != null && (
        <>
          <s className="text-xs text-ink-500">{formatPrice(was, locale)}</s>
          {showPct && <span className="text-xs font-bold text-sale">-{off}%</span>}
        </>
      )}
    </span>
  );
}
