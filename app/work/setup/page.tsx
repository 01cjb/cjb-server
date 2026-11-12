import Link from "next/link";
import Brand from "@/components/work/Brand";
import SetupForm from "@/components/work/SetupForm";
import { getAdmin } from "@/lib/admin/guard";
import { workLive } from "@/lib/work/auth";
import { countUsers } from "@/lib/work/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "처음 설정" };

// 직원이 한 명도 없을 때 첫 대표 계정 만들기 — 쇼핑몰 관리자(Supabase 로그인)만
export default async function WorkSetup() {
  const [n, a] = await Promise.all([countUsers(), getAdmin()]);
  let body: React.ReactNode;
  if (!workLive()) body = <p className="text-sm text-neutral-600">목업 모드에서는 설정이 필요 없습니다. 데모 계정으로 <Link className="text-brand-700 underline" href="/work/login">로그인</Link>하세요.</p>;
  else if (n > 0) body = <p className="text-sm text-neutral-600">이미 설정되었습니다. <Link className="text-brand-700 underline" href="/work/login">로그인</Link></p>;
  else if (!a.ok) body = <p className="text-sm text-neutral-600">먼저 쇼핑몰 최고관리자 계정으로 <Link className="text-brand-700 underline" href="/login?next=/work/setup">로그인</Link>한 뒤 이 화면으로 돌아오세요.</p>;
  else body = <SetupForm />;
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm space-y-5">
        <Brand />
        <h1 className="text-lg font-bold">처음 설정 — 대표 계정 만들기</h1>
        {body}
      </div>
    </div>
  );
}
