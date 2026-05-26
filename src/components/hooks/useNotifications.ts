import { useEffect, useState, useRef, useCallback } from "react";

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  time: Date;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const pushNotification = useCallback((message: string) => {
    console.log("🔔 [NOTIF] Pushing notification:", message);
    setNotifications((prev) => [
      {
        id: Date.now(),
        message,
        read: false,
        time: new Date(),
      },
      ...prev,
    ]);
  }, []);

  useEffect(() => {
    const WS_URL = "wss://city-animate-anagram.ngrok-free.dev/ws/notifications/";
    console.log("🔌 [WS] Attempting to connect to:", WS_URL);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ [WS] Connected successfully!");
      console.log("✅ [WS] ReadyState:", ws.readyState);
    };

    ws.onmessage = (event) => {
        
      console.log("📨 [WS] Raw message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("📨 [WS] Parsed message:", data);
        pushNotification(data.message);
        console.log("📨 [WS] Notification added to state!");
      } catch (err) {
        console.error("❌ [WS] Failed to parse message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ [WS] Error:", err);
      console.error("❌ [WS] ReadyState at error:", ws.readyState);
    };

    ws.onclose = (event) => {
      console.warn("🔌 [WS] Connection closed!");
      console.warn("🔌 [WS] Code:", event.code);
      console.warn("🔌 [WS] Reason:", event.reason);
      console.warn("🔌 [WS] Was clean:", event.wasClean);
    };

    if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

    return () => {
      console.log("🔌 [WS] Cleanup: closing WebSocket");
      ws.close();
    };
  }, [pushNotification]);

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAllRead, pushNotification };
}