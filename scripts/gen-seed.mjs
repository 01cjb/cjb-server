// lib/mock.ts 목업 데이터 → supabase/seed.sql 생성
// 사용: npm run db:seed  (Node 22.6+ 의 TypeScript 실행 기능 사용)
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const json = execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "-e",
  "import('./lib/mock.ts').then(m=>console.log(JSON.stringify({c:m.categories,b:m.brands,p:m.products,bn:m.banners})))"], { encoding: "utf8" });
const { c, b, p, bn } = JSON.parse(json);
const s = (v) => (v == null ? "null" : typeof v === "number" || typeof v === "boolean" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => `'{${a.map((x) => `"${x}"`).join(",")}}'`;

let sql = `-- 자동 생성: scripts/gen-seed.mjs (lib/mock.ts 기반)\n`;
sql += `insert into public.health_check (note) values ('hello from seed');\n\n`;
sql += `insert into public.member_grades (id, name, discount_rate, description, sort) values
  ('general','일반회원',0,'판매가 적용',1),
  ('salon','미용실회원',0,'미용실회원가 적용 (사업자 인증)',2),
  ('vip','VIP',0,'미용실회원가 + VIP 전용관',3)
on conflict (id) do nothing;\n\n`;
sql += `insert into public.categories (id, slug, name, icon, sort) overriding system value values\n` +
  c.map((x) => `  (${x.id}, ${s(x.slug)}, ${s(x.name)}, ${s(x.icon)}, ${x.sort})`).join(",\n") + `\non conflict (id) do nothing;\n\n`;
sql += `insert into public.brands (id, slug, name, sort) overriding system value values\n` +
  b.map((x) => `  (${x.id}, ${s(x.slug)}, ${s(x.name)}, ${x.sort})`).join(",\n") + `\non conflict (id) do nothing;\n\n`;
sql += `insert into public.products (id, name, brand_id, category_id, model_no, summary, consumer_price, price, salon_price, stock, badges, is_best, is_new, is_timesale, vip_only, status, created_at) overriding system value values\n` +
  p.map((x) => `  (${x.id}, ${s(x.name)}, ${s(x.brand_id)}, ${s(x.category_id)}, ${s(x.model_no)}, ${s(x.summary)}, ${s(x.consumer_price)}, ${x.price}, ${s(x.salon_price)}, ${x.stock}, ${arr(x.badges)}, ${x.is_best}, ${x.is_new}, ${x.is_timesale}, ${x.vip_only}, ${s(x.status)}, ${s(x.created_at)})`).join(",\n") +
  `\non conflict (id) do nothing;\n\n`;
sql += `insert into public.banners (id, title, subtitle, link, bg_color, sort) overriding system value values\n` +
  bn.map((x) => `  (${x.id}, ${s(x.title)}, ${s(x.subtitle)}, ${s(x.link)}, ${s(x.bg_color)}, ${x.sort})`).join(",\n") + `\non conflict (id) do nothing;\n\n`;
for (const t of ["categories", "brands", "products", "banners"])
  sql += `select setval(pg_get_serial_sequence('public.${t}','id'), (select max(id) from public.${t}));\n`;

writeFileSync("supabase/seed.sql", sql);
console.log("supabase/seed.sql 생성 완료");
