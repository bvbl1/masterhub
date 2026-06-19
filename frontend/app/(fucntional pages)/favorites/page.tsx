"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StarIcon from "@/components/icons/StarIcon";
import {
  favoritesApi,
  reviewsApi,
  servicesApi,
  type FavoriteProviderSummary,
  type Service,
} from "@/lib/api";
import { useFavoritesTranslation } from "@/lib/i18n/useFavoritesTranslation";

type EnrichedFavorite = FavoriteProviderSummary & {
  avgRating: number | null;
  reviewCount: number;
  topServices: Array<{
    service: Service;
    avgRating: number;
    reviewCount: number;
  }>;
};

const MAX_SERVICES_TO_SCORE = 36;

function serviceCityLabel(service: Service): string | undefined {
  const raw = service as Service & { city?: string };
  const c = service.city ?? raw.city;
  return typeof c === "string" && c.trim() ? c.trim() : undefined;
}

function serviceCoverUrl(service: Service): string | undefined {
  const raw = service as Service & { photo_urls?: string[] };
  const url = service.photoUrls?.[0] ?? raw.photo_urls?.[0];
  return typeof url === "string" && url.trim() ? url.trim() : undefined;
}

async function enrichFavorite(
  p: FavoriteProviderSummary,
): Promise<EnrichedFavorite> {
  const [rev, svcRes] = await Promise.all([
    reviewsApi.getReviewsByProvider(p.id).catch(() => ({
      reviews: [] as { rating: number }[],
      avgRating: 0,
    })),
    servicesApi.getServices({ provider_id: p.id }).catch(() => ({
      services: [] as Service[],
    })),
  ]);

  const active = (svcRes.services ?? []).filter((s) => s.isActive !== false);
  const capped =
    active.length > MAX_SERVICES_TO_SCORE
      ? active.slice(0, MAX_SERVICES_TO_SCORE)
      : active;

  const scored = await Promise.all(
    capped.map(async (service) => {
      try {
        const r = await reviewsApi.getReviewsByService(Number(service.id));
        return {
          service,
          avgRating: Number(r.avgRating) || 0,
          reviewCount: r.reviews.length,
        };
      } catch {
        return { service, avgRating: 0, reviewCount: 0 };
      }
    }),
  );

  scored.sort((a, b) => {
    if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    return b.reviewCount - a.reviewCount;
  });

  return {
    ...p,
    avgRating:
      rev.reviews.length > 0 ? Number(rev.avgRating) || 0 : null,
    reviewCount: rev.reviews.length,
    topServices: scored.slice(0, 7),
  };
}

function ServiceStrip({
  items,
}: {
  items: EnrichedFavorite["topServices"];
}) {
  const { t } = useFavoritesTranslation();

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2">{t("noServicesStrip")}</p>
    );
  }

  return (
    <div className="relative">
      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 pt-1 -mx-1 px-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map(({ service, avgRating, reviewCount }) => {
          const cover = serviceCoverUrl(service);
          const city = serviceCityLabel(service);
          return (
            <Link
              key={service.id}
              href={`/dashboard/${service.id}`}
              className="snap-start shrink-0 w-[148px] sm:w-[160px] rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden flex flex-col"
            >
              <div className="relative w-full aspect-[5/3] bg-gradient-to-br from-slate-100 to-slate-200/80">
                {cover ? (
                  <Image
                    src={cover}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="160px"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                    <svg
                      className="w-8 h-8 opacity-80"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.25}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-2.5 flex flex-col gap-1 min-h-0">
                <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">
                  {service.title}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-gray-600">
                  <StarIcon />
                  <span className="font-medium tabular-nums">
                    {reviewCount > 0 ? avgRating.toFixed(1) : "—"}
                  </span>
                  {reviewCount > 0 ? (
                    <span className="text-gray-400">({reviewCount})</span>
                  ) : null}
                </div>
                {city ? (
                  <p className="text-[10px] text-gray-500 line-clamp-1">{city}</p>
                ) : (
                  <p className="text-[10px] text-gray-400">—</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const { t, reviewCountLabel } = useFavoritesTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<EnrichedFavorite[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await favoritesApi.listFavoriteProviders(100, 0);
      const enriched = await Promise.all(list.map((p) => enrichFavorite(p)));
      setRows(enriched);
    } catch {
      setError(t("loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto px-6 py-12">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-8" />
        <div className="space-y-6">
          {[1, 2, 3].map((k) => (
            <div
              key={k}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="mt-4 flex gap-2 overflow-hidden">
                {[1, 2, 3, 4].map((c) => (
                  <div
                    key={c}
                    className="shrink-0 w-36 h-40 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-6 py-10 pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      ) : null}

      {rows.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-8 py-16 text-center">
          <p className="text-gray-600 font-medium">{t("emptyTitle")}</p>
          <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            {t("emptyDesc")}
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-6 text-sm font-semibold text-[#486284] hover:text-[#3a5270]"
          >
            {t("browseServices")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-8">
          {rows.map((row) => {
            const name =
              `${row.firstName} ${row.secondName}`.trim() ||
              t("providerFallback", { id: row.id });
            const initials =
              `${row.firstName?.charAt(0) ?? ""}${row.secondName?.charAt(0) ?? ""}`.toUpperCase() ||
              "?";

            return (
              <li
                key={row.id}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm shadow-gray-200/40 overflow-hidden"
              >
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <Link
                    href={`/provider/${row.id}`}
                    className="flex items-center gap-4 min-w-0 group"
                  >
                    <div className="relative w-16 h-16 shrink-0 rounded-full ring-2 ring-white shadow-md overflow-hidden bg-[#486284] flex items-center justify-center text-white text-lg font-bold">
                      {row.avatarUrl ? (
                        <Image
                          src={row.avatarUrl}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="font-semibold text-gray-900 group-hover:text-[#486284] transition-colors truncate">
                        {name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                        <StarIcon />
                        {row.reviewCount > 0 && row.avgRating != null ? (
                          <>
                            <span className="font-semibold text-gray-800 tabular-nums">
                              {row.avgRating.toFixed(1)}
                            </span>
                            <span className="text-gray-400">
                              ({row.reviewCount} {reviewCountLabel(row.reviewCount)})
                            </span>
                          </>
                        ) : (
                          <span>{t("noReviewsYet")}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-gray-50 bg-slate-50/50">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium pt-4 pb-2">
                    {t("topServices")}
                  </p>
                  <ServiceStrip items={row.topServices} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
