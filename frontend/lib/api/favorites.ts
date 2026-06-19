import { pickAvatarUrlFromRaw } from "./auth";
import { ApiError, del, get, post } from "./client";

/** Элемент списка избранных (GET /favorites). */
export interface FavoriteProviderSummary {
  id: number;
  firstName: string;
  secondName: string;
  avatarUrl?: string;
  role?: string;
}

function parseFavoriteProvider(
  raw: Record<string, unknown>,
): FavoriteProviderSummary | null {
  const id = Number(raw.id ?? raw.user_id ?? raw.provider_id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const first = String(
    raw.firstName ?? raw.first_name ?? "",
  ).trim();
  const second = String(
    raw.secondName ?? raw.last_name ?? raw.second_name ?? "",
  ).trim();
  const avatarUrl = pickAvatarUrlFromRaw(raw);
  const role = raw.role != null ? String(raw.role) : undefined;
  return { id, firstName: first, secondName: second, avatarUrl, role };
}

function collectProvidersPayload(res: Record<string, unknown>): unknown[] {
  const direct = res.providers;
  if (Array.isArray(direct)) return direct;
  const nested = res.data;
  if (nested && typeof nested === "object") {
    const d = (nested as Record<string, unknown>).providers;
    if (Array.isArray(d)) return d;
  }
  if (Array.isArray(res.items)) return res.items;
  return [];
}

/** GET /favorites?limit=&offset= */
export async function listFavoriteProviders(
  limit = 100,
  offset = 0,
): Promise<FavoriteProviderSummary[]> {
  const res = await get<Record<string, unknown>>("/favorites", {
    auth: true,
    params: { limit, offset },
  });
  const out: FavoriteProviderSummary[] = [];
  for (const item of collectProvidersPayload(res)) {
    if (!item || typeof item !== "object") continue;
    const parsed = parseFavoriteProvider(item as Record<string, unknown>);
    if (parsed) out.push(parsed);
  }
  return out;
}

function readIsFavoritePayload(res: Record<string, unknown>): boolean {
  const direct = res.isFavorite ?? res.is_favorite;
  if (typeof direct === "boolean") return direct;
  const nested = res.data;
  if (nested && typeof nested === "object") {
    const d = (nested as Record<string, unknown>).isFavorite;
    const s = (nested as Record<string, unknown>).is_favorite;
    if (typeof d === "boolean") return d;
    if (typeof s === "boolean") return s;
  }
  return false;
}

/** GET /favorites/:providerId — проверка, в избранном ли провайдер у текущего пользователя. */
export async function isProviderFavorite(
  providerId: number,
): Promise<boolean> {
  try {
    const res = await get<Record<string, unknown>>(
      `/favorites/${providerId}`,
      { auth: true },
    );
    return readIsFavoritePayload(res);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 404)) {
      return false;
    }
    throw e;
  }
}

/** POST /favorites/:providerId */
export function addFavorite(providerId: number): Promise<unknown> {
  return post(`/favorites/${providerId}`, undefined, { auth: true });
}

/** DELETE /favorites/:providerId */
export function removeFavorite(providerId: number): Promise<unknown> {
  return del(`/favorites/${providerId}`);
}
