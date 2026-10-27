import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Box } from "@/components/ui/Box";
import { Link } from "@/i18n/navigation";
import { statusTone, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";

/** Page heading row with optional actions on the end side. */
export function AdminHeader({ title, subtitle, actions }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function OrderStatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return <Badge tone={statusTone[status]}>{label}</Badge>;
}

const productTone = { ACTIVE: "success", DRAFT: "neutral", ARCHIVED: "sale" } as const;
export function ProductStatusBadge({ status, label }: { status: keyof typeof productTone; label: string }) {
  return <Badge tone={productTone[status]}>{label}</Badge>;
}

/** Boxy data table wrapper with horizontal scroll on small screens. */
export function DataTable({ head, children, className }: { head: React.ReactNode[]; children: React.ReactNode; className?: string }) {
  return (
    <Box className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-line bg-surface text-start text-xs font-bold uppercase tracking-wide text-ink-600">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-3 py-2.5 text-start">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </Box>
  );
}

export function Pager({ page, pages, href, prev, next }: { page: number; pages: number; href: (p: number) => string; prev: string; next: string }) {
  if (pages <= 1) return null;
  const btn = "inline-flex h-9 items-center rounded-sm border border-line-strong bg-white px-3 text-sm font-semibold hover:border-ink-400";
  return (
    <nav className="mt-4 flex items-center justify-center gap-2 text-sm">
      {page > 1 && <Link href={href(page - 1)} className={btn}>{prev}</Link>}
      <span className="px-2 text-ink-600 tabular-nums">
        {page} / {pages}
      </span>
      {page < pages && <Link href={href(page + 1)} className={btn}>{next}</Link>}
    </nav>
  );
}

export function qs(params: Record<string, string | number | undefined | null>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
}

export const field = "h-10 w-full rounded-sm border border-line-strong bg-white px-3 text-sm focus:border-brand-500 focus:outline-none";

/** Dashboard-style figure card; links when href is set. */
export function Stat({ icon: Icon, label, value, sub, href, warn }: { icon: LucideIcon; label: string; value: string; sub?: string; href?: string; warn?: boolean }) {
  const body = (
    <Box className={cn("flex h-full items-center gap-4 p-4", href && "hover:border-ink-400")}>
      <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-sm", warn ? "bg-sale-50 text-sale" : "bg-brand-50 text-brand-700")}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-extrabold leading-tight tabular-nums 2xl:text-2xl">{value}</span>
        <span className="block text-xs text-ink-600">{label}</span>
        {sub && <span className="block text-xs text-ink-500">{sub}</span>}
      </span>
    </Box>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
