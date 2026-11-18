"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductRail } from "@/components/catalog/ProductRail";
import type { Product } from "@/lib/catalog-types";
import { recordView, useRecentlyViewed } from "@/lib/recently-viewed";

/** Products this shopper opened recently (kept in their browser); hidden until there are some. */
export function RecentlyViewed({ labels }: { labels: { title: string; prevLabel: string; nextLabel: string } }) {
  const slugs = useRecentlyViewed();
  const key = slugs.join(",");
  const [result, setResult] = useState<{ key: string; items: Product[] }>({ key: "", items: [] });

  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    fetch(`/api/products?slugs=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items: Product[] }) => {
        // Keep the viewing order (newest first); the API returns catalogue order.
        const bySlug = new Map(d.items.map((p) => [p.slug, p]));
        setResult({ key, items: key.split(",").flatMap((s) => bySlug.get(s) ?? []) });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [key]);

  const items = result.key === key ? result.items : [];
  if (!items.length) return null;
  return (
    <ProductRail title={labels.title} prevLabel={labels.prevLabel} nextLabel={labels.nextLabel}>
      {items.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </ProductRail>
  );
}

/** Drop on a product page to add it to "Recently viewed". */
export function RecordView({ slug }: { slug: string }) {
  useEffect(() => recordView(slug), [slug]);
  return null;
}
