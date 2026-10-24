"use client";

import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={pathname}
      locale={next}
      hrefLang={next}
      className={cn("inline-flex items-center gap-1.5 hover:underline", className)}
    >
      <Globe className="size-3.5" aria-hidden />
      <span lang={next}>{label}</span>
    </Link>
  );
}
