"use client";

import OrderProviderPreview, {
  type OrderProviderPreviewProps,
} from "./OrderProviderPreview";
import { formatCurrency } from "@/lib/formatCurrency";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";

interface OrderSummaryProps {
  provider: Omit<OrderProviderPreviewProps, "compact">;
  date: string;
  time: string;
  address: string;
  price: string;
  submitting: boolean;
  onSubmit: () => void;
}

export default function OrderSummary({
  provider,
  date,
  time,
  address,
  price,
  submitting,
  onSubmit,
}: OrderSummaryProps) {
  const { t } = useOrdersTranslation();
  const hasDate = date.length > 0;
  const hasTime = time.length > 0;
  const hasAddress = address.trim().length > 0;
  const parsedPrice = parseFloat(price);
  const hasPrice = !isNaN(parsedPrice) && parsedPrice > 0;

  const dateTimeValue =
    hasDate || hasTime
      ? `${hasDate ? date : "—"} ${hasTime ? t("summary.atTime", { time }) : ""}`.trim()
      : null;

  return (
    <div className="sticky top-20">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            {t("summary.title")}
          </h3>
        </div>

        <div className="px-6 py-4 border-b border-gray-100">
          <OrderProviderPreview {...provider} compact />
        </div>

        <div className="px-6 py-4 space-y-3 border-b border-gray-100">
          <SummaryRow
            label={t("summary.dateTime")}
            value={dateTimeValue}
            notSet={t("summary.notSet")}
          />
          <SummaryRow
            label={t("summary.address")}
            value={hasAddress ? address : null}
            notSet={t("summary.notSet")}
          />
        </div>

        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("summary.agreedPrice")}</span>
            <span className="text-xl font-bold text-gray-900">
              {hasPrice ? formatCurrency(parsedPrice, { decimals: 2 }) : "—"}
            </span>
          </div>
        </div>

        <div className="px-6 py-5">
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full py-3 px-4 bg-[#486284] hover:bg-[#3a5270] disabled:bg-[#486284]/40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {t("summary.creating")}
              </>
            ) : (
              t("summary.createOrder")
            )}
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-2.5 leading-relaxed">
            {t("summary.terms")}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  notSet,
}: {
  label: string;
  value: string | null;
  notSet: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-sm text-right ${value ? "text-gray-900 font-medium" : "text-gray-300"}`}
      >
        {value ?? notSet}
      </span>
    </div>
  );
}
