"use client";

import type { OrderStatus } from "@/lib/api";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";

const statusStyles: Record<
  OrderStatus,
  { bg: string; text: string; dot: string }
> = {
  pending_provider_acceptance: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-400",
  },
  pending_payment: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-400",
  },
  pending_customer_confirmation: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-400",
  },
  in_progress: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-400",
  },
  completed: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  reviewed: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  cancelled: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-400",
  },
  rejected_by_provider: {
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-400",
  },
  disputed: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    dot: "bg-orange-400",
  },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const { statusLabel } = useOrdersTranslation();
  const styles = statusStyles[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles.bg} ${styles.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {statusLabel(status)}
    </span>
  );
}
