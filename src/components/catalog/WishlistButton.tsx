"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useWishlisted, wishlist } from "@/lib/wishlist-store";

/** Heart toggle. Signed-out shoppers are sent to sign in and brought back here. */
export function WishlistButton({ slug, className }: { slug: string; className?: string }) {
  const t = useTranslations("Wishlist");
  const { data } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const saved = useWishlisted(slug);
  const userId = data?.user.id;

  useEffect(() => {
    if (userId) void wishlist.load(userId);
  }, [userId]);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t("remove") : t("add")}
      title={saved ? t("remove") : t("add")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userId) return router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
        void wishlist.toggle(slug);
      }}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-sm border border-line bg-white/95 transition-colors hover:border-ink-400",
        saved ? "text-sale" : "text-ink-600",
        className,
      )}
    >
      <Heart className={cn("size-4.5", saved && "fill-current")} aria-hidden />
    </button>
  );
}
