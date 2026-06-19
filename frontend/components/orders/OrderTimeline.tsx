"use client";

import type { OrderStatus } from "@/lib/api";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";

interface OrderTimelineProps {
  status: OrderStatus;
}

function getActiveStageIndex(status: OrderStatus): number {
  switch (status) {
    case "pending_provider_acceptance":
      return 0;
    case "pending_payment":
      return 1;
    case "in_progress":
      return 3;
    case "pending_customer_confirmation":
      return 3;
    case "completed":
    case "reviewed":
      return 4;
    case "cancelled":
    case "rejected_by_provider":
    case "disputed":
      return -1;
    default:
      return 0;
  }
}

function isFailed(status: OrderStatus): boolean {
  return (
    status === "cancelled" ||
    status === "rejected_by_provider" ||
    status === "disputed"
  );
}

export default function OrderTimeline({ status }: OrderTimelineProps) {
  const { t } = useOrdersTranslation();

  const steps = [
    { key: "created", label: t("timeline.created") },
    { key: "accepted", label: t("timeline.accepted") },
    { key: "paid", label: t("timeline.paid") },
    { key: "in_progress", label: t("timeline.inProgress") },
    { key: "completed", label: t("timeline.completed") },
  ];

  const activeIndex = getActiveStageIndex(status);
  const failed = isFailed(status);

  const failedLabel =
    status === "rejected_by_provider"
      ? t("timeline.rejected")
      : status === "disputed"
        ? t("timeline.disputeRaised")
        : t("timeline.cancelled");

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-5">
        {t("timeline.title")}
      </h3>

      <div className="relative">
        {steps.map((step, idx) => {
          const isCompleted = !failed && activeIndex >= idx;
          const isCurrent = !failed && activeIndex === idx;

          let dotColor = "bg-gray-200";
          let lineColor = "bg-gray-200";
          let textColor = "text-gray-400";

          if (isCompleted && idx < activeIndex) {
            dotColor = "bg-green-500";
            lineColor = "bg-green-500";
            textColor = "text-gray-700";
          } else if (isCurrent) {
            dotColor = "bg-[#486284]";
            textColor = "text-gray-900 font-semibold";
          }

          if (failed && idx === 0) {
            dotColor = "bg-green-500";
            textColor = "text-gray-700";
          }

          return (
            <div key={step.key} className="flex items-start gap-4 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 z-10 ring-4 ring-white ${dotColor} ${
                    isCurrent ? "ring-[#486284]/10" : ""
                  }`}
                />
                {idx < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-12 ${
                      isCompleted && idx < activeIndex
                        ? lineColor
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>

              <div
                className={`pb-8 -mt-0.5 ${
                  idx === steps.length - 1 ? "pb-0" : ""
                }`}
              >
                <p className={`text-sm ${textColor}`}>{step.label}</p>
                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-[#486284]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#486284] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#486284]" />
                    </span>
                    {t("timeline.currentStage")}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}

        {failed ? (
          <div className="flex items-start gap-4 mt-0 relative">
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-gray-200 -mt-8 mb-2" />
              <div
                className={`w-3 h-3 rounded-full shrink-0 z-10 ring-4 ring-white ${
                  status === "rejected_by_provider"
                    ? "bg-red-400"
                    : status === "disputed"
                      ? "bg-orange-400"
                      : "bg-gray-400"
                }`}
              />
            </div>
            <div className="-mt-0.5">
              <p
                className={`text-sm font-semibold ${
                  status === "rejected_by_provider"
                    ? "text-red-600"
                    : status === "disputed"
                      ? "text-orange-600"
                      : "text-gray-500"
                }`}
              >
                {failedLabel}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
