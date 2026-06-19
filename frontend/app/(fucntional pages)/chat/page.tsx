"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { ApiError, authApi, mediaApi } from "@/lib/api";
import {
  listConversations,
  getOrCreateConversation,
  getMessages,
  markConversationRead,
  normalizeMessage,
} from "@/lib/api/chat";
import type {
  ChatConversationDTO,
  ChatMessageDTO,
  UserRole,
} from "@/lib/api/types";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import type { Conversation as UiConversation } from "@/components/chat/ConversationList";
import type { ChatMessage } from "@/components/chat/ChatWindow";
import {
  useChatWebSocket,
  type ChatWsEvent,
} from "@/lib/hooks/useChatWebSocket";
import { useChatTranslation } from "@/lib/i18n/useChatTranslation";

function fmtTime(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function toUiMessage(m: ChatMessageDTO, locale: string): ChatMessage {
  return {
    id: m.id,
    text: m.content,
    senderId: m.senderId,
    timestamp: fmtTime(m.createdAt, locale),
    read: m.isRead,
    mediaUrl: m.mediaUrl,
  };
}

function otherParticipantId(conv: ChatConversationDTO, me: number): number {
  return conv.customerId === me ? conv.providerId : conv.customerId;
}

/** Собеседник в активном треде: участник или (для admin) провайдер по умолчанию. */
function activeThreadPartnerId(
  conv: ChatConversationDTO,
  me: number,
  role: UserRole,
): number | null {
  if (Number.isFinite(me)) {
    if (conv.customerId === me) return conv.providerId;
    if (conv.providerId === me) return conv.customerId;
  }
  if (role === "admin") return conv.providerId;
  return null;
}

function ChatContent() {
  const { t, i18n: i18nInst } = useChatTranslation();
  const locale = i18nInst.language;
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const providerIdParam = searchParams.get("providerId");
  const serviceIdParam = searchParams.get("serviceId");
  const customerIdParam = searchParams.get("customerId");

  const [rawConversations, setRawConversations] = useState<
    ChatConversationDTO[]
  >([]);
  const [profiles, setProfiles] = useState<
    Record<
      number,
      { name: string; avatar: string; online: boolean; role?: UserRole }
    >
  >({});
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [bootstrapDone, setBootstrapDone] = useState(false);
  /** Mobile: list vs thread (desktop always shows both) */
  const [showMobileList, setShowMobileList] = useState(true);
  const [messageSending, setMessageSending] = useState(false);

  const profileFetchRef = useRef<Set<number>>(new Set());
  const deepLinkOpenedRef = useRef(false);

  const serviceIdNum = serviceIdParam
    ? parseInt(serviceIdParam, 10)
    : undefined;
  const providerIdNum = providerIdParam ? parseInt(providerIdParam, 10) : NaN;
  const customerIdNum = customerIdParam
    ? parseInt(customerIdParam, 10)
    : NaN;

  const meNum = user ? parseInt(user.id, 10) : NaN;

  const activeConv = useMemo(
    () => rawConversations.find((c) => c.id === activeId) ?? null,
    [rawConversations, activeId],
  );

  const partnerId =
    activeConv && user
      ? activeThreadPartnerId(activeConv, meNum, user.role)
      : null;

  const partnerProfile = partnerId !== null ? profiles[partnerId] : undefined;

  const loadList = useCallback(async () => {
    const rows = await listConversations();
    setRawConversations(rows);
    return rows;
  }, []);

  useEffect(() => {
    if (!user) {
      setBootstrapDone(false);
      setRawConversations([]);
      setActiveId(null);
      setMessages([]);
      setProfiles({});
      profileFetchRef.current.clear();
      setError("");
      setShowMobileList(true);
      deepLinkOpenedRef.current = false;
      return;
    }
    setBootstrapDone(false);
  }, [user?.id]);

  useEffect(() => {
    if (activeId === null) setShowMobileList(true);
  }, [activeId]);

  useEffect(() => {
    if (!bootstrapDone || activeId === null) return;
    if (deepLinkOpenedRef.current) return;
    const hasAdminDisputeLink =
      user?.role === "admin" &&
      Number.isFinite(customerIdNum) &&
      customerIdNum > 0 &&
      Number.isFinite(providerIdNum) &&
      providerIdNum > 0;
    if (!providerIdParam && !hasAdminDisputeLink) return;
    deepLinkOpenedRef.current = true;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      setShowMobileList(false);
    }
  }, [
    bootstrapDone,
    activeId,
    providerIdParam,
    user?.role,
    customerIdNum,
    providerIdNum,
  ]);

  useEffect(() => {
    if (authLoading || !user || !Number.isFinite(meNum)) return;

    let cancelled = false;
    (async () => {
      setListLoading(true);
      setError("");
      try {
        let list = await loadList();
        if (cancelled) return;

        if (
          user.role === "admin" &&
          Number.isFinite(customerIdNum) &&
          customerIdNum > 0 &&
          Number.isFinite(providerIdNum) &&
          providerIdNum > 0
        ) {
          const match = list.find(
            (c) =>
              c.customerId === customerIdNum && c.providerId === providerIdNum,
          );
          if (match) setActiveId(match.id);
        }

        if (
          user.role === "customer" &&
          Number.isFinite(providerIdNum) &&
          providerIdNum > 0
        ) {
          await getOrCreateConversation(providerIdNum);
          list = await loadList();
          if (cancelled) return;
          const match = list.find(
            (c) => c.customerId === meNum && c.providerId === providerIdNum,
          );
          if (match) setActiveId(match.id);
        }

        if (user.role === "provider") {
          const found = list.find((c) => {
            if (
              Number.isFinite(customerIdNum) &&
              customerIdNum > 0 &&
              Number.isFinite(providerIdNum) &&
              providerIdNum > 0
            ) {
              return (
                c.customerId === customerIdNum &&
                c.providerId === providerIdNum
              );
            }
            if (Number.isFinite(providerIdNum)) {
              return (
                (c.customerId === providerIdNum && c.providerId === meNum) ||
                (c.providerId === providerIdNum && c.customerId === meNum)
              );
            }
            return false;
          });
          if (found) setActiveId(found.id);
        }
      } catch (e) {
        if (!cancelled) {
          const msg =
            e instanceof ApiError
              ? (e.body.message ?? e.message)
              : t("page.loadConversationsFailed");
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
          setBootstrapDone(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, meNum, providerIdNum, customerIdNum, loadList, user?.role, t]);

  useEffect(() => {
    if (!user || !Number.isFinite(meNum)) return;

    for (const c of rawConversations) {
      const idsToFetch =
        user.role === "admin"
          ? [c.customerId, c.providerId]
          : [otherParticipantId(c, meNum)];

      for (const oid of idsToFetch) {
        if (profileFetchRef.current.has(oid)) continue;
        profileFetchRef.current.add(oid);

        authApi
          .getProviderInfo(String(oid))
          .then((res) => {
            const u = res.user;
            const name =
              `${u.firstName} ${u.secondName}`.trim() ||
              t("page.userFallback", { id: oid });
            const avatar = u.avatarUrl?.trim() ?? "";
            setProfiles((prev) => ({
              ...prev,
              [oid]: {
                name,
                avatar,
                online: false,
                role: u.role,
              },
            }));
          })
          .catch(() => {
            setProfiles((prev) => ({
              ...prev,
              [oid]: {
                name: t("page.userFallback", { id: oid }),
                avatar: "",
                online: false,
              },
            }));
          });
      }
    }
  }, [rawConversations, user, meNum, t]);

  useEffect(() => {
    if (!activeId || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await getMessages(activeId);
        if (cancelled) return;
        setMessages(rows.map((m) => toUiMessage(m, locale)));
        await markConversationRead(activeId);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, user, locale]);

  const handleWs = useCallback(
    (ev: ChatWsEvent) => {
      if (ev.type !== "message_sent" && ev.type !== "new_message") return;
      const dto = normalizeMessage(ev.message as Record<string, unknown>);
      if (!activeId || dto.conversationId !== activeId) {
        void loadList();
        return;
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === dto.id)) return prev;
        return [...prev, toUiMessage(dto, locale)];
      });
      void loadList();
    },
    [activeId, loadList, locale],
  );

  const {
    send,
    ready: wsReady,
    connectionState,
  } = useChatWebSocket({
    enabled: Boolean(user),
    onEvent: handleWs,
  });

  useEffect(() => {
    if (!wsReady) return;
    setError((prev) =>
      /connection|could not send|still can.t connect/i.test(prev) ? "" : prev,
    );
  }, [wsReady]);

  const selectConversation = useCallback((id: number) => {
    setActiveId(id);
    setError("");
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      setShowMobileList(false);
    }
  }, []);

  const handleMobileBackToList = useCallback(() => {
    setShowMobileList(true);
  }, []);

  const uiConversations: UiConversation[] = useMemo(() => {
    if (!Number.isFinite(meNum) && user?.role !== "admin") return [];
    return rawConversations.map((c) => {
      const oid =
        user?.role === "admin"
          ? c.providerId
          : otherParticipantId(c, meNum);
      const p = profiles[oid];
      const lastAt = c.lastMessageAt
        ? new Date(c.lastMessageAt).toLocaleString(locale, {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "";
      return {
        id: c.id,
        participant: {
          name: p?.name ?? t("page.userFallback", { id: oid }),
          avatar: p?.avatar ?? "",
          online: false,
        },
        lastMessage: "",
        lastMessageTime: lastAt,
        unreadCount: 0,
      };
    });
  }, [rawConversations, profiles, meNum, user?.role, locale, t]);

  const handleSend = useCallback(
    async (text: string, imageFile?: File) => {
      if (!activeConv || !Number.isFinite(meNum) || partnerId === null) return;

      setMessageSending(true);
      try {
        let mediaUrl: string | undefined;
        if (imageFile) {
          const urls = (
            await mediaApi.uploadBatch([imageFile], mediaApi.CHAT_MEDIA_CONTEXT)
          ).map((item) => item.url);
          mediaUrl = urls[0];
        }

        const content = text.trim() || (mediaUrl ? t("page.photoMessage") : "");
        if (!content && !mediaUrl) return;

        const payload: Record<string, unknown> = {
          type: "send_message",
          conversation_id: activeConv.id,
          recipient_id: partnerId,
          content,
        };
        if (mediaUrl) {
          payload.media_url = mediaUrl;
        }

        if (send(payload)) return;

        for (let i = 0; i < 80; i++) {
          await new Promise((r) => setTimeout(r, 40));
          if (send(payload)) return;
        }

        setError(t("page.sendFailed"));
      } catch {
        setError(t("page.sendPhotoFailed"));
      } finally {
        setMessageSending(false);
      }
    },
    [activeConv, meNum, partnerId, send, t],
  );

  const participantFallback = useMemo(() => {
    if (partnerId === null)
      return {
        name: t("page.chatFallback"),
        avatar: "",
        online: false,
      };
    return {
      name: t("page.userFallback", { id: partnerId }),
      avatar: "",
      online: false,
    };
  }, [partnerId, t]);

  const participantProfileHref =
    partnerId !== null ? `/provider/${partnerId}` : undefined;

  const validServiceId =
    serviceIdNum !== undefined && Number.isFinite(serviceIdNum)
      ? serviceIdNum
      : undefined;

  if (authLoading) {
    return (
      <div className="flex h-[calc(100vh-73px)] items-center justify-center">
        <p className="text-sm text-gray-500">{t("page.loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-73px)] flex-col items-center justify-center gap-4 p-6">
        <p className="text-gray-600">{t("page.signInPrompt")}</p>
        <Link
          href="/login"
          className="rounded-lg bg-[#486284] px-4 py-2 text-sm font-semibold text-white"
        >
          {t("page.signIn")}
        </Link>
      </div>
    );
  }

  if (!bootstrapDone) {
    return (
      <div className="flex h-[calc(100vh-73px)] items-center justify-center">
        <p className="text-sm text-gray-500">{t("page.loading")}</p>
      </div>
    );
  }

  const wsBanner =
    connectionState === "open"
      ? null
      : connectionState === "reconnecting"
        ? t("page.reconnecting")
        : t("page.connecting");

  const sidebarVisibility =
    activeId && !showMobileList ? "hidden md:flex" : "flex";

  const threadVisibility =
    activeId && showMobileList ? "hidden md:flex" : "flex";

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col md:flex-row md:overflow-hidden">
      <div
        className={`${sidebarVisibility} max-h-[40vh] min-h-0 w-full shrink-0 flex-col overflow-hidden border-gray-200 bg-white md:max-h-none md:h-full md:w-[380px] md:border-r`}
      >
        {error ? (
          <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}
        <ConversationList
          conversations={uiConversations}
          activeId={activeId}
          onSelect={selectConversation}
        />
        {listLoading ? (
          <p className="px-4 py-2 text-xs text-gray-400">{t("page.updating")}</p>
        ) : null}
      </div>

      <div
        className={`${threadVisibility} min-h-0 min-w-0 flex-1 flex-col bg-[#FAFBFC]`}
      >
        {wsBanner ? (
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
            {wsBanner}
          </div>
        ) : null}

        {activeConv ? (
          <ChatWindow
            participant={partnerProfile ?? participantFallback}
            participantProfileHref={participantProfileHref}
            serviceId={validServiceId}
            providerId={activeConv.providerId}
            messages={messages}
            currentUserId={meNum}
            onSend={handleSend}
            onBack={handleMobileBackToList}
            canSend={wsReady}
            sending={messageSending}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500">
            {listLoading
              ? t("page.loadingConversations")
              : t("page.selectConversation")}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPageFallback() {
  const { t } = useChatTranslation();
  return (
    <div className="flex h-[calc(100vh-73px)] items-center justify-center text-sm text-gray-500">
      {t("page.loading")}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageFallback />}>
      <ChatContent />
    </Suspense>
  );
}
