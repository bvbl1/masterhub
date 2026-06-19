import { ApiError, get, getToken } from "./client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/v1";

/** Upload contexts accepted by media-service (see backend/media domain). */
export type MediaUploadContext =
  | "service_photos"
  | "review_photos"
  | "provider_documents"
  | "chat_media"
  | "order_photos"
  | "job_request_photos"
  | "dispute_photos"
  | "avatar";

/** Chat message attachments. */
export const CHAT_MEDIA_CONTEXT: MediaUploadContext = "chat_media";

/** Photos attached when a customer creates an order. */
export const ORDER_PHOTOS_CONTEXT: MediaUploadContext = "order_photos";

/** Photos on a job request. */
export const JOB_REQUEST_PHOTOS_CONTEXT: MediaUploadContext = "job_request_photos";

/** Evidence photos when opening an order dispute. */
export const DISPUTE_PHOTOS_CONTEXT: MediaUploadContext = "dispute_photos";

/** @deprecated Use ORDER_PHOTOS_CONTEXT, JOB_REQUEST_PHOTOS_CONTEXT, or DISPUTE_PHOTOS_CONTEXT */
export const GENERAL_ATTACHMENT_CONTEXT: MediaUploadContext =
  "provider_documents";

export const PROVIDER_DOCUMENTS_CONTEXT: MediaUploadContext = "provider_documents";

/** Query param embedded in stored provider document URLs so admins can resolve media_id later. */
export const PROVIDER_DOC_MEDIA_ID_PARAM = "mh_mid";

export type UploadedMediaItem = {
  mediaId: number;
  url: string;
};

export type MediaRecord = UploadedMediaItem & {
  uploaderId?: number;
  context?: string;
  filename?: string;
};

type UploadBatchResponse = {
  media?: unknown[];
};

function str(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function parseMediaItem(raw: unknown): MediaRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const mediaId = num(o.mediaId ?? o.media_id ?? o.MediaId);
  const url = str(o.url ?? o.Url).trim();
  if (mediaId <= 0 || !url) return null;
  const uploaderId = num(o.uploaderId ?? o.uploader_id ?? o.UploaderId);
  return {
    mediaId,
    url,
    uploaderId: uploaderId > 0 ? uploaderId : undefined,
    context: str(o.context ?? o.Context) || undefined,
    filename: str(o.filename ?? o.Filename) || undefined,
  };
}

export function normalizeMediaUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname;
  } catch {
    const base = url.split("?")[0]?.split("#")[0] ?? url;
    try {
      return new URL(base, "https://placeholder.local").pathname;
    } catch {
      return base;
    }
  }
}

export function isPrivateProviderDocumentUrl(url: string): boolean {
  return /provider_documents\//i.test(url);
}

export function parseMediaIdFromStoredUrl(url: string): number | null {
  try {
    const u = new URL(url);
    const raw = u.searchParams.get(PROVIDER_DOC_MEDIA_ID_PARAM);
    if (raw) {
      const id = Number(raw);
      if (Number.isFinite(id) && id > 0) return id;
    }
  } catch {
    const m = url.match(/[?&]mh_mid=(\d+)/);
    if (m) {
      const id = Number(m[1]);
      if (Number.isFinite(id) && id > 0) return id;
    }
  }
  return null;
}

/** Persist media_id alongside the S3 URL in provider_request.document_urls. */
export function tagProviderDocumentUrl(url: string, mediaId: number): string {
  try {
    const u = new URL(url);
    u.searchParams.set(PROVIDER_DOC_MEDIA_ID_PARAM, String(mediaId));
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${PROVIDER_DOC_MEDIA_ID_PARAM}=${mediaId}`;
  }
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function uploadBatch(
  files: File[],
  context: MediaUploadContext = "service_photos",
): Promise<UploadedMediaItem[]> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, { message: "No authentication token found" });
  }

  const payloadFiles = await Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      data: await fileToBase64(file),
    })),
  );

  const res = await fetch(`${BASE_URL}/media/upload/batch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context,
      files: payloadFiles,
    }),
  });

  if (!res.ok) {
    let body: { message?: string; error?: string } = {};
    try {
      body = await res.json();
    } catch {
      body = { message: `Request failed with status ${res.status}` };
    }
    throw new ApiError(res.status, body);
  }

  const data = (await res.json()) as UploadBatchResponse;
  const items: UploadedMediaItem[] = [];
  for (const raw of data.media ?? []) {
    const parsed = parseMediaItem(raw);
    if (parsed) items.push({ mediaId: parsed.mediaId, url: parsed.url });
  }
  return items;
}

/** GET /v1/media/{media_id}/presigned */
export async function getPresignedUrl(mediaId: number | string): Promise<string> {
  const id = encodeURIComponent(String(mediaId));
  const data = await get<unknown>(`/media/${id}/presigned`, { auth: true });
  if (!data || typeof data !== "object") {
    throw new Error("Unexpected presigned URL response");
  }
  const url = str((data as Record<string, unknown>).url ?? (data as Record<string, unknown>).Url);
  if (!url) throw new Error("Presigned URL missing in response");
  return url;
}

/** GET /v1/media?context=… — files uploaded by the current user. */
export async function getMyMedia(
  context?: MediaUploadContext,
): Promise<MediaRecord[]> {
  const data = await get<unknown>("/media", {
    auth: true,
    params: context ? { context } : undefined,
  });
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  const raw = root.media ?? root.Media;
  if (!Array.isArray(raw)) return [];
  const items: MediaRecord[] = [];
  for (const entry of raw) {
    const parsed = parseMediaItem(entry);
    if (parsed) items.push(parsed);
  }
  return items;
}

/** GET /v1/media/{media_id} */
export async function getMedia(mediaId: number | string): Promise<MediaRecord | null> {
  const id = encodeURIComponent(String(mediaId));
  try {
    const data = await get<unknown>(`/media/${id}`, { auth: true });
    if (!data || typeof data !== "object") return null;
    const root = data as Record<string, unknown>;
    return parseMediaItem(root.media ?? root.Media ?? root);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

const MEDIA_LOOKUP_CACHE_KEY = "masterhub_media_url_lookup_v1";
const MEDIA_LOOKUP_MAX_ID = 3000;
const MEDIA_LOOKUP_CONCURRENCY = 25;

function readMediaLookupCache(): Map<string, number> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = sessionStorage.getItem(MEDIA_LOOKUP_CACHE_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, number>;
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

function writeMediaLookupCache(cache: Map<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, number> = {};
    for (const [k, v] of cache.entries()) obj[k] = v;
    sessionStorage.setItem(MEDIA_LOOKUP_CACHE_KEY, JSON.stringify(obj));
  } catch {
    /* ignore quota errors */
  }
}

async function lookupMediaIdsByUrls(
  documentUrls: string[],
  ownerUserId?: string,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const cache = readMediaLookupCache();

  for (const url of documentUrls) {
    const fromParam = parseMediaIdFromStoredUrl(url);
    if (fromParam) {
      result.set(normalizeMediaUrl(url), fromParam);
      continue;
    }
    const cached = cache.get(normalizeMediaUrl(url));
    if (cached) result.set(normalizeMediaUrl(url), cached);
  }

  const stillMissing = (url: string) => !result.has(normalizeMediaUrl(url));

  try {
    const myMedia = await getMyMedia(PROVIDER_DOCUMENTS_CONTEXT);
    for (const item of myMedia) {
      const key = normalizeMediaUrl(item.url);
      if (documentUrls.some((u) => normalizeMediaUrl(u) === key)) {
        result.set(key, item.mediaId);
        cache.set(key, item.mediaId);
      }
    }
  } catch {
    /* current user may not own these files (admin view) */
  }

  const unresolved = documentUrls.filter(stillMissing);
  if (unresolved.length === 0) {
    writeMediaLookupCache(cache);
    return result;
  }

  const neededKeys = new Set(unresolved.map(normalizeMediaUrl));

  for (
    let start = 1;
    start <= MEDIA_LOOKUP_MAX_ID && neededKeys.size > 0;
    start += MEDIA_LOOKUP_CONCURRENCY
  ) {
    const ids: number[] = [];
    for (
      let id = start;
      id < start + MEDIA_LOOKUP_CONCURRENCY && id <= MEDIA_LOOKUP_MAX_ID;
      id += 1
    ) {
      ids.push(id);
    }

    const metas = await Promise.all(ids.map((id) => getMedia(id)));
    for (const meta of metas) {
      if (!meta) continue;
      if (meta.context && meta.context !== PROVIDER_DOCUMENTS_CONTEXT) continue;
      if (
        ownerUserId &&
        meta.uploaderId != null &&
        String(meta.uploaderId) !== String(ownerUserId)
      ) {
        continue;
      }
      const key = normalizeMediaUrl(meta.url);
      if (!neededKeys.has(key)) continue;
      result.set(key, meta.mediaId);
      cache.set(key, meta.mediaId);
      neededKeys.delete(key);
    }
  }

  writeMediaLookupCache(cache);
  return result;
}

/** Replace private provider document URLs with short-lived presigned URLs for viewing. */
export async function resolveProviderDocumentViewUrls(
  documentUrls: string[],
  options?: { ownerUserId?: string },
): Promise<string[]> {
  if (documentUrls.length === 0) return [];

  const urlToId = await lookupMediaIdsByUrls(documentUrls, options?.ownerUserId);

  return Promise.all(
    documentUrls.map(async (storedUrl) => {
      if (!isPrivateProviderDocumentUrl(storedUrl)) return storedUrl;

      let mediaId = parseMediaIdFromStoredUrl(storedUrl);
      if (!mediaId) {
        mediaId = urlToId.get(normalizeMediaUrl(storedUrl)) ?? null;
      }
      if (!mediaId) return storedUrl;

      try {
        return await getPresignedUrl(mediaId);
      } catch {
        return storedUrl;
      }
    }),
  );
}
