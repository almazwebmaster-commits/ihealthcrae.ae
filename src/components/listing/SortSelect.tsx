"use client";

import type { SortKey } from "@/lib/catalog-types";

/** GET form that re-submits on change; hidden inputs keep the other params. */
export function SortSelect({
  action,
  hidden,
  value,
  options,
  label,
}: {
  action: string;
  hidden: [string, string][];
  value: SortKey;
  options: { value: SortKey; label: string }[];
  label: string;
}) {
  return (
    <form action={action} className="flex items-center gap-2">
      {hidden.map(([k, v], i) => (
        <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor="sort" className="text-xs font-semibold text-ink-600">
        {label}
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-sm border border-line-strong bg-white px-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="h-9 rounded-sm border border-line-strong px-2 text-sm">
          OK
        </button>
      </noscript>
    </form>
  );
}
