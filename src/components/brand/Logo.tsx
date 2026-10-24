import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

const markColors: Record<Tone, { arm: string; core: string; dot: string }> = {
  // light = for use on light backgrounds
  light: { arm: "#0B6E69", core: "#2E9A92", dot: "#FFB400" },
  // dark = for use on brand/ink backgrounds
  dark: { arm: "#FFFFFF", core: "#96D2CC", dot: "#FFB400" },
};

/**
 * Mosaic cross: five square tiles forming a medical cross.
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
      <rect x="16" y="0" width="12" height="12" rx="1.5" fill={c.dot} />
      <rect x="0" y="16" width="12" height="12" rx="1.5" fill={c.arm} />
      <rect x="16" y="16" width="12" height="12" rx="1.5" fill={c.core} />
      <rect x="32" y="16" width="12" height="12" rx="1.5" fill={c.arm} />
      <rect x="16" y="32" width="12" height="12" rx="1.5" fill={c.arm} />
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
      <span className="flex items-baseline font-sans text-2xl leading-none tracking-tight">
        <span className="font-extrabold text-accent-500">i</span>
        <span
          className={cn("font-extrabold", dark ? "text-white" : "text-brand-700")}
        >
          Health
        </span>
        <span
          className={cn("font-medium", dark ? "text-brand-100" : "text-brand-500")}
        >
          care
        </span>
        {showTld && (
          <span
            className={cn(
              "ms-1 rounded-sm px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              dark ? "bg-white/15 text-white" : "bg-brand-50 text-brand-700",
            )}
          >
            .ae
          </span>
        )}
      </span>
    </span>
  );
}
