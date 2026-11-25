import "server-only";
import type { WorkMe } from "./auth";
import { teamLabel } from "./menus";
import { DIRECTIVE_STATUS, listDirectives, listDocs, myBoxes } from "./docs";
import { CHANNELS, STATUS_LABEL, unifiedOrders } from "@/lib/channels/orders";
import { MINI_KNOWLEDGE } from "./mini-knowledge";
import { PM_STATUS, SETTLE_PREFIX, SKIP_PREFIX, listPm, skipSettle, todaySlots, unskipSettle } from "./pm";

// 업무 시스템 AI 비서 「미니」
// 원칙: 고객 개인정보(이름·연락처·주소)는 AI로 보내지 않습니다. 건수·상품명·제목 같은 업무 정보만 보냅니다.

export const MINI_NAME = "미니";
const API = "https://api.anthropic.com/v1";
const HEAD = (key: string) => ({ "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" });
const kst = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString();
const dayOf = (iso: string) => (iso ? kst(new Date(iso)).slice(0, 10) : "");

// 사용할 모델: 환경변수 CLAUDE_MODEL이 있으면 그것, 없으면 계정에서 쓸 수 있는 모델 중 가장 가벼운 것(haiku → sonnet)
let cachedModel: { id: string; at: number } | null = null;
async function pickModel(key: string): Promise<string> {
  if (process.env.CLAUDE_MODEL) return process.env.CLAUDE_MODEL;
  if (cachedModel && Date.now() - cachedModel.at < 6 * 3600e3) return cachedModel.id;
  const r = await fetch(`${API}/models?limit=100`, { headers: HEAD(key), cache: "no-store" });
  if (!r.ok) throw new Error(`모델 목록을 가져오지 못했습니다 (${r.status})`);
  const ids: string[] = ((await r.json()).data ?? []).map((m: { id: string }) => m.id); // 최신순
  const id = ids.find((i) => /haiku/i.test(i)) ?? ids.find((i) => /sonnet/i.test(i)) ?? ids[0];
  if (!id) throw new Error("사용할 수 있는 모델이 없습니다.");
  cachedModel = { id, at: Date.now() };
  return id;
}

// 오늘 업무 현황 (개인정보 제외)
export async function workContext(me: WorkMe): Promise<string> {
  const today = kst().slice(0, 10);
  const out: string[] = [`오늘 날짜: ${today} (한국 시간 ${kst().slice(11, 16)})`, `질문한 직원: ${me.name} (${me.is_owner ? "대표" : teamLabel(me.team)}${me.position ? ` · ${me.position}` : ""})`];
  const can = (k: string) => me.is_owner || me.menus.includes(k);
  if (can("orders") || can("waybill") || can("shipping")) {
    try {
      const all = await unifiedOrders();
      const t = all.filter((o) => dayOf(o.orderedAt) === today);
      const by = (list: typeof all, f: (o: (typeof all)[number]) => string) => Object.entries(list.reduce<Record<string, number>>((a, o) => ((a[f(o)] = (a[f(o)] ?? 0) + 1), a), {})).map(([k, n]) => `${k} ${n}건`).join(", ") || "없음";
      const wait = all.filter((o) => ["paid", "preparing"].includes(o.status) && !o.tracking?.some((x) => x.no));
      const items: Record<string, number> = {};
      for (const o of t) for (const i of o.items) items[i.name.slice(0, 40)] = (items[i.name.slice(0, 40)] ?? 0) + (i.qty || 1);
      const top = Object.entries(items).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k} ${n}개`).join(" / ");
      out.push(`[주문] 오늘 주문 ${t.length}건 — 채널별: ${by(t, (o) => CHANNELS[o.channel] ?? o.channel)} — 상태별: ${by(t, (o) => STATUS_LABEL[o.status] ?? o.status)}`);
      out.push(`[송장] 송장번호가 아직 없는 출고 대기 주문 ${wait.length}건 (오늘 주문분 ${wait.filter((o) => dayOf(o.orderedAt) === today).length}건)`);
      if (top) out.push(`[오늘 많이 나간 상품] ${top}`);
    } catch { out.push("[주문] 주문 정보를 불러오지 못했습니다."); }
  } else out.push("[주문] 이 직원은 주문·송장 메뉴 권한이 없어 주문 현황을 알려 줄 수 없습니다.");
  if (can("docs")) {
    try {
      const dirs = await listDirectives(me);
      const open = dirs.filter((d) => d.status !== "done");
      out.push(`[지시함] 진행 중 ${open.length}건 / 전체 ${dirs.length}건`);
      for (const d of open.slice(0, 12)) out.push(`- (${DIRECTIVE_STATUS[d.status]}) ${d.title} · ${d.from_name ?? "-"} → ${d.to_name ?? (d.to_team === "all" ? "전체" : teamLabel(d.to_team))}${d.due_date ? ` · 기한 ${d.due_date}` : ""}`);
      const done = dirs.filter((d) => d.status === "done" && d.done_at && dayOf(d.done_at) === today);
      if (done.length) out.push(`[오늘 완료된 지시] ${done.map((d) => d.title).join(" / ")}`);
      const docs = (await Promise.all(myBoxes(me).map((b) => listDocs(me, b.key).then((l) => l.filter((x) => dayOf(x.created_at) === today).map((x) => `${b.label}: ${x.title}`))))).flat();
      out.push(`[서류 보관함] 오늘 올라온 서류 ${docs.length}건${docs.length ? ` — ${docs.slice(0, 8).join(" / ")}` : ""}`);
    } catch { out.push("[지시함·서류] 정보를 불러오지 못했습니다."); }
  }
  if (canSettle(me)) {
    try {
      const slots = todaySlots();
      out.push(`[자동 정산] 오늘 예정 시각: ${slots.length ? slots.join(", ") : "없음(주말)"} — 시간표: 월요일 09:30·15:00, 화~금 15:00`);
      const pm = (await listPm({ days: 2 })).filter((r) => r.title.startsWith(SETTLE_PREFIX) || r.title.startsWith(SKIP_PREFIX));
      for (const r of pm.slice(0, 8)) out.push(`- 번호 ${r.id} · ${r.title} · ${PM_STATUS[r.status] ?? r.status} · ${r.requested_by ?? "-"}${r.result ? ` · 결과: ${r.result.slice(0, 300)}` : ""}`);
      if (!pm.length) out.push("- 최근 이틀간 정산 기록·건너뛰기 표시 없음");
    } catch { out.push("[자동 정산] 정보를 불러오지 못했습니다."); }
  }
  return out.join("\n");
}

const canSettle = (me: WorkMe) => me.is_owner || me.menus.includes("orders") || me.menus.includes("waybill");

// 미니가 쓸 수 있는 도구: 오늘 자동 정산 회차 건너뛰기·되돌리기 (PM 지시함에 표시만 함. 실제 정산은 Claude가 진행)
const TOOLS = [
  { name: "skip_settlement", description: "오늘 자동 정산 중 한 회차를 건너뛰게 한다. 직원이 어느 시각 회차인지 분명히 말했을 때만 쓴다. 모호하면 먼저 묻는다.", input_schema: { type: "object", properties: { time: { type: "string", description: "건너뛸 회차 시각 HH:MM. [자동 정산]의 오늘 예정 시각 중 하나" }, note: { type: "string", description: "이유 등 메모. 고객 이름·연락처·주소는 넣지 않는다" } }, required: ["time"] } },
  { name: "undo_skip", description: "건너뛰기 표시를 취소해 그 회차를 다시 정산하게 한다. [자동 정산] 목록의 번호를 쓴다.", input_schema: { type: "object", properties: { id: { type: "number", description: "건너뛰기 표시의 번호" } }, required: ["id"] } },
];
async function runTool(me: WorkMe, name: string, input: Record<string, unknown>): Promise<string> {
  if (name === "skip_settlement") {
    const r = await skipSettle(me, { time: String(input.time ?? ""), note: String(input.note ?? "") });
    return r.ok ? `${r.already ? "이미 건너뛰기로 표시되어 있습니다" : "건너뛰기로 표시했습니다"}: ${r.title} (번호 ${r.id}). Claude가 그 회차는 정산하지 않습니다.` : `실패: ${r.error}`;
  }
  if (name === "undo_skip") { const r = await unskipSettle(me, Number(input.id)); return r.ok ? "건너뛰기를 취소했습니다. 그 회차는 예정대로 정산합니다." : `실패: ${r.error}`; }
  return "알 수 없는 요청입니다.";
}

const SYSTEM = (ctx: string) => `당신은 (주)씨제이비인터내셔널 사내 업무 시스템의 AI 비서 「${MINI_NAME}」입니다.
- 직원의 질문에 한국어 존댓말로, 짧고 분명하게 답합니다. 음성으로도 읽히므로 표·기호·마크다운을 쓰지 말고 문장으로 말합니다. 보통 2~5문장, 업무 보고는 항목별로 한 줄씩.
- 숫자와 현황은 아래 [현재 업무 현황]에 있는 사실만, 일하는 방법은 [업무 지식]에 있는 내용만 근거로 답합니다. 거기 없는 숫자나 사실은 지어내지 말고 "지금 제가 볼 수 있는 정보에는 없습니다"라고 말합니다.
- 주문 취합·정산을 지금 해 달라는 요청에는, 미니가 직접 실행하지는 못하며 Claude가 정해진 시각에 자동으로 진행한다고 말하고 오늘 예정 시각을 알려 줍니다. 그 시각 밖에 당장 필요하면 대표님이 Claude 대화창에 "정산시작해줘"라고 하도록 안내합니다. 방법을 물으면 [업무 지식]의 절차를 순서대로 짧게 안내합니다.
- 고객의 이름·연락처·주소 같은 개인정보는 가지고 있지 않으며, 물어도 알려 줄 수 없다고 안내합니다.
- 당신은 정보를 읽고 정리해 줄 뿐, 주문·송장·지시를 직접 바꾸지는 못합니다. 그런 요청은 해당 메뉴에서 하도록 안내합니다. 단 하나 예외로, 오늘 자동 정산 회차를 건너뛰게 하거나 되돌리는 것은 도구로 할 수 있습니다.
- 자동 정산: 정산은 Claude가 [자동 정산] 시간표대로 알아서 진행합니다. 직원이 "오늘 3시 정산 하지 마"처럼 말하면 skip_settlement 도구로 표시합니다. 정산 진행 상황을 물으면 [자동 정산]의 기록과 결과를 그대로 알려 줍니다. 기록이 없으면 아직 진행 기록이 없다고 말합니다.
- 업무와 관계없는 가벼운 질문에도 친절히 짧게 답합니다.

[업무 지식]
${MINI_KNOWLEDGE}

[현재 업무 현황]
${ctx}`;

// 답 한 번의 최대 길이. 모델이 답을 쓰기 전에 생각하는 분량도 여기에 포함되므로 넉넉히 둠(700일 때 답이 중간에 끊기거나 비어서 나옴)
const MAX_TOKENS = 4096;

export type MiniMsg = { role: "user" | "assistant"; content: string };

export async function askMini(me: WorkMe, history: MiniMsg[]): Promise<{ ok: true; text: string } | { ok: false; error: string; status: number }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "미니가 아직 연결되지 않았습니다. (API 키 미등록)", status: 503 };
  const msgs = history.filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12).map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return { ok: false, error: "질문을 입력하세요.", status: 400 };
  try {
    const [model, ctx] = await Promise.all([pickModel(key), workContext(me)]);
    const system = SYSTEM(ctx), tools = canSettle(me) ? TOOLS : undefined;
    type Block = { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> };
    const convo: { role: string; content: unknown }[] = [...msgs];
    let j: { content?: Block[]; stop_reason?: string; error?: { type?: string; message?: string } } = {};
    for (let step = 0; step < 3; step++) {
      const r = await fetch(`${API}/messages`, { method: "POST", headers: HEAD(key), body: JSON.stringify({ model, max_tokens: MAX_TOKENS, system, messages: convo, ...(tools ? { tools } : {}) }) });
      j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const t = j?.error?.type as string | undefined;
        if (r.status === 429) return { ok: false, error: "지금 요청이 많습니다. 잠시 뒤 다시 물어봐 주세요.", status: 429 };
        if (t === "billing_error" || /credit|balance/i.test(j?.error?.message ?? "")) return { ok: false, error: "이번 달 AI 사용 한도를 다 썼습니다. 다음 달에 다시 쓸 수 있습니다.", status: 402 };
        if (r.status === 401) return { ok: false, error: "AI 연결 키가 올바르지 않습니다. 관리자에게 알려 주세요.", status: 502 };
        return { ok: false, error: "미니가 답하지 못했습니다. 잠시 뒤 다시 시도해 주세요.", status: 502 };
      }
      const uses = (j.content ?? []).filter((c) => c.type === "tool_use");
      if (j.stop_reason !== "tool_use" || !uses.length) break;
      const results = [];
      for (const u of uses) results.push({ type: "tool_result", tool_use_id: u.id, content: await runTool(me, u.name ?? "", u.input ?? {}) });
      convo.push({ role: "assistant", content: j.content }, { role: "user", content: results });
    }
    const body = (j.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("").trim();
    if (!body) return { ok: true, text: "답을 만들지 못했습니다. 다시 물어봐 주세요." };
    // 그래도 길이 한도에 걸려 끊겼으면 끊긴 사실을 알림
    const cut = j.stop_reason === "max_tokens";
    return { ok: true, text: cut ? `${body}\n\n(답이 길어 여기까지만 나왔습니다. "계속"이라고 하면 이어서 말씀드립니다.)` : body };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "미니 연결에 실패했습니다.", status: 502 };
  }
}
