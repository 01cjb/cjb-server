"use client";
import { useEffect, useState } from "react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// 업무 시스템 앱 설치 버튼: 크롬·엣지·안드로이드는 바로 설치, 아이폰은 방법 안내. 이미 앱으로 열려 있으면 숨김
export default function InstallApp() {
  const [evt, setEvt] = useState<BIP | null>(null);
  const [standalone, setStandalone] = useState(true);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const on = (e: Event) => { e.preventDefault(); setEvt(e as BIP); };
    const done = () => { setEvt(null); setStandalone(true); };
    window.addEventListener("beforeinstallprompt", on);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", on); window.removeEventListener("appinstalled", done); };
  }, []);

  if (standalone || (!evt && !ios)) return null;
  async function install() {
    if (evt) { await evt.prompt(); await evt.userChoice; setEvt(null); return; }
    setHelp((v) => !v);
  }
  return (
    <div className="mt-2">
      <button onClick={install} className="w-full rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100">
        📲 앱으로 설치
      </button>
      {help && ios && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">사파리 아래쪽 <b>공유</b> 버튼 → <b>홈 화면에 추가</b>를 누르세요.</p>
      )}
    </div>
  );
}
