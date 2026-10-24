import { useLocale } from "next-intl";
import { ProductVisual } from "@/components/catalog/ProductVisual";
import { Box } from "@/components/ui/Box";
import type { Product } from "@/lib/catalog-types";
import { Link } from "@/i18n/navigation";
import { tr } from "@/lib/i18n-utils";

/** Amazon-style box: a title, four product tiles and a "see more" link. */
export function QuadBox({
  title,
  href,
  linkLabel,
  products,
}: {
  title: string;
  href: string;
  linkLabel: string;
  products: Product[];
}) {
  const locale = useLocale();
  return (
    <Box className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-lg font-bold text-ink-900">{title}</h2>
      <div className="grid flex-1 grid-cols-2 gap-3">
        {products.slice(0, 4).map((p) => (
          <Link key={p.slug} href={`/p/${p.slug}`} className="group block">
            <ProductVisual
              product={p}
              sizes="(min-width: 1280px) 150px, (min-width: 640px) 25vw, 45vw"
              className="rounded-sm border border-line transition-transform group-hover:scale-[1.02]"
            />
            <span className="mt-1 line-clamp-1 text-xs text-ink-700 group-hover:text-brand-700">
              {tr(p.name, locale)}
            </span>
          </Link>
        ))}
      </div>
      <Link href={href} className="mt-3 text-sm font-semibold text-brand-700 hover:underline">
        {linkLabel}
      </Link>
    </Box>
  );
}
