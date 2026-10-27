"use client";

import { useSyncExternalStore } from "react";

const DUBAI_OFFSET = 4 * 3600; // UTC+4, no DST

function subscribe(cb: () => void) {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
}
const nowSeconds = () => Math.floor(Date.now() / 1000);

/**
 * Counts down to `until` (ISO time, e.g. a flash deal's end) or, by default, to
 * midnight UAE time — when "Deals of the day" end. Hours run past 24 for longer deals.
 */
export function Countdown({ label, until }: { label: string; until?: string }) {
  const now = useSyncExternalStore(subscribe, nowSeconds, () => 0);
  const end = until ? Math.floor(new Date(until).getTime() / 1000) : null;
  const left = !now ? null : end != null ? Math.max(0, end - now) : 86400 - ((now + DUBAI_OFFSET) % 86400);
  const parts = left == null
    ? ["--", "--", "--"]
    : [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map((n) =>
        String(n).padStart(2, "0"),
      );

  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-ink-600">
      {label}
      <span dir="ltr" className="inline-flex items-center gap-0.5 font-mono tabular-nums">
        {parts.map((p, i) => (
          <span key={i} className="inline-flex items-center gap-0.5">
            {i > 0 && <span className="text-ink-400">:</span>}
            <span className="rounded-xs bg-ink-900 px-1.5 py-0.5 text-white">{p}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
