"use client";

import Image from "next/image";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";

export type OrderCustomerPreviewProps = {
  customerId: number;
  customerFallbackLabel: string;
  customerFirstName?: string;
  customerSecondName?: string;
  customerAvatarUrl?: string;
  customerEmail?: string;
  customerPhone?: string;
  compact?: boolean;
  loading?: boolean;
};

export default function OrderCustomerPreview({
  customerId,
  customerFallbackLabel,
  customerFirstName,
  customerSecondName,
  customerAvatarUrl,
  customerEmail,
  customerPhone,
  compact = false,
  loading = false,
}: OrderCustomerPreviewProps) {
  const { t } = useOrdersTranslation();

  const fullName = [customerFirstName, customerSecondName]
    .filter((s) => s && String(s).trim())
    .join(" ")
    .trim();
  const displayName = fullName || customerFallbackLabel;

  const initials = (() => {
    const a = customerFirstName?.trim().charAt(0) ?? "";
    const b = customerSecondName?.trim().charAt(0) ?? "";
    const both = `${a}${b}`.toUpperCase();
    if (both) return both;
    return displayName.charAt(0).toUpperCase() || "?";
  })();

  const avatarSize = compact ? "w-11 h-11 text-sm" : "w-12 h-12 text-base";

  const avatarInner = customerAvatarUrl ? (
    <Image
      src={customerAvatarUrl}
      alt={displayName}
      fill
      className="object-cover"
      unoptimized
    />
  ) : (
    initials
  );

  const email = customerEmail?.trim();
  const phone = customerPhone?.trim();

  return (
    <div
      className={`flex gap-2.5 ${compact ? "items-center" : "items-start"} ${loading ? "opacity-70" : ""}`}
    >
      <div
        className={`relative ${avatarSize} rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm bg-slate-200 flex items-center justify-center text-slate-600 font-bold`}
      >
        {avatarInner}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {t("preview.customer")}
        </p>
        <p
          className={`font-semibold text-gray-900 ${
            compact ? "text-sm line-clamp-2" : "text-base"
          }`}
        >
          {displayName}
        </p>
        <p className="text-[11px] text-gray-400 font-mono mt-0.5">#{customerId}</p>
        {email || phone ? (
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            {email ? (
              <li>
                <span className="text-gray-400 text-xs">{t("detail.customerEmail")}: </span>
                <a
                  href={`mailto:${email}`}
                  className="text-[#486284] hover:underline break-all"
                >
                  {email}
                </a>
              </li>
            ) : null}
            {phone ? (
              <li>
                <span className="text-gray-400 text-xs">{t("detail.customerPhone")}: </span>
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="text-[#486284] hover:underline"
                >
                  {phone}
                </a>
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="text-[11px] text-gray-400 mt-1">{t("detail.customerContactHidden")}</p>
        )}
      </div>
    </div>
  );
}
