// Supabase Edge Function 예시 — 배포: supabase functions deploy hello
Deno.serve(() => new Response(JSON.stringify({ ok: true, from: "cjb edge" }), {
  headers: { "content-type": "application/json" },
}));
