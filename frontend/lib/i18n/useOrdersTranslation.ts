"use client";

import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";
import type { OrderStatus, UserRole } from "@/lib/api";

export function useOrdersTranslation() {
  const { t, i18n: inst } = useTranslation("orders", { i18n });

  const statusLabel = (status: OrderStatus) =>
    t(`status.${status}`, { defaultValue: status });

  const panelMessage = (status: OrderStatus, role: UserRole) =>
    t(`panel.message.${status}.${role}`, {
      defaultValue: t("panel.unknownStatus"),
    });

  return { t, i18n: inst, statusLabel, panelMessage };
}
