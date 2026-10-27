import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LogoMark } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { openStatuses } from "@/lib/orders";
import { db } from "@/server/db";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Staff-only shell: dark sidebar + top bar, no storefront chrome. */
export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireStaff(locale, "/admin");
  const t = await getTranslations("AdminUI.nav");
  const tTop = await getTranslations("TopBar");
  const openOrders = await db.order.count({ where: { status: { in: openStatuses } } });

  return (
    <div className="flex min-h-screen flex-col bg-surface lg:flex-row">
      <aside className="bg-ink-900 text-white print:hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:py-5">
          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark tone="dark" className="size-7" />
            <span className="text-sm font-extrabold" dir="ltr">
              iHealthcare <span className="rounded-xs bg-accent-500 px-1 py-0.5 text-[10px] text-ink-900">{t("admin")}</span>
            </span>
          </Link>
        </div>
        <div className="px-2 pb-2 lg:flex-1">
          <AdminNav labels={{ dashboard: t("dashboard"), orders: t("orders"), products: t("products"), promotions: t("promotions") }} openOrders={openOrders} />
        </div>
        <div className="hidden space-y-2 border-t border-white/10 p-4 text-xs text-ink-300 lg:block">
          <p className="truncate font-semibold text-white">{user.name}</p>
          <p className="truncate" dir="ltr">{user.email}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <LanguageSwitcher label={tTop("language")} className="text-white" />
            <SignOutButton label={t("signOut")} className="hover:text-white" />
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-end gap-4 border-b border-line bg-white px-4 py-2 text-sm print:hidden">
          <span className="lg:hidden">
            <LanguageSwitcher label={tTop("language")} className="text-ink-700" />
          </span>
          <Link href="/" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
            {t("viewStore")}
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
