const LOCALE = "ru-RU";

export type FormatCurrencyOptions = {
  /** Number of fraction digits (default 0). */
  decimals?: number;
};

/** Formats amount as "1 234 тг". Returns "—" for invalid values. */
export function formatCurrency(
  amount: number,
  options?: FormatCurrencyOptions,
): string {
  if (!Number.isFinite(amount)) return "—";
  const decimals = options?.decimals ?? 0;
  return `${amount.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ₸`;
}

export function formatCurrencyRange(
  min: number,
  max: number,
  options?: FormatCurrencyOptions,
): string {
  return `${formatCurrency(min, options)} – ${formatCurrency(max, options)}`;
}
