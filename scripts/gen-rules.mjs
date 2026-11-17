// 운영규칙 기준문서용: DB 마이그레이션(supabase/migrations)을 읽어 표·상태값·자동처리·변경이력을 뽑는다.
// `npm run build` 때마다 자동 실행 → DB 구조가 바뀌면 문서(/admin/rules)도 같이 바뀐다.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dir = "supabase/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const tables = {};      // 표 이름 → 처음 만든 파일
const checks = {};      // "표.칸" → 허용 값 목록 (나중 파일이 덮어씀)
const triggers = [];    // 자동 처리
const migrations = [];

for (const f of files) {
  const sql = readFileSync(join(dir, f), "utf8");
  const m = f.match(/^(\d{4})(\d{2})(\d{2})\d*_(.+)\.sql$/);
  const added = [];
  // 위치별로 "지금 다루는 표"를 추적
  const marks = [...sql.matchAll(/(?:create table(?: if not exists)?|alter table(?: if exists)?)\s+public\.(\w+)/gi)].map((x) => ({ at: x.index, table: x[1], create: /^create/i.test(x[0]) }));
  for (const mk of marks) if (mk.create && !tables[mk.table]) { tables[mk.table] = f; added.push(mk.table); }
  const tableAt = (i) => { let t = null; for (const mk of marks) { if (mk.at <= i) t = mk.table; else break; } return t; };
  for (const c of sql.matchAll(/check\s*\(\s*(\w+)\s+in\s*\(([^)]*)\)\s*\)/gi)) {
    const t = tableAt(c.index); if (!t) continue;
    checks[`${t}.${c[1]}`] = [...c[2].matchAll(/'([^']*)'/g)].map((x) => x[1]);
  }
  for (const t of sql.matchAll(/create trigger\s+(\w+)\s+(before|after)\s+([\w\s,]+?)\s+on\s+(?:public|auth)\.(\w+)/gi))
    if (!triggers.some((x) => x.name === t[1])) triggers.push({ name: t[1], when: `${t[2]} ${t[3].trim().replace(/\s+/g, " ")}`.toLowerCase(), table: t[4], file: f });
  migrations.push({ file: f, date: m ? `${m[1]}-${m[2]}-${m[3]}` : "", name: m ? m[4] : f, tables: added });
}

const out = { tables: Object.keys(tables).sort(), checks, triggers, migrations };
mkdirSync("lib/generated", { recursive: true });
const next = JSON.stringify(out, null, 2) + "\n";
let prev = ""; try { prev = readFileSync("lib/generated/schema.json", "utf8"); } catch {}
if (prev !== next) writeFileSync("lib/generated/schema.json", next);
console.log(`[gen-rules] 표 ${out.tables.length}개 · 상태값 ${Object.keys(checks).length}종 · 자동처리 ${triggers.length}개 · 변경 ${migrations.length}건${prev === next ? " (변경 없음)" : " (갱신)"}`);
