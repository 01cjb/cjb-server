"use client";
import { useEffect, useState } from "react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "bw.install.hide";

// 쇼핑몰 앱 설치 안내: 안드로이드·PC 크롬은 바로 설치, 아이폰은 방법 안내. 앱으로 열었거나 닫으면 숨김
export default function ShopInstall() {
  const [evt, setEvt] = useState<BIP | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    let hidden = false;
    try { hidden = localStorage.getItem(KEY) === "1"; } catch { /* 무시 */ }
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    if (!standalone && !hidden && isIos) setShow(true);
    const on = (e: Event) => { e.preventDefault(); setEvt(e as BIP); if (!standalone && !hidden) setShow(true); };
    const done = () => { setShow(false); setEvt(null); };
    window.addEventListener("beforeinstallprompt", on);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", on); window.removeEventListener("appinstalled", done); };
  }, []);

  if (!show) return null;
  const close = () => { setShow(false); try { localStorage.setItem(KEY, "1"); } catch { /* 무시 */ } };
  const install = async () => {
    if (evt) { await evt.prompt(); const c = await evt.userChoice; if (c.outcome === "accepted") setShow(false); setEvt(null); return; }
    setHelp((v) => !v);
  };
  return (
    <div className="rounded-[20px] border border-[#ece6f1] bg-white p-3.5">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/app-icon/192" alt="" className="size-12 shrink-0 rounded-[14px] shadow-[0_6px_14px_-8px_rgba(59,29,90,.5)]" />
        <div className="min-w-0 flex-1">
          <b className="block text-[14px] text-[#2a1840]">뷰티웰 앱으로 쓰기</b>
          <p className="text-[12px] text-neutral-500">홈 화면에 추가하면 앱처럼 바로 열려요</p>
        </div>
        <button onClick={install} className="shrink-0 rounded-xl bg-plum px-3 py-2 text-[12px] font-bold text-white">{ios ? "방법 보기" : "설치"}</button>
        <button onClick={close} aria-label="닫기" className="shrink-0 px-1 text-lg leading-none text-neutral-400">×</button>
      </div>
      {help && ios && (
        <p className="mt-2.5 rounded-xl bg-[#f6f2f9] px-3 py-2 text-[12px] leading-relaxed text-[#5d5368]">사파리 아래쪽 <b>공유</b> 버튼(네모에 위쪽 화살표) → <b>홈 화면에 추가</b> → <b>추가</b>를 누르면 돼요.</p>
      )}
    </div>
  );
}
