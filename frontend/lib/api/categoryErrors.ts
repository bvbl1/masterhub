/** Postgres unique violation on categories.category_name */
export function isDuplicateCategoryNameError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("duplicate key") ||
    m.includes("23505") ||
    m.includes("idx_categories_category_name") ||
    m.includes("unique constraint")
  );
}
