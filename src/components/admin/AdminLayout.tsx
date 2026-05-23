import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SuperAdminSidebar from "./AdminSidebar";
import { Toast } from "../super_admin/SharedComponents";
import {  C } from "../types/types";
import type { Client, ClientStatus, Counts, ToastType } from "../types/types";

// ── Context so child pages can trigger approve/reject ─────────────────────────
// (Pass via Outlet context — no need for Redux/Zustand for this scale)

export interface SuperAdminOutletContext {
  clients: Client[];
  counts: Counts;
  handleApprove: (id: string) => void;
  handleReject: (id: string) => void;
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const navigate = useNavigate();
  // With this:
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/get_all_clients/", {
      headers: { "ngrok-skip-browser-warning": "1" }
    })
      .then(r => r.json())
      .then(data => {
        // Map backend fields to your Client type
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
          status: c.status ?? "pending",   // ← needs status column in DB
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
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const counts: Counts = {
    total: clients.length,
    pending: clients.filter((c) => c.status === "pending").length,
    approved: clients.filter((c) => c.status === "approved").length,
    rejected: clients.filter((c) => c.status === "rejected").length,
  };

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  const handleApprove = async (id: string) => {
    try {
    await fetch(`http://127.0.0.1:8000/update_client_status/${id}/`, {
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
    await fetch(`http://127.0.0.1:8000/update_client_status/${id}/`, {
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
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        input::placeholder { color: ${C.slate300}; }
      `}</style>

      {/* Sidebar */}
      <SuperAdminSidebar counts={counts} />

      {/* Main area */}
      <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
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

            <button style={{
              position: "relative", width: 36, height: 36, borderRadius: 9,
              border: `1px solid ${C.border}`, background: C.white,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 15,
            }}>
              🔔
              <span style={{
                position: "absolute", top: 7, right: 7,
                width: 7, height: 7, borderRadius: "50%", background: C.blue,
              }} />
            </button>

            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: C.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff", cursor: "pointer",
            }}>SA</div>
          </div>
        </header>

        {/* Page content rendered here */}
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