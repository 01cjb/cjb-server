import { buildRulesMd } from "@/lib/rules";
import { H1 } from "@/components/admin/Table";

export const dynamic = "force-dynamic";

// 간단한 Markdown 표시 (제목·표·목록·인용·굵게) — 문서 내용은 lib/rules.ts 가 자동으로 만든다
const inline = (s: string, k: string | number) => {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return <span key={k}>{parts.map((p, i) => (p.startsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p))}</span>;
};
const cells = (row: string) => row.replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));

function render(md: string) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) continue;
    if (l.startsWith("# ")) continue; // 큰 제목은 화면 제목으로 대신
    if (l.startsWith("## ")) { out.push(<h2 key={i} className="mt-8 mb-3 border-b border-neutral-200 pb-2 text-lg font-bold">{l.slice(3)}</h2>); continue; }
    if (l.startsWith("---")) { out.push(<hr key={i} className="my-6 border-neutral-200" />); continue; }
    if (l.startsWith(">")) {
      const q: string[] = []; while (i < lines.length && lines[i].startsWith(">")) q.push(lines[i++].replace(/^>\s?/, "")); i--;
      out.push(<div key={i} className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm leading-relaxed text-neutral-700">{q.filter(Boolean).map((x, j) => <p key={j}>{inline(x.replace(/^- /, "· "), j)}</p>)}</div>); continue;
    }
    if (l.startsWith("|")) {
      const rows: string[] = []; while (i < lines.length && lines[i].startsWith("|")) rows.push(lines[i++]); i--;
      const [head, , ...body] = rows;
      out.push(
        <div key={i} className="my-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500"><tr>{cells(head).map((c, j) => <th key={j} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>)}</tr></thead>
            <tbody>{body.map((r, j) => <tr key={j} className="border-t border-neutral-100">{cells(r).map((c, k) => <td key={k} className="px-3 py-2 align-top">{inline(c, k)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ); continue;
    }
    if (/^(- |\d+\. )/.test(l)) {
      const items: string[] = []; const ordered = /^\d+\. /.test(l);
      while (i < lines.length && /^(- |\d+\. )/.test(lines[i])) items.push(lines[i++].replace(/^(- |\d+\. )/, "")); i--;
      const cls = "my-2 space-y-1.5 pl-5 text-sm leading-relaxed";
      out.push(ordered ? <ol key={i} className={`${cls} list-decimal`}>{items.map((x, j) => <li key={j}>{inline(x, j)}</li>)}</ol> : <ul key={i} className={`${cls} list-disc`}>{items.map((x, j) => <li key={j}>{inline(x, j)}</li>)}</ul>); continue;
    }
    out.push(<p key={i} className="my-2 text-sm leading-relaxed">{inline(l, i)}</p>);
  }
  return out;
}

export default async function Rules() {
  const md = await buildRulesMd();
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <H1>운영규칙 기준문서</H1>
        <a href="/api/admin/rules?download=1" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">MD 파일로 내려받기</a>
      </div>
      <div className="max-w-4xl">{render(md)}</div>
    </>
  );
}
