import type { Review, Service } from "@/lib/api";
import { getHomePageReviews } from "@/lib/api/reviews";

export const HOME_REVIEWS_MAX = 9;
const SESSION_KEY = "masterhub_home_reviews_v1";

export type HomeReviewsCache = {
  reviews: Review[];
  servicesById: Record<string, Service>;
};

let memoryCache: HomeReviewsCache | null = null;

function readSessionCache(): HomeReviewsCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeReviewsCache;
    if (!Array.isArray(parsed.reviews) || !parsed.servicesById) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(payload: HomeReviewsCache): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

/** Loads home testimonials once per tab session (memory + sessionStorage). */
export async function loadHomeReviewsCached(): Promise<HomeReviewsCache> {
  if (memoryCache) return memoryCache;

  const fromSession = readSessionCache();
  if (fromSession) {
    memoryCache = fromSession;
    return fromSession;
  }

  const data = await getHomePageReviews(HOME_REVIEWS_MAX);
  const payload: HomeReviewsCache = {
    reviews: data.reviews,
    servicesById: data.servicesById,
  };

  memoryCache = payload;
  writeSessionCache(payload);
  return payload;
}
