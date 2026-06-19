"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  categoriesApi,
  jobRequestsApi,
  mediaApi,
  servicesApi,
  ApiError,
  type Category,
} from "@/lib/api";
import PhotoUploadField from "@/components/common/PhotoUploadField";
import { formatCurrency } from "@/lib/formatCurrency";
import { useRequestsTranslation } from "@/lib/i18n/useRequestsTranslation";

export default function NewJobRequestPage() {
  const { t } = useRequestsTranslation();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [avgPrice, setAvgPrice] = useState<number | null>(null);
  const [avgPriceLoading, setAvgPriceLoading] = useState(false);

  useEffect(() => {
    categoriesApi
      .getCategories()
      .then((r) => setCategories(r.categories))
      .catch(() => {});
    servicesApi
      .listCities()
      .then((list) =>
        setCities(
          [...list].sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" }),
          ),
        ),
      )
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setAvgPrice(null);
      setAvgPriceLoading(false);
      return;
    }

    let cancelled = false;
    setAvgPriceLoading(true);
    setAvgPrice(null);

    servicesApi
      .getAvgPriceForCategory(Number(categoryId))
      .then((price) => {
        if (!cancelled) setAvgPrice(price);
      })
      .catch(() => {
        if (!cancelled) setAvgPrice(null);
      })
      .finally(() => {
        if (!cancelled) setAvgPriceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const selectedCategoryName =
    categories.find((c) => c.id === categoryId)?.name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !title.trim() || !city.trim()) {
      setError(t("new.requiredFields"));
      return;
    }
    const min = parseFloat(budgetMin);
    const max = parseFloat(budgetMax);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) {
      setError(t("new.budgetInvalid"));
      return;
    }
    if (min > max) {
      setError(t("new.budgetMinMax"));
      return;
    }
    let iso = scheduledAt.trim();
    if (!iso) {
      setError(t("new.pickDateTime"));
      return;
    }
    if (!iso.includes("T")) {
      iso = `${iso}T12:00:00`;
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      setError(t("new.invalidDate"));
      return;
    }
    const scheduled_at = d.toISOString();

    setSubmitting(true);
    setError("");
    try {
      let photo_urls: string[] | undefined;
      if (photos.length > 0) {
        photo_urls = (
          await mediaApi.uploadBatch(photos, mediaApi.JOB_REQUEST_PHOTOS_CONTEXT)
        ).map((item) => item.url);
      }

      const jr = await jobRequestsApi.createJobRequest({
        category_id: Number(categoryId),
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        budget_min: min,
        budget_max: max,
        scheduled_at,
        ...(photo_urls?.length ? { photo_urls } : {}),
      });
      router.push(`/requests/${jr.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body.message ?? err.body.error ?? t("new.createFailed"));
      } else {
        setError(t("new.genericError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center text-gray-500">
        {t("new.loading")}
      </div>
    );
  }

  if (!user || user.role !== "customer") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-4">{t("new.customersOnly")}</p>
        <Link href="/requests" className="text-[#486284] font-semibold">
          {t("new.backToRequests")}
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/15 outline-none";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/requests"
        className="text-sm font-medium text-[#486284] hover:underline mb-6 inline-block"
      >
        {t("new.backToMyRequests")}
      </Link>
      <h1 className="text-2xl font-bold text-[#1E293B] mb-2">{t("new.title")}</h1>
      <p className="text-sm text-[#64748B] mb-8">{t("new.subtitle")}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("new.category")} <span className="text-red-400">*</span>
          </label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputCls}
          >
            <option value="">{t("new.selectCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {categoryId ? (
            <p
              className="mt-2 text-xs text-[#64748B] leading-relaxed rounded-lg bg-[#486284]/5 border border-[#486284]/15 px-3 py-2"
              role="status"
            >
              {avgPriceLoading ? (
                t("new.avgPriceLoading")
              ) : avgPrice !== null && avgPrice > 0 ? (
                <>
                  {t("new.avgPriceFor")}{" "}
                  <span className="font-medium text-[#1E293B]">
                    {selectedCategoryName || t("new.thisCategory")}
                  </span>
                  :{" "}
                  <span className="font-semibold text-[#486284]">
                    {formatCurrency(avgPrice)}
                  </span>
                  {t("new.avgPriceGuide")}
                </>
              ) : (
                <>
                  {t("new.noAvgPriceFor")}{" "}
                  <span className="font-medium text-[#1E293B]">
                    {selectedCategoryName || t("new.thisCategory")}
                  </span>
                  {t("new.noAvgPriceGuide")}
                </>
              )}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("new.titleLabel")} <span className="text-red-400">*</span>
          </label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("new.titlePlaceholder")}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("new.description")} <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("new.descriptionPlaceholder")}
            className={`${inputCls} resize-y min-h-[100px]`}
          />
        </div>

        <div>
          <label
            htmlFor="request-city"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {t("new.city")} <span className="text-red-400">*</span>
          </label>
          <select
            id="request-city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={citiesLoading}
            className={inputCls}
          >
            <option value="">
              {citiesLoading ? t("new.loadingCities") : t("new.selectCity")}
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("new.budgetMin")} <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("new.budgetMax")} <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("new.preferredTime")} <span className="text-red-400">*</span>
          </label>
          <input
            required
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={inputCls}
          />
          <p className="text-xs text-gray-500 mt-1">{t("new.isoHint")}</p>
        </div>

        <PhotoUploadField
          label={t("new.photosOptional")}
          files={photos}
          onFilesChange={setPhotos}
          disabled={submitting}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-[#486284] text-white font-semibold hover:bg-[#3a5270] disabled:opacity-50"
        >
          {submitting ? t("new.posting") : t("new.post")}
        </button>
      </form>
    </div>
  );
}
