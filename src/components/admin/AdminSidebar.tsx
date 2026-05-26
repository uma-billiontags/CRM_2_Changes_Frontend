import { Link, useLocation } from "react-router-dom";
import type { Counts } from "../types/types";
import { LogOut, Settings } from 'lucide-react';


// ── Sidebar Color Palette ─────────────────────────────────────────────────────

const SC = {
  blue: "#2563EB",
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
  sidebarBg: "#0F172A",
  sidebarBorder: "rgba(255,255,255,0.07)",
  sidebarText: "rgba(255,255,255,0.45)",
  sidebarTextMuted: "rgba(255,255,255,0.25)",
  sidebarActive: "rgba(37,99,235,0.85)",
  white: "#FFFFFF",
};

// ── Nav Config ────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: string;
  to: string;
  accent?: string;
  countKey?: keyof Counts;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "ADMINISTRATION",
    items: [
      { label: "Overview", icon: "◈", to: "/admin/overview" },
    ],
  },
  {
    group: "CLIENTS",
    items: [
      { label: "All Clients", icon: "🏢", to: "/admin/clients", countKey: "total" },
    ],
  },
  {
    group: "CAMPAIGNS",
    items: [
      { label: "All Campaigns", icon: "📊", to: "/admin/campaigns", countKey: "campaignTotal" },
    ],
  },
  {
    group: "SETTINGS",
    items: [
      { label: "System Settings", icon: "⚙️", to: "/admin/system-settings" },
      { label: "Audit Logs", icon: "📋", to: "/admin/audit-logs" },
    ],
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface AdminSidebarProps {
  counts: Counts;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminSidebar({ counts }: AdminSidebarProps) {
  const location = useLocation();

  return (
    <aside style={{
      width: 240,
      minHeight: "100vh",
      background: SC.sidebarBg,
      borderRight: `1px solid ${SC.sidebarBorder}`,
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0, left: 0, bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        height: 64,
        display: "flex", alignItems: "center",
        padding: "0 16px",
        borderBottom: `1px solid ${SC.sidebarBorder}`,
        gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: SC.blue,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 900, color: SC.white,
        }}>A</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: SC.white }}>Admin</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>BILLION TAGS</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {NAV_GROUPS.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 4 }}>
            <div style={{
              fontSize: 9, fontWeight: 700,
              color: SC.sidebarTextMuted,
              padding: "12px 10px 4px",
              letterSpacing: "0.12em",
            }}>{group}</div>

            {items.map((item) => {
              const active =
                location.pathname === item.to ||
                (item.to !== "/superadmin/overview" && location.pathname.startsWith(item.to));
              const count = item.countKey !== undefined ? counts[item.countKey] : undefined;

              return (
                <Link key={item.to} to={item.to} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                    marginBottom: 2,
                    background: active ? SC.sidebarActive : "transparent",
                    color: active ? SC.white : SC.sidebarText,
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    }}
                  >
                    <span style={{
                      flexShrink: 0, width: 18, height: 18,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, lineHeight: "1",
                    }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {count !== undefined && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: "2px 7px", borderRadius: 10,
                        background: item.accent ? `${item.accent}25` : "rgba(255,255,255,0.08)",
                        color: item.accent ?? "rgba(255,255,255,0.5)",
                      }}>{count}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${SC.sidebarBorder}`, padding: "10px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px", borderRadius: 10,
          background: "rgba(255,255,255,0.05)",
          marginBottom: 4,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: SC.blue,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: SC.white, fontSize: 12, fontWeight: 800, flexShrink: 0,
          }}>A</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: SC.white }}>Admin</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>ADMINISTRATOR</div>
          </div>
        </div>

        <Link to="/portal_settings" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 8,
            color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', marginBottom: 3,
            justifyContent: 'flex-start',
          }}>
            <Settings size={14} /> Settings
          </div>
        </Link>

        <Link to="/login" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 8,
            color: 'rgba(248,113,113,0.85)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
            justifyContent: 'flex-start',
          }}>
            <LogOut size={14} /> Sign Out
          </div>
        </Link>
      </div>
    </aside>
  );
}