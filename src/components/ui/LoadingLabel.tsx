"use client";

import { useTranslations } from "next-intl";

/** Screen-reader-only "Loading…" in the shopper's language (loading.tsx files can't read the locale themselves). */
export function LoadingLabel() {
  const t = useTranslations("Common");
  return <span className="sr-only">{t("loading")}</span>;
}
