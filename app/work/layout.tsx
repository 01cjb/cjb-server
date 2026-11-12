export const metadata = { title: { default: "CJB 업무 시스템", template: "%s | CJB 업무 시스템" }, robots: { index: false, follow: false } };

export default function WorkRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-neutral-50 text-neutral-900">{children}</div>;
}
