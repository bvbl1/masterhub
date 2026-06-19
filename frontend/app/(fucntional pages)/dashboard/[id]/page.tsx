"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import StarIcon from "@/components/icons/StarIcon";
import ReviewsSection from "@/components/service-details/ReviewsSection";
import ProviderCard from "@/components/service-details/ProviderCard";
import PricingSidebar from "@/components/service-details/PricingSidebar";
import ServiceSkeleton from "@/components/service-details/ServiceSkeleton";
import { servicesApi, reviewsApi, type Service, type Review } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n/client";

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("common", { i18n });
  return (
    <div className="flex justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" />
            <path
              d="M12 8V12M12 16H12.01"
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t("serviceDetail.errorTitle")}
        </h2>
        <p className="text-gray-500 mb-6">{t("serviceDetail.errorBody")}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-[#486284] hover:bg-[#3a5270] text-white font-medium rounded-lg transition-colors text-sm"
        >
          {t("serviceDetail.tryAgain")}
        </button>
      </div>
    </div>
  );
}

export default function ServicePage() {
  const { t } = useTranslation("common", { i18n });
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const serviceId = Number(params.id);

  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const loadService = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [svc, revResult] = await Promise.all([
        servicesApi.getService(serviceId),
        reviewsApi
          .getReviewsByService(serviceId)
          .catch(() => ({ reviews: [] as Review[], avgRating: 0 })),
      ]);
      setService(svc.service);
      setReviews(revResult.reviews);
      setAvgRating(revResult.avgRating);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  if (loading) return <ServiceSkeleton />;
  if (error || !service) return <ErrorState onRetry={loadService} />;

  const avgRatingDisplay =
    reviews.length > 0 ? avgRating.toFixed(1) : null;

  const galleryImages =
    service.photoUrls && service.photoUrls.length > 0
      ? service.photoUrls
      : ["/Wall Painting.webp", "/Apartment Renovation.png"];

  return (
    <div className="flex justify-center px-6 py-8">
      <div className="max-w-[1200px] w-full">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {service.title}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            {avgRatingDisplay ? (
              <>
                <div className="flex items-center gap-1">
                  <StarIcon />
                  <span className="font-semibold text-gray-900">
                    {avgRatingDisplay}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {reviews.length === 1
                    ? t("serviceDetail.reviewCount", { count: reviews.length })
                    : t("serviceDetail.reviewsCount", { count: reviews.length })}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400">
                {t("serviceDetail.noReviewsYet")}
              </span>
            )}
          </div>
        </div>
        {/* Gallery Section (Placeholder for provider-uploaded images) */}

        <div className="flex gap-8">
          <div className="">
            <div className="mb-8">
              <div
                ref={galleryRef}
                onScroll={() => {
                  const el = galleryRef.current;
                  if (!el) return;
                  const idx = Math.round(el.scrollLeft / el.offsetWidth);
                  setActiveSlide(idx);
                }}
                className="flex max-w-200 rounded-lg overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {galleryImages.map((src, i) => (
                  <div
                    key={i}
                    className="snap-center shrink-0 w-full bg-gray-100 border border-gray-200 rounded-md"
                  >
                    <Image
                      width={800}
                      height={500}
                      src={src}
                      unoptimized
                      alt={t("serviceDetail.galleryAlt", { index: i + 1 })}
                      className="w-full max-h-120 object-center object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="w-full items-center gap-3 justify-center my-5 flex">
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const el = galleryRef.current;
                      if (!el) return;
                      el.scrollTo({
                        left: i * el.offsetWidth,
                        behavior: "smooth",
                      });
                    }}
                    className={`rounded-full transition-all ${
                      activeSlide === i
                        ? "w-6 h-3 bg-[#486284]"
                        : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Description */}
            <div className="mt-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {t("serviceDetail.aboutService")}
              </h2>
              <hr className=" text-gray-200 my-2" />
              <div className="text-gray-600 leading-relaxed whitespace-pre-line text-[15px]">
                {service.description}
              </div>
            </div>

            {/* Provider */}
            <div className="mt-8">
              <ProviderCard providerId={service.providerId} />
            </div>

            {/* Reviews */}
            <div className="mt-8 mb-12">
              <ReviewsSection reviews={reviews} />
            </div>

            {/* Mobile sticky bottom bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
              <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
                <div>
                  <p className="text-xs text-gray-500">{t("serviceDetail.from")}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(service.priceStart)}
                  </p>
                </div>
                {user?.role === "customer" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/chat?providerId=${service.providerId}&serviceId=${service.id}`,
                        )
                      }
                      className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg text-sm"
                    >
                      {t("serviceDetail.message")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/orders/create?serviceId=${service.id}&providerId=${service.providerId}`,
                        )
                      }
                      className="px-4 py-2.5 bg-[#486284] hover:bg-[#3a5270] text-white font-semibold rounded-lg text-sm transition-colors"
                    >
                      {t("serviceDetail.createOrder")}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="w-[340px] shrink-0 hidden lg:block">
            <PricingSidebar
              priceStart={service.priceStart}
              showCustomerActions={user?.role === "customer"}
              onCreateOrder={() =>
                router.push(
                  `/orders/create?serviceId=${service.id}&providerId=${service.providerId}`,
                )
              }
              onMessageProvider={() =>
                router.push(
                  `/chat?providerId=${service.providerId}&serviceId=${service.id}`,
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
