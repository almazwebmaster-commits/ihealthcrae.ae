import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-ink-600">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight className="flip-rtl size-3 text-ink-400" aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-700 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-ink-900">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
