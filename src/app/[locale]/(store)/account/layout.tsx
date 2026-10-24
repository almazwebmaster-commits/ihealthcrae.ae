import { getTranslations } from "next-intl/server";
import { AccountNav } from "@/components/account/AccountNav";
import { isStaff, requireUser } from "@/server/session";

export default async function AccountLayout({ children, params }: LayoutProps<"/[locale]/account">) {
  const { locale } = await params;
  const session = await requireUser(locale, "/account");
  const t = await getTranslations("AccountArea");
  const labels = Object.fromEntries(
    ["title", "overview", "orders", "subscriptions", "wishlist", "addresses", "profile", "admin", "signOut"].map((k) => [k, t(k)]),
  );

  return (
    <div className="container-site grid gap-4 py-4 lg:grid-cols-[15rem_1fr]">
      <div className="lg:sticky lg:top-40 lg:self-start">
        <AccountNav labels={labels} isStaff={isStaff(session.user.role)} />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
