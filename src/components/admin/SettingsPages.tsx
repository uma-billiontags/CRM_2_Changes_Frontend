import { useState } from "react";
import { C } from "../types/types";

// ── Shared inner card ─────────────────────────────────────────────────────────

function PageCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{
      padding: "16px 22px", borderBottom: `1px solid ${C.border}`,
      background: C.slate100,
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: C.slate, margin: 0, letterSpacing: "-0.3px" }}>
        {title}
      </h2>
      <p style={{ fontSize: 11, color: C.slate500, margin: "3px 0 0", fontWeight: 500 }}>{subtitle}</p>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 22px", borderBottom: `1px solid ${C.borderLight}`,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{label}</div>
        <div style={{ fontSize: 11, color: C.slate500, marginTop: 2 }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div
      onClick={() => setOn((v) => !v)}
      style={{
        width: 42, height: 24, borderRadius: 12, cursor: "pointer",
        background: on ? C.green : C.slate300,
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 20 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: C.white, transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export function SystemSettingsPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0, letterSpacing: "-0.4px" }}>
          System Settings
        </h1>
        <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", fontWeight: 500 }}>
          Configure platform-wide behaviour and preferences
        </p>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        {/* Onboarding */}
        <PageCard>
          <CardHeader title="Client Onboarding" subtitle="Control the onboarding workflow" />
          <SettingRow label="Require Admin Approval" desc="New clients must be manually approved before activation">
            <Toggle defaultOn />
          </SettingRow>
          <SettingRow label="Auto-Approve Prepaid Clients" desc="Skip review for clients paying in advance">
            <Toggle />
          </SettingRow>
          <SettingRow label="Send Welcome Email" desc="Automatically email clients on approval">
            <Toggle defaultOn />
          </SettingRow>
        </PageCard>

        {/* Notifications */}
        <PageCard>
          <CardHeader title="Notifications" subtitle="Choose when admins are alerted" />
          <SettingRow label="New Client Submission" desc="Alert when a new client submits for approval">
            <Toggle defaultOn />
          </SettingRow>
          <SettingRow label="Overdue Payment Alert" desc="Notify finance team of overdue invoices">
            <Toggle defaultOn />
          </SettingRow>
          <SettingRow label="High-Risk Client Flag" desc="Flag clients classified as High or Critical risk">
            <Toggle />
          </SettingRow>
        </PageCard>

        {/* Billing */}
        <PageCard>
          <CardHeader title="Billing Defaults" subtitle="Default values pre-filled on the onboarding form" />
          <div style={{ padding: "16px 22px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Default Currency", value: "INR" },
                { label: "Default Payment Terms", value: "Net 30 days" },
                { label: "Default Tax Type", value: "GST" },
                { label: "Default Credit Period", value: "30 days" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.slate500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                  <input
                    defaultValue={value}
                    style={{
                      width: "100%", height: 36, padding: "0 12px",
                      border: `1px solid ${C.border}`, borderRadius: 8,
                      fontSize: 13, color: C.slate, outline: "none",
                      background: C.bg,
                    }}
                  />
                </div>
              ))}
            </div>
            <button style={{
              marginTop: 16, padding: "9px 20px", borderRadius: 8, border: "none",
              background: C.blue, color: C.white, fontSize: 13, fontWeight: 600,
              cursor: "pointer",
            }}>Save Defaults</button>
          </div>
        </PageCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN USERS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_ADMINS = [
  { id: "ADM-001", name: "Rajesh Kumar",  email: "rajesh@billiontags.com",  role: "Super Admin",   status: "active",   lastLogin: "2026-05-19T11:30:00Z" },
  { id: "ADM-002", name: "Priya Sharma",  email: "priya@billiontags.com",   role: "Admin",         status: "active",   lastLogin: "2026-05-18T09:10:00Z" },
  { id: "ADM-003", name: "Arun Nair",     email: "arun@billiontags.com",    role: "Finance Admin", status: "active",   lastLogin: "2026-05-17T14:20:00Z" },
  { id: "ADM-004", name: "Sneha Menon",   email: "sneha@billiontags.com",   role: "Viewer",        status: "inactive", lastLogin: "2026-04-30T08:00:00Z" },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminUsersPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0, letterSpacing: "-0.4px" }}>
            Admin Users
          </h1>
          <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", fontWeight: 500 }}>
            Manage platform administrators and their access levels
          </p>
        </div>
        <button style={{
          padding: "9px 18px", borderRadius: 8, border: "none",
          background: C.blue, color: C.white, fontSize: 13, fontWeight: 600,
          cursor: "pointer",
        }}>+ Invite Admin</button>
      </div>

      <PageCard>
        <CardHeader title="All Administrators" subtitle={`${MOCK_ADMINS.length} users with platform access`} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ background: C.slate100, borderBottom: `1px solid ${C.border}` }}>
                {["ID", "Name", "Email", "Role", "Status", "Last Login", "Actions"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    fontSize: 10, fontWeight: 700, color: C.slate500,
                    letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_ADMINS.map((admin, i) => (
                <tr
                  key={admin.id}
                  style={{ borderBottom: i < MOCK_ADMINS.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = C.slate100; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, background: C.blueLight, padding: "2px 7px", borderRadius: 5, fontFamily: "monospace" }}>
                      {admin.id}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: C.slate }}>{admin.name}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: C.slate500 }}>{admin.email}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: admin.role === "Super Admin" ? C.purple : C.blue,
                      background: admin.role === "Super Admin" ? C.purpleLight : C.blueLight,
                      padding: "3px 8px", borderRadius: 6,
                    }}>{admin.role}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: admin.status === "active" ? C.green : C.slate500,
                      background: admin.status === "active" ? C.greenLight : C.slate100,
                      padding: "3px 8px", borderRadius: 6,
                    }}>{admin.status.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: C.slate700 }}>{fmtDate(admin.lastLogin)}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ padding: "4px 10px", borderRadius: 6, background: C.blueLight, border: `1px solid ${C.blueMid}`, color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                      {admin.role !== "Super Admin" && (
                        <button style={{ padding: "4px 10px", borderRadius: 6, background: C.redLight, border: `1px solid #FECACA`, color: C.red, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_LOGS = [
  { id: "LOG-001", action: "Client Approved",  actor: "Rajesh Kumar", target: "NovaTech Solutions Pvt. Ltd.", timestamp: "2026-05-19T11:22:00Z", type: "success" },
  { id: "LOG-002", action: "Client Rejected",  actor: "Priya Sharma",  target: "RetailEdge Commerce Ltd.",    timestamp: "2026-05-18T16:45:00Z", type: "error"   },
  { id: "LOG-003", action: "Admin Invited",    actor: "Rajesh Kumar", target: "sneha@billiontags.com",       timestamp: "2026-05-17T10:00:00Z", type: "info"    },
  { id: "LOG-004", action: "Settings Updated", actor: "Arun Nair",    target: "Billing Defaults",            timestamp: "2026-05-16T14:30:00Z", type: "info"    },
  { id: "LOG-005", action: "Client Approved",  actor: "Priya Sharma",  target: "BrandBridge Media Pvt. Ltd.", timestamp: "2026-05-11T14:00:00Z", type: "success" },
];

const LOG_TYPE_STYLE: Record<string, { color: string; bg: string; icon: string }> = {
  success: { color: C.green, bg: C.greenLight, icon: "✓" },
  error:   { color: C.red,   bg: C.redLight,   icon: "✕" },
  info:    { color: C.blue,  bg: C.blueLight,  icon: "ℹ" },
};

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_LOGS.filter((l) =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.actor.toLowerCase().includes(search.toLowerCase()) ||
    l.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0, letterSpacing: "-0.4px" }}>
          Audit Logs
        </h1>
        <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", fontWeight: 500 }}>
          Complete history of all admin actions on the platform
        </p>
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <input
          placeholder="Search by action, actor or target…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, maxWidth: 360, height: 38, padding: "0 14px",
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 9, color: C.slate, fontSize: 13, outline: "none",
          }}
        />
        <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>
          {filtered.length} log{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <PageCard>
        <CardHeader title="Activity Log" subtitle="Sorted by most recent" />
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.slate500, fontSize: 13 }}>
            No logs found.
          </div>
        ) : (
          filtered.map((log, i) => {
            const style = LOG_TYPE_STYLE[log.type] ?? LOG_TYPE_STYLE.info;
            return (
              <div
                key={log.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "14px 22px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : "none",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.slate100; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {/* Icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: style.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: style.color, fontWeight: 700,
                }}>{style.icon}</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{log.action}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "monospace", color: C.slate500 }}>{log.id}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.slate500, marginTop: 3 }}>
                    By <span style={{ color: C.slate700, fontWeight: 600 }}>{log.actor}</span>
                    {" · "}
                    <span style={{
                      color: style.color, fontWeight: 600,
                      background: style.bg, padding: "1px 6px", borderRadius: 4, fontSize: 11,
                    }}>{log.target}</span>
                  </div>
                </div>

                {/* Timestamp */}
                <div style={{ fontSize: 11, color: C.slate500, whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>
                  {fmtDateTime(log.timestamp)}
                </div>
              </div>
            );
          })
        )}
      </PageCard>
    </div>
  );
}