export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`grid place-items-center rounded-xl bg-brand-600 text-white font-bold ${compact ? "size-8 text-sm" : "size-11 text-base"}`}>CJB</span>
      {compact && <span className="text-sm font-bold text-brand-700">업무 시스템</span>}
      {!compact && (
        <span className="leading-tight">
          <span className="block text-lg font-bold text-brand-700">CJB 업무 시스템</span>
          <span className="block text-[11px] text-neutral-500">(주)씨제이비인터내셔널 사내 전용</span>
        </span>
      )}
    </span>
  );
}
