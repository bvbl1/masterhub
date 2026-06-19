"use client";
import StarIcon from "@/components/icons/StarIcon";
import { authApi, favoritesApi, getToken, User } from "@/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProviderTranslation } from "@/lib/i18n/useProviderTranslation";

interface HeroSectionProps {
  providerId: number;
  averageRating: number | null;
  totalReviews: number;
  totalServices: number;
  onMessage: () => void;
  onViewServices: () => void;
}

export default function HeroSection({
  providerId,
  averageRating,
  totalReviews,
  totalServices,
  onMessage,
  onViewServices,
}: HeroSectionProps) {
  const { t, servicesCountLabel } = useProviderTranslation();
  const router = useRouter();
  const [provider, setProvider] = useState<User>();
  const [mounted, setMounted] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [favoriteLoaded, setFavoriteLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [favoriteHint, setFavoriteHint] = useState("");

  const loadProvider = useCallback(async () => {
    const provider = await authApi.getProviderInfo(String(providerId));

    setProvider(provider.user);
  }, [providerId]);

  useEffect(() => {
    void loadProvider();
  }, [loadProvider]);

  useEffect(() => {
    setMounted(true);
    const loggedIn = Boolean(getToken());
    setHasSession(loggedIn);
    if (!loggedIn) {
      setFavoriteLoaded(true);
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    setFavoriteLoaded(false);
    favoritesApi
      .isProviderFavorite(providerId)
      .then((v) => {
        if (!cancelled) {
          setIsFavorite(v);
          setFavoriteLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsFavorite(false);
          setFavoriteLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const toggleFavorite = useCallback(async () => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    if (!favoriteLoaded || favoriteBusy) return;
    setFavoriteBusy(true);
    setFavoriteHint("");
    try {
      if (isFavorite) {
        await favoritesApi.removeFavorite(providerId);
        setIsFavorite(false);
      } else {
        await favoritesApi.addFavorite(providerId);
        setIsFavorite(true);
      }
    } catch {
      setFavoriteHint(t("hero.favoriteUpdateFailed"));
      window.setTimeout(() => setFavoriteHint(""), 4000);
    } finally {
      setFavoriteBusy(false);
    }
  }, [favoriteBusy, favoriteLoaded, isFavorite, providerId, router, t]);

  const initials = useMemo(() => {
    if (!provider) return "?";
    const a = provider.firstName?.trim().charAt(0) ?? "";
    const b = provider.secondName?.trim().charAt(0) ?? "";
    const s = `${a}${b}`.toUpperCase();
    return s || "?";
  }, [provider]);

  const displayName =
    provider != null
      ? `${provider.firstName} ${provider.secondName}`.trim()
      : "";

  const favoriteButtonLoading =
    mounted && hasSession && !favoriteLoaded && !favoriteBusy;
  const favoriteButtonDisabled =
    !mounted || favoriteBusy || (hasSession && !favoriteLoaded);

  return (
    <section className="relative bg-gradient-to-b from-slate-50 to-white border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-6 py-10 md:py-14">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          <div className="relative">
            <div className="w-28 h-28 relative md:w-32 md:h-32 rounded-full bg-[#486284]/10 ring-4 ring-white shadow-lg overflow-hidden flex items-center justify-center text-[#486284] font-bold text-4xl">
              {provider?.avatarUrl?.trim() ? (
                <Image
                  src={provider.avatarUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                initials
              )}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left w-full min-w-0">
            <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {displayName || t("hero.providerFallback")}
              </h1>
              <button
                type="button"
                onClick={() => void toggleFavorite()}
                disabled={favoriteButtonDisabled}
                aria-pressed={isFavorite}
                aria-label={
                  isFavorite
                    ? t("hero.removeFavorite")
                    : t("hero.addFavorite")
                }
                className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl border border-gray-100 bg-white text-[#486284] shadow-xs hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 focus-visible:ring-[#486284] focus-visible:ring-offset-2"
              >
                {favoriteBusy || favoriteButtonLoading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-[#486284]/30 border-t-[#486284] animate-spin" />
                ) : isFavorite ? (
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.218l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {favoriteHint ? (
              <p className="text-sm text-red-600 mt-2 md:text-right">
                {favoriteHint}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 mt-2.5">
              {averageRating != null ? (
                <div className="flex items-center gap-1.5">
                  <StarIcon />
                  <span className="font-semibold text-gray-900 text-sm">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400">
                    {t("hero.reviewsCount", { count: totalReviews })}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">
                  {t("hero.noReviewsYet")}
                </span>
              )}

              <span className="text-gray-200 hidden sm:block">|</span>

              <span className="text-sm text-gray-500">
                {servicesCountLabel(totalServices)}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5">
              <button
                onClick={onMessage}
                className="px-6 py-2.5 bg-[#486284] hover:bg-[#3a5270] text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {t("hero.messageProvider")}
              </button>
              <button
                onClick={onViewServices}
                className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
              >
                {t("hero.viewServices")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
