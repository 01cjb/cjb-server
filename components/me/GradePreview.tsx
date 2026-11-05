"use client";
import { useStore } from "@/components/Store";
const grades = [{ id: "general", name: "일반회원" }, { id: "salon", name: "미용실회원" }, { id: "vip", name: "VIP" }] as const;
export default function GradePreview() {
  const { grade, setGrade } = useStore();
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 p-4">
      <p className="text-sm font-semibold">목업 전용: 회원등급별 가격 미리보기</p>
      <p className="text-xs text-neutral-500 mt-1">DB 연결 후에는 관리자가 정한 등급이 자동 적용되고 이 버튼은 사라집니다.</p>
      <div className="flex gap-2 mt-3">{grades.map((x) => <button key={x.id} onClick={() => setGrade(x.id)} className={`flex-1 rounded-lg py-2 text-sm border ${grade === x.id ? "bg-brand-600 text-white border-brand-600" : "border-neutral-300"}`}>{x.name}</button>)}</div>
    </div>
  );
}
