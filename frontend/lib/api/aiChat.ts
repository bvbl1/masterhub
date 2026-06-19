import { getToken } from "./client";

type JsonRecord = Record<string, unknown>;

function str(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

export type AiAssistantIntent =
  | "create_job_request"
  | "repair_advice"
  | "recommend_providers"
  | "improve_description"
  | "price_estimate"
  | "general_question"
  | string;

export type AiDraftJobRequest = {
  city: string;
  serviceType: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  scheduledAt: string;
};

export type AiClassification = {
  serviceType: string;
  urgency: string;
  budgetSegment: string;
  additionalServices: string[];
};

export type AiEstimatedPrice = {
  minPrice: number;
  maxPrice: number;
  estimatedDays: number;
  comment: string;
};

export type AiRecommendedProvider = {
  id: number;
  fullName: string;
  city: string;
  specialty: string;
  rating: number;
  reason: string;
};

export type AiChatRequestContext = {
  city?: string;
  service_type?: string;
  description?: string;
  budget_min?: number;
  budget_max?: number;
  scheduled_at?: string;
};

export type AiChatResponse = {
  message: string;
  intent: AiAssistantIntent;
  draftJobRequest?: AiDraftJobRequest;
  classification?: AiClassification;
  estimatedPrice?: AiEstimatedPrice;
  repairSteps: string[];
  recommendedProviders: AiRecommendedProvider[];
  missing: string[];
};

function num(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter(Boolean);
}

function normalizeDraft(raw: JsonRecord | undefined): AiDraftJobRequest | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  return {
    city: str(raw.city),
    serviceType: str(raw.service_type ?? raw.serviceType),
    description: str(raw.description),
    budgetMin: num(raw.budget_min ?? raw.budgetMin),
    budgetMax: num(raw.budget_max ?? raw.budgetMax),
    scheduledAt: str(raw.scheduled_at ?? raw.scheduledAt),
  };
}

export function normalizeAiChatResponse(data: JsonRecord): AiChatResponse {
  const draftSrc = data.draft_job_request ?? data.draftJobRequest;
  let draft: AiDraftJobRequest | undefined;
  if (draftSrc && typeof draftSrc === "object") {
    const parsed = normalizeDraft(draftSrc as JsonRecord);
    if (parsed) {
      if (
        !parsed.city &&
        !parsed.serviceType &&
        !parsed.description &&
        parsed.budgetMin === 0 &&
        parsed.budgetMax === 0 &&
        !parsed.scheduledAt
      ) {
        draft = undefined;
      } else {
        draft = parsed;
      }
    }
  }

  const classificationSrc =
    data.classification && typeof data.classification === "object"
      ? (data.classification as JsonRecord)
      : undefined;

  let classification: AiClassification | undefined;
  if (classificationSrc) {
    classification = {
      serviceType: str(
        classificationSrc.service_type ?? classificationSrc.serviceType,
      ),
      urgency: str(classificationSrc.urgency),
      budgetSegment: str(classificationSrc.budget_segment ?? classificationSrc.budgetSegment),
      additionalServices: strArr(
        classificationSrc.additional_services ??
          classificationSrc.additionalServices,
      ),
    };
    if (
      !classification.serviceType &&
      !classification.urgency &&
      !classification.budgetSegment &&
      classification.additionalServices.length === 0
    ) {
      classification = undefined;
    }
  }

  const priceSrc =
    data.estimated_price ?? data.estimatedPrice;
  let estimatedPrice: AiEstimatedPrice | undefined;
  if (priceSrc && typeof priceSrc === "object") {
    const pr = priceSrc as JsonRecord;
    estimatedPrice = {
      minPrice: num(pr.min_price ?? pr.minPrice),
      maxPrice: num(pr.max_price ?? pr.maxPrice),
      estimatedDays: num(pr.estimated_days ?? pr.estimatedDays),
      comment: str(pr.comment),
    };
    if (
      estimatedPrice.minPrice <= 0 &&
      estimatedPrice.maxPrice <= 0 &&
      estimatedPrice.estimatedDays <= 0 &&
      !estimatedPrice.comment
    ) {
      estimatedPrice = undefined;
    }
  }

  let recommendedProviders: AiRecommendedProvider[] = [];
  const recSrc =
    data.recommended_providers ?? data.recommendedProviders;
  if (Array.isArray(recSrc)) {
    recommendedProviders = recSrc
      .filter((x) => x && typeof x === "object")
      .map((x) => {
        const p = x as JsonRecord;
        return {
          id: num(p.id),
          fullName: str(p.full_name ?? p.fullName),
          city: str(p.city),
          specialty: str(p.specialty),
          rating: num(p.rating),
          reason: str(p.reason),
        };
      })
      .filter((p) => p.id > 0 || p.fullName);
  }

  return {
    message: str(data.message) || "(No assistant message)",
    intent: str(data.intent || "general_question") as AiAssistantIntent,
    draftJobRequest: draft,
    classification,
    estimatedPrice,
    repairSteps: strArr(data.repair_steps ?? data.repairSteps),
    recommendedProviders,
    missing: strArr(data.missing),
  };
}

export async function postAiChat(
  message: string,
  context?: AiChatRequestContext | null,
): Promise<AiChatResponse> {
  const token = getToken();
  if (!token?.trim()) {
    throw new Error("Sign in to use the AI assistant.");
  }

  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.trim()}`,
    },
    body: JSON.stringify(
      context && Object.keys(context).length > 0
        ? { message: message.trim(), context }
        : { message: message.trim() },
    ),
    cache: "no-store",
  });

  let data: JsonRecord = {};
  try {
    data = (await res.json()) as JsonRecord;
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const errMsg =
      str(data.error) ||
      str(data.message) ||
      `Request failed (${res.status})`;
    throw new Error(errMsg);
  }

  return normalizeAiChatResponse(data);
}

export function draftToRequestContext(draft: AiDraftJobRequest): AiChatRequestContext {
  return {
    city: draft.city || undefined,
    service_type: draft.serviceType || undefined,
    description: draft.description || undefined,
    budget_min:
      draft.budgetMin !== 0 ? draft.budgetMin : undefined,
    budget_max:
      draft.budgetMax !== 0 ? draft.budgetMax : undefined,
    scheduled_at: draft.scheduledAt || undefined,
  };
}
