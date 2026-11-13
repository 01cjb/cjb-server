import type { Metadata } from "next";

// 업무 시스템은 쇼핑몰(뷰티웰)과 별도 앱으로 설치되도록 manifest·아이콘을 따로 지정
export const metadata: Metadata = {
  title: { default: "CJB 업무 시스템", template: "%s | CJB 업무 시스템" },
  robots: { index: false, follow: false },
  manifest: "/work.webmanifest",
  appleWebApp: { capable: true, title: "CJB 업무", statusBarStyle: "default" },
  icons: { icon: "/work-icon/192", apple: "/work-icon/apple" },
};

export default function WorkRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-neutral-50 text-neutral-900">{children}</div>;
}
