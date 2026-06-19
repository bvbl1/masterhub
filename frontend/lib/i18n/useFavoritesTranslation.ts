"use client";

import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";

export function useFavoritesTranslation() {
  const { t, i18n: inst } = useTranslation("favorites", { i18n });

  const reviewCountLabel = (count: number) =>
    count === 1 ? t("review") : t("reviews");

  return { t, i18n: inst, reviewCountLabel };
}
