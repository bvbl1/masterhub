"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
} from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { servicesApi, mediaApi, type Service, ApiError } from "@/lib/api";
import LocationMap, { type MapResolvedPlace } from "@/components/common/Map";
import { useProviderServicesTranslation } from "@/lib/i18n/useProviderServicesTranslation";

function readServicePhotoUrls(s: Service): string[] {
  const raw = s as Service & { photo_urls?: string[] };
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [...(s.photoUrls ?? []), ...(raw.photo_urls ?? [])]) {
    const trimmed = url.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

export default function EditServicePage() {
  const { t } = useProviderServicesTranslation();
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const rawId = params.id;
  const serviceId = typeof rawId === "string" ? Number(rawId) : NaN;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [service, setService] = useState<Service | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceStart, setPriceStart] = useState("");
  const [city, setCity] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [originalPhotoUrls, setOriginalPhotoUrls] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!Number.isFinite(serviceId) || serviceId <= 0) {
      setLoading(false);
      setError(t("edit.invalidId"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { service: s } = await servicesApi.getService(serviceId, {
        auth: true,
      });
      setService(s);
      if (user?.id != null && String(s.providerId) !== String(user.id)) {
        setForbidden(true);
        setService(null);
      } else {
        setTitle(s.title);
        setDescription(s.description);
        setPriceStart(String(s.priceStart));
        setCity(s.city?.trim() ?? "");
        setIsActive(s.isActive ?? true);
        const urls = readServicePhotoUrls(s);
        setPhotoUrls(urls);
        setOriginalPhotoUrls(urls);
        setNewImages([]);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
      } else if (err instanceof ApiError) {
        setError(err.body.message ?? err.body.error ?? t("edit.loadError"));
      } else {
        setError(t("edit.loadError"));
      }
      setService(null);
    } finally {
      setLoading(false);
    }
  }, [serviceId, user?.id, t]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "provider") return;
    load();
  }, [authLoading, user, load]);

  useEffect(() => {
    if (newImages.length === 0) {
      setNewImagePreviews([]);
      return;
    }
    const previews = newImages.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(previews);
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [newImages]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;
    const imageFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );
    setNewImages((prev) => {
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
    setError("");
  };

  const removeExistingPhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
    setError("");
  };

  const removeNewPhoto = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setError("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!Number.isFinite(serviceId) || serviceId <= 0) return;
    if (!title.trim() || !description.trim()) {
      setError(t("edit.titleRequired"));
      return;
    }
    if (!city.trim()) {
      setError(t("edit.cityRequired"));
      return;
    }
    const price = parseFloat(priceStart);
    if (isNaN(price) || price <= 0) {
      setError(t("edit.priceInvalid"));
      return;
    }

    setSaving(true);
    try {
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        uploadedUrls = (
          await mediaApi.uploadBatch(newImages, "service_photos")
        ).map((item) => item.url);
      }

      // Calculate which photos were removed and which were added
      const removedPhotos = originalPhotoUrls.filter(
        (url) => !photoUrls.includes(url)
      );

      await servicesApi.updateService(serviceId, {
        id: String(serviceId),
        title: title.trim(),
        description: description.trim(),
        price_start: price,
        is_active: isActive,
        city: city.trim(),
        photo_urls_to_add: uploadedUrls,
        photo_urls_to_remove: removedPhotos,
      });
      router.push("/provider-services");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body.message ?? err.body.error ?? t("edit.updateFailed"));
      } else {
        setError(t("edit.genericError"));
      }
    } finally {
      setSaving(false);
    }
  }

  const applyMapCity = useCallback((p: MapResolvedPlace) => {
    setCity(p.city);
    setError("");
  }, []);

  const inputCls =
    "w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/15 outline-none";

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="h-10 bg-gray-100 rounded mb-4" />
        <div className="h-32 bg-gray-100 rounded mb-4" />
        <div className="h-10 bg-gray-100 rounded w-3/4" />
      </div>
    );
  }

  if (!user || user.role !== "provider") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-gray-600">
        {t("edit.providersOnly")}{" "}
        <Link href="/login" className="text-primary font-semibold">
          {t("edit.signIn")}
        </Link>
      </div>
    );
  }

  if (!Number.isFinite(serviceId) || serviceId <= 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-gray-600">
        {t("edit.invalidLink")}
        <Link
          href="/provider-services"
          className="block mt-6 text-[#486284] font-semibold"
        >
          {t("edit.backToList")}
        </Link>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-900 font-medium">{t("edit.forbidden")}</p>
        <Link
          href="/provider-services"
          className="inline-block mt-6 text-[#486284] font-semibold"
        >
          {t("edit.backToList")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-32 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-700">{error || t("edit.notFound")}</p>
        <Link
          href="/provider-services"
          className="inline-block mt-6 text-[#486284] font-semibold"
        >
          {t("edit.backToList")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-16">
      <div className="mb-8">
        <Link
          href="/provider-services"
          className="text-sm font-medium text-[#486284] hover:underline mb-4 inline-block"
        >
          ← {t("edit.backToList")}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">
          {t("edit.heading")}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{t("edit.subtitle")}</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="edit-title"
            className="block text-sm font-medium text-gray-800 mb-1.5"
          >
            {t("edit.titleLabel")}
          </label>
          <input
            id="edit-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label
            htmlFor="edit-description"
            className="block text-sm font-medium text-gray-800 mb-1.5"
          >
            {t("edit.descriptionLabel")}
          </label>
          <textarea
            id="edit-description"
            rows={6}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputCls} resize-y min-h-[120px]`}
          />
        </div>

        <div>
          <p className="block text-sm font-medium text-gray-800 mb-1.5">
            {t("edit.photosLabel")}
          </p>
          <p className="text-xs text-gray-500 mb-3">{t("edit.photosHint")}</p>

          {(photoUrls.length > 0 || newImagePreviews.length > 0) && (
            <div className="flex flex-wrap gap-3 mb-3">
              {photoUrls.map((url, index) => (
                <div
                  key={`existing-${url}`}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                >
                  <Image
                    src={url}
                    alt={t("edit.photoAlt", { index: index + 1 })}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 text-white text-xs leading-none hover:bg-black/75"
                    aria-label={t("edit.removePhoto")}
                  >
                    ×
                  </button>
                </div>
              ))}
              {newImagePreviews.map((preview, index) => (
                <div
                  key={`new-${newImages[index]?.name ?? "preview"}-${index}`}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border border-dashed border-[#486284]/40 bg-gray-50"
                >
                  <img
                    src={preview}
                    alt={t("edit.photoAlt", {
                      index: photoUrls.length + index + 1,
                    })}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 text-white text-xs leading-none hover:bg-black/75"
                    aria-label={t("edit.removePhoto")}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <label
            htmlFor="edit-service-photos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-[#486284] hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            {t("edit.addPhotos")}
          </label>
          <input
            id="edit-service-photos"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="sr-only"
          />
        </div>

        <div>
          <label
            htmlFor="edit-city"
            className="block text-sm font-medium text-gray-800 mb-1.5"
          >
            {t("edit.cityLabel")} <span className="text-red-400">*</span>
          </label>
          <input
            id="edit-city"
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputCls}
            placeholder={t("edit.cityPlaceholder")}
            autoComplete="address-level2"
          />
          <p className="mt-2 text-xs text-gray-500">{t("edit.mapHint")}</p>
          <div className="mt-3 rounded-xl border border-gray-100 overflow-hidden">
            <LocationMap onPlaceResolved={applyMapCity} mapHeightPx={280} />
          </div>
        </div>

        <div>
          <label
            htmlFor="edit-price"
            className="block text-sm font-medium text-gray-800 mb-1.5"
          >
            {t("edit.priceLabel")}
          </label>
          <div className="relative max-w-[220px]">
            <input
              id="edit-price"
              type="number"
              min="0"
              step="any"
              required
              value={priceStart}
              onChange={(e) => setPriceStart(e.target.value)}
              className={`${inputCls} pr-10`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
              ₸
            </span>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300 text-[#486284] focus:ring-[#486284]"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span className="text-sm font-medium text-gray-800">
            {t("edit.activeLabel")}
          </span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <button
            type="button"
            disabled={saving}
            className="sm:flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            onClick={() => router.back()}
          >
            {t("edit.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="sm:flex-[2] py-2.5 px-4 rounded-lg bg-[#486284] text-white font-semibold hover:bg-[#3a5270] disabled:opacity-60 transition-colors"
          >
            {saving ? t("edit.saving") : t("edit.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
