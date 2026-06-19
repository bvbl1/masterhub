import { get, post, put, del } from "./client";
import type {
  Service,
  ServiceFilters,
  CreateServiceRequest,
  CreateServiceResponse,
  UpdateServiceRequest,
  SuccessResponse,
  ServiceProviderSummary,
} from "./types";

export type ServicesResponse = {
  services: Service[];
};

/** Gateway / domain may send price_start or priceStart. */
export function readServicePriceStart(
  raw: Service | Record<string, unknown>,
): number {
  const r = raw as Record<string, unknown>;
  const v = r.priceStart ?? r.price_start ?? r.PriceStart;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizeService(raw: Record<string, unknown>): Service {
  const photoRaw = raw.photoUrls ?? raw.photo_urls ?? raw.PhotoUrls;
  const photoUrls = Array.isArray(photoRaw)
    ? photoRaw.map((u) => String(u).trim()).filter(Boolean)
    : undefined;

  return {
    id: String(raw.id ?? raw.Id ?? ""),
    title: String(raw.title ?? raw.Title ?? ""),
    description: String(raw.description ?? raw.Description ?? ""),
    priceStart: readServicePriceStart(raw),
    categoryId: String(raw.categoryId ?? raw.category_id ?? ""),
    providerId: String(raw.providerId ?? raw.provider_id ?? ""),
    photoUrls,
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    city:
      typeof raw.city === "string" && raw.city.trim()
        ? raw.city.trim()
        : undefined,
    provider: raw.provider as ServiceProviderSummary | undefined,
  };
}

function normalizeServicesResponse(raw: unknown): ServicesResponse {
  const body = raw as {
    services?: unknown[];
    Services?: unknown[];
  };
  const arr = body.services ?? body.Services ?? [];
  if (!Array.isArray(arr)) return { services: [] };
  return {
    services: arr.map((item) =>
      normalizeService(item as Record<string, unknown>),
    ),
  };
}

export function getServices(
  filters?: ServiceFilters,
): Promise<ServicesResponse> {
  return get<unknown>("/services", {
    params: {
      category_id: filters?.category_id,
      provider_id: filters?.provider_id,
    },
  }).then(normalizeServicesResponse);
}

/** GET /services — с JWT провайдера API возвращает только его услуги. */
export function getOwnServices(): Promise<ServicesResponse> {
  return get<unknown>("/myservices", { auth: true }).then(
    normalizeServicesResponse,
  );
}

export type ServiceResponse = {
  service: Service;
};

export function getService(
  id: number,
  options?: { auth?: boolean },
): Promise<ServiceResponse> {
  return get<unknown>(`/services/${id}`, {
    ...(options?.auth ? { auth: true as const } : {}),
  }).then((raw) => {
    const body = raw as { service?: unknown; Service?: unknown };
    const svc = body.service ?? body.Service ?? raw;
    return {
      service: normalizeService(svc as Record<string, unknown>),
    };
  });
}

export function createService(
  data: CreateServiceRequest,
): Promise<CreateServiceResponse> {
  return post<CreateServiceResponse>("/services", data, { auth: true });
}

export function updateService(
  id: number,
  data: UpdateServiceRequest,
): Promise<SuccessResponse> {
  return put<SuccessResponse>(`/services/${id}`, data, { auth: true });
}

export function deleteService(id: number): Promise<SuccessResponse> {
  return del<SuccessResponse>(`/services/${id}`, { auth: true });
}

/** GET /avgprice?category_id= — средняя цена услуг (price_start) в категории. */
export function getAvgPriceForCategory(categoryId: number): Promise<number> {
  return get<unknown>("/avgprice", {
    params: { category_id: categoryId },
  }).then((raw) => {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const body = raw as {
      avgPrice?: unknown;
      avg_price?: unknown;
      AvgPrice?: unknown;
    };
    const v = body.avgPrice ?? body.avg_price ?? body.AvgPrice;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });
}

/** GET /listcities — города из услуг в БД (для фильтров). */
export function listCities(): Promise<string[]> {
  return get<unknown>("/listcities").then((raw) => {
    if (Array.isArray(raw)) {
      return raw.map((c) => String(c).trim()).filter(Boolean);
    }
    const body = raw as { cities?: unknown[]; Cities?: unknown[] };
    const arr = body.cities ?? body.Cities;
    if (!Array.isArray(arr)) return [];
    return arr.map((c) => String(c).trim()).filter(Boolean);
  });
}
