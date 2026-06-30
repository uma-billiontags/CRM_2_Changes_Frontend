// SuperAdminLayout.tsx
import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { Toast } from "../super_admin/SharedComponents";
import { C } from "../types/types";
import type { Client, ClientStatus, Counts, ToastType } from "../types/types";

// ── Firebase imports ────────────────────────────────────────────────────────
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// ── Firebase config ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCm6A3ecdnRuM2BtqcU8hbViNVmtSYowNE",
  authDomain: "crm-notification-system-b1fbf.firebaseapp.com",
  projectId: "crm-notification-system-b1fbf",
  storageBucket: "crm-notification-system-b1fbf.firebasestorage.app",
  messagingSenderId: "822813005343",
  appId: "1:822813005343:web:9b60be7829ac4a5615e72a",
};

// ── VAPID key for FCM ───────────────────────────────────────────────────
const VAPID_KEY =
  "BOrsq40DwgRJYZ6MUfTq6evI-iBEF2rknTh-sgONupO8DJNDFiZF-nRY49GAOE8fwUwqa_I2R0nXYTmkUHmC1eU";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Init Firebase once ───────────────────────────────────────────────────────
const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export interface AdminOutletContext {
  clients: Client[];
  counts: Counts;
  handleApprove: (id: string) => void;
  handleReject: (id: string) => void;
}

// ── Notification type ────────────────────────────────────────────────────────
interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
}

export default function SuperAdminLayout() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const rootRef = useRef<HTMLDivElement>(null);

  // Apply theme to root div so CSS vars cascade
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // ── Notification state ───────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem("crm_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasRegistered = useRef(false); // ✅ add this ref

  useEffect(() => {
    localStorage.setItem("crm_notifications", JSON.stringify(notifications));
  }, [notifications]);


  // ── Helper: add notification to bell list ────────────────────────────────
  const addNotification = (message: string) => {
    const newNotif: Notification = {
      id: Date.now(),
      message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // ── Helper: desktop popup notification ──────────────────────────────────
  const showDesktopNotification = (message: string) => {
    if (!("Notification" in window)) return;

    const fire = () => {
      new Notification("🔔 New Client Alert", {
        body: message,
        icon: "/icons.svg",
        tag: `crm-${Date.now()}`,
      });
    };

    if (Notification.permission === "granted") {
      fire();
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") fire();
      });
    }
  };

  // ── 1. Request browser notification permission on mount ──────────────────
  useEffect(() => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications");
      return;
    }
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  // ── 2. Register Service Worker + get FCM token + save to Django ──────────
  //    This token is used by Django to send push even when browser is closed
  // ── 2. Register Service Worker + get FCM token + save to Django ──────────
  useEffect(() => {
    const registerAndSaveToken = async () => {

      // ✅ Skip if already ran once (prevents React StrictMode double run)
      if (hasRegistered.current) return;
      hasRegistered.current = true;

      try {
        if (!("serviceWorker" in navigator)) return;

        const swRegistration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("Notification permission not granted");
          return;
        }

        const messaging = getMessaging(firebaseApp);

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        });

        if (!token) {
          console.warn("No FCM token received");
          return;
        }

        console.log("FCM Token:", token);

        await fetch(`${BASE_URL}/save_fcm_token/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        console.log("FCM token saved to backend");
      } catch (err) {
        console.error("FCM setup error:", err);
      }
    };

    registerAndSaveToken();
  }, []);

  // ── 3. FCM Foreground listener ───────────────────────────────────────────
  //    Fires when tab is open (WebSocket also fires, but FCM is the fallback
  //    when WebSocket is not connected)
  useEffect(() => {
    try {
      const messaging = getMessaging(firebaseApp);

      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("FCM foreground message:", payload);
        const message =
          payload.notification?.body ||
          payload.data?.message ||
          "New notification";

        addNotification(message);
        showDesktopNotification(message);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("FCM onMessage error:", err);
    }
  }, []);

  // ── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem("crm_notifications");
    setShowDropdown(false);
  };

  // ── Fetch clients ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/get_all_clients/`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    })
      .then((r) => r.json())
      .then((data) => {
        const mapped = data.map((c: any) => ({
          id: c.client_id,
          reporting_id: c.reporting_id,
          company_name: c.name,
          company_type: c.company_type,
          agency_type: c.agency_type,
          email: c.email,
          phone: c.phone,
          website: c.website,
          country: c.country,
          state: c.state,
          city: c.city,
          cin_number: c.cin_number,
          vast_number: c.vast_number,
          place_of_supply: c.place_of_supply,
          is_active: c.is_active,
          status: c.status ?? "pending",
          submitted_at: c.created_at,
          billing: c.billing ?? {},
          contacts: c.contacts ?? [],
          ownership: c.ownership ?? {},
          classification: c.classification ?? {},
        }));
        setClients(mapped);
      })
      .catch((err) => console.error("Failed to fetch clients", err));
  }, []);

  // ── Fetch campaigns ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/get_campaigns/`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.campaigns)
            ? data.campaigns
            : [];
        setCampaigns(list);
      })
      .catch((err) => console.error("Failed to fetch campaigns", err));
  }, []);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const counts: Counts = {
    total: clients.length,
    pending: clients.filter((c) => c.status === "pending").length,
    approved: clients.filter((c) => c.status === "approved").length,
    rejected: clients.filter((c) => c.status === "rejected").length,
    campaignTotal: campaigns.length,
  };

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  const handleApprove = async (id: string) => {
    try {
      const teamId = localStorage.getItem('user_id');
      await fetch(`${BASE_URL}/update_client_status/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", team_id: teamId }),
      });
      setClients((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
              ...c,
              status: "approved" as ClientStatus,
              approved_at: new Date().toISOString(),
            }
            : c
        )
      );
      showToast("Client approved successfully!", "success");
    } catch {
      showToast("Failed to approve client.", "error");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const teamId = localStorage.getItem('user_id');  // ← get from localStorage

      await fetch(`${BASE_URL}/update_client_status/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", team_id: teamId }),  // ← include team_id in body
      });
      setClients((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: "rejected" as ClientStatus } : c
        )
      );
      showToast("Client has been rejected.", "error");
    } catch {
      showToast("Failed to reject client.", "error");
    }
  };

  const outletContext: AdminOutletContext = {
    clients,
    counts,
    handleApprove,
    handleReject,
  };

  return (
    <div
      className="db-root"
      data-theme={theme}
      ref={rootRef}
    >
      <AdminSidebar counts={counts} />

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="db-main">
        {/* Header */}
        <header className="db-header">
          <div className="db-header-left">
            <div className="db-header-tabs">
              <span className="db-tab active">Billion Tags</span>
              <span className="db-tab">Admin Portal</span>
            </div>
          </div>

          <div className="db-header-right">
            {/* ── Bell Icon with Dropdown ──────────────────────────────── */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <div
                className="db-icon-btn"
                title="Notifications"
                onClick={() => {
                  setShowDropdown((prev) => !prev);
                  if (!showDropdown) markAllRead();
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute", top: -4, right: -4,
                      width: 14, height: 14,
                      background: C.red, borderRadius: "50%",
                      fontSize: 8, fontWeight: 700,
                      color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid var(--bg-header)",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              {/* ── Dropdown Panel ───────────────────────────────────── */}
              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: 320,
                    background: C.white,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    zIndex: 999,
                    animation: "slideDown 0.2s ease both",
                    overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.slate }}>
                      Notifications
                    </span>
                    {notifications.length > 0 && (
                      <span
                        onClick={clearAll}
                        style={{
                          fontSize: 11,
                          color: C.blue,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Clear all
                      </span>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: "32px 16px",
                          textAlign: "center",
                          color: C.slate500,
                          fontSize: 13,
                        }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            padding: "12px 16px",
                            borderBottom: `1px solid ${C.border}`,
                            background: n.read ? C.white : "#EFF6FF",
                            transition: "background 0.2s",
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "#DBEAFE",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                            }}
                          >
                            👤
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 12,
                                color: C.slate,
                                fontWeight: n.read ? 400 : 600,
                                lineHeight: 1.4,
                              }}
                            >
                              {n.message}
                            </p>
                            <p style={{ margin: "3px 0 0", fontSize: 11, color: C.slate500 }}>
                              {n.time}
                            </p>
                          </div>
                          {!n.read && (
                            <div
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: C.blue,
                                flexShrink: 0,
                                marginTop: 4,
                              }}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <div
              className="db-theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </div>

            {/* User */}
            <div className="db-header-user">
              <div className="db-header-avatar">A</div>
              <span className="db-header-uname">ADMIN</span>
            </div>
          </div>
        </header>

        <main
          className="db-content"
        >
          <Outlet context={outletContext} />
        </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
} 