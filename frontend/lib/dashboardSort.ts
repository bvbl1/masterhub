import { readServicePriceStart } from "@/lib/api/services";
import type { Service } from "@/lib/api/types";
import type { ServiceReviewSummary } from "@/components/dashboard/useServiceReviewStats";
import type { DashboardSort } from "@/components/dashboard/dashboardFilters";

export function sortDashboardServices(
  services: Service[],
  sort: DashboardSort | null,
  reviewStats: Record<string, ServiceReviewSummary>,
): Service[] {
  if (!sort) return services;

  const list = [...services];

  switch (sort) {
    case "price_asc":
      return list.sort(
        (a, b) => readServicePriceStart(a) - readServicePriceStart(b),
      );
    case "price_desc":
      return list.sort(
        (a, b) => readServicePriceStart(b) - readServicePriceStart(a),
      );
    case "rating": {
      return list.sort((a, b) => {
        const sa = reviewStats[a.id];
        const sb = reviewStats[b.id];
        const ra = sa?.avgRating ?? 0;
        const rb = sb?.avgRating ?? 0;
        const ca = sa?.count ?? 0;
        const cb = sb?.count ?? 0;
        if (rb !== ra) return rb - ra;
        if (cb !== ca) return cb - ca;
        return readServicePriceStart(a) - readServicePriceStart(b);
      });
    }
    default:
      return list;
  }
}
