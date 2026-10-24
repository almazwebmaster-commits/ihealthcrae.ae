"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

/** Rendered only when GOOGLE_CLIENT_ID/SECRET are configured (the page decides). */
export function GoogleButton({ callbackURL }: { callbackURL: string }) {
  const t = useTranslations("Auth");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs text-ink-500">
        <span className="h-px flex-1 bg-line" />
        {t("or")}
        <span className="h-px flex-1 bg-line" />
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await authClient.signIn.social({ provider: "google", callbackURL });
          setBusy(false);
        }}
        className={buttonClass("outline", "lg", "w-full")}
      >
        <GoogleMark />
        {t("google")}
      </button>
    </>
  );
}
