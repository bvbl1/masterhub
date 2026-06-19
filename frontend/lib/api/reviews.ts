import { parseStarRating } from "@/lib/reviewStats";
import { get, post } from "./client";
import { getServices } from "./services";
import type {
  CreateReviewRequest,
  SuccessResponse,
  Review,
  ReviewFilters,
  Service,
  ServiceReviewItemApi,
  ServiceReviewsApiResponse,
  ServiceReviewsResult,
} from "./types";

export type HomePageReviewsResult = ServiceReviewsResult & {
  servicesById: Record<string, Service>;
};

function mapServiceReviewItem(r: ServiceReviewItemApi): Review {
  const raw = r as ServiceReviewItemApi & {
    order_id?: string;
    service_id?: string;
    reviewer_id?: string;
    created_at?: string;
  };
  const photoUrls = [
    ...new Set(
      [...(r.photoUrls ?? []), ...(r.photo_urls ?? [])].filter(Boolean),
    ),
  ];
  const reviewerId = raw.reviewerId ?? raw.reviewer_id;
  const createdAt = r.createdAt ?? raw.created_at ?? "";
  return {
    ...(r.id != null && String(r.id) !== "" ? { id: String(r.id) } : {}),
    ...(raw.orderId != null && String(raw.orderId) !== ""
      ? { orderId: String(raw.orderId) }
      : raw.order_id != null && String(raw.order_id) !== ""
        ? { orderId: String(raw.order_id) }
        : {}),
    ...(raw.serviceId != null && String(raw.serviceId) !== ""
      ? { serviceId: String(raw.serviceId) }
      : raw.service_id != null && String(raw.service_id) !== ""
        ? { serviceId: String(raw.service_id) }
        : {}),
    ...(reviewerId != null && String(reviewerId) !== ""
      ? { reviewerId: String(reviewerId) }
      : {}),
    rating: parseStarRating(r.rating) ?? 0,
    comment: r.comment,
    created_at: createdAt,
    ...(photoUrls.length ? { photoUrls } : {}),
  };
}

export function createReview(
  data: CreateReviewRequest,
): Promise<SuccessResponse> {
  const body: Record<string, unknown> = {
    order_id: data.order_id,
    rating: data.rating,
    comment: data.comment,
  };
  const photos = data.photoUrls?.filter(Boolean);
  if (photos?.length) {
    body.photoUrls = photos;
  }
  return post<SuccessResponse>("/reviews", body, { auth: true });
}

export function getReviews(filters: ReviewFilters): Promise<Review[]> {
  return get<Review[]>("/reviews", {
    params: {
      service_id: filters.service_id,
      provider_id: filters.provider_id,
    },
  });
}

function mapListReviewsResponse(
  data: ServiceReviewsApiResponse,
): ServiceReviewsResult {
  return {
    reviews: (data.reviews ?? []).map(mapServiceReviewItem),
    avgRating:
      Number(data.avgRating ?? (data as { avg_rating?: number }).avg_rating) ||
      0,
  };
}

/**
 * Recent reviews for the public home page.
 * Uses only public endpoints: GET /v1/services + GET /v1/reviews/service/:id
 * (GET /v1/reviews is not available without auth on current review-service builds).
 */
export async function getHomePageReviews(
  limit: number,
): Promise<HomePageReviewsResult> {
  const { services } = await getServices();
  const servicesById: Record<string, Service> = {};
  for (const service of services) {
    servicesById[service.id] = service;
  }
  const serviceIds = services
    .map((s) => Number(s.id))
    .filter((id) => Number.isFinite(id) && id > 0)
    .slice(0, 10);

  if (serviceIds.length === 0) {
    return { reviews: [], avgRating: 0, servicesById };
  }

  const batches = await Promise.all(
    serviceIds.map((id) =>
      getReviewsByService(id).catch(() => ({
        reviews: [] as Review[],
        avgRating: 0,
      })),
    ),
  );

  const seen = new Set<string>();
  const merged: Review[] = [];
  for (const batch of batches) {
    for (const review of batch.reviews) {
      const key = review.id ?? `${review.created_at}-${review.reviewerId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(review);
    }
  }

  merged.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const slice = merged.slice(0, limit);
  const avgRating =
    slice.length > 0
      ? slice.reduce((sum, r) => sum + r.rating, 0) / slice.length
      : 0;

  return { reviews: slice, avgRating, servicesById };
}

/** GET /v1/reviews?limit=&offset= — requires public ListReviews on review-service */
export async function listReviews(
  limit = 10,
  offset = 0,
): Promise<ServiceReviewsResult> {
  const data = await get<ServiceReviewsApiResponse>("/reviews", {
    params: { limit, offset },
  });
  return mapListReviewsResponse(data);
}

/** GET /v1/reviews/service/:serviceId */
export function getReviewsByService(
  serviceId: number,
): Promise<ServiceReviewsResult> {
  return get<ServiceReviewsApiResponse>(`/reviews/service/${serviceId}`).then(
    (data) => ({
      reviews: (data.reviews ?? []).map(mapServiceReviewItem),
      avgRating:
        Number(
          data.avgRating ?? (data as { avg_rating?: number }).avg_rating,
        ) || 0,
    }),
  );
}

/** GET /v1/reviews/provider/:providerId */
export function getReviewsByProvider(
  providerId: number,
): Promise<ServiceReviewsResult> {
  return get<ServiceReviewsApiResponse>(`/reviews/provider/${providerId}`).then(
    (data) => ({
      reviews: (data.reviews ?? []).map(mapServiceReviewItem),
      avgRating:
        Number(
          data.avgRating ?? (data as { avg_rating?: number }).avg_rating,
        ) || 0,
    }),
  );
}
