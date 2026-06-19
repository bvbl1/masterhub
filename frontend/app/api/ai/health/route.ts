import { NextResponse } from "next/server";
import { resolveAiServiceBase } from "@/lib/server/aiServiceUrl";

/** Debug: verify AI_SERVICE_URL from the running frontend container (no auth). */
export async function GET() {
  const base = resolveAiServiceBase();
  try {
    const res = await fetch(`${base}/health`, {
      cache: "no-store",
    }).catch(() => null);

    return NextResponse.json({
      aiServiceBase: base,
      envSet: Boolean(process.env.AI_SERVICE_URL?.trim()),
      reachable: res != null,
      note: "Browser should call POST /api/ai/chat on this frontend; not ai-service directly.",
    });
  } catch {
    return NextResponse.json({
      aiServiceBase: base,
      envSet: Boolean(process.env.AI_SERVICE_URL?.trim()),
      reachable: false,
    });
  }
}
