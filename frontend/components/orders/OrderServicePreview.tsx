"use client";

import Image from "next/image";
import Link from "next/link";
import StarIcon from "@/components/icons/StarIcon";
import { useOrdersTranslation } from "@/lib/i18n/useOrdersTranslation";

export type OrderServicePreviewProps = {
  serviceId: number;
  title: string;
  coverUrl?: string;
  serviceAvgRating: number;
  serviceReviewCount: number;
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

export default function OrderServicePreview({
  serviceId,
  title,
  coverUrl,
  serviceAvgRating,
  serviceReviewCount,
  compact = false,
  loading = false,
}: OrderServicePreviewProps) {
  const { t } = useOrdersTranslation();
  const serviceHref = `/dashboard/${serviceId}`;
  const imgSize = compact ? "w-14 h-12" : "w-24 h-20 sm:w-28 sm:h-[4.5rem]";
  const serviceStars = ratingLine(serviceAvgRating, serviceReviewCount);

  return (
    <div
      className={`flex gap-3 ${compact ? "" : "sm:gap-4"} ${loading ? "opacity-70" : ""}`}
    >
      <Link
        href={serviceHref}
        className={`relative ${imgSize} rounded-lg overflow-hidden bg-gray-100 shrink-0 ring-1 ring-gray-100`}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={serviceHref}
          className={`font-semibold text-gray-900 leading-snug hover:text-[#486284] ${
            compact ? "text-sm line-clamp-2" : "text-[15px] sm:text-base"
          }`}
        >
          {title}
        </Link>
        {serviceStars ? (
          <div className="mt-0.5">{serviceStars}</div>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5">
            {t("preview.noServiceReviews")}
          </p>
        )}
      </div>
    </div>
  );
}
