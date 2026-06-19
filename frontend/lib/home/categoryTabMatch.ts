import type { Category, Service } from "@/lib/api";
import type { HomeServiceTabId } from "@/lib/i18n/useHomeTranslation";

const TAB_MATCHERS: Record<HomeServiceTabId, RegExp[]> = {
  construction: [/construct/i, /строит/i, /құрылыс/i],
  renovation: [/renovat/i, /renovation/i, /отделк/i],
  installation: [/install/i, /монтаж/i, /орнат/i, /ұсын/i],
  repair: [/repair/i, /ремонт/i, /жөндеу/i],
};

/** Category ids whose name/description matches the home tab label theme. */
export function resolveCategoryIdsForTab(
  tab: HomeServiceTabId,
  categories: Category[],
): string[] {
  const patterns = TAB_MATCHERS[tab];
  const matched = categories.filter((c) => {
    const text = `${c.name} ${c.description}`.toLowerCase();
    return patterns.some((p) => p.test(text));
  });
  return matched.map((c) => String(c.id));
}

const HOME_SERVICES_LIMIT = 3;

export function filterHomeServicesByTab(
  services: Service[],
  tab: HomeServiceTabId,
  categories: Category[],
): Service[] {
  const active = services.filter((s) => s.isActive !== false);
  const categoryIds = resolveCategoryIdsForTab(tab, categories);
  const filtered =
    categoryIds.length > 0
      ? active.filter((s) => categoryIds.includes(String(s.categoryId)))
      : active;
  return filtered.slice(0, HOME_SERVICES_LIMIT);
}

export { HOME_SERVICES_LIMIT };
