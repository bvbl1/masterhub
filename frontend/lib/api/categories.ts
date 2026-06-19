import { del, get, patch, post } from "./client";
import type { Category } from "./types";

interface CategoriesResponse {
  categories: Category[];
}

interface CategoryResponse {
  category: Category;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  icon: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string;
  icon: string;
}

/** gRPC-Gateway + proto json tag expects `Icon`, not `icon` (see masterhub-proto category.pb.go). */
function categoryWriteBody(data: CreateCategoryRequest | UpdateCategoryRequest) {
  return {
    name: data.name,
    description: data.description,
    Icon: data.icon,
  };
}

function normalizeCategory(raw: Record<string, unknown>): Category {
  const iconRaw =
    raw.icon ?? raw.Icon ?? raw.icon_url ?? raw.iconUrl ?? raw.iconURL;
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    icon:
      iconRaw != null && String(iconRaw).trim() !== ""
        ? String(iconRaw).trim()
        : undefined,
  };
}

export function getCategories(): Promise<CategoriesResponse> {
  return get<unknown>("/categories").then((raw) => {
    const body = raw as { categories?: Record<string, unknown>[] };
    const list = body.categories ?? [];
    return { categories: list.map((c) => normalizeCategory(c)) };
  });
}

export function getCategory(id: number | string): Promise<CategoryResponse> {
  return get<unknown>(`/categories/${id}`).then((raw) => {
    const body = raw as { category?: Record<string, unknown> };
    const c = body.category ?? (raw as Record<string, unknown>);
    return { category: normalizeCategory(c) };
  });
}

export function createCategory(
  data: CreateCategoryRequest,
): Promise<CategoryResponse> {
  return post<unknown>("/categories", categoryWriteBody(data), { auth: true }).then((raw) => {
    const body = raw as { category?: Record<string, unknown> };
    const c = body.category ?? (raw as Record<string, unknown>);
    return { category: normalizeCategory(c) };
  });
}

export function updateCategory(
  id: number | string,
  data: UpdateCategoryRequest,
): Promise<CategoryResponse> {
  return patch<unknown>(`/categories/${id}`, categoryWriteBody(data), { auth: true }).then(
    (raw) => {
      const body = raw as { category?: Record<string, unknown> };
      const c = body.category ?? (raw as Record<string, unknown>);
      return { category: normalizeCategory(c) };
    },
  );
}

export function deleteCategory(id: number | string): Promise<void> {
  return del<void>(`/categories/${id}`, { auth: true });
}
