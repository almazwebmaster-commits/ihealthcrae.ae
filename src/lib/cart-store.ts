"use client";

import { useSyncExternalStore } from "react";

/** `sub` = Subscribe & save delivery interval in weeks; absent for one-time purchases. */
export type CartLine = { slug: string; option?: number; sub?: number; qty: number };
export type LineKey = Pick<CartLine, "slug" | "option" | "sub">;

const KEY = "ihc-cart-v1";
const MAX_QTY = 10;
const EMPTY: CartLine[] = [];

let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Storage unavailable (private mode) — keep in memory only.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const same = (a: LineKey, b: LineKey) =>
  a.slug === b.slug && a.option === b.option && a.sub === b.sub;
const clamp = (q: number) => Math.max(1, Math.min(MAX_QTY, q));

/** Inserts or merges a line into a list. */
function upsert(lines: CartLine[], line: CartLine) {
  const existing = lines.find((l) => same(l, line));
  return existing
    ? lines.map((l) => (l === existing ? { ...l, qty: clamp(l.qty + line.qty) } : l))
    : [...lines, { ...line, qty: clamp(line.qty) }];
}

export const cart = {
  add(key: LineKey, qty = 1) {
    write(upsert(read(), { ...key, qty }));
  },
  setQty(key: LineKey, qty: number) {
    write(read().map((l) => (same(l, key) ? { ...l, qty: clamp(qty) } : l)));
  },
  /** Switches a line between one-time and a subscription interval, merging duplicates. */
  setSubscription(key: LineKey, sub: number | undefined) {
    const lines = read();
    const line = lines.find((l) => same(l, key));
    if (!line) return;
    write(upsert(lines.filter((l) => l !== line), { ...line, sub }));
  },
  remove(key: LineKey) {
    write(read().filter((l) => !same(l, key)));
  },
  clear() {
    write([]);
  },
  /** Used by CartSync after merging with the account's saved cart. */
  replace(lines: CartLine[]) {
    write(lines);
  },
  lines: () => read(),
  subscribe,
};

const keyOf = (l: LineKey) => `${l.slug}|${l.option ?? ""}|${l.sub ?? ""}`;

/** Union of two carts; the same line on both sides keeps the larger quantity (no double-counting). */
export function mergeCarts(a: CartLine[], b: CartLine[]) {
  const map = new Map<string, CartLine>();
  for (const l of [...a, ...b]) {
    const k = keyOf(l);
    const prev = map.get(k);
    map.set(k, prev ? { ...prev, qty: clamp(Math.max(prev.qty, l.qty)) } : { ...l, qty: clamp(l.qty) });
  }
  return [...map.values()];
}

export const CART_MAX_QTY = MAX_QTY;

export function useCartLines() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCartCount() {
  return useCartLines().reduce((n, l) => n + l.qty, 0);
}
