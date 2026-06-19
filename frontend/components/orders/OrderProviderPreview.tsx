"use client";

import Image from "next/image";
import Link from "next/link";
import StarIcon from "@/components/icons/StarIcon";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";

export type OrderProviderPreviewProps = {
  /** Если пусто — без ссылки на профиль */
  providerId?: string;
  providerFallbackLabel: string;
  providerFirstName?: string;
  providerSecondName?: string;
  providerAvatarUrl?: string;
  providerAvgRating: number;
  providerReviewCount: number;
  compact?: boolean;
  loading?: boolean;
};

function ratingLine(avg: number, count: number) {
  if (count <= 0 || !Number.isFinite(avg) || avg <= 0) return null;
  return (
    <div className="flex items-center gap-1 text-sm text-gray-600">
      <StarIcon />
      <span className="font-semibold text-gray-900">{avg.toFixed(1)}</span>
      <span className="text-gray-400">({count})</span>
    </div>
  );
}

export default function OrderProviderPreview({
  providerId,
  providerFallbackLabel,
  providerFirstName,
  providerSecondName,
  providerAvatarUrl,
  providerAvgRating,
  providerReviewCount,
  compact = false,
  loading = false,
}: OrderProviderPreviewProps) {
  const { t } = useOrdersTranslation();
  const providerHref =
    providerId && providerId !== "0"
      ? `/provider/${providerId}`
      : null;

  const fullName = [providerFirstName, providerSecondName]
    .filter((s) => s && String(s).trim())
    .join(" ")
    .trim();
  const providerDisplay = fullName || providerFallbackLabel;

  const initials = (() => {
    const a = providerFirstName?.trim().charAt(0) ?? "";
    const b = providerSecondName?.trim().charAt(0) ?? "";
    const both = `${a}${b}`.toUpperCase();
    if (both) return both;
    const fb = providerFallbackLabel.replace(/^Provider\s*#?\s*/i, "").trim();
    return fb ? fb.charAt(0).toUpperCase() : "?";
  })();

  const avatarSize = compact ? "w-11 h-11 text-sm" : "w-12 h-12 text-base";
  const providerStars = ratingLine(providerAvgRating, providerReviewCount);

  const avatarInner = providerAvatarUrl ? (
    <Image
      src={providerAvatarUrl}
      alt={providerDisplay}
      fill
      className="object-cover"
      unoptimized
    />
  ) : (
    initials
  );

  return (
    <div
      className={`flex gap-2.5 ${compact ? "items-center" : "items-start"} ${loading ? "opacity-70" : ""}`}
    >
      {providerHref ? (
        <Link
          href={providerHref}
          className={`relative ${avatarSize} rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm bg-[#486284]/10 flex items-center justify-center text-[#486284] font-bold`}
        >
          {avatarInner}
        </Link>
      ) : (
        <div
          className={`relative ${avatarSize} rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm bg-[#486284]/10 flex items-center justify-center text-[#486284] font-bold`}
        >
          {avatarInner}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {t("preview.provider")}
        </p>
        {providerHref ? (
          <Link
            href={providerHref}
            className={`font-semibold text-gray-900 hover:text-[#486284] hover:underline ${
              compact ? "text-sm line-clamp-2" : "text-base"
            }`}
          >
            {providerDisplay}
          </Link>
        ) : (
          <p
            className={`font-semibold text-gray-900 ${
              compact ? "text-sm line-clamp-2" : "text-base"
            }`}
          >
            {providerDisplay}
          </p>
        )}
        {providerStars ? (
          <div className="mt-0.5">{providerStars}</div>
        ) : (
          <p className="text-[11px] text-gray-400 mt-0.5">
            {t("preview.noProviderReviews")}
          </p>
        )}
      </div>
    </div>
  );
}
