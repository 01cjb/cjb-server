"use client";
import { useState } from "react";
import type { Carrier } from "@/lib/admin/types";
import { Msg, useApi } from "./Act";

export function ShipForm({ orderId, carriers }: { orderId: number; carriers: Carrier[] }) {
  const { call, msg, busy } = useApi();
  const [c, setC] = useState(carriers[0]?.code ?? ""); const [no, setNo] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); call(`/api/admin/orders/${orderId}/shipments`, "POST", { carrier_code: c, tracking_no: no }); }} className="flex flex-wrap items-end gap-2">
      <select value={c} onChange={(e) => setC(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">{carriers.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}</select>
      <input value={no} onChange={(e) => setNo(e.target.value)} placeholder="송장번호" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-44" />
      <button disabled={busy} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm disabled:opacity-50">송장 등록</button>
      <Msg m={msg} />
    </form>
  );
}

const ST = [["picked_up", "집화"], ["in_transit", "이동중"], ["out_for_delivery", "배송출발"], ["delivered", "배송완료"], ["returned", "반송"], ["failed", "배송실패"]];
export function ShipStatusForm({ id }: { id: number }) {
  const { call, msg, busy } = useApi();
  const [s, setS] = useState("in_transit"); const [loc, setLoc] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); call(`/api/admin/shipments/${id}`, "PATCH", { status: s, location: loc, description: ST.find((x) => x[0] === s)?.[1] }); }} className="flex flex-wrap items-end gap-2 mt-2">
      <select value={s} onChange={(e) => setS(e.target.value)} className="rounded border border-neutral-300 px-2 py-1 text-xs">{ST.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="위치 (선택)" className="rounded border border-neutral-300 px-2 py-1 text-xs w-32" />
      <button disabled={busy} className="rounded border border-neutral-300 px-2 py-1 text-xs">상태 기록</button><Msg m={msg} />
    </form>
  );
}
