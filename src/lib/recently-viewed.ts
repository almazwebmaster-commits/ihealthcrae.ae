"use client";

import { useSyncExternalStore } from "react";

// Product slugs the shopper opened recently, newest first, kept in this browser only.
const KEY = "ihc:recently-viewed";
const MAX = 12;
const listeners = new Set<() => void>();
let cache: string[] | null = null;
const EMPTY: string[] = [];

function read(): string[] {
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").slice(0, MAX) : [];
  } catch {
    cache = [];
  }
  return cache;
}

export function recordView(slug: string) {
  const next = [slug, ...read().filter((s) => s !== slug)].slice(0, MAX);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked (private mode): keep the in-memory list for this visit
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRecentlyViewed() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
