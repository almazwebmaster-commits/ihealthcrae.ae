import { Banknote, Headset, MapPin, ShieldCheck, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function TopBar() {
  const t = await getTranslations("TopBar");

  return (
    <div className="bg-ink-900 text-xs text-ink-300">
      <div className="container-site flex h-9 items-center justify-between gap-4">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 hover:text-white"
        >
          <MapPin className="size-3.5 text-accent-500" aria-hidden />
          <span>{t("deliverTo")}</span>
          <span className="font-semibold text-white">{t("emirate")}</span>
        </button>

        <ul className="hidden items-center gap-5 md:flex">
          <li className="inline-flex items-center gap-1.5">
            <Truck className="size-3.5 text-accent-500" aria-hidden />
            {t("freeDelivery")}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Banknote className="size-3.5 text-accent-500" aria-hidden />
            {t("cod")}
          </li>
          <li className="hidden items-center gap-1.5 lg:inline-flex">
            <ShieldCheck className="size-3.5 text-accent-500" aria-hidden />
            {t("genuine")}
          </li>
        </ul>

        <div className="flex items-center gap-4">
          <Link
            href="/help"
            className="hidden items-center gap-1.5 hover:text-white sm:inline-flex"
          >
            <Headset className="size-3.5" aria-hidden />
            {t("help")}
          </Link>
          <LanguageSwitcher
            label={t("language")}
            className="font-semibold text-white"
          />
        </div>
      </div>
    </div>
  );
}
