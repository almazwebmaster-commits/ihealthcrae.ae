import { CartSync } from "@/components/layout/CartSync";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NavBar } from "@/components/layout/NavBar";
import { TopBar } from "@/components/layout/TopBar";

/** Storefront chrome: header, category bar, footer and cart sync. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40">
        <TopBar />
        <Header />
        <NavBar />
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
      <CartSync />
    </>
  );
}
