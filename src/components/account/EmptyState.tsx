import type { LucideIcon } from "lucide-react";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

export function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <Box className="flex flex-col items-center px-6 py-14 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-sm bg-surface text-ink-400">
        <Icon className="size-7" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-600">{body}</p>
      {cta && (
        <Link href={cta.href} className={buttonClass("accent", "md", "mt-5")}>
          {cta.label}
        </Link>
      )}
    </Box>
  );
}
