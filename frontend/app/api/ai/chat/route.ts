import { NextRequest, NextResponse } from "next/server";
import { resolveAiServiceBase } from "@/lib/server/aiServiceUrl";

/** Proxies authenticated AI chat to backend/ai (browser → /api/ai/chat → AI_SERVICE_URL). */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "missing authorization token" },
      { status: 401 },
    );
  }

  const upstreamBase = resolveAiServiceBase();
  const upstreamUrl = `${upstreamBase}/v1/ai/chat`;

  try {
    const res = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type":
          res.headers.get("content-type") ?? "application/json; charset=utf-8",
      },
    });
  } catch (err) {
    const hint =
      process.env.AI_SERVICE_URL?.trim()
        ? "AI_SERVICE_URL is set but the frontend container cannot reach ai-service (private network / port / service name)."
        : "Set AI_SERVICE_URL on the frontend Railway service, e.g. http://ai-service.railway.internal:50070";

    console.error("[api/ai/chat] upstream failed:", upstreamUrl, err);

    return NextResponse.json(
      {
        error: "Cannot reach AI service.",
        hint,
      },
      { status: 502 },
    );
  }
}
