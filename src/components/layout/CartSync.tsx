"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { cart, mergeCarts, type CartLine } from "@/lib/cart-store";

const SAVE_DEBOUNCE_MS = 600;

function save(lines: CartLine[]) {
  return fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Keeps the browser cart and the signed-in account's cart in step:
 * on sign-in the two are merged, afterwards every change is saved to the account.
 * Renders nothing.
 */
export function CartSync() {
  const { data } = useSession();
  const userId = data?.user.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const res = await fetch("/api/cart").catch(() => null);
      if (cancelled || !res?.ok) return;
      const { lines: server } = (await res.json()) as { lines: CartLine[] };
      const merged = mergeCarts(cart.lines(), server);
      cart.replace(merged);
      await save(merged);
      if (cancelled) return;
      unsubscribe = cart.subscribe(() => {
        clearTimeout(timer);
        timer = setTimeout(() => save(cart.lines()), SAVE_DEBOUNCE_MS);
      });
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, [userId]);

  return null;
}
