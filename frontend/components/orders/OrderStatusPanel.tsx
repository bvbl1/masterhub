"use client";

import type { OrderStatus, UserRole } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";
import type { TFunction } from "i18next";

interface OrderStatusPanelProps {
  status: OrderStatus;
  role: UserRole;
  price: number;
  onAction: (action: string) => void;
}

function getActions(
  status: OrderStatus,
  role: UserRole,
  t: TFunction<"orders">,
): {
  label: string;
  action: string;
  variant: "primary" | "secondary" | "danger";
}[] {
  if (role === "admin") {
    return [];
  }

  const actions: {
    label: string;
    action: string;
    variant: "primary" | "secondary" | "danger";
  }[] = [];

  if (role === "customer") {
    switch (status) {
      case "pending_payment":
        actions.push({
          label: t("actions.payNowPanel"),
          action: "pay",
          variant: "primary",
        });
        break;
      case "pending_customer_confirmation":
        actions.push({
          label: t("actions.confirmCompletionPanel"),
          action: "confirm",
          variant: "primary",
        });
        break;
      case "completed":
        actions.push({
          label: t("actions.leaveReviewPanel"),
          action: "review",
          variant: "secondary",
        });
        break;
      case "reviewed":
        break;
    }
  }

  if (role === "provider") {
    switch (status) {
      case "pending_provider_acceptance":
        actions.push({
          label: t("actions.acceptOrderPanel"),
          action: "accept",
          variant: "primary",
        });
        actions.push({
          label: t("actions.rejectOrder"),
          action: "reject",
          variant: "danger",
        });
        break;
      case "in_progress":
        actions.push({
          label: t("actions.markCompleted"),
          action: "complete",
          variant: "primary",
        });
        break;
    }
  }

  const cancellable: OrderStatus[] = [
    "pending_provider_acceptance",
    "pending_payment",
  ];
  if (cancellable.includes(status)) {
    actions.push({
      label: t("actions.cancelOrder"),
      action: "cancel",
      variant: "danger",
    });
  }

  const disputable: OrderStatus[] = [
    "in_progress",
    "pending_customer_confirmation",
  ];
  if (disputable.includes(status)) {
    actions.push({
      label: t("actions.raiseDispute"),
      action: "dispute",
      variant: "danger",
    });
  }

  return actions;
}

export default function OrderStatusPanel({
  status,
  role,
  price,
  onAction,
}: OrderStatusPanelProps) {
  const { t, panelMessage } = useOrdersTranslation();
  const message = panelMessage(status, role);
  const actions = getActions(status, role, t);

  return (
    <div className="sticky top-100">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>

        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
            {t("panel.orderTotal")}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(price, { decimals: 2 })}
          </p>
        </div>

        {actions.length > 0 && (
          <div className="px-6 py-5 space-y-2.5">
            {actions.map((act) => (
              <button
                key={act.action}
                onClick={() => onAction(act.action)}
                className={`w-full py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors ${
                  act.variant === "primary"
                    ? "bg-[#486284] hover:bg-[#3a5270] text-white"
                    : act.variant === "danger"
                      ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => onAction("open_chat")}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="M0 20V2C0 1.45.196.979.588.588A1.93 1.93 0 012 0h16c.55 0 1.021.196 1.413.588.391.391.587.862.587 1.412v12c0 .55-.196 1.021-.587 1.413A1.93 1.93 0 0118 16H4L0 20z"
                fill="#9CA3AF"
              />
            </svg>
            {t("panel.openChat")}
          </button>
        </div>
      </div>
    </div>
  );
}
