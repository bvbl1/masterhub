"use client";

import Image from "next/image";
import { useState } from "react";
import { useChatTranslation } from "@/lib/i18n/useChatTranslation";

function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "?";
}

export interface Conversation {
  id: number;
  participant: {
    name: string;
    avatar: string;
    online: boolean;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
}: ConversationListProps) {
  const { t } = useChatTranslation();
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) =>
    c.participant.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-lg font-bold text-gray-900">{t("list.title")}</h2>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <circle
              cx="7"
              cy="7"
              r="5.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M11 11l3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder={t("list.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/15 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 p-1">
        {filtered.length === 0 ? (
          <div className="text-center">
            {conversations.length === 0 ? (
              <>
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                      stroke="#D1D5DB"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {t("list.emptyTitle")}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t("list.emptyDesc")}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("list.noResults")}</p>
            )}
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              type="button"
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors rounded-xl ${
                activeId === conv.id
                  ? "bg-[#486284]/10  shadow-sm"
                  : "hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="relative w-11 h-11 rounded-full bg-[#486284]/10 overflow-hidden flex items-center justify-center text-[#486284] text-xs font-bold">
                  {conv.participant.avatar?.trim() ? (
                    <Image
                      src={conv.participant.avatar}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    initialsFromDisplayName(conv.participant.name)
                  )}
                </div>
                {conv.participant.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {conv.participant.name}
                  </span>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {conv.lastMessageTime}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-gray-500 truncate">
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-[#486284] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
