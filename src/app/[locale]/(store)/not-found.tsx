import { useTranslations } from "next-intl";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="container-site py-16">
      <Box className="mx-auto max-w-lg p-10 text-center">
        <p className="text-5xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-3 text-xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-sm text-ink-600">{t("body")}</p>
        <Link href="/" className={buttonClass("primary", "md", "mt-6")}>
          {t("home")}
        </Link>
      </Box>
    </div>
  );
}
