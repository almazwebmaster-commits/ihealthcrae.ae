import { CartSync } from "@/components/layout/CartSync";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { NavBar } from "@/components/layout/NavBar";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { TopBar } from "@/components/layout/TopBar";

/** Storefront chrome: header, category bar, footer and cart sync. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <StickyHeader header={<Header />} bar={<NavBar />} />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Keeps the end of the footer clear of the mobile tab bar */}
      <div aria-hidden className="h-16 md:hidden" />
      <MobileTabBar />
      <CartSync />
    </>
  );
}
