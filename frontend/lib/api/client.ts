import type { ApiErrorBody } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/v1";

const TOKEN_KEY = "masterhub_token";
/** Последний email/логин для автозаполнения (только если пользователь включал Remember me). */
export const REMEMBER_LOGIN_EMAIL_KEY = "masterhub_remember_login";

// ─── Token management ────────────────────────────────────────────────────────

/**
 * Сначала вкладочная сессия, затем сохранённая — чтобы «без Remember me»
 * токен жил только в sessionStorage до закрытия вкладки.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
  );
}

/**
 * @param persist — true: localStorage (сессия переживает перезапуск браузера).
 *                  false: sessionStorage (сессия только до закрытия вкладки).
 */
export function setToken(token: string, persist = true): void {
  if (typeof window === "undefined") return;
  clearToken();
  if (persist) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Заменить токен (например после promote), сохраняя тот же «режим» хранилища.
 */
export function replaceTokenPreserveStorage(newToken: string): void {
  if (typeof window === "undefined") return;
  const inSession = sessionStorage.getItem(TOKEN_KEY) !== null;
  const inLocal = localStorage.getItem(TOKEN_KEY) !== null;
  clearToken();
  if (inSession) {
    sessionStorage.setItem(TOKEN_KEY, newToken);
  } else if (inLocal) {
    localStorage.setItem(TOKEN_KEY, newToken);
  } else {
    localStorage.setItem(TOKEN_KEY, newToken);
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getRememberedLoginEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REMEMBER_LOGIN_EMAIL_KEY);
}

export function setRememberedLoginEmail(email: string | null): void {
  if (typeof window === "undefined") return;
  if (email) {
    localStorage.setItem(REMEMBER_LOGIN_EMAIL_KEY, email.trim());
  } else {
    localStorage.removeItem(REMEMBER_LOGIN_EMAIL_KEY);
  }
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? body.error ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  params?: Record<string, string | number | undefined>;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = false, params } = options;

  let url = `${BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (!token) {
      throw new ApiError(401, { message: "No authentication token found" });
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorBody: ApiErrorBody;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { message: `Request failed with status ${res.status}` };
    }
    throw new ApiError(res.status, errorBody);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Convenience methods ─────────────────────────────────────────────────────

export function get<T>(
  endpoint: string,
  opts?: Omit<RequestOptions, "method" | "body">,
): Promise<T> {
  return request<T>(endpoint, { ...opts, method: "GET" });
}

export function post<T>(
  endpoint: string,
  body?: unknown,
  opts?: Omit<RequestOptions, "method" | "body">,
): Promise<T> {
  return request<T>(endpoint, { ...opts, method: "POST", body });
}

export function put<T>(
  endpoint: string,
  body?: unknown,
  opts?: Omit<RequestOptions, "method" | "body">,
): Promise<T> {
  return request<T>(endpoint, { ...opts, method: "PUT", body });
}

export function patch<T>(
  endpoint: string,
  body?: unknown,
  opts?: Omit<RequestOptions, "method" | "body">,
): Promise<T> {
  return request<T>(endpoint, { ...opts, method: "PATCH", body });
}

export function del<T>(
  endpoint: string,
  opts?: Omit<RequestOptions, "method" | "body">,
): Promise<T> {
  return request<T>(endpoint, { ...opts, method: "DELETE", auth: true });
}
