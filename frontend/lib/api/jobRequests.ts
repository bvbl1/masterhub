import { del, get, post } from "./client";
import { collectPhotoUrls } from "./photoUrls";
import type {
  AcceptJobRequestBidPayload,
  AcceptJobRequestBidResult,
  CreateJobRequestPayload,
  JobRequest,
  JobRequestListFilters,
  JobRequestResponse,
  JobRequestResponseStatus,
  JobRequestStatus,
  RespondToJobRequestPayload,
} from "./types";

type JsonRecord = Record<string, unknown>;

function num(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

function normalizeJobRequest(raw: JsonRecord): JobRequest {
  return {
    id: num(raw.id),
    customerId: num(raw.customerId ?? raw.customer_id),
    categoryId: num(raw.categoryId ?? raw.category_id),
    title: str(raw.title),
    description: str(raw.description),
    city: str(raw.city),
    budgetMin: Number(raw.budgetMin ?? raw.budget_min ?? 0),
    budgetMax: Number(raw.budgetMax ?? raw.budget_max ?? 0),
    scheduledAt: str(raw.scheduledAt ?? raw.scheduled_at),
    status: str(raw.status) as JobRequestStatus,
    responseCount: num(raw.responseCount ?? raw.response_count),
    createdAt: str(raw.createdAt ?? raw.created_at),
    updatedAt: str(raw.updatedAt ?? raw.updated_at),
    photoUrls: collectPhotoUrls(raw),
  };
}

function normalizeJobRequestResponse(raw: JsonRecord): JobRequestResponse {
  return {
    id: num(raw.id),
    jobRequestId: num(raw.jobRequestId ?? raw.job_request_id),
    providerId: num(raw.providerId ?? raw.provider_id),
    proposedPrice: Number(raw.proposedPrice ?? raw.proposed_price ?? 0),
    comment: str(raw.comment),
    estimatedDays: num(raw.estimatedDays ?? raw.estimated_days),
    status: str(raw.status) as JobRequestResponseStatus,
    createdAt: str(raw.createdAt ?? raw.created_at),
    updatedAt: str(raw.updatedAt ?? raw.updated_at),
  };
}

function unwrapJobRequest(raw: unknown): JobRequest {
  const r = raw as JsonRecord;
  const jr =
    (r.jobRequest as JsonRecord | undefined) ??
    (r.job_request as JsonRecord | undefined) ??
    r;
  return normalizeJobRequest(jr as JsonRecord);
}

export function createJobRequest(
  data: CreateJobRequestPayload,
): Promise<JobRequest> {
  return post<unknown>("/job-requests", data, { auth: true }).then((raw) =>
    unwrapJobRequest(raw),
  );
}

export function listJobRequests(
  filters?: JobRequestListFilters,
): Promise<JobRequest[]> {
  return get<unknown>("/job-requests", {
    auth: true,
    params: {
      status: filters?.status,
      category_id: filters?.category_id,
      city: filters?.city,
      limit: filters?.limit,
      offset: filters?.offset,
    },
  }).then((raw) => {
    const body = raw as {
      jobRequests?: JsonRecord[];
      job_requests?: JsonRecord[];
    };
    const arr = body.jobRequests ?? body.job_requests;
    if (Array.isArray(raw)) {
      return (raw as JsonRecord[]).map((x) =>
        normalizeJobRequest(x as JsonRecord),
      );
    }
    if (!arr || !Array.isArray(arr)) return [];
    return arr.map((x) => normalizeJobRequest(x as JsonRecord));
  });
}

export function getJobRequest(id: number): Promise<JobRequest> {
  return get<unknown>(`/job-requests/${id}`, { auth: true }).then((raw) =>
    unwrapJobRequest(raw),
  );
}

export function cancelJobRequest(id: number): Promise<{ success: boolean }> {
  return del<{ success: boolean }>(`/job-requests/${id}`, { auth: true });
}

export function respondToJobRequest(
  jobRequestId: number,
  data: RespondToJobRequestPayload,
): Promise<JobRequestResponse> {
  return post<unknown>(
    `/job-requests/${jobRequestId}/respond`,
    data,
    { auth: true },
  ).then((raw) => {
    const body = raw as {
      response?: JsonRecord;
      jobRequestResponse?: JsonRecord;
    };
    const resp =
      body.response ??
      body.jobRequestResponse ??
      (raw as JsonRecord);
    return normalizeJobRequestResponse(resp as JsonRecord);
  });
}

export function listJobRequestResponses(
  jobRequestId: number,
  params?: { limit?: number; offset?: number },
): Promise<JobRequestResponse[]> {
  return get<unknown>(`/job-requests/${jobRequestId}/responses`, {
    auth: true,
    params: {
      limit: params?.limit,
      offset: params?.offset,
    },
  }).then((raw) => {
    const body = raw as {
      responses?: JsonRecord[];
      jobRequestResponses?: JsonRecord[];
    };
    const arr = body.responses ?? body.jobRequestResponses;
    if (Array.isArray(raw)) {
      return (raw as JsonRecord[]).map((x) =>
        normalizeJobRequestResponse(x as JsonRecord),
      );
    }
    if (!arr || !Array.isArray(arr)) return [];
    return arr.map((x) => normalizeJobRequestResponse(x as JsonRecord));
  });
}

export function getJobRequestResponse(
  jobRequestId: number,
  responseId: number,
): Promise<JobRequestResponse> {
  return get<unknown>(
    `/job-requests/${jobRequestId}/responses/${responseId}`,
    { auth: true },
  ).then((raw) => {
    const body = raw as { response?: JsonRecord };
    const resp = body.response ?? (raw as JsonRecord);
    return normalizeJobRequestResponse(resp as JsonRecord);
  });
}

export function acceptJobRequestResponse(
  jobRequestId: number,
  responseId: number,
  data: AcceptJobRequestBidPayload,
): Promise<AcceptJobRequestBidResult> {
  return post<unknown>(
    `/job-requests/${jobRequestId}/responses/${responseId}/accept`,
    data,
    { auth: true },
  ).then((raw) => {
    const body = raw as {
      jobRequest?: JsonRecord;
      job_request?: JsonRecord;
      orderId?: number | string;
      order_id?: number | string;
    };
    const jr =
      body.jobRequest ??
      body.job_request ??
      (raw as JsonRecord).jobRequest ??
      (raw as JsonRecord).job_request;
    const rawRec = raw as JsonRecord;
    const orderId = num(
      body.orderId ??
        body.order_id ??
        rawRec.orderId ??
        rawRec.order_id,
    );
    if (!jr) {
      throw new Error("Invalid accept response: missing job request");
    }
    return {
      jobRequest: normalizeJobRequest(jr as JsonRecord),
      orderId,
    };
  });
}

export function withdrawJobRequestResponse(
  jobRequestId: number,
  responseId: number,
): Promise<{ success: boolean }> {
  return del<{ success: boolean }>(
    `/job-requests/${jobRequestId}/responses/${responseId}`,
    { auth: true },
  );
}
