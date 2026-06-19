import { get, post, ApiError } from "./client";
import type { ProviderApplication, ProviderApplicationStatus } from "./types";

function str(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function parseProviderApplication(data: unknown): ProviderApplication | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const raw =
    root.application ?? root.Application ?? root.provider_application;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id ?? o.Id;
  if (id === undefined || id === null || id === "") return null;

  const urlsRaw = o.documentUrls ?? o.document_urls ?? o.DocumentUrls;
  const documentUrls = Array.isArray(urlsRaw)
    ? urlsRaw.map((u) => str(u)).filter(Boolean)
    : [];

  const statusRaw = str(o.status ?? o.Status).toLowerCase();
  const status: ProviderApplicationStatus =
    statusRaw === "approved" || statusRaw === "rejected" || statusRaw === "pending"
      ? statusRaw
      : "pending";

  return {
    id: str(id),
    userId: str(o.userId ?? o.user_id ?? o.UserId),
    status,
    documentUrls,
    rejectionReason:
      o.rejectionReason != null
        ? str(o.rejectionReason)
        : o.rejection_reason != null
          ? str(o.rejection_reason)
          : undefined,
    reviewedBy:
      o.reviewedBy != null
        ? str(o.reviewedBy)
        : o.reviewed_by != null
          ? str(o.reviewed_by)
          : undefined,
    createdAt: str(o.createdAt ?? o.created_at ?? ""),
    updatedAt: str(o.updatedAt ?? o.updated_at ?? ""),
  };
}

function isNoApplicationError(err: ApiError): boolean {
  if (err.status === 404) return true;
  const msg = (err.body.message ?? err.body.error ?? "").toLowerCase();
  if (err.status !== 500) return false;
  return (
    msg.includes("not found") ||
    msg.includes("record not found") ||
    msg.includes("provider request not found") ||
    msg.includes("failed to get provider request")
  );
}

/** GET /v1/user/provider/application */
export async function getMyProviderApplication(): Promise<ProviderApplication | null> {
  try {
    const data = await get<unknown>("/user/provider/application", {
      auth: true,
    });
    return parseProviderApplication(data);
  } catch (e) {
    if (e instanceof ApiError && isNoApplicationError(e)) {
      return null;
    }
    throw e;
  }
}

function parseApplicationsList(data: unknown): {
  applications: ProviderApplication[];
  total: number;
} {
  if (!data || typeof data !== "object") {
    return { applications: [], total: 0 };
  }
  const root = data as Record<string, unknown>;
  const appsRaw = root.applications ?? root.Applications;
  const applications: ProviderApplication[] = [];
  if (Array.isArray(appsRaw)) {
    for (const item of appsRaw) {
      if (!item || typeof item !== "object") continue;
      const parsed = parseProviderApplication({ application: item });
      if (parsed) applications.push(parsed);
    }
  }
  const total = Number(root.total ?? root.Total ?? applications.length);
  return {
    applications,
    total: Number.isFinite(total) ? total : applications.length,
  };
}

/** GET /v1/admin/provider-applications — только admin (см. user.proto). */
export async function listProviderApplicationsAdmin(opts?: {
  status?: "" | ProviderApplicationStatus;
  limit?: number;
  offset?: number;
}): Promise<{ applications: ProviderApplication[]; total: number }> {
  const rawStatus = opts?.status;
  const status =
    rawStatus !== undefined && rawStatus !== "" ? rawStatus : undefined;
  const data = await get<unknown>("/admin/provider-applications", {
    auth: true,
    params: {
      status,
      limit: opts?.limit,
      offset: opts?.offset,
    },
  });
  return parseApplicationsList(data);
}

/** Одна заявка по id: обход GET /admin/provider-applications (без отдельного эндпоинта в proto). */
export async function getProviderApplicationAdminById(
  applicationId: string,
): Promise<ProviderApplication | null> {
  const id = String(applicationId);
  let offset = 0;
  const limit = 100;
  for (let i = 0; i < 50; i++) {
    const { applications, total } = await listProviderApplicationsAdmin({
      status: "",
      limit,
      offset,
    });
    const found = applications.find((a) => a.id === id);
    if (found) return found;
    if (applications.length === 0 || offset + applications.length >= total) {
      break;
    }
    offset += limit;
  }
  return null;
}

function parseApplyLikeResponse(data: unknown): ProviderApplication {
  const parsed = parseProviderApplication(data);
  if (parsed) return parsed;
  throw new Error("Unexpected admin provider-application response");
}

/** POST `…/v1/admin/provider-applications/{id}/approve` (напр. `http://localhost:8080/v1/admin/provider-applications/1/approve`). */
export async function approveProviderApplicationAdmin(
  applicationId: string | number,
): Promise<ProviderApplication> {
  const id = encodeURIComponent(String(applicationId));
  const data = await post<unknown>(
    `/admin/provider-applications/${id}/approve`,
    {},
    { auth: true },
  );
  return parseApplyLikeResponse(data);
}

/** POST `…/v1/admin/provider-applications/{id}/reject` (напр. `http://localhost:8080/v1/admin/provider-applications/2/reject`). Тело: причина отклонения. */
export async function rejectProviderApplicationAdmin(
  applicationId: string | number,
  rejectionReason: string,
): Promise<ProviderApplication> {
  const id = encodeURIComponent(String(applicationId));
  const reason = rejectionReason.trim();
  const tryPost = (body: Record<string, string>) =>
    post<unknown>(`/admin/provider-applications/${id}/reject`, body, {
      auth: true,
    });
  try {
    const data = await tryPost({ rejection_reason: reason });
    return parseApplyLikeResponse(data);
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) {
      const data = await tryPost({ rejectionReason: reason });
      return parseApplyLikeResponse(data);
    }
    throw e;
  }
}

/** POST /v1/user/provider/apply — JSON: document_urls (snake) или documentUrls (camel), см. grpc-gateway. */
export async function submitProviderApplication(
  documentUrls: string[],
): Promise<ProviderApplication> {
  const unwrap = (data: unknown): ProviderApplication => {
    const parsed = parseProviderApplication(data);
    if (!parsed) {
      throw new Error("Unexpected response from provider apply");
    }
    return parsed;
  };
  try {
    const data = await post<unknown>(
      "/user/provider/apply",
      { document_urls: documentUrls },
      { auth: true },
    );
    return unwrap(data);
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) {
      const data = await post<unknown>(
        "/user/provider/apply",
        { documentUrls: documentUrls },
        { auth: true },
      );
      return unwrap(data);
    }
    throw e;
  }
}
