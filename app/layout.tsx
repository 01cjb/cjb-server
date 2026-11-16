import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomTabBar from "@/components/BottomTabBar";
import { StoreProvider } from "@/components/Store";
import PwaRegister from "@/components/PwaRegister";
import { MainShell, PhoneShell, ShopOnly } from "@/components/ShopChrome";
import { getCategories } from "@/lib/data";
import { company } from "@/lib/company";
import { getMe } from "@/lib/me";

export const metadata: Metadata = {
  title: { default: `${company.mall} - 뷰티/이·미용인을 위한 복지몰`, template: `%s | ${company.mall}` },
  description: `${company.name} 이·미용 전문가 도매 쇼핑몰`,
  appleWebApp: { capable: true, title: company.mall, statusBarStyle: "default" },
  manifest: "/manifest.webmanifest", // 업무 시스템(/work)은 자체 manifest로 덮어씀
};

export const viewport: Viewport = { themeColor: "#3b1d5a", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, me] = await Promise.all([getCategories(), getMe()]);
  const serverGrade = me.mock ? null : me.user?.grade_id ?? "general";
  const session = me.mock ? { mock: true, name: null, admin: true } : { mock: false, name: me.user?.name ?? null, admin: me.user?.role === "admin" || me.user?.role === "staff" };
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 인트로는 세션당 한 번만 (두 번째부터는 그리기 전에 숨김) */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem('bw.intro'))document.documentElement.dataset.intro='done';sessionStorage.setItem('bw.intro','1')}catch(e){}" }} />
      </head>
      <body>
        <StoreProvider serverGrade={serverGrade}>
          <PhoneShell>
            <ShopOnly><Header categories={categories} session={session} loggedIn={me.mock || !!me.user} /></ShopOnly>
            <MainShell>{children}</MainShell>
            <ShopOnly><Footer /><BottomTabBar /></ShopOnly>
          </PhoneShell>
        </StoreProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
