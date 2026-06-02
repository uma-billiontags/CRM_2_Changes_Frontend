import { useOutletContext, useNavigate } from "react-router-dom";
import { C, fmt } from "../types/types";
import { StatusBadge } from "../super_admin/SharedComponents";
import type { AdminOutletContext } from "./AdminLayout";
import type { Client } from "../types/types";

// ── Types (local) ─────────────────────────────────────────────────────────────

interface StatItem {
  label: string;
  value: number;
  icon: string;
  color: string;
  accentLight: string;
  to: string;
}

// ── Overview page ─────────────────────────────────────────────────────────────

export default function AdminOverview() {
  const { clients, counts } = useOutletContext<AdminOutletContext>();
  const navigate = useNavigate();

  const stats: StatItem[] = [
    { label: "Total Clients",    value: counts.total,    icon: "🏢", color: C.blue,  accentLight: C.blueLight,  to: "/superadmin/clients"  },
    { label: "Pending Approval", value: counts.pending,  icon: "⏳", color: C.amber, accentLight: C.amberLight, to: "/superadmin/pending"  },
    { label: "Approved",         value: counts.approved, icon: "✓", color: C.green, accentLight: C.greenLight, to: "/superadmin/approved" },
    { label: "Rejected",         value: counts.rejected, icon: "✕", color: C.red,   accentLight: C.redLight,   to: "/superadmin/rejected" },
  ];

  const pendingClients = clients.filter((c: Client) => c.status === "pending");

  return (
    <div>
      {/* Page heading */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0, letterSpacing: "-0.4px" }}>
          Platform Overview
        </h1>
        <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", letterSpacing: "0.04em", fontWeight: 500 }}>
          REAL-TIME SUMMARY OF CLIENT ONBOARDING STATUS
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            onClick={() => navigate(s.to)}
            style={{
              background: C.white, borderRadius: 14, padding: "22px 20px",
              border: `1px solid ${C.border}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              cursor: "pointer", transition: "box-shadow 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: C.slate500, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {s.label}
              </span>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: s.accentLight,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: s.color, letterSpacing: "-1px", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: C.slate500, marginTop: 8, fontWeight: 500 }}>
              Click to view →
            </div>
          </div>
        ))}
      </div>

      {/* Pending list */}
      <div style={{
        background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
        overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          padding: "16px 22px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>⏳</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.slate, letterSpacing: "-0.3px" }}>
            Awaiting Approval
          </span>
          <span style={{
            marginLeft: "auto", fontSize: 11, color: C.amber, fontWeight: 700,
            background: C.amberLight, padding: "2px 8px", borderRadius: 10, border: `1px solid #FDE68A`,
          }}>{counts.pending} pending</span>
          <button
            onClick={() => navigate("/superadmin/pending")}
            style={{
              padding: "5px 12px", borderRadius: 7,
              background: C.blueLight, border: `1px solid ${C.blueMid}`,
              color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >View All</button>
        </div>

        {pendingClients.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: C.slate500, fontSize: 13 }}>
            No pending clients 🎉
          </div>
        ) : (
          pendingClients.map((c: Client, i: number) => (
            <div
              key={c.id}
              onClick={() => navigate("/superadmin/pending")}
              style={{
                padding: "14px 22px",
                borderBottom: i < pendingClients.length - 1 ? `1px solid ${C.borderLight}` : "none",
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", transition: "background 0.12s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.slate100; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9, background: C.blueLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>🏢</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.company_name}
                </div>
                <div style={{ fontSize: 11, color: C.slate500, marginTop: 2 }}>
                  {c.id} · Submitted {fmt(c.submitted_at)}
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}