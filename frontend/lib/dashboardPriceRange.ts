import { readServicePriceStart } from "@/lib/api/services";
import type { Service } from "@/lib/api/types";

/** Round up for a readable price slider maximum (₸). */
export function roundUpSliderMax(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 2000;
  if (n <= 500) return Math.max(100, Math.ceil(n / 50) * 50);
  if (n <= 5_000) return Math.ceil(n / 100) * 100;
  if (n <= 50_000) return Math.ceil(n / 500) * 500;
  return Math.ceil(n / 1_000) * 1_000;
}

/** Prices used for slider cap (category + city, not price/rating filters). */
export function collectPricesForSlider(
  services: Service[],
  filters: { category: string; city: string },
): number[] {
  const wantCity = filters.city.trim().toLowerCase();

  return services
    .filter((ser) => {
      if (filters.category && String(ser.categoryId) !== String(filters.category)) {
        return false;
      }
      if (wantCity) {
        const c = ser.city?.trim().toLowerCase() ?? "";
        if (c !== wantCity) return false;
      }
      if (ser.isActive === false) return false;
      return true;
    })
    .map((s) => readServicePriceStart(s))
    .filter((p) => p > 0);
}

/** Max price for dashboard filter slider from loaded service prices. */
export function computeSliderMaxFromPrices(prices: number[]): number {
  const valid = prices
    .map((p) => Number(p))
    .filter((p) => Number.isFinite(p) && p > 0);
  if (!valid.length) return 2000;
  return roundUpSliderMax(Math.max(...valid));
}

export function computeSliderMaxFromServices(
  services: Service[],
  filters: { category: string; city: string },
): number {
  return computeSliderMaxFromPrices(collectPricesForSlider(services, filters));
}
