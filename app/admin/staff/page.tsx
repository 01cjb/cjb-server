import { listStaff } from "@/lib/admin/repo";
import StaffForm from "@/components/admin/StaffForm";
import Act from "@/components/admin/Act";
import Pill from "@/components/admin/Pill";
import { H1, Table } from "@/components/admin/Table";
import { dt } from "@/lib/fmt";

const ROLE: Record<string, string> = { admin: "최고관리자", staff: "직원", customer: "일반회원" };

export default async function Staff() {
  const { staff, audit } = await listStaff();
  const tests = staff.filter((s) => s.is_test);
  const realAdmins = staff.filter((s) => s.role === "admin" && !s.is_test);
  const domains = process.env.ADMIN_EMAIL_DOMAINS;
  return (
    <div className="space-y-6">
      <H1>관리자 계정</H1>

      <div className="rounded-xl bg-white border border-neutral-200 p-5 text-sm">
        <p className="font-semibold mb-3">회사 계정 전환 체크리스트</p>
        <ol className="space-y-2">
          {[
            [realAdmins.length > 0, "회사 메일로 회원가입 → 아래에서 ‘최고관리자’로 지정 (테스트 계정 체크 해제)"],
            [realAdmins.length > 0, "회사 계정으로 로그인해 /admin 접속 확인"],
            [tests.length === 0, "개인(테스트) 계정을 ‘권한 해제’ — 회사 계정으로 로그인한 상태에서 진행"],
            [!!domains, "Vercel 환경변수 ADMIN_EMAIL_DOMAINS 에 회사 도메인 입력 → 이후 회사 메일만 관리자 지정 가능"],
          ].map(([done, t], i) => (
            <li key={i} className="flex gap-2"><span className={`mt-0.5 size-4 shrink-0 rounded-full grid place-items-center text-[10px] ${done ? "bg-emerald-600 text-white" : "border border-neutral-300"}`}>{done ? "✓" : ""}</span><span className={done ? "text-neutral-400" : ""}>{t as string}</span></li>
          ))}
        </ol>
        {domains && <p className="text-xs text-neutral-500 mt-3">허용 도메인: {domains}</p>}
      </div>

      <StaffForm />

      <Table head={["이름", "이메일", "권한", "구분", "가입", "최근 로그인", ""]} empty={!staff.length}>
        {staff.map((s) => (
          <tr key={s.id}>
            <td>{s.name || "-"}</td><td>{s.email}</td><td><Pill s={s.role} label={ROLE[s.role]} /></td>
            <td>{s.is_test ? <Pill s="pending" label="테스트(개인)" /> : <Pill s="active" label="회사" />}</td>
            <td className="text-xs text-neutral-500">{dt(s.created_at)}</td><td className="text-xs text-neutral-500">{dt(s.last_login_at)}</td>
            <td><Act url="/api/admin/staff" body={{ email: s.email, role: "customer" }} ask="해제 사유" label="권한 해제" tone="danger" /></td>
          </tr>
        ))}
      </Table>

      <div>
        <h2 className="font-semibold text-sm mb-2">권한 변경 기록</h2>
        <Table head={["일시", "대상", "변경", "메모"]} empty={!audit.length}>
          {audit.map((a) => <tr key={a.id}><td className="text-xs text-neutral-500">{dt(a.created_at)}</td><td>{a.target_email}</td><td className="text-xs">{ROLE[a.from_role ?? ""] ?? a.from_role} → <b>{ROLE[a.to_role ?? ""] ?? a.to_role}</b></td><td className="text-xs">{a.note ?? ""}</td></tr>)}
        </Table>
      </div>
      <p className="text-xs text-neutral-400">권한 변경은 최고관리자만 할 수 있고, 마지막 최고관리자는 해제되지 않습니다(관리자 없이 잠기는 것 방지).</p>
    </div>
  );
}
