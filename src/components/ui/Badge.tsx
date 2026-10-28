import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-500 text-ink-900",
  sale: "bg-sale text-white",
  success: "bg-success-50 text-success",
  info: "bg-pastel-sky text-pastel-sky-ink",
  neutral: "bg-surface-sunken text-ink-700",
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
