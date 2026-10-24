"use client";

import { useSyncExternalStore } from "react";

// Saved-product slugs for the signed-in shopper, loaded once and updated optimistically.
let slugs: Set<string> | null = null;
let loadingFor: string | null = null;
const listeners = new Set<() => void>();
const EMPTY = new Set<string>();

const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const wishlist = {
  /** Loads the user's wishlist once per user id. */
  async load(userId: string) {
    if (loadingFor === userId) return;
    loadingFor = userId;
    const res = await fetch("/api/wishlist").catch(() => null);
    slugs = new Set(res?.ok ? ((await res.json()).slugs as string[]) : []);
    emit();
  },
  reset() {
    slugs = null;
    loadingFor = null;
    emit();
  },
  async toggle(slug: string) {
    const on = !(slugs ?? EMPTY).has(slug);
    const next = new Set(slugs ?? []);
    if (on) next.add(slug);
    else next.delete(slug);
    slugs = next;
    emit();
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, on }),
    }).catch(() => null);
    if (!res?.ok) {
      // Roll back on failure
      const rolled = new Set(slugs);
      if (on) rolled.delete(slug);
      else rolled.add(slug);
      slugs = rolled;
      emit();
    }
  },
};

export function useWishlisted(slug: string) {
  return useSyncExternalStore(
    subscribe,
    () => (slugs ?? EMPTY).has(slug),
    () => false,
  );
}
