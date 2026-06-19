"use client";

import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import { useModalStore } from "@/lib/store/modalStore";
import LocationMap, { type MapResolvedPlace } from "@/components/common/Map";
import {
  servicesApi,
  categoriesApi,
  mediaApi,
  ApiError,
  type Category,
} from "@/lib/api";
import { useProviderServicesTranslation } from "@/lib/i18n/useProviderServicesTranslation";

interface FormErrors {
  title?: string;
  description?: string;
  price_start?: string;
  category_id?: string;
  city?: string;
}

export default function CreateServiceModal({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const { t } = useProviderServicesTranslation();
  const { closeModal } = useModalStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceStart, setPriceStart] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [city, setCity] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    categoriesApi
      .getCategories()
      .then((cat) => setCategories(cat.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (images.length === 0) {
      setImagePreviews([]);
      return;
    }
    const previews = images.map((image) => URL.createObjectURL(image));
    setImagePreviews(previews);
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [images]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!title.trim()) next.title = t("createModal.errors.titleRequired");
    if (!description.trim())
      next.description = t("createModal.errors.descriptionRequired");
    if (!priceStart.trim()) {
      next.price_start = t("createModal.errors.priceRequired");
    } else {
      const num = parseFloat(priceStart);
      if (isNaN(num) || num <= 0)
        next.price_start = t("createModal.errors.pricePositive");
    }
    if (!categoryId)
      next.category_id = t("createModal.errors.categoryRequired");
    if (!city.trim()) next.city = t("createModal.errors.cityRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      let photoUrls: string[] = [];
      if (images.length > 0) {
        photoUrls = (
          await mediaApi.uploadBatch(images, "service_photos")
        ).map((item) => item.url);
      }

      await servicesApi.createService({
        title: title.trim(),
        description: description.trim(),
        price_start: parseFloat(priceStart),
        category_id: Number(categoryId),
        city: city.trim(),
        photo_urls: photoUrls,
      });
      onSuccess?.();
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(
          err.body.message ?? err.body.error ?? t("createModal.createFailed"),
        );
      } else {
        setApiError(t("createModal.genericError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const applyMapCity = useCallback((p: MapResolvedPlace) => {
    setCity(p.city);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.city;
      return next;
    });
    setApiError("");
  }, []);

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setApiError("");
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors outline-none ${
      hasError
        ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 bg-white focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/15"
    }`;

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;
    const imageFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );
    setImages((prev) => {
      const merged = [...prev, ...imageFiles];
      const uniqueByFile = new Map<string, File>();
      for (const file of merged) {
        uniqueByFile.set(
          `${file.name}-${file.size}-${file.lastModified}`,
          file,
        );
      }
      return Array.from(uniqueByFile.values());
    });
    event.target.value = "";
    setApiError("");
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[90vw] p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-50 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17L4 12"
              stroke="#22C55E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {t("createModal.successTitle")}
        </h2>
        <p className="text-sm text-gray-500">{t("createModal.successDesc")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-[min(560px,96vw)] max-w-[96vw] max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#486284] to-[#3a5270] px-8 pt-8 pb-6 rounded-t-2xl">
        <h2 className="text-xl font-bold text-white">
          {t("createModal.title")}
        </h2>
        <p className="text-sm text-white/70 mt-1">
          {t("createModal.subtitle")}
        </p>
      </div>

      {/* Form */}
      <div className="px-8 py-6 space-y-5">
        {apiError && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}
        <div>
          <h3 className="block text-lg font-medium text-gray-700 mb-1.5">
            {t("createModal.addPhoto")}
          </h3>
          <label
            htmlFor="serviceImage"
            className="w-20 h-20 rounded-xl bg-black/5 hover:bg-black/10 cursor-pointer flex items-center justify-center mb-2"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="gray"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </label>
          <input
            type="file"
            id="serviceImage"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            hidden
          />
          <p className="text-xs text-gray-500 mb-3">
            {t("createModal.photoHint")}
          </p>
          {imagePreviews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imagePreviews.map((preview, index) => (
                <div
                  key={`${images[index]?.name ?? "preview"}-${index}`}
                  className="shrink-0 w-16 h-16 rounded-md overflow-hidden border border-gray-200"
                >
                  <img
                    src={preview}
                    alt={
                      images[index]?.name ??
                      t("createModal.imageAlt", { index: index + 1 })
                    }
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("createModal.serviceTitle")}{" "}
            <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder={t("createModal.titlePlaceholder")}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError("title");
            }}
            className={inputClass(!!errors.title)}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("createModal.category")} <span className="text-red-400">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              clearError("category_id");
            }}
            className={inputClass(!!errors.category_id)}
          >
            <option value="">{t("createModal.selectCategory")}</option>
            {categories.length &&
              categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
          {errors.category_id && (
            <p className="mt-1 text-xs text-red-500">{errors.category_id}</p>
          )}
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("createModal.city")} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder={t("createModal.cityPlaceholder")}
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              clearError("city");
            }}
            className={inputClass(!!errors.city)}
            autoComplete="address-level2"
          />
          {errors.city && (
            <p className="mt-1 text-xs text-red-500">{errors.city}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            {t("createModal.cityHint")}
          </p>
          <div className="mt-3 rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
            <LocationMap onPlaceResolved={applyMapCity} mapHeightPx={280} />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("createModal.description")}{" "}
            <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            placeholder={t("createModal.descriptionPlaceholder")}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearError("description");
            }}
            className={`${inputClass(!!errors.description)} resize-none`}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("createModal.startingPrice")}{" "}
            <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={priceStart}
              onChange={(e) => {
                setPriceStart(e.target.value);
                clearError("price_start");
              }}
              className={`${inputClass(!!errors.price_start)} pr-10`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
              ₸
            </span>
          </div>
          {errors.price_start && (
            <p className="mt-1 text-xs text-red-500">{errors.price_start}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={closeModal}
            disabled={loading}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {t("createModal.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-[#486284] hover:bg-[#3a5270] disabled:bg-[#486284]/40 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {t("createModal.creating")}
              </>
            ) : (
              t("createModal.create")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
