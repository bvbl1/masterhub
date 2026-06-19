export const locales = ["en", "ru", "kk"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "En",
  ru: "Ru",
  kk: "Kk",
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  kk: "Қазақша",
};

export const LOCALE_STORAGE_KEY = "masterhub_locale";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
