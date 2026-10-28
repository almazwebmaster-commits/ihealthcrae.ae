import { cn } from "@/lib/utils";

/** The core surface: white card, soft corners, a barely-there border. */
export function Box({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line/70 bg-surface-raised shadow-box",
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
