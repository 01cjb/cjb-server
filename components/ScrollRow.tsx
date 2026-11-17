"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// 가로 스크롤 줄: 휴대폰은 손가락으로, PC는 마우스 드래그·휠·좌우 화살표로 넘김
export default function ScrollRow({ className = "", children, tone = "light", arrowClass = "" }: { className?: string; children: React.ReactNode; tone?: "light" | "dark"; arrowClass?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ l: false, r: false });
  const drag = useRef({ on: false, x: 0, s: 0, moved: false });

  const update = useCallback(() => {
    const el = ref.current; if (!el) return;
    setEdge({ l: el.scrollLeft > 4, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    update();
    const ro = new ResizeObserver(update); ro.observe(el);
    const wheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max)) return; // 끝이면 페이지 스크롤
      e.preventDefault(); el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => { ro.disconnect(); el.removeEventListener("wheel", wheel); };
  }, [update]);

  const go = (dir: number) => { const el = ref.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" }); };

  const down = (e: React.PointerEvent) => { if (e.pointerType !== "mouse") return; drag.current = { on: true, x: e.clientX, s: ref.current!.scrollLeft, moved: false }; };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d.on) return;
    const dx = e.clientX - d.x; if (Math.abs(dx) > 5) d.moved = true;
    if (d.moved) ref.current!.scrollLeft = d.s - dx;
  };
  const up = () => { drag.current.on = false; };
  const click = (e: React.MouseEvent) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; } };

  const btn = tone === "dark"
    ? "bg-plum-2 text-white ring-1 ring-white/25"
    : "bg-white text-neutral-700 border border-neutral-200 shadow-md";
  return (
    <div className="relative min-w-0">
      <div ref={ref} onScroll={update} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onClickCapture={click} onDragStart={(e) => e.preventDefault()}
        className={`overflow-x-auto no-scrollbar select-none ${className}`}>
        {children}
      </div>
      {edge.l && <button type="button" aria-label="이전" onClick={() => go(-1)} className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 size-7 rounded-full grid place-items-center text-sm ${btn} ${arrowClass}`}>‹</button>}
      {edge.r && <button type="button" aria-label="다음" onClick={() => go(1)} className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 size-7 rounded-full grid place-items-center text-sm ${btn} ${arrowClass}`}>›</button>}
    </div>
  );
}
