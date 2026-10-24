import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

function Stars({ className }: { className?: string }) {
  return (
    <span className={cn("flex", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="aspect-square h-full w-auto shrink-0 fill-current" strokeWidth={0} aria-hidden />
      ))}
    </span>
  );
}

export function Rating({
  value,
  count,
  size = "sm",
  label,
  className,
}: {
  value: number;
  count?: string;
  size?: "sm" | "md";
  label: string;
  className?: string;
}) {
  const star = size === "sm" ? "h-3.5 w-[4.375rem]" : "h-4.5 w-[5.625rem]";
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={label}>
      <span className={cn("relative inline-block", star)} role="img" aria-label={label}>
        <Stars className="absolute inset-0 text-ink-300" />
        {/* Clip from the inline start so partial stars fill correctly in RTL too */}
        <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${(value / 5) * 100}%` }}>
          <Stars className={cn("text-accent-500", star)} />
        </span>
      </span>
      <span className={cn("font-semibold text-ink-700", size === "sm" ? "text-xs" : "text-sm")}>
        {value.toFixed(1)}
      </span>
      {count && <span className={cn("text-ink-500", size === "sm" ? "text-xs" : "text-sm")}>({count})</span>}
    </span>
  );
}
