import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomTabBar from "@/components/BottomTabBar";
import { StoreProvider } from "@/components/Store";
import PwaRegister from "@/components/PwaRegister";
import { MainShell, ShopOnly } from "@/components/ShopChrome";
import { getCategories } from "@/lib/data";
import { company } from "@/lib/company";
import { getMe } from "@/lib/me";

export const metadata: Metadata = {
  title: { default: `${company.mall} - 뷰티/이·미용인을 위한 복지몰`, template: `%s | ${company.mall}` },
  description: `${company.name} 이·미용 전문가 도매 쇼핑몰`,
  appleWebApp: { capable: true, title: company.mall, statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#6a2f96", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, me] = await Promise.all([getCategories(), getMe()]);
  const serverGrade = me.mock ? null : me.user?.grade_id ?? "general";
  const session = me.mock ? { mock: true, name: null, admin: true } : { mock: false, name: me.user?.name ?? null, admin: me.user?.role === "admin" || me.user?.role === "staff" };
  return (
    <html lang="ko">
      <body>
        <StoreProvider serverGrade={serverGrade}>
          <ShopOnly><Header categories={categories} session={session} loggedIn={me.mock || !!me.user} /></ShopOnly>
          <MainShell>{children}</MainShell>
          <ShopOnly><Footer /><BottomTabBar /></ShopOnly>
        </StoreProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
