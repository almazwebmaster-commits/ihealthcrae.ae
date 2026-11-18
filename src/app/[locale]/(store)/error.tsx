"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

/** Storefront error screen: the header and footer stay, so shoppers can carry on browsing. */
export default function StoreError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-site py-12 sm:py-16">
      <Box className="mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-accent-50">
          <TriangleAlert className="size-8 text-accent-700" strokeWidth={1.8} aria-hidden />
        </span>
        <h1 className="mt-5 text-xl font-extrabold text-ink-900 sm:text-2xl">{t("title")}</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-600">{t("body")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => retry()} className={buttonClass("primary", "lg")}>
            <RefreshCw className="size-4" aria-hidden />
            {t("retry")}
          </button>
          <Link href="/" className={buttonClass("outline", "lg")}>
            {t("home")}
          </Link>
        </div>
      </Box>
    </div>
  );
}
