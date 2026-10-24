"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { signOut } from "@/lib/auth-client";
import { cart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { wishlist } from "@/lib/wishlist-store";

/** Signs out and clears this device's cart + wishlist (they stay saved on the account). */
export function SignOutButton({ label, className, onDone }: { label: string; className?: string; onDone?: () => void }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        cart.clear();
        wishlist.reset();
        onDone?.();
        router.push("/");
        router.refresh();
      }}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <LogOut className="size-4" aria-hidden />
      {label}
    </button>
  );
}
