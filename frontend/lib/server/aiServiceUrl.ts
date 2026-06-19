/**
 * Base URL for backend/ai (server-only).
 * Browser calls /api/ai/chat; this URL is used inside the Next.js route handler.
 *
 * Railway: set on the **frontend** service (runtime, no rebuild required):
 *   AI_SERVICE_URL=http://ai-service.railway.internal:50070
 */
export function resolveAiServiceBase(): string {
  const raw =
    process.env.AI_SERVICE_URL?.trim() ||
    process.env.AI_SERVICE_URL_INTERNAL?.trim() ||
    "http://localhost:50070";

  const withScheme =
    raw.startsWith("http://") || raw.startsWith("https://")
      ? raw
      : `http://${raw}`;

  return withScheme.replace(/\/$/, "");
}
