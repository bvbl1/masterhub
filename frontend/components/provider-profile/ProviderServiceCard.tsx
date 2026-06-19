"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { servicesApi, type Service, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import { useProviderTranslation } from "@/lib/i18n/useProviderTranslation";

interface ProviderServiceCardProps {
  service: Service;
  /** Карточка ведёт на страницу редактирования услуги провайдера. */
  manageMode?: boolean;
  /** После успешного удаления (например, перезагрузить список). */
  onDeleted?: () => void;
}

function serviceCoverUrl(service: Service): string | undefined {
  const raw = service as Service & { photo_urls?: string[] };
  const url = service.photoUrls?.[0] ?? raw.photo_urls?.[0];
  return typeof url === "string" && url.trim() ? url.trim() : undefined;
}

function serviceCityLabel(service: Service): string | undefined {
  const raw = service as Service & { city?: string };
  const c = service.city ?? raw.city;
  return typeof c === "string" && c.trim() ? c.trim() : undefined;
}

export default function ProviderServiceCard({
  service,
  manageMode = false,
  onDeleted,
}: ProviderServiceCardProps) {
  const { t } = useProviderTranslation();
  const [deleting, setDeleting] = useState(false);
  const firstPhoto = serviceCoverUrl(service);
  const cityLabel = serviceCityLabel(service);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;

    const ok = window.confirm(
      t("serviceCard.deleteConfirm", { title: service.title }),
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await servicesApi.deleteService(Number(service.id));
      onDeleted?.();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.body.message ?? err.body.error ?? t("serviceCard.deleteFailed"))
          : t("serviceCard.deleteFailed");
      window.alert(msg);
    } finally {
      setDeleting(false);
    }
  }

  const cardInner = (
    <>
      <div className="relative w-full aspect-16/10 bg-gradient-to-br from-slate-100 to-slate-200/80 overflow-hidden">
        {firstPhoto ? (
          <Image
            src={firstPhoto}
            alt={service.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <svg
              className="w-14 h-14 opacity-90"
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

      <div className="p-4 sm:p-5">
        <h3 className="font-semibold text-gray-900 text-[15px] leading-snug line-clamp-2">
          {service.title}
        </h3>
        {cityLabel ? (
          <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5 min-h-5">
            <svg
              className="w-4 h-4 shrink-0 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="line-clamp-1">{cityLabel}</span>
          </p>
        ) : null}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
              {t("serviceCard.startingAt")}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(service.priceStart)}
            </p>
          </div>
          {manageMode ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={deleting}
                onClick={(e) => void handleDelete(e)}
                className="px-3 py-2 border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting ? t("serviceCard.deleting") : t("serviceCard.delete")}
              </button>
              <span className="px-4 py-2 bg-[#486284] hover:bg-[#3a5270] text-white text-sm font-medium rounded-lg transition-colors">
                {t("serviceCard.edit")}
              </span>
            </div>
          ) : (
            <Link
              href={`/dashboard/${service.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors">
                {t("serviceCard.viewDetails")}
              </span>
            </Link>
          )}
        </div>
      </div>
    </>
  );

  const shellClass =
    "bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group";

  if (manageMode) {
    return (
      <Link
        href={`/provider-services/${service.id}/edit`}
        className={`block ${shellClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#486284] focus-visible:ring-offset-2`}
      >
        {cardInner}
      </Link>
    );
  }

  return <div className={shellClass}>{cardInner}</div>;
}
