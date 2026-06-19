"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import CategoryIconUpload from "@/components/admin/CategoryIconUpload";
import { CategoryIconDisplay, isCategoryIconUrl } from "@/lib/categoryIcons";
import { ApiError, categoriesApi, mediaApi, type Category } from "@/lib/api";
import { isDuplicateCategoryNameError } from "@/lib/api/categoryErrors";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

const emptyForm = (): categoriesApi.CreateCategoryRequest => ({
  name: "",
  description: "",
  icon: "",
});

export default function AdminCategoriesPage() {
  const { t } = useAdminTranslation();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] =
    useState<categoriesApi.CreateCategoryRequest>(emptyForm);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { categories: list } = await categoriesApi.getCategories();
      setCategories(list);
    } catch {
      setError(t("categories.loadError"));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") return;
    void load();
  }, [authLoading, user, load]);

  const resetForm = () => {
    setForm(emptyForm());
    setIconFile(null);
    setEditingId(null);
    setActionError("");
  };

  async function resolveIconUrl(): Promise<string> {
    if (iconFile) {
      const urls = await mediaApi.uploadBatch([iconFile], "service_photos");
      const url = urls[0]?.url.trim();
      if (!url) throw new Error(t("categories.iconUploadFailed"));
      return url;
    }
    const existing = form.icon.trim();
    if (isCategoryIconUrl(existing)) return existing;
    throw new Error(t("categories.iconRequired"));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const description = form.description.trim();
    if (!name || !description) {
      setActionError(t("categories.nameDescRequired"));
      return;
    }

    setSaving(true);
    setActionError("");
    try {
      const icon = await resolveIconUrl();
      if (editingId) {
        await categoriesApi.updateCategory(editingId, { name, description, icon });
      } else {
        await categoriesApi.createCategory({ name, description, icon });
      }
      resetForm();
      await load();
    } catch (err) {
      const raw =
        err instanceof ApiError
          ? (err.body.message ?? err.body.error ?? "")
          : err instanceof Error
            ? err.message
            : "";
      const msg =
        raw && isDuplicateCategoryNameError(raw)
          ? t("categories.duplicateName", { name })
          : raw || t("categories.requestFailed");
      setActionError(msg);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description,
      icon: cat.icon?.trim() ?? "",
    });
    setIconFile(null);
    setActionError("");
  };

  const handleDelete = async (cat: Category) => {
    const ok = window.confirm(
      t("categories.deleteConfirm", { name: cat.name }),
    );
    if (!ok) return;

    setActionError("");
    try {
      await categoriesApi.deleteCategory(cat.id);
      if (editingId === cat.id) resetForm();
      await load();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.message ?? t("categories.deleteFailed"))
          : t("categories.deleteFailed");
      setActionError(msg);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-16 text-center text-gray-500">
        {t("common.loading")}
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-4">{t("common.adminOnly")}</p>
        <Link
          href="/dashboard"
          className="text-[#486284] font-medium hover:underline"
        >
          {t("common.backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t("categories.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("categories.subtitle")}{" "}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
            /v1/categories
          </code>
          .
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-slate-800 mb-4">
          {editingId ? t("categories.editCategory") : t("categories.addCategory")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-1">
            <span className="text-xs font-medium text-slate-600">
              {t("categories.name")}
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#486284] focus:outline-none focus:ring-1 focus:ring-[#486284]"
              placeholder={t("categories.namePlaceholder")}
              maxLength={100}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-slate-600">
              {t("categories.description")}
            </span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#486284] focus:outline-none focus:ring-1 focus:ring-[#486284] resize-y min-h-[80px]"
              placeholder={t("categories.descPlaceholder")}
            />
          </label>
          <div className="sm:col-span-2">
            <CategoryIconUpload
              iconUrl={form.icon}
              file={iconFile}
              onFileChange={setIconFile}
              disabled={saving}
            />
          </div>
        </div>
        {actionError && (
          <p className="mt-3 text-sm text-red-600">{actionError}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#486284] text-white text-sm font-medium hover:bg-[#3d526d] disabled:opacity-60"
          >
            {saving
              ? t("categories.saving")
              : editingId
                ? t("categories.saveChanges")
                : t("categories.addCategory")}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("common.cancel")}
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-12">
          {t("categories.loadingList")}
        </p>
      ) : categories.length === 0 ? (
        <p className="text-center text-gray-500 py-12">{t("categories.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className={`rounded-xl border bg-white p-4 sm:p-5 shadow-sm transition-colors ${
                editingId === cat.id
                  ? "border-[#486284] ring-1 ring-[#486284]/20"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      <CategoryIconDisplay
                        icon={cat.icon}
                        className="h-9 w-9"
                        imgSize={36}
                      />
                    </span>
                    <p className="font-semibold text-slate-900">{cat.name}</p>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                    {cat.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {t("categories.idLabel", { id: cat.id })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {t("categories.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(cat)}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    {t("categories.delete")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
