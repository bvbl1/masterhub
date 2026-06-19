/** Прод chat-service на Railway (если env не задан). */
export const RAILWAY_CHAT_WS_DEFAULT =
  "wss://chat-service-production-a182.up.railway.app/ws";

function publicEnv(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

/** Нормализует host / https / wss → …/ws */
export function normalizeChatWsBase(
  input: string,
  preferSecure = true,
): string {
  let s = input.trim().replace(/\/+$/, "");
  if (!s) return "";

  if (/^https:\/\//i.test(s)) {
    s = s.replace(/^https:\/\//i, "wss://");
  } else if (/^http:\/\//i.test(s)) {
    s = s.replace(/^http:\/\//i, "ws://");
  } else if (!/^wss?:\/\//i.test(s)) {
    const proto = preferSecure ? "wss" : "ws";
    s = `${proto}://${s}`;
  }

  return s.endsWith("/ws") ? s : `${s}/ws`;
}

/** Сервер (API route): runtime env, без пересборки. */
export function resolveChatWsUrlServer(): string {
  const fromRuntime =
    publicEnv("CHAT_WS_URL") ?? publicEnv("NEXT_PUBLIC_CHAT_WS_URL");
  if (fromRuntime) {
    return normalizeChatWsBase(fromRuntime, true);
  }
  if (process.env.NODE_ENV === "production") {
    return RAILWAY_CHAT_WS_DEFAULT;
  }
  return "ws://localhost:8081/ws";
}

/**
 * Клиент: NEXT_PUBLIC_* из билда, иначе Railway → chat-service (не :8081 на домене фронта).
 */
export function getChatWebSocketUrl(): string {
  if (typeof window === "undefined") {
    return "ws://localhost:8081/ws";
  }

  const explicit = publicEnv("NEXT_PUBLIC_CHAT_WS_URL");
  if (explicit) {
    return normalizeChatWsBase(
      explicit,
      window.location.protocol === "https:",
    );
  }

  const hostOnly = publicEnv("NEXT_PUBLIC_CHAT_WS_HOST");
  if (hostOnly) {
    const port = publicEnv("NEXT_PUBLIC_CHAT_WS_PORT");
    const hasPort = /:\d+$/.test(hostOnly);
    const base = hasPort
      ? hostOnly
      : port
        ? `${hostOnly}:${port}`
        : hostOnly;
    return normalizeChatWsBase(
      base,
      window.location.protocol === "https:",
    );
  }

  // Прод на Railway: WS на отдельном chat-service, не frontend:8081
  if (window.location.hostname.endsWith(".up.railway.app")) {
    return RAILWAY_CHAT_WS_DEFAULT;
  }

  const host = window.location.hostname;
  const port = publicEnv("NEXT_PUBLIC_CHAT_WS_PORT") ?? "8081";
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${host}:${port}/ws`;
}
