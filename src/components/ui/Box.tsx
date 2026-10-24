import { cn } from "@/lib/utils";

/** The core boxy surface: white, hairline border, square corners. */
export function Box({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-sm border border-line bg-surface-raised shadow-box",
        className,
      )}
      {...props}
    />
  );
}

export function BoxHeader({
  title,
  action,
  className,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-line px-4 py-3",
        className,
      )}
    >
      <h2 className="text-base font-bold text-ink-900">{title}</h2>
      {action}
    </div>
  );
}
