import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

const markColors: Record<Tone, { arm: string; core: string; dot: string }> = {
  // light = for use on light backgrounds
  light: { arm: "#07806E", core: "#12A38B", dot: "#FFB400" },
  // dark = for use on brand/ink backgrounds
  dark: { arm: "#FFFFFF", core: "#9EDDCC", dot: "#FFB400" },
};

/**
 * Mosaic cross: five soft tiles forming a medical cross.
 * The top tile is amber — it doubles as the dot of the "i".
 */
export function LogoMark({
  tone = "light",
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  const c = markColors[tone];
  return (
    <svg
      viewBox="0 0 44 44"
      aria-hidden="true"
      className={cn("size-9 shrink-0", className)}
    >
      <rect x="16" y="0" width="12" height="12" rx="3.5" fill={c.dot} />
      <rect x="0" y="16" width="12" height="12" rx="3.5" fill={c.arm} />
      <rect x="16" y="16" width="12" height="12" rx="3.5" fill={c.core} />
      <rect x="32" y="16" width="12" height="12" rx="3.5" fill={c.arm} />
      <rect x="16" y="32" width="12" height="12" rx="3.5" fill={c.arm} />
    </svg>
  );
}

export function Logo({
  tone = "light",
  showTld = true,
  className,
}: {
  tone?: Tone;
  showTld?: boolean;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <span
      dir="ltr"
      className={cn("inline-flex items-center gap-2 select-none", className)}
      aria-label="iHealthcare.ae"
    >
      <LogoMark tone={tone} />
      <span className="flex items-baseline font-display text-2xl leading-none tracking-tight">
        <span className={cn("font-extrabold", dark ? "text-accent-500" : "text-accent-600")}>i</span>
        <span
          className={cn("font-extrabold", dark ? "text-white" : "text-brand-800")}
        >
          Health
        </span>
        <span
          className={cn("font-semibold", dark ? "text-brand-100" : "text-brand-600")}
        >
          care
        </span>
        {showTld && (
          <span
            className={cn(
              "ms-1.5 self-center rounded-full px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider",
              dark ? "bg-white/15 text-white" : "bg-brand-50 text-brand-800",
            )}
          >
            .ae
          </span>
        )}
      </span>
    </span>
  );
}
