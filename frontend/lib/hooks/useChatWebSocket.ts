"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/api/client";
import { fetchChatWebSocketUrl } from "@/lib/api/chat";

export type ChatWsEvent =
  | { type: "message_sent"; message: Record<string, unknown> }
  | { type: "new_message"; message: Record<string, unknown> }
  | { type: "error"; error?: string };

type ConnectionState = "idle" | "connecting" | "open" | "reconnecting";

export function useChatWebSocket(opts: {
  enabled: boolean;
  onEvent: (ev: ChatWsEvent) => void;
}) {
  const onEventRef = useRef(opts.onEvent);
  onEventRef.current = opts.onEvent;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const manualCloseRef = useRef(false);
  const connectingRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");

  useEffect(() => {
    if (!opts.enabled) {
      manualCloseRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setReady(false);
      setConnectionState("idle");
      return;
    }

    manualCloseRef.current = false;
    reconnectAttemptRef.current = 0;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (manualCloseRef.current || !opts.enabled) return;
      setConnectionState("reconnecting");
      setReady(false);
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(500 * Math.pow(2, attempt), 15_000);
      reconnectAttemptRef.current = attempt + 1;
      clearReconnectTimer();
      reconnectTimerRef.current = setTimeout(() => {
        if (manualCloseRef.current) return;
        connect();
      }, delay);
    };

    function openSocket(base: string, token: string) {
      const ws = new WebSocket(`${base}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        connectingRef.current = false;
        if (manualCloseRef.current) return;
        reconnectAttemptRef.current = 0;
        setReady(true);
        setConnectionState("open");
      };

      ws.onclose = () => {
        connectingRef.current = false;
        wsRef.current = null;
        setReady(false);
        if (manualCloseRef.current) {
          setConnectionState("idle");
          return;
        }
        setConnectionState("reconnecting");
        scheduleReconnect();
      };

      ws.onerror = () => {
        /* onclose follows */
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as ChatWsEvent;
          onEventRef.current?.(data);
        } catch {
          /* ignore */
        }
      };
    }

    async function connect() {
      if (manualCloseRef.current || !opts.enabled) return;
      const existing = wsRef.current;
      if (
        existing &&
        (existing.readyState === WebSocket.CONNECTING ||
          existing.readyState === WebSocket.OPEN)
      ) {
        return;
      }
      if (connectingRef.current) return;
      const token = getToken();
      if (!token) {
        setReady(false);
        setConnectionState("idle");
        return;
      }

      connectingRef.current = true;
      setConnectionState((s) => (s === "reconnecting" ? s : "connecting"));

      try {
        const base = await fetchChatWebSocketUrl();
        if (manualCloseRef.current || !opts.enabled) {
          connectingRef.current = false;
          return;
        }
        openSocket(base, token);
      } catch {
        connectingRef.current = false;
        setReady(false);
        setConnectionState("reconnecting");
        scheduleReconnect();
      }
    }

    connect();

    return () => {
      manualCloseRef.current = true;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      connectingRef.current = false;
      setReady(false);
      setConnectionState("idle");
    };
  }, [opts.enabled]);

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { send, ready, connectionState };
}
