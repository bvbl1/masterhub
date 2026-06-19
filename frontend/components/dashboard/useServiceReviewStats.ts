"use client";

import { useEffect, useMemo, useState } from "react";
import { reviewsApi, type Service } from "@/lib/api";

export type ServiceReviewSummary = { avgRating: number; count: number };

export function useServiceReviewStats(services: Service[], loading: boolean) {
  const [reviewStats, setReviewStats] = useState<
    Record<string, ServiceReviewSummary>
  >({});

  const serviceIdsKey = useMemo(
    () =>
      [...services]
        .map((s) => s.id)
        .sort()
        .join(","),
    [services],
  );

  useEffect(() => {
    if (loading || services.length === 0) {
      setReviewStats({});
      return;
    }

    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        services.map(async (s) => {
          const id = parseInt(s.id, 10);
          if (!Number.isFinite(id)) {
            return { id: s.id, avgRating: 0, count: 0 };
          }
          try {
            const data = await reviewsApi.getReviewsByService(id);
            return {
              id: s.id,
              avgRating: data.avgRating,
              count: data.reviews.length,
            };
          } catch {
            return { id: s.id, avgRating: 0, count: 0 };
          }
        }),
      );

      if (cancelled) return;

      const next: Record<string, ServiceReviewSummary> = {};
      for (const r of results) {
        next[r.id] = { avgRating: r.avgRating, count: r.count };
      }
      setReviewStats(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, serviceIdsKey, services]);

  return reviewStats;
}
