"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ApiError, authApi, mediaApi } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";
import { useModalStore } from "@/lib/store/modalStore";
import ConnectTelegramButton from "./ConnectTelegramButton";

export default function ProfileModal() {
  const { user, refresh } = useAuth();
  const { closeModal } = useModalStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.secondName ?? "");
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const preview = URL.createObjectURL(avatarFile);
    setAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [avatarFile]);

  const initials = useMemo(() => {
    const first = firstName.trim().charAt(0);
    const second = lastName.trim().charAt(0);
    const s = `${first}${second}`.toUpperCase();
    return s || "?";
  }, [firstName, lastName]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarFile(file);
    setError("");
    event.target.value = "";
  };

  const handleSave = async () => {
    if (!user) return;
    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      let newAvatarUrl: string | undefined;
      if (avatarFile) {
        const uploaded = await mediaApi.uploadBatch([avatarFile], "avatar");
        if (uploaded.length > 0) {
          newAvatarUrl = uploaded[0].url;
        }
      }

      await authApi.updateUser(user.id, {
        user_id: user.id,
        first_name: firstName.trim(),
        second_name: lastName.trim(),
        email: user.email,
        phone: user.phone ?? "-",
        role: user.role,
      });

      if (newAvatarUrl) {
        await authApi.updateMyAvatar(newAvatarUrl);
      }

      await refresh();
      closeModal();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.body.message ?? err.body.error ?? "Failed to update profile",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-[460px] max-w-[90vw] overflow-hidden">
      <div className="bg-gradient-to-r from-[#486284] to-[#3a5270] px-8 pt-8 pb-6">
        <h2 className="text-xl font-bold text-white">Profile Settings</h2>
        <p className="text-sm text-white/70 mt-1">
          Update your avatar and name
        </p>
      </div>

      <div className="px-8 py-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#486284] text-white text-sm font-bold flex items-center justify-center overflow-hidden">
            {avatarPreview || user.avatarUrl ? (
              <img
                src={avatarPreview ?? user.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <label
              htmlFor="profileAvatar"
              className="inline-flex cursor-pointer px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
            >
              Change avatar
            </label>
            <input
              id="profileAvatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              hidden
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="profileFirstName"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              First name
            </label>
            <input
              id="profileFirstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/15 outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="profileLastName"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Last name
            </label>
            <input
              id="profileLastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/15 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm text-gray-800 truncate">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="text-sm text-gray-800">
              {user.phone ? user.phone : "None"}
            </p>
          </div>
        </div>

        <ConnectTelegramButton />

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={closeModal}
            disabled={saving}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-[#486284] hover:bg-[#3a5270] disabled:bg-[#486284]/40 rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
