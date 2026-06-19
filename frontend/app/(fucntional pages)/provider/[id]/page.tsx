"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import HeroSection from "@/components/provider-profile/HeroSection";
import ProviderServiceCard from "@/components/provider-profile/ProviderServiceCard";
import RatingBreakdown from "@/components/provider-profile/RatingBreakdown";
import ProfileSkeleton from "@/components/provider-profile/ProfileSkeleton";
import { servicesApi, reviewsApi, type Service, type Review } from "@/lib/api";
import { useProviderTranslation } from "@/lib/i18n/useProviderTranslation";

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useProviderTranslation();
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
          {t("profile.errorTitle")}
        </h2>
        <p className="text-gray-500 mb-6">{t("profile.errorBody")}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-[#486284] hover:bg-[#3a5270] text-white font-medium rounded-lg transition-colors text-sm"
        >
          {t("profile.tryAgain")}
        </button>
      </div>
    </div>
  );
}

function EmptyServices() {
  const { t } = useProviderTranslation();
  return (
    <div className="py-12 text-center bg-gray-50 rounded-xl">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-sm">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="3"
            width="7"
            height="7"
            rx="1"
            stroke="#D1D5DB"
            strokeWidth="2"
          />
          <rect
            x="14"
            y="3"
            width="7"
            height="7"
            rx="1"
            stroke="#D1D5DB"
            strokeWidth="2"
          />
          <rect
            x="3"
            y="14"
            width="7"
            height="7"
            rx="1"
            stroke="#D1D5DB"
            strokeWidth="2"
          />
          <path
            d="M17.5 14V21M14 17.5H21"
            stroke="#D1D5DB"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h4 className="font-medium text-gray-500">{t("profile.noServicesTitle")}</h4>
      <p className="text-sm text-gray-400 mt-1">{t("profile.noServicesDesc")}</p>
    </div>
  );
}

export default function ProviderProfilePage() {
  const { t } = useProviderTranslation();
  const params = useParams();
  const router = useRouter();
  const providerId = Number(params.id);

  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const servicesRef = useRef<HTMLDivElement>(null);

  const loadProvider = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [servicesRes, revResult] = await Promise.all([
        servicesApi.getServices({ provider_id: providerId }),
        reviewsApi
          .getReviewsByProvider(providerId)
          .catch(() => ({ reviews: [] as Review[], avgRating: 0 })),
      ]);

      setServices(servicesRes.services);
      setReviews(revResult.reviews);
      setAvgRating(revResult.avgRating);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadProvider();
  }, [loadProvider]);

  useEffect(() => {
    const handleScroll = () => setStickyVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) return <ProfileSkeleton />;
  if (error) return <ErrorState onRetry={loadProvider} />;

  const averageRatingForHero = reviews.length > 0 ? avgRating : null;

  const visibleServices = showAllServices ? services : services.slice(0, 3);

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm transition-all duration-300 ${
          stickyVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-gray-900 text-sm">
            {t("profile.stickyName", { id: providerId })}
          </span>
          <button
            onClick={() => router.push(`/chat?providerId=${providerId}`)}
            className="px-5 py-2 bg-[#486284] hover:bg-[#3a5270] text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {t("profile.messageProvider")}
          </button>
        </div>
      </div>

      <div className="bg-white min-h-screen">
        <HeroSection
          providerId={providerId}
          averageRating={averageRatingForHero}
          totalReviews={reviews.length}
          totalServices={services.length}
          onMessage={() => router.push(`/chat?providerId=${providerId}`)}
          onViewServices={() =>
            servicesRef.current?.scrollIntoView({ behavior: "smooth" })
          }
        />

        <section
          ref={servicesRef}
          className="max-w-[1200px] mx-auto px-6 py-10 scroll-mt-24"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {t("profile.services")}
            {services.length > 0 && (
              <span className="text-gray-400 font-normal ml-2 text-base">
                ({services.length})
              </span>
            )}
          </h2>

          {services.length === 0 ? (
            <EmptyServices />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleServices.map((service) => (
                  <ProviderServiceCard key={service.id} service={service} />
                ))}
              </div>

              {!showAllServices && services.length > 3 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowAllServices(true)}
                    className="px-8 py-2.5 text-sm font-medium text-[#486284] bg-[#486284]/10 hover:bg-[#486284]/15 rounded-lg transition-colors"
                  >
                    {t("profile.viewAllServices", { count: services.length })}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <div className="border-t border-gray-100">
          <RatingBreakdown reviews={reviews} avgRating={avgRating} />
        </div>
      </div>
    </>
  );
}
