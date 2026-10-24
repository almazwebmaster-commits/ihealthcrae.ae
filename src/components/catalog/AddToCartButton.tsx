"use client";

import { Check, ShoppingCart } from "lucide-react";
import { useRef, useState } from "react";
import { buttonClass, type ButtonSize } from "@/components/ui/Button";
import { cart } from "@/lib/cart-store";

export function AddToCartButton({
  slug,
  option,
  sub,
  qty = 1,
  disabled,
  label,
  addedLabel,
  size = "sm",
  className,
}: {
  slug: string;
  option?: number;
  /** Subscribe & save interval in weeks */
  sub?: number;
  qty?: number;
  disabled?: boolean;
  label: string;
  addedLabel: string;
  size?: ButtonSize;
  className?: string;
}) {
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        cart.add({ slug, option, sub }, qty);
        setAdded(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), 1600);
      }}
      className={buttonClass(added ? "primary" : "accent", size, className)}
      aria-live="polite"
    >
      {added ? <Check className="size-4" aria-hidden /> : <ShoppingCart className="size-4" aria-hidden />}
      {added ? addedLabel : label}
    </button>
  );
}
