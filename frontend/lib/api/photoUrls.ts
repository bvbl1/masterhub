/** Normalize photo URL arrays from gateway (camelCase / snake_case). */
export function collectPhotoUrls(
  raw: Record<string, unknown> | null | undefined,
): string[] {
  if (!raw) return [];
  const from = [
    raw.photoUrls,
    raw.photo_urls,
    raw.PhotoUrls,
  ];
  const out: string[] = [];
  for (const v of from) {
    if (!Array.isArray(v)) continue;
    for (const item of v) {
      const s = String(item ?? "").trim();
      if (s && !out.includes(s)) out.push(s);
    }
  }
  return out;
}
