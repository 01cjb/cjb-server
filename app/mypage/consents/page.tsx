import Link from "next/link";
import { myConsents } from "@/lib/me";
import ConsentToggle from "@/components/me/ConsentToggle";
import Pill from "@/components/admin/Pill";
import { dt } from "@/lib/fmt";
export default async function MyConsents() {
  const { current, history } = await myConsents();
  const mk = current.find((c) => c.code === "marketing");
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">수신동의 · 약관</h1>
      <ConsentToggle init={{ agreed: !!mk?.agreed, ch_email: !!mk?.channel_email, ch_sms: !!mk?.channel_sms, ch_push: !!mk?.channel_push }} />
      <div>
        <p className="font-semibold text-sm mb-2">동의한 약관</p>
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200 text-sm">
          {current.map((c) => <li key={c.code} className="flex items-center gap-2 py-3"><span className="flex-1">{c.title} <span className="text-xs text-neutral-400">v{c.version}</span></span>{c.agreed ? <Pill s="active" label="동의" /> : <Pill s="hidden" label="미동의" />}<span className="text-xs text-neutral-400 w-28 text-right">{dt(c.created_at)}</span></li>)}
        </ul>
        <p className="text-xs text-neutral-400 mt-2">필수 약관 철회는 회원 탈퇴로 처리됩니다. <Link href="/terms" className="underline">이용약관</Link> · <Link href="/privacy" className="underline font-semibold">개인정보처리방침</Link></p>
      </div>
      <details className="text-sm"><summary className="cursor-pointer text-neutral-500">변경 이력 {history.length}건</summary>
        <ul className="mt-2 text-xs text-neutral-500 space-y-1">{history.map((h, i) => <li key={i}>{dt(h.created_at)} · {h.title} · {h.agreed ? "동의" : "거부"}</li>)}</ul></details>
    </div>
  );
}
