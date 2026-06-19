"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import StatusBadge from "@/components/orders/StatusBadge";
import type { OrderStatus } from "@/lib/api";
import { formatCurrency } from "@/lib/formatCurrency";
import PhotoLightbox from "@/components/common/PhotoLightbox";
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

function ParticipantAvatar({
  avatar,
  name,
  size,
}: {
  avatar: string;
  name: string;
  size: "header" | "message";
}) {
  const url = avatar?.trim();
  const sizeCls =
    size === "header" ? "w-9 h-9 text-xs" : "w-7 h-7 text-[10px] leading-none";
  return (
    <div
      className={`relative shrink-0 rounded-full bg-[#486284]/10 overflow-hidden flex items-center justify-center text-[#486284] font-semibold ring-1 ring-black/5 ${sizeCls}`}
    >
      {url ? (
        <Image src={url} alt="" fill className="object-cover" unoptimized />
      ) : (
        initialsFromDisplayName(name)
      )}
    </div>
  );
}
export interface ChatMessage {
  id: number;
  text: string;
  senderId: number;
  timestamp: string;
  read: boolean;
  mediaUrl?: string | null;
}

export interface LinkedOrder {
  id: number;
  status: OrderStatus;
  price: number;
}

interface ChatWindowProps {
  participant: {
    name: string;
    avatar: string;
    online: boolean;
  };
  /** Публичная страница провайдера; для клиента без маршрута — не задаём */
  participantProfileHref?: string;
  serviceTitle?: string;
  serviceId?: number;
  providerId?: number;
  linkedOrder?: LinkedOrder | null;
  messages: ChatMessage[];
  currentUserId: number;
  onSend: (text: string, imageFile?: File) => void | Promise<void>;
  sending?: boolean;
  onBack?: () => void;
  /** false while WebSocket is not ready — blocks send without losing the draft */
  canSend?: boolean;
  /** Shown under input when canSend is false */
  connectionHint?: string;
}

export default function ChatWindow({
  participant,
  participantProfileHref,
  serviceTitle,
  serviceId,
  providerId,
  linkedOrder,
  messages,
  currentUserId,
  onSend,
  onBack,
  canSend = true,
  connectionHint,
  sending = false,
}: ChatWindowProps) {
  const { t } = useChatTranslation();
  const [input, setInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [participant.name]);

  const handleSend = (imageFile?: File) => {
    const trimmed = input.trim();
    if ((!trimmed && !imageFile) || !canSend || sending) return;
    void Promise.resolve(onSend(trimmed, imageFile)).then(() => {
      setInput("");
    });
  };

  const onImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleSend(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!canSend) return;
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#E2E8F0] bg-white shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="#1E293B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {participantProfileHref ? (
          <Link
            href={participantProfileHref}
            className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl px-5 py-3 border-b border-[#E2E8F0] bg-white shrink-0 outline-none transition-colors"
            aria-label={t("window.openProfile", { name: participant.name })}
          >
            <div className="relative shrink-0">
              <ParticipantAvatar
                avatar={participant.avatar}
                name={participant.name}
                size="header"
              />
              {participant.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-[#1E293B] truncate transition-colors ">
                {participant.name}
              </p>
              {serviceTitle ? (
                <p className="text-xs text-[#64748B] truncate">
                  {serviceTitle}
                </p>
              ) : (
                <p className="text-xs text-[#64748B]">
                  {t("window.viewProfile")} ·{" "}
                  {participant.online
                    ? t("window.online")
                    : t("window.offline")}
                </p>
              )}
            </div>
          </Link>
        ) : (
          <>
            <div className="relative shrink-0">
              <ParticipantAvatar
                avatar={participant.avatar}
                name={participant.name}
                size="header"
              />
              {participant.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1E293B] truncate">
                {participant.name}
              </p>
              {serviceTitle ? (
                <p className="text-xs text-[#64748B] truncate">
                  {serviceTitle}
                </p>
              ) : (
                <p className="text-xs text-[#64748B]">
                  {participant.online
                    ? t("window.online")
                    : t("window.offline")}
                </p>
              )}
            </div>
          </>
        )}

        {/* Header action */}
        {!linkedOrder && serviceId && providerId ? (
          <Link
            href={`/orders/create?serviceId=${serviceId}&providerId=${providerId}`}
            className="px-3 py-1.5 text-xs font-semibold bg-[#486284] hover:bg-[#3a5270] text-white rounded-lg transition-colors hidden sm:block"
          >
            {t("window.createOrder")}
          </Link>
        ) : linkedOrder ? (
          <Link
            href={`/orders/${linkedOrder.id}`}
            className="px-3 py-1.5 text-xs font-semibold bg-[#486284]/10 text-[#486284] hover:bg-[#486284]/15 rounded-lg transition-colors hidden sm:block"
          >
            {t("window.viewOrder")}
          </Link>
        ) : null}
      </div>
      {/* Order summary banner */}
      {linkedOrder && (
        <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-xs text-[#64748B]">
                {t("window.orderLabel")}{" "}
                <span className="font-mono font-semibold text-[#1E293B]">
                  #{linkedOrder.id}
                </span>
              </div>
              <StatusBadge status={linkedOrder.status} />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-bold text-[#1E293B]">
                {formatCurrency(linkedOrder.price, { decimals: 2 })}
              </span>
              <Link
                href={`/orders/${linkedOrder.id}`}
                className="text-xs font-medium text-[#486284] hover:underline"
              >
                {t("window.viewDetails")}
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* Create order prompt (no order, shown in message area) */}
      {!linkedOrder && serviceId && providerId && messages.length > 0 && (
        <div className="px-5 py-2.5 bg-[#486284]/5 border-b border-[#E2E8F0] shrink-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#64748B]">
              {t("window.createOrderPrompt")}
            </p>
            <Link
              href={`/orders/create?serviceId=${serviceId}&providerId=${providerId}`}
              className="px-3 py-1.5 text-xs font-semibold bg-[#486284] hover:bg-[#3a5270] text-white rounded-lg transition-colors whitespace-nowrap"
            >
              {t("window.createOrder")}
            </Link>
          </div>
        </div>
      )}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-[#F8FAFC]/50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                    stroke="#D1D5DB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#64748B]">
                {t("window.emptyTitle")}
              </p>
              <p className="text-xs text-[#94A3B8] mt-1">
                {t("window.emptyDesc", { name: participant.name })}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMine = msg.senderId === currentUserId;
              const showAvatar =
                !isMine &&
                (idx === 0 || messages[idx - 1].senderId === currentUserId);

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"} ${
                    idx > 0 && messages[idx - 1].senderId === msg.senderId
                      ? "mt-0.5"
                      : "mt-3"
                  }`}
                >
                  {!isMine && (
                    <div className="w-7 shrink-0">
                      {showAvatar ? (
                        <ParticipantAvatar
                          avatar={participant.avatar}
                          name={participant.name}
                          size="message"
                        />
                      ) : null}
                    </div>
                  )}

                  <div
                    className={`max-w-[70%] ${!msg.mediaUrl && "px-3.5 py-2"} rounded-2xl ${
                      isMine
                        ? ` ${!msg.mediaUrl ? "bg-[#486284]" : "bg-[#7694ba]"} text-white rounded-br-md`
                        : "bg-white text-[#1E293B] border border-[#E2E8F0] shadow-sm rounded-bl-md"
                    }`}
                  >
                    {msg.mediaUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(msg.mediaUrl!)}
                        className="mb-2 block cursor-zoom-in overflow-hidden rounded-lg outline-none ring-white/40 focus-visible:ring-2"
                        aria-label={t("window.openPhoto")}
                      >
                        <Image
                          src={msg.mediaUrl}
                          alt=""
                          width={400}
                          height={300}
                          className="max-h-70 w-auto object-cover"
                          unoptimized
                        />
                      </button>
                    ) : null}
                    {msg.text && !msg.mediaUrl ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    ) : null}
                    <div
                      className={`flex items-center justify-end gap-1 mt-0.5 ${isMine ? "text-white/60" : "text-[#94A3B8]"}`}
                    >
                      <span className="text-[10px]">{msg.timestamp}</span>
                      {isMine && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          {msg.read ? (
                            <>
                              <path
                                d="M2 8.5L5.5 12L14 3.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M5 8.5L8.5 12"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </>
                          ) : (
                            <path
                              d="M3 8.5L6.5 12L14 3.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-[#E2E8F0] bg-white">
        {connectionHint ? (
          <p className="mb-2 text-center text-[11px] text-amber-800/90">
            {connectionHint}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onImagePick}
            disabled={!canSend || sending}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={!canSend || sending}
            className="w-10 h-10 shrink-0 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[#486284] hover:bg-[#486284]/5 disabled:opacity-50 flex items-center justify-center transition-colors"
            aria-label={t("window.attachPhoto")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder={
              canSend
                ? t("window.inputPlaceholder")
                : t("window.inputWaiting")
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canSend || sending}
            className="flex-1 px-4 py-2.5 text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-full outline-none focus:border-[#486284] focus:ring-2 focus:ring-[#486284]/15 transition-colors disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={(!input.trim() && !canSend) || !canSend || sending}
            className="w-10 h-10 shrink-0 rounded-full bg-[#486284] hover:bg-[#3a5270] disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path
                d="M18.333 1.667L9.167 10.833M18.333 1.667l-5.833 16.666-3.333-7.5-7.5-3.333 16.666-5.833z"
                stroke={input.trim() && canSend ? "white" : "#9CA3AF"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <PhotoLightbox
        urls={previewUrl ? [previewUrl] : []}
        index={previewUrl ? 0 : null}
        onClose={() => setPreviewUrl(null)}
      />
    </div>
  );
}
