import "server-only";
import ExcelJS from "exceljs";
import { adminEnabled, createServiceClient } from "@/lib/auth";
import { mockChannelRows } from "@/lib/channels/orders";

// 뷰카(b2b.vuka.co.kr) 주문 엑셀 올리기 — 뷰카는 API가 없어 엑셀로 받음
// 「주문현황」·「배송(준비)중」 엑셀출력 파일을 그대로 올리면 됨. 한 주문의 여러 상품 줄은 주문번호로 묶음
// 송장번호가 있거나 상태가 배송중/배송완료면 출고 목록에서 빠지도록 배송 상태로 저장

const cellText = (v: ExcelJS.CellValue): string => {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("text" in v) return String(v.text);
    if ("result" in v) return String(v.result ?? "");
    if (v instanceof Date) return new Date(v.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
  }
  return String(v);
};
const num = (s: string) => Number(s.replace(/[^\d.-]/g, "")) || 0;
const norm = (s: string) => s.replace(/[\s()\[\]]/g, "");

export type VukaResult = { total: number; orders: number; pending: number; shipped: number; skipped: number; errors: string[] };

export async function importVuka(buf: ArrayBuffer, fallbackDate: string): Promise<VukaResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fallbackDate)) throw new Error("날짜 형식이 올바르지 않습니다.");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("엑셀에 시트가 없습니다.");

  // 머리글 줄 찾기 (위쪽 10줄 안에서 '주문번호'와 '상품명'이 있는 줄)
  let headRow = 0;
  const head: Record<string, number> = {};
  for (let i = 1; i <= Math.min(10, ws.rowCount) && !headRow; i++) {
    const cells: Record<string, number> = {};
    ws.getRow(i).eachCell((c, col) => { const t = norm(cellText(c.value)); if (t && !(t in cells)) cells[t] = col; });
    if (Object.keys(cells).some((k) => k.startsWith("주문번호")) && Object.keys(cells).some((k) => k.startsWith("상품명"))) { headRow = i; Object.assign(head, cells); }
  }
  if (!headRow) throw new Error("뷰카 주문 엑셀이 아닙니다. (주문번호·상품명 칸이 필요합니다)");
  const col = (...names: string[]) => { for (const n of names) { const k = Object.keys(head).find((h) => h.startsWith(n)); if (k) return head[k]; } return 0; };
  const C = {
    no: col("주문번호"), item: col("상품명"), qty: col("수량"), amount: col("주문금액", "금액"), shop: col("매장명", "매장"),
    name: col("받는분", "수취인", "주문자"), tel: col("연락처", "휴대폰", "전화"), addr: col("배송지주소", "주소"), zip: col("우편번호"),
    day: col("주문일"), status: col("주문상태", "상태"), slip: col("송장번호", "운송장"), carrier: col("택배사"), msg: col("배송메세지", "배송메시지", "요청사항"),
  };
  const miss = (["no", "item", "name", "addr"] as const).filter((k) => !C[k]);
  if (miss.length) throw new Error("뷰카 엑셀에 받는분·배송지주소 칸이 없습니다. 「배송(준비)중」 또는 「주문현황」에서 엑셀출력한 파일을 올려주세요.");
  const get = (r: ExcelJS.Row, c: number) => (c ? cellText(r.getCell(c).value).replace(/\s+/g, " ").trim() : "");

  type O = { no: string; day: string; shop: string; name: string; tel: string; addr: string; zip: string; msg: string; status: string; slip: string; carrier: string; amount: number; items: { name: string; qty: number; price: number }[] };
  const map = new Map<string, O>();
  let lines = 0, skipped = 0;
  const errors: string[] = [];
  ws.eachRow((r, i) => {
    if (i <= headRow) return;
    const no = get(r, C.no).replace(/\.0$/, "");
    if (!no) { if (get(r, C.item)) { skipped++; errors.push(`${i}행: 주문번호 없음`); } return; }
    lines++;
    const statusText = get(r, C.status);
    const slip = (get(r, C.slip) || (statusText.match(/\d{10,13}/)?.[0] ?? "")).replace(/\D/g, "");
    const o = map.get(no) ?? {
      no, day: get(r, C.day).slice(0, 10), shop: get(r, C.shop), name: get(r, C.name), tel: get(r, C.tel), addr: get(r, C.addr),
      zip: get(r, C.zip).replace(/\D/g, ""), msg: get(r, C.msg), status: statusText, slip, carrier: get(r, C.carrier), amount: 0, items: [],
    };
    const amt = num(get(r, C.amount));
    o.amount += amt;
    o.slip ||= slip;
    o.items.push({ name: get(r, C.item), qty: num(get(r, C.qty)) || 1, price: amt });
    map.set(no, o);
  });

  const rows = [...map.values()].map((o) => {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(o.day) ? o.day : fallbackDate;
    const done = /완료/.test(o.status) && /배송/.test(o.status);
    const shipped = !!o.slip || /배송중|출고/.test(o.status) || done;
    const status = /취소/.test(o.status) ? "cancelled" : /반품/.test(o.status) ? "returned" : /교환/.test(o.status) ? "exchanged" : done ? "delivered" : shipped ? "shipped" : "preparing";
    const carrier = o.carrier || (o.slip ? "로젠택배" : null);
    return {
      channel: "vuka", external_order_id: o.no, order_place: o.shop ? `뷰카 · ${o.shop}` : "뷰카", ordered_at: new Date(`${day}T12:00:00+09:00`).toISOString(),
      paid: true, canceled: status === "cancelled", status, status_code: o.status.split(/\s|송장/)[0] || null,
      buyer_name: o.shop || o.name, receiver_name: o.name, receiver_phone: o.tel, zipcode: o.zip || null, address: o.addr, shipping_message: o.msg || null,
      total_amount: o.amount, items: o.items.map((it) => ({ name: it.name, qty: it.qty, price: it.price, ...(o.slip ? { carrier, tracking_no: o.slip, status_text: "배송중" } : {}) })),
      raw: { source: "vuka-excel", shop: o.shop }, synced_at: new Date().toISOString(),
    };
  });

  if (!adminEnabled()) {
    const mem = mockChannelRows();
    for (const r of rows) {
      const i = mem.findIndex((m) => m.channel === "vuka" && m.external_order_id === r.external_order_id);
      const row = { id: -5000 - (i >= 0 ? i : mem.length), ...r } as unknown as (typeof mem)[number];
      if (i >= 0) mem[i] = row; else mem.push(row);
    }
  } else if (rows.length) {
    const { error } = await createServiceClient().from("channel_orders").upsert(rows, { onConflict: "channel,external_order_id" });
    if (error) throw new Error("저장 실패: " + error.message);
  }
  const pending = rows.filter((r) => r.status === "preparing").length;
  return { total: lines, orders: rows.length, pending, shipped: rows.length - pending, skipped, errors: errors.slice(0, 10) };
}
