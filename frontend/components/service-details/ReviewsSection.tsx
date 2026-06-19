"use client";

import Image from "next/image";
import StarIcon from "@/components/icons/StarIcon";
import ReviewPhotoRow from "@/components/common/ReviewPhotoRow";
import { useReviewReviewers, type ReviewerEntry } from "@/hooks/useReviewReviewers";
import { type Review, type UserRole } from "@/lib/api";
import { userDisplayName, userInitials } from "@/lib/reviewerDisplay";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";

interface ReviewsSectionProps {
  reviews: Review[];
  onViewAll?: () => void;
}

function roleLabel(
  role: UserRole | undefined,
  t: (key: string) => string,
): string {
  switch (role) {
    case "customer":
      return t("serviceDetail.reviewerRoleCustomer");
    case "provider":
      return t("serviceDetail.reviewerRoleProvider");
    case "admin":
      return t("serviceDetail.reviewerRoleAdmin");
    default:
      return "";
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} notActive={i >= rating} />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  entry,
  t,
}: {
  review: Review;
  entry?: ReviewerEntry;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const date = new Date(review.created_at).toLocaleDateString(lang, {
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
      ? t("serviceDetail.reviewerFallback", { id: review.reviewerId })
      : t("serviceDetail.user");

  const initials = user ? userInitials(user) : "?";
  const role = user ? roleLabel(user.role, t) : "";

  return (
    <div className="py-5 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm bg-[#486284]/10 flex items-center justify-center text-[#486284] font-semibold text-sm">
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
                  {t("serviceDetail.reviewerLoading")}
                </p>
              ) : null}
              {failed && review.reviewerId ? (
                <p className="text-xs text-amber-600 mt-0.5">
                  {t("serviceDetail.reviewerUnavailable")}
                </p>
              ) : null}
            </div>
            <span className="text-xs text-gray-400 shrink-0">{date}</span>
          </div>
          <div className="mt-2">
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
  const { t } = useTranslation("common", { i18n });
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
        {t("serviceDetail.reviewsEmptyTitle")}
      </h4>
      <p className="text-sm text-gray-400 mt-1">
        {t("serviceDetail.reviewsEmptyHint")}
      </p>
    </div>
  );
}

export default function ReviewsSection({
  reviews,
  onViewAll,
}: ReviewsSectionProps) {
  const { t } = useTranslation("common", { i18n });
  const reviewers = useReviewReviewers(reviews);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("serviceDetail.reviewsTitle")}
          {reviews.length > 0 && (
            <span className="text-gray-400 font-normal ml-2 text-base">
              ({reviews.length})
            </span>
          )}
        </h3>
      </div>

      {reviews.length === 0 ? (
        <EmptyReviews />
      ) : (
        <>
          <div>
            {reviews.slice(0, 3).map((review) => {
              const rid = review.reviewerId?.trim();
              const key =
                review.id ?? rid ?? `${review.created_at}-${review.rating}`;
              return (
                <ReviewCard
                  key={key}
                  review={review}
                  entry={rid ? reviewers[rid] : undefined}
                  t={t}
                />
              );
            })}
          </div>
          {reviews.length > 3 && onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="mt-4 w-full py-2.5 text-sm font-medium text-[#486284] bg-[#486284]/10 hover:bg-[#486284]/15 rounded-lg transition-colors"
            >
              {t("serviceDetail.viewAllReviews", { count: reviews.length })}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
