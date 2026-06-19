export const RATING_FILTER_OPTIONS = [4.5, 4, 3.5] as const;

export type MinRatingFilter = (typeof RATING_FILTER_OPTIONS)[number];

export type DashboardSort = "rating" | "price_asc" | "price_desc";

export const SORT_OPTIONS: DashboardSort[] = [
  "rating",
  "price_asc",
  "price_desc",
];

export interface DashboardFilters {
  category: string;
  city: string;
  priceFrom: number;
  priceTo: number;
  minRatings: MinRatingFilter[];
  sort: DashboardSort | null;
}

export function createDefaultDashboardFilters(priceTo = 2000): DashboardFilters {
  return {
    category: "",
    city: "",
    priceFrom: 0,
    priceTo,
    minRatings: [],
    sort: null,
  };
}
