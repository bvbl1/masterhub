"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import StarIcon from "@/components/icons/StarIcon";
import ReviewPhotoRow from "@/components/common/ReviewPhotoRow";
import { fadeUp } from "@/lib/motion/presets";
import { useHomeTranslation } from "@/lib/i18n/useHomeTranslation";
import type { Review, Service } from "@/lib/api";
import {
  useReviewReviewers,
  type ReviewerEntry,
} from "@/hooks/useReviewReviewers";
import { userDisplayName, userInitials } from "@/lib/reviewerDisplay";
import { i18n } from "@/lib/i18n/client";
import { loadHomeReviewsCached } from "@/lib/home/homeReviewsCache";

const REVIEWS_PER_PAGE = 3;
const MAX_PAGES = 3;

function chunkReviews(reviews: Review[], pageSize: number, maxPages: number) {
  const pages: Review[][] = [];
  for (let i = 0; i < maxPages; i++) {
    const slice = reviews.slice(i * pageSize, (i + 1) * pageSize);
    if (slice.length === 0) break;
    pages.push(slice);
  }
  return pages;
}

export default function TestimonialsSection() {
  const { t } = useHomeTranslation();
  const reduceMotion = useReducedMotion();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [servicesById, setServicesById] = useState<Record<string, Service>>({});
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const reviewers = useReviewReviewers(reviews);

  useEffect(() => {
    let cancelled = false;

    loadHomeReviewsCached()
      .then((data) => {
        if (cancelled) return;
        setReviews(data.reviews);
        setServicesById(data.servicesById);
      })
      .catch(() => {
        if (!cancelled) {
          setReviews([]);
          setServicesById({});
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const pages = useMemo(
    () => chunkReviews(reviews, REVIEWS_PER_PAGE, MAX_PAGES),
    [reviews],
  );

  const pageCount = pages.length;

  const goToPage = useCallback(
    (index: number) => {
      if (pageCount === 0) return;
      setActivePage(((index % pageCount) + pageCount) % pageCount);
    },
    [pageCount],
  );

  const currentPage = pageCount === 0 ? 0 : Math.min(activePage, pageCount - 1);

  const goPrev = useCallback(
    () => goToPage(currentPage - 1),
    [currentPage, goToPage],
  );
  const goNext = useCallback(
    () => goToPage(currentPage + 1),
    [currentPage, goToPage],
  );

  const slideVariants = reduceMotion
    ? undefined
    : {
        enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
      };

  const [direction, setDirection] = useState(0);

  const navigate = useCallback(
    (next: number) => {
      setDirection(next > currentPage ? 1 : -1);
      goToPage(next);
    },
    [currentPage, goToPage],
  );

  return (
    <section
      id="reviews"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24 scroll-mt-16 lg:scroll-mt-24"
    >
      <motion.div
        className="text-center mb-8 sm:mb-10 lg:mb-12"
        variants={fadeUp}
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.4 }}
      >
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#486284] mb-3 sm:mb-4 leading-tight">
          {t("testimonials.title")}
        </h2>
        <p className="text-[#1A202C]/60 text-sm sm:text-base max-w-2xl mx-auto">
          {t("testimonials.subtitle")}
        </p>
      </motion.div>

      {loading ? (
        <div className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: REVIEWS_PER_PAGE }, (_, i) => (
            <div
              key={i}
              className={`rounded-2xl border border-[#d5dde8] bg-white/70 p-5 sm:p-6 h-56 animate-pulse ${
                i === 2 ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            />
          ))}
        </div>
      ) : pageCount > 0 ? (
        <div className="relative">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
                variants={slideVariants}
                initial={reduceMotion ? false : "enter"}
                animate={reduceMotion ? undefined : "center"}
                exit={reduceMotion ? undefined : "exit"}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {pages[currentPage]?.map((review, i) => {
                  const rid = review.reviewerId?.trim();
                  const key =
                    review.id ?? rid ?? `${review.created_at}-${review.rating}`;
                  const service = review.serviceId
                    ? servicesById[review.serviceId]
                    : undefined;

                  return (
                    <div
                      key={key}
                      className={
                        i === 2 && (pages[currentPage]?.length ?? 0) === 3
                          ? "sm:col-span-2 sm:max-w-md sm:mx-auto lg:col-span-1 lg:max-w-none"
                          : ""
                      }
                    >
                      <ReviewCard
                        review={review}
                        service={service}
                        entry={rid ? reviewers[rid] : undefined}
                        t={t}
                      />
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {pageCount > 1 ? (
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <button
                type="button"
                onClick={() => {
                  setDirection(-1);
                  goPrev();
                }}
                aria-label={t("testimonials.prev")}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#c5d0e0] bg-white text-[#456186] shadow-sm hover:bg-[#f4f7fb] transition-colors"
              >
                <ChevronIcon direction="left" />
              </button>

              <div className="flex items-center gap-2.5">
                {pages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => navigate(i)}
                    aria-label={t("testimonials.pageOf", {
                      current: i + 1,
                      total: pageCount,
                    })}
                    aria-current={currentPage === i}
                    className={`rounded-full transition-all min-w-[8px] ${
                      currentPage === i
                        ? "w-8 h-2.5 bg-[#456186]"
                        : "w-2.5 h-2.5 bg-[#c5d0e0] hover:bg-[#a8b8cc]"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setDirection(1);
                  goNext();
                }}
                aria-label={t("testimonials.next")}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#c5d0e0] bg-white text-[#456186] shadow-sm hover:bg-[#f4f7fb] transition-colors"
              >
                <ChevronIcon direction="right" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const fraction = rating - full;

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <StarIcon key={i} />;
        if (i === full && fraction > 0) {
          return <StarIcon key={i} fillPercent={fraction * 100} />;
        }
        return <StarIcon key={i} notActive />;
      })}
    </div>
  );
}

function ReviewCard({
  review,
  service,
  entry,
  t,
}: {
  review: Review;
  service?: Service;
  entry?: ReviewerEntry;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString(lang, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const user = entry?.status === "ok" ? entry.user : null;
  const displayName = user
    ? userDisplayName(user)
    : review.reviewerId
      ? `#${review.reviewerId}`
      : t("testimonials.anonymousReviewer");
  const initials = user ? userInitials(user) : "?";

  const serviceTitle =
    service?.title?.trim() || t("testimonials.unknownService");
  const serviceCity = service?.city?.trim();
  const serviceHref = review.serviceId
    ? `/dashboard/${review.serviceId}`
    : undefined;
  const cover = service?.photoUrls?.[0];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#d5dde8] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(72,98,132,0.08)]">
      <div className="flex items-start gap-3 mb-4">
        <div className="relative w-12 h-12 rounded-full bg-[#e8edf4] shrink-0 overflow-hidden flex items-center justify-center text-[#486284] font-semibold text-sm ring-2 ring-white shadow-sm">
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

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#1A202C] truncate text-sm sm:text-base">
            {displayName}
          </p>
          {date ? (
            <p className="text-xs text-[#1A202C]/45 mt-0.5">{date}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={review.rating} />
            <span className="text-xs font-bold text-[#456186] tabular-nums">
              {review.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <blockquote className="flex-1 text-[#1A202C]/75 text-sm sm:text-[15px] leading-relaxed line-clamp-5">
        &ldquo;{review.comment}&rdquo;
      </blockquote>

      <ReviewPhotoRow urls={review.photoUrls} />

      {serviceHref ? (
        <Link
          href={serviceHref}
          className="mt-4 pt-4 border-t border-[#e8edf4] group flex items-center gap-3 rounded-xl hover:bg-[#f6f8fb] -mx-1 px-1 py-1 transition-colors"
        >
          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#e8edf4] shrink-0">
            {cover ? (
              <Image
                src={cover}
                alt=""
                fill
                className="object-cover"
                sizes="44px"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#486284]/40">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
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
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wide text-[#486284]/55 font-medium">
              {t("testimonials.reviewedService")}
            </p>
            <p className="text-sm font-semibold text-[#1A202C] truncate group-hover:text-[#456186] transition-colors">
              {serviceTitle}
            </p>
            {serviceCity ? (
              <p className="text-xs text-[#1A202C]/45 truncate">
                {serviceCity}
              </p>
            ) : null}
          </div>
          <span className="text-[#456186]/50 group-hover:text-[#456186] transition-colors shrink-0">
            <ChevronIcon direction="right" />
          </span>
        </Link>
      ) : null}
    </article>
  );
}
