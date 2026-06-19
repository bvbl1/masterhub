"use client";

import { useTranslation } from "react-i18next";

/** Typed helper for the default `common` namespace. */
export function useAppTranslation() {
  return useTranslation("common");
}
