import { get, post, patch } from "./client";
import type { ChatConversationDTO, ChatMessageDTO } from "./types";

function mediaUrlFromRaw(raw: Record<string, unknown>): string | null {
  const v = raw.mediaUrl ?? raw.media_url ?? raw.MediaUrl;
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s || null;
}

/** REST только через NEXT_PUBLIC_API_URL (gateway :8080). См. README «Chat (REST via gateway)». */

function num(v: unknown, fallback = 0): number {
  if (v === undefined || v === null) return fallback;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

export function normalizeConversation(
  raw: Record<string, unknown>,
): ChatConversationDTO {
  const customerId = raw.customerId ?? raw.customer_id;
  const providerId = raw.providerId ?? raw.provider_id;
  const lastMessageAt = raw.lastMessageAt ?? raw.last_message_at;
  return {
    id: num(raw.id),
    customerId: num(customerId),
    providerId: num(providerId),
    createdAt: str(raw.createdAt ?? raw.created_at),
    lastMessageAt:
      lastMessageAt === undefined || lastMessageAt === null
        ? null
        : str(lastMessageAt),
  };
}

export function normalizeMessage(raw: Record<string, unknown>): ChatMessageDTO {
  return {
    id: num(raw.id),
    conversationId: num(raw.conversationId ?? raw.conversation_id),
    senderId: num(raw.senderId ?? raw.sender_id),
    content: str(raw.content),
    mediaUrl: mediaUrlFromRaw(raw),
    isRead: Boolean(raw.isRead ?? raw.is_read),
    createdAt: str(raw.createdAt ?? raw.created_at),
  };
}

/** POST /conversations — только пока текущий пользователь выступает как customer (бэкенд кладёт JWT user_id в customer). */
export async function getOrCreateConversation(providerId: number): Promise<{
  conversation: ChatConversationDTO;
}> {
  const res = await post<{
    conversation?: Record<string, unknown>;
  }>("/conversations", { provider_id: providerId }, { auth: true });
  const c = res.conversation;
  if (!c) throw new Error("missing conversation in response");
  return { conversation: normalizeConversation(c as Record<string, unknown>) };
}

export async function listConversations(): Promise<ChatConversationDTO[]> {
  const res = await get<{ conversations?: Record<string, unknown>[] }>(
    "/conversations",
    { auth: true },
  );
  const list = res.conversations ?? [];
  return list.map((c) => normalizeConversation(c as Record<string, unknown>));
}

export async function getMessages(
  conversationId: number,
  limit = 80,
  offset = 0,
): Promise<ChatMessageDTO[]> {
  const res = await get<{ messages?: Record<string, unknown>[] }>(
    `/conversations/${conversationId}/messages`,
    {
      auth: true,
      params: { limit, offset },
    },
  );
  const list = res.messages ?? [];
  return list.map((m) => normalizeMessage(m as Record<string, unknown>));
}

export async function markConversationRead(
  conversationId: number,
): Promise<void> {
  await patch(
    `/conversations/${conversationId}/messages/read`,
    {},
    {
      auth: true,
    },
  );
}

import {
  getChatWebSocketUrl,
} from "@/lib/chat/wsUrl";

export { getChatWebSocketUrl };

/** Runtime URL с сервера (CHAT_WS_URL) — приоритет над клиентским fallback. */
export async function fetchChatWebSocketUrl(): Promise<string> {
  try {
    const res = await fetch("/api/chat-ws-url", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { url?: string };
      if (data.url?.trim()) return data.url.trim();
    }
  } catch {
    /* fallback */
  }
  return getChatWebSocketUrl();
}
