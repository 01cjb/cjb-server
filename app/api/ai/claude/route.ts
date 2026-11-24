import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";

// 업무 시스템에 로그인한 직원만 사용 (외부에서 우리 AI 요금을 쓰지 못하게)
export async function POST(req: Request) {
  const { deny } = await requireWork();
  if (deny) return deny;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const { prompt } = await req.json().catch(() => ({ prompt: "" }));
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });
  const text = (data.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
  return NextResponse.json({ text });
}
