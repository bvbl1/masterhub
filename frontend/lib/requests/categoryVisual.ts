import type { Category } from "@/lib/api";

const PALETTES = [
  { bg: "bg-sky-50", text: "text-sky-600", ring: "ring-sky-100" },
  { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100" },
  { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100" },
  { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
  { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100" },
  { bg: "bg-cyan-50", text: "text-cyan-600", ring: "ring-cyan-100" },
] as const;

export function categoryVisual(
  categoryId: number,
  categories: Category[],
): {
  label: string;
  palette: (typeof PALETTES)[number];
  initial: string;
  icon?: string;
} {
  const cat = categories.find((c) => Number(c.id) === categoryId);
  const label = cat?.name?.trim() || "Service";
  const initial = label.charAt(0).toUpperCase() || "?";
  const palette = PALETTES[Math.abs(categoryId) % PALETTES.length];
  return { label, palette, initial, icon: cat?.icon };
}
