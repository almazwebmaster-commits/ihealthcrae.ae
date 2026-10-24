import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  accent: "bg-accent-500 text-ink-900 border-accent-600",
  sale: "bg-sale text-white border-sale",
  success: "bg-success-50 text-success border-success/30",
  info: "bg-info-50 text-info border-info/30",
  neutral: "bg-surface text-ink-700 border-line",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
