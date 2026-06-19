"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProviderServiceCard from "@/components/provider-profile/ProviderServiceCard";
import CreateServiceModal from "@/components/common/CreateServiceModal";
import { useAuth } from "@/lib/context/AuthContext";
import { useModalStore } from "@/lib/store/modalStore";
import { servicesApi, type Service, ApiError } from "@/lib/api";
import { useProviderServicesTranslation } from "@/lib/i18n/useProviderServicesTranslation";

export default function ProviderServicesPage() {
  const { t } = useProviderServicesTranslation();
  const { user, loading: authLoading } = useAuth();
  const { openModal } = useModalStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (user?.role !== "provider") return;
    setLoading(true);
    setError("");
    servicesApi
      .getOwnServices()
      .then((res) => setServices(res.services))
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError(
            err.body.message ?? err.body.error ?? t("list.loadError"),
          );
        } else {
          setError(t("list.loadError"));
        }
      })
      .finally(() => setLoading(false));
  }, [user?.role, t]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role === "provider") load();
    else setLoading(false);
  }, [authLoading, user?.role, load]);

  if (authLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse h-9 w-56 bg-gray-200 rounded mb-2 max-w-full" />
        <div className="animate-pulse h-4 w-72 bg-gray-100 rounded mb-10 max-w-full" />
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-200 bg-[#F3F4F6] rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-16/10 bg-gray-300" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-2/3" />
                <div className="h-3 bg-gray-300 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-[#1E293B] font-medium">{t("list.title")}</p>
        <p className="mt-2 text-gray-600 text-sm">{t("list.signInDesc")}</p>
        <Link
          href="/login"
          className="inline-block mt-6 text-primary font-semibold hover:underline"
        >
          {t("list.signIn")}
        </Link>
      </div>
    );
  }

  if (user.role !== "provider") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-[#1E293B] font-medium">{t("list.title")}</p>
        <p className="mt-2 text-gray-600 text-sm">{t("list.providersOnly")}</p>
        <Link
          href="/dashboard"
          className="inline-block mt-6 text-primary font-semibold hover:underline"
        >
          {t("list.goToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">
            {t("list.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t("list.subtitle", { count: services.length })}
          </p>
        </div>
        <button
          type="button"
          className="w-full sm:w-auto px-5 py-2.5 bg-[#486284] text-white text-sm font-semibold rounded-lg hover:bg-[#3a5270] transition-colors"
          onClick={() => openModal(<CreateServiceModal onSuccess={load} />)}
        >
          {t("list.createService")}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-full border border-gray-200 bg-[#F3F4F6] overflow-hidden rounded-xl animate-pulse"
            >
              <div className="w-full aspect-16/10 bg-gray-300" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-300 rounded w-3/4" />
                <div className="h-3 bg-gray-300 rounded w-full" />
                <div className="h-8 bg-gray-300 rounded w-1/2 mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 px-6 text-center">
          <p className="text-gray-600">{t("list.empty")}</p>
          <button
            type="button"
            className="mt-4 px-5 py-2.5 bg-[#486284] text-white text-sm font-semibold rounded-lg hover:bg-[#3a5270] transition-colors"
            onClick={() => openModal(<CreateServiceModal onSuccess={load} />)}
          >
            {t("list.createFirst")}
          </button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ProviderServiceCard
              key={service.id}
              service={service}
              manageMode
              onDeleted={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
