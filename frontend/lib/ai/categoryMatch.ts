import type { Category } from "@/lib/api/types";

/**
 * Prefer highest-scoring category when hints (e.g. AI service_type) overlap name/description.
 */
export function bestCategoryMatch(
  categories: Category[],
  ...hints: Array<string | undefined | null>
): Category | null {
  const needles = hints
    .map((h) => (h ?? "").trim().toLowerCase())
    .filter((h) => h.length >= 2);
  if (!needles.length || !categories.length) return null;

  let best: { c: Category; score: number } | null = null;

  for (const cat of categories) {
    const name = cat.name.trim().toLowerCase();
    const desc = (cat.description ?? "").trim().toLowerCase();
    let score = 0;

    for (const n of needles) {
      const parts = name.split(/\s+/).filter((w) => w.length > 2);
      const words = [...parts, ...n.split(/[\s,./]+/).filter((w) => w.length > 2)];

      if (name && (n.includes(name) || name.includes(n))) score += 5;
      if (desc.includes(n)) score += 2;
      if (parts.some((w) => n.includes(w))) score += 3;
      const seen = new Set(words);
      for (const tok of new Set(n.split(/[\s,./\-]+/).filter((t) => t.length > 2))) {
        if (seen.has(tok) || name.includes(tok) || desc.includes(tok)) score += 1;
      }
    }

    if (!best || score > best.score) best = { c: cat, score };
  }

  return best && best.score >= 2 ? best.c : null;
}
