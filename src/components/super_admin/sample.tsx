// SuperAdminLayout.tsx
import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { Toast } from "./SharedComponents";
import { C } from "../types/types";
import type { Client, ClientStatus, Counts, ToastType } from "../types/types";

export interface SuperAdminOutletContext {
  clients: Client[];
  counts: Counts;
  handleApprove: (id: string) => void;
  handleReject: (id: string) => void;
}

// ── Notification type ─────────────────────────────────────────────────────────
interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
}

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // ── Notification state ──────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

   // Request browser notification permission when admin opens the dashboard
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── WebSocket connection ────────────────────────────────────────────────────
  useEffect(() => {
    const socket = new WebSocket(
      "wss://city-animate-anagram.ngrok-free.dev/ws/notifications/"
    );

    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // ── Bell notification (existing) ──
      const newNotif: Notification = {
        id: Date.now(),
        message: data.message,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // ── Desktop notification (new) ──
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🔔 New Client Alert", {
          body: data.message,
          icon: "/icons.svg",       // put your logo in /public folder
          badge: "/icons.svg",
          tag: "crm-notification", // prevents duplicate popups
        });
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = (event) => {
      console.log("WebSocket disconnected", event.code);
    };

    return () => {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    };
  }, []);

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
    setShowDropdown(false);
  };

  // ── Existing fetches ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("https://city-animate-anagram.ngrok-free.dev/get_all_clients/", {
      headers: { "ngrok-skip-browser-warning": "1" }
    })
      .then(r => r.json())
      .then(data => {
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
      .catch(err => console.error("Failed to fetch clients", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("https://city-animate-anagram.ngrok-free.dev/get_campaigns/", {
      headers: { "ngrok-skip-browser-warning": "1" },
    })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.campaigns) ? data.campaigns : [];
        setCampaigns(list);
      })
      .catch(err => console.error("Failed to fetch campaigns", err));
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
      await fetch(`https://city-animate-anagram.ngrok-free.dev/update_client_status/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      setClients((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: "approved" as ClientStatus, approved_at: new Date().toISOString() } : c
        )
      );
      showToast("Client approved successfully!", "success");
    } catch {
      showToast("Failed to approve client.", "error");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetch(`https://city-animate-anagram.ngrok-free.dev/update_client_status/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
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

  const outletContext: SuperAdminOutletContext = {
    clients, counts, handleApprove, handleReject,
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: C.bg,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        input::placeholder { color: ${C.slate300}; }
      `}</style>

      <SuperAdminSidebar counts={counts} />

      <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{
          height: 64, background: C.white, borderBottom: `1px solid ${C.border}`,
          padding: "0 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 50, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: C.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 900, color: C.white, flexShrink: 0,
            }}>SA</div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.slate }}>Billion </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>Tags</span>
              <span style={{ fontSize: 11, color: C.slate500, marginLeft: 8 }}>/ Super Admin Portal</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {counts.pending > 0 && (
              <div
                onClick={() => navigate("/superadmin/pending")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                  background: C.amberLight, border: `1px solid #FDE68A`,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.amber }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, letterSpacing: "0.08em" }}>
                  {counts.pending} PENDING
                </span>
              </div>
            )}

            {/* ── Bell Icon with Dropdown ─────────────────────────────────── */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setShowDropdown((prev) => !prev);
                  if (!showDropdown) markAllRead();
                }}
                style={{
                  position: "relative", width: 36, height: 36, borderRadius: 9,
                  border: `1px solid ${C.border}`, background: C.white,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 15,
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -4,
                    minWidth: 18, height: 18, borderRadius: 9,
                    background: "#EF4444", color: "#fff",
                    fontSize: 10, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 4px", lineHeight: 1,
                    border: `2px solid ${C.white}`,
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* ── Dropdown Panel ───────────────────────────────────────── */}
              {showDropdown && (
                <div style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  width: 320, background: C.white,
                  border: `1px solid ${C.border}`, borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  zIndex: 999,
                  animation: "slideDown 0.2s ease both",
                  overflow: "hidden",
                }}>
                  {/* Header */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.slate }}>
                      Notifications
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        style={{
                          fontSize: 11, color: C.blue, background: "none",
                          border: "none", cursor: "pointer", fontWeight: 600, padding: 0,
                        }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{
                        padding: "32px 16px", textAlign: "center",
                        color: C.slate500, fontSize: 13,
                      }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 10,
                            padding: "12px 16px",
                            borderBottom: `1px solid ${C.border}`,
                            background: n.read ? C.white : "#EFF6FF",
                            transition: "background 0.2s",
                          }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "#DBEAFE", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14,
                          }}>
                            👤
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0, fontSize: 12, color: C.slate,
                              fontWeight: n.read ? 400 : 600,
                              lineHeight: 1.4,
                            }}>
                              {n.message}
                            </p>
                            <p style={{ margin: "3px 0 0", fontSize: 11, color: C.slate500 }}>
                              {n.time}
                            </p>
                          </div>
                          {!n.read && (
                            <div style={{
                              width: 7, height: 7, borderRadius: "50%",
                              background: C.blue, flexShrink: 0, marginTop: 4,
                            }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* ── End Bell ─────────────────────────────────────────────────── */}

            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: C.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff", cursor: "pointer",
            }}>SA</div>
          </div>
        </header>

        <main style={{ flex: 1, padding: 28, overflowY: "auto", animation: "fadeUp 0.35s ease both" }}>
          <Outlet context={outletContext} />
        </main>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}