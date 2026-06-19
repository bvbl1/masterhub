"use client";

import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";

export function useProviderTranslation() {
  const { t, i18n: inst } = useTranslation("provider", { i18n });

  const servicesCountLabel = (count: number) =>
    count === 1
      ? t("hero.servicesCount_one", { count })
      : t("hero.servicesCount", { count });

  const reviewsCountLabel = (count: number) =>
    count === 1
      ? t("reviews.reviewsCount_one", { count })
      : t("reviews.reviewsCount", { count });

  const starCountLabel = (stars: number) =>
    stars === 1
      ? t("reviews.oneStar", { count: stars })
      : t("reviews.nStars", { count: stars });

  return {
    t,
    i18n: inst,
    servicesCountLabel,
    reviewsCountLabel,
    starCountLabel,
  };
}
