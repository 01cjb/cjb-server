import { redirect } from "next/navigation";
import Brand from "@/components/work/Brand";
import LoginForm from "@/components/work/LoginForm";
import { getWorkMe, workLive } from "@/lib/work/auth";
import { DEMO_LOGIN } from "@/lib/work/mock";

export const dynamic = "force-dynamic";
export const metadata = { title: "로그인" };

const safeNext = (n?: string) => (n && n.startsWith("/work") && !n.startsWith("//") ? n : "/work");

export default async function WorkLogin({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getWorkMe()) redirect(safeNext(next));
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-brand-200/50 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 size-[28rem] rounded-full bg-indigo-200/50 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-6"><Brand /></div>
        <LoginForm next={safeNext(next)} demo={workLive() ? undefined : DEMO_LOGIN} />
      </div>
    </div>
  );
}
