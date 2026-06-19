"use client";

import { formatCurrency } from "@/lib/formatCurrency";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";

interface PricingSidebarProps {
  priceStart: number;
  onCreateOrder: () => void;
  onMessageProvider: () => void;
  /** Only customers can create orders / message providers from marketplace cards. */
  showCustomerActions?: boolean;
}

export default function PricingSidebar({
  priceStart,
  onCreateOrder,
  onMessageProvider,
  showCustomerActions = false,
}: PricingSidebarProps) {
  const { t } = useTranslation("common", { i18n });

  return (
    <div className="sticky top-20">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-sm text-gray-500 mb-1">
            {t("serviceDetail.startingFrom")}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(priceStart)}
          </p>
        </div>

        <div className="space-y-2.5 mb-6 pt-5 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="#22C55E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-600">
              {t("serviceDetail.verifiedProvider")}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M10.5 5.5C10.5 8.5 6 11 6 11C6 11 1.5 8.5 1.5 5.5C1.5 4.30653 1.97411 3.16193 2.81802 2.31802C3.66193 1.47411 4.80653 1 6 1C7.19347 1 8.33807 1.47411 9.18198 2.31802C10.0259 3.16193 10.5 4.30653 10.5 5.5Z"
                  stroke="#8B5CF6"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-600">
              {t("serviceDetail.safePayments")}
            </span>
          </div>
        </div>

        {showCustomerActions ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={onCreateOrder}
              className="w-full py-3 px-4 bg-[#486284] hover:bg-[#3a5270] text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {t("serviceDetail.createOrder")}
            </button>
            <button
              type="button"
              onClick={onMessageProvider}
              className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
            >
              {t("serviceDetail.messageProvider")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
