import type { Review } from "@/lib/api";

/** Integer star 1–5 from API (handles strings and floats). */
export function parseStarRating(rating: unknown): number | null {
  const n = typeof rating === "number" ? rating : Number(rating);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export type StarBreakdownRow = {
  stars: number;
  count: number;
  percentage: number;
};

export function buildStarBreakdown(reviews: Review[]): StarBreakdownRow[] {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let validTotal = 0;

  for (const r of reviews) {
    const star = parseStarRating(r.rating);
    if (star == null) continue;
    counts[star]++;
    validTotal++;
  }

  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars],
    percentage:
      validTotal > 0 ? Math.round((counts[stars] / validTotal) * 100) : 0,
  }));
}

export function computeAverageRating(reviews: Review[]): number {
  let sum = 0;
  let n = 0;
  for (const r of reviews) {
    const star = parseStarRating(r.rating);
    if (star == null) continue;
    sum += star;
    n++;
  }
  return n > 0 ? sum / n : 0;
}
