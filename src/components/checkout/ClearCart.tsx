"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart-store";

/** Empties the cart once an order is confirmed. Renders nothing. */
export function ClearCart() {
  useEffect(() => {
    cart.clear();
  }, []);
  return null;
}
