// 실제 이미지가 없을 때 쓰는 목업 썸네일 (Supabase Storage 이미지로 교체 예정)
const palettes = ["from-brand-100 to-brand-200", "from-pink-100 to-rose-200", "from-sky-100 to-indigo-200", "from-amber-100 to-orange-200", "from-emerald-100 to-teal-200"];

export default function ProductThumb({ id, src, label, icon, className = "" }: { id: number; src?: string | null; label?: string; icon?: string; className?: string }) {
  if (src) return <img src={src} alt={label ?? ""} className={`w-full h-full object-cover ${className}`} />;
  return (
    <div className={`w-full h-full bg-gradient-to-br ${palettes[id % palettes.length]} grid place-items-center ${className}`}>
      <div className="text-center">
        <div className="text-4xl">{icon ?? "🛍️"}</div>
        {label && <div className="mt-2 text-[11px] font-semibold text-neutral-600 px-2">{label}</div>}
      </div>
    </div>
  );
}
