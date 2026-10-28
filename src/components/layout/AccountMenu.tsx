"use client";

import { Heart, LayoutDashboard, Package, Repeat, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const STAFF = new Set(["staff", "admin"]);

/** Account button: sign-in pitch when signed out, account shortcuts when signed in. */
export function AccountMenu() {
  const t = useTranslations("Account");
  const { data, isPending } = useSession();
  const user = data?.user;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const firstName = user?.name.split(/\s+/)[0];
  const links = [
    { href: "/account/orders", icon: Package, label: t("orders") },
    { href: "/account/subscriptions", icon: Repeat, label: t("subscriptions") },
    { href: "/wishlist", icon: Heart, label: t("wishlist") },
    ...(user && STAFF.has(user.role ?? "") ? [{ href: "/admin", icon: LayoutDashboard, label: t("admin") }] : []),
  ];

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-ink-900 transition-colors hover:bg-surface-sunken",
          open && "bg-surface-sunken",
        )}
      >
        {user ? (
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {user.name.trim().charAt(0).toUpperCase()}
          </span>
        ) : (
          <UserRound className="size-5.5" strokeWidth={1.9} aria-hidden />
        )}
        <span className={cn("hidden max-w-24 truncate text-xs font-medium lg:block", isPending && "opacity-0")}>
          {user ? t("hi", { name: firstName ?? "" }) : t("signIn")}
        </span>
        <span className="sr-only lg:hidden">{user ? t("myAccount") : t("signIn")}</span>
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-72 rounded-xl border border-line bg-white p-4 text-ink-900 shadow-pop">
          {user ? (
            <>
              <p className="truncate font-display text-base font-extrabold">{t("hi", { name: firstName ?? "" })}</p>
              <p className="truncate text-xs text-ink-500" dir="ltr">{user.email}</p>
              <Link href="/account" onClick={close} className={buttonClass("primary", "md", "mt-3 w-full")}>
                {t("myAccount")}
              </Link>
            </>
          ) : (
            <>
              <p className="font-display text-base font-extrabold">{t("welcome")}</p>
              <p className="mt-1 text-xs text-ink-600">{t("pitch")}</p>
              <Link href="/sign-in" onClick={close} className={buttonClass("primary", "md", "mt-3 w-full")}>
                {t("signIn")}
              </Link>
              <p className="mt-2 text-center text-xs text-ink-600">
                {t("newHere")}{" "}
                <Link href="/register" onClick={close} className="font-bold text-brand-700 hover:underline">
                  {t("createAccount")}
                </Link>
              </p>
            </>
          )}
          <ul className="mt-3 border-t border-line pt-2">
            {links.map(({ href, icon: Icon, label }) => (
              <li key={href}>
                <Link href={href} onClick={close} className="flex items-center gap-2.5 rounded-sm px-2 py-2 text-sm hover:bg-surface">
                  <Icon className="size-4 text-brand-700" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
            {user && (
              <li className="mt-1 border-t border-line pt-1">
                <SignOutButton
                  label={t("signOut")}
                  onDone={close}
                  className="w-full rounded-sm px-2 py-2 text-sm text-ink-700 hover:bg-surface [&_svg]:text-ink-500"
                />
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
