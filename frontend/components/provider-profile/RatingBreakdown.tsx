"use client";

import Image from "next/image";
import StarIcon from "@/components/icons/StarIcon";
import ReviewPhotoRow from "@/components/common/ReviewPhotoRow";
import { useReviewReviewers, type ReviewerEntry } from "@/hooks/useReviewReviewers";
import type { Review } from "@/lib/api";
import { userDisplayName, userInitials } from "@/lib/reviewerDisplay";
import {
  buildStarBreakdown,
  computeAverageRating,
  parseStarRating,
} from "@/lib/reviewStats";
import { useProviderTranslation } from "@/lib/i18n/useProviderTranslation";

interface RatingBreakdownProps {
  reviews: Review[];
  /** From GET /reviews/provider/:id — preferred over client-side average. */
  avgRating?: number;
}

function StarRating({ rating }: { rating: number }) {
  const star = parseStarRating(rating) ?? 0;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} notActive={i >= star} />
      ))}
    </div>
  );
}

function ReviewItem({
  review,
  entry,
}: {
  review: Review;
  entry?: ReviewerEntry;
}) {
  const { t, i18n } = useProviderTranslation();
  const locale =
    i18n.language === "ru"
      ? "ru-RU"
      : i18n.language === "kk"
        ? "kk-KZ"
        : "en-US";
  const date = new Date(review.created_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const user = entry?.status === "ok" ? entry.user : null;
  const loading = entry?.status === "loading";
  const failed = entry?.status === "error";

  const displayName = user
    ? userDisplayName(user)
    : review.reviewerId
      ? t("reviews.reviewerFallback", { id: review.reviewerId })
      : t("reviews.reviewerAnonymous");

  const initials = user ? userInitials(user) : "?";

  return (
    <div className="py-5 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#486284]/10 ring-2 ring-white shadow-sm flex items-center justify-center text-[#486284] font-semibold text-sm">
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm leading-snug">
                {displayName}
              </h4>
              {loading ? (
                <p className="text-xs text-gray-400 mt-0.5">
                  {t("reviews.reviewerLoading")}
                </p>
              ) : null}
              {failed && review.reviewerId ? (
                <p className="text-xs text-amber-600 mt-0.5">
                  {t("reviews.reviewerUnavailable")}
                </p>
              ) : null}
            </div>
            <span className="text-xs text-gray-400 shrink-0">{date}</span>
          </div>
          <div className="mt-1">
            <StarRating rating={review.rating} />
          </div>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            {review.comment}
          </p>
          <ReviewPhotoRow urls={review.photoUrls} />
        </div>
      </div>
    </div>
  );
}

function EmptyReviews() {
  const { t } = useProviderTranslation();
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            stroke="#D1D5DB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h4 className="font-medium text-gray-500">
        {t("reviews.noReviewsTitle")}
      </h4>
      <p className="text-sm text-gray-400 mt-1">{t("reviews.noReviewsDesc")}</p>
    </div>
  );
}

export default function RatingBreakdown({
  reviews,
  avgRating: avgRatingFromApi,
}: RatingBreakdownProps) {
  const { t, reviewsCountLabel, starCountLabel } = useProviderTranslation();
  const reviewers = useReviewReviewers(reviews);
  const totalReviews = reviews.length;
  const breakdown = buildStarBreakdown(reviews);

  const averageRating =
    totalReviews === 0
      ? 0
      : avgRatingFromApi != null && Number.isFinite(avgRatingFromApi)
        ? avgRatingFromApi
        : computeAverageRating(reviews);

  const filledStars = Math.round(averageRating);

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-10">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {t("reviews.title")}
      </h2>

      {totalReviews === 0 ? (
        <EmptyReviews />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-8 mb-8 p-6 bg-gray-50 rounded-xl">
            <div className="text-center sm:text-left sm:pr-8 sm:border-r sm:border-gray-200">
              <p className="text-5xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-0.5 mt-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon key={i} notActive={i >= filledStars} />
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {reviewsCountLabel(totalReviews)}
              </p>
            </div>

            <div className="flex-1 space-y-2">
              {breakdown.map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-12 text-right shrink-0">
                    {starCountLabel(item.stars)}
                  </span>
                  <div
                    className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden"
                    role="presentation"
                  >
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-[width] duration-500 ease-out"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-14 shrink-0 text-right tabular-nums">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {reviews.map((review) => {
              const rid = review.reviewerId?.trim();
              const key =
                review.id ?? rid ?? `${review.created_at}-${review.rating}`;
              return (
                <ReviewItem
                  key={key}
                  review={review}
                  entry={rid ? reviewers[rid] : undefined}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
