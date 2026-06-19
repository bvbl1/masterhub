import { resolveChatWsUrlServer } from "@/lib/chat/wsUrl";

/** Runtime WebSocket URL для чата (CHAT_WS_URL на Railway без rebuild). */
export async function GET() {
  return Response.json({ url: resolveChatWsUrlServer() });
}
