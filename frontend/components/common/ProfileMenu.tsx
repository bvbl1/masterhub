"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBriefcase,
  HiOutlineHeart,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { useAuth } from "@/lib/context/AuthContext";
import { useModalStore } from "@/lib/store/modalStore";
import ProfileModal from "./ProfileModal";
import ProviderBecomeModal from "./ProviderBecomeModal";
import ConnectTelegramButton from "./ConnectTelegramButton";

type ProfileMenuVariant = "full" | "compact";

interface ProfileMenuProps {
  variant?: ProfileMenuVariant;
  onNavigate?: () => void;
}

export default function ProfileMenu({
  variant = "full",
  onNavigate,
}: ProfileMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { openModal } = useModalStore();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const initials = useMemo(() => {
    if (!user?.firstName) return "?";
    return `${user.firstName.charAt(0)}${user.secondName?.charAt(0) ?? ""}`.toUpperCase();
  }, [user]);

  const displayName = user ? `${user.firstName} ${user.secondName}`.trim() : "";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const closeAnd = (fn: () => void) => {
    setOpen(false);
    onNavigate?.();
    fn();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-2 min-w-0 rounded-lg p-1 hover:bg-gray-50 transition-colors ${
          variant === "compact" ? "shrink-0" : ""
        }`}
        title="Account menu"
      >
        <div className="relative w-8 h-8 shrink-0 bg-[#486284] rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
          {user.avatarUrl?.trim() ? (
            <Image
              src={user.avatarUrl.trim()}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            initials
          )}
        </div>
        {variant === "full" ? (
          <div className="min-w-0 max-w-[120px] lg:max-w-[200px] hidden md:block text-left">
            <p className="text-sm font-medium text-[#1E293B] truncate">
              {displayName}
            </p>
            <p className="text-xs text-[#94A3B8] capitalize truncate">
              {user.role}
            </p>
          </div>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 min-w-[13.5rem] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg shadow-gray-200/80 z-60"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              closeAnd(() => {
                openModal(<ProfileModal />);
              })
            }
            className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-[#1E293B] hover:bg-gray-50 transition-colors"
          >
            <HiOutlineUserCircle
              className="h-5 w-5 shrink-0 text-[#486284]"
              aria-hidden
            />
            Profile
          </button>
          <ConnectTelegramButton
            variant="menu"
            onSuccess={() => {
              setOpen(false);
              onNavigate?.();
            }}
          />
          {user.role === "customer" ? (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  closeAnd(() => {
                    router.push("/favorites");
                  })
                }
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-[#1E293B] hover:bg-gray-50 transition-colors"
              >
                <HiOutlineHeart
                  className="h-5 w-5 shrink-0 text-[#486284]"
                  aria-hidden
                />
                Saved providers
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  closeAnd(() => {
                    openModal(<ProviderBecomeModal />);
                  })
                }
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-[#1E293B] hover:bg-gray-50 transition-colors"
              >
                <HiOutlineBriefcase
                  className="h-5 w-5 shrink-0 text-[#486284]"
                  aria-hidden
                />
                Become provider
              </button>
            </>
          ) : null}
          <div className="my-1.5 mx-2 h-px bg-gray-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
              logout();
              router.push("/login");
            }}
            className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <HiOutlineArrowRightOnRectangle
              className="h-5 w-5 shrink-0 text-red-500"
              aria-hidden
            />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
