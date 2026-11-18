import { cn } from "@/lib/utils";
import { LoadingLabel } from "./LoadingLabel";

/**
 * Loading placeholders shown while a page's data arrives (used by the route loading.tsx files).
 * They mirror the real layouts so nothing jumps when the content lands.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

/** Busy region wrapper so screen readers announce loading once instead of reading empty blocks. */
function Loading({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <LoadingLabel />
      {children}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-2.5 shadow-box">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="space-y-2 px-1 pb-1 pt-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-1 h-5 w-1/2" />
        <Skeleton className="mt-3 h-11 w-full rounded-full" />
      </div>
    </div>
  );
}

/** Category, search and collection pages: header bar, filter column and a product grid. */
export function ListingSkeleton() {
  return (
    <Loading className="container-site space-y-4 py-4">
      <Skeleton className="h-4 w-48" />
      <div className="flex items-end justify-between gap-3 rounded-xl border border-line/70 bg-white px-4 py-4 shadow-box">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="hidden h-9 w-40 sm:block" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <div className="hidden space-y-4 self-start rounded-xl border border-line/70 bg-white p-4 shadow-box lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 rounded-xl lg:hidden" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i}>
              <ProductCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </Loading>
  );
}

/** Product page: gallery, title block, buy box. */
export function ProductPageSkeleton() {
  return (
    <Loading className="container-site space-y-4 py-4">
      <Skeleton className="h-4 w-72 max-w-full" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-5">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-3 lg:col-span-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
        <div className="space-y-4 rounded-xl border border-line/70 bg-white p-4 shadow-box lg:col-span-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </Loading>
  );
}
