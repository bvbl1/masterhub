import {
  post,
  get,
  put,
  setToken,
  clearToken,
  replaceTokenPreserveStorage,
  setRememberedLoginEmail,
  ApiError,
} from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  UserRole,
  PromoteResponse,
  UpdateUserRequest,
} from "./types";

/** URL аватара из «сырого» объекта пользователя (как в favorites / gateway). */
export function pickAvatarUrlFromRaw(
  raw: Record<string, unknown>,
): string | undefined {
  const candidates = [
    raw.avatarUrl,
    raw.avatar_url,
    raw.AvatarUrl,
    raw.avatar,
  ];
  for (const c of candidates) {
    if (c != null && String(c).trim() !== "") return String(c).trim();
  }
  return undefined;
}

function isUserRole(v: unknown): v is UserRole {
  return v === "customer" || v === "provider" || v === "admin";
}

function normalizeUser(raw: Record<string, unknown>): User {
  const role = raw.role;
  return {
    id: String(raw.id ?? ""),
    email: String(raw.email ?? ""),
    firstName: String(raw.firstName ?? raw.first_name ?? ""),
    secondName: String(raw.secondName ?? raw.second_name ?? ""),
    phone:
      raw.phone != null && String(raw.phone) !== ""
        ? String(raw.phone)
        : undefined,
    role: isUserRole(role) ? role : "customer",
    avatarUrl: pickAvatarUrlFromRaw(raw),
  };
}

export async function login(
  data: LoginRequest,
  options?: { rememberMe?: boolean },
): Promise<LoginResponse> {
  const rememberMe = options?.rememberMe ?? false;
  const res = await post<LoginResponse>("/auth/login", data);
  setToken(res.token, rememberMe);
  if (rememberMe) {
    setRememberedLoginEmail(data.email_or_phone.trim());
  } else {
    setRememberedLoginEmail(null);
  }
  return res;
}

export function register(data: RegisterRequest): Promise<User> {
  return post<User>("/user", data);
}

export async function getMe(): Promise<User> {
  const res = await get<{ user: Record<string, unknown> }>("/users/me", {
    auth: true,
  });
  return normalizeUser(res.user);
}

export async function promoteToProvider(): Promise<PromoteResponse> {
  const res = await post<PromoteResponse>("/user/provider", undefined, {
    auth: true,
  });
  replaceTokenPreserveStorage(res.token);
  return res;
}

/** GET /auth/google — URL для OAuth-редиректа на сторону Google */
export async function getGoogleAuthUrl(): Promise<{ url: string }> {
  return get<{ url: string }>("/auth/google");
}

export function logout(): void {
  clearToken();
}

export async function getProviderInfo(id: string): Promise<{ user: User }> {
  return getUserById(id);
}

/** GET /users/:id — профиль пользователя (клиент, провайдер, админ). */
export async function getUserById(id: string): Promise<{ user: User }> {
  const res = await get<{ user: Record<string, unknown> }>(`/users/${id}`, {
    auth: true,
  });
  return { user: normalizeUser(res.user) };
}

export async function updateUser(
  id: string | number,
  data: UpdateUserRequest,
): Promise<{ user: User }> {
  const res = await put<{ user: Record<string, unknown> }>(
    `/users/${id}`,
    data,
    { auth: true },
  );
  return { user: normalizeUser(res.user) };
}

export async function updateMyAvatar(
  avatarUrl: string,
): Promise<{ success: boolean }> {
  const url = avatarUrl.trim();
  if (!url) {
    throw new ApiError(400, { message: "Avatar URL is empty" });
  }
  return post<{ success: boolean }>(
    "/users/me/avatar",
    { avatar_url: url },
    { auth: true },
  );
}
