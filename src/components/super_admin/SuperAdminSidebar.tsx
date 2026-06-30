import { Link, useLocation } from "react-router-dom";
import type { Counts } from "../types/types";
import { LogOut, Settings } from 'lucide-react';

// ── Nav Config ────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: string;
  to: string;
  dot?: "red" | "green";
  badge?: number | string;
  accent?: string;
  countKey?: keyof Counts;
  children?: { label: string; icon: string; to: string; matchPaths?: string[] }[];
}

interface NavGroup {
  section?: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    section: "ADMINISTRATION",
    items: [
      { label: "Dashboard", icon: "📊", to: "/superadmin/overview" },
    ],
  },
  {
    section: "CLIENTS",
    items: [
      { label: "All Clients", icon: "🏢", to: "/superadmin/clients", countKey: "total" },
      { label: "Pending Approval", icon: "⏳", to: "/superadmin/pending", countKey: "pending" },
    ],
  },
  {
    section: "CAMPAIGNS",
    items: [
      {
        label: "All Campaigns", icon: "📈", to: "/superadmin/campaigns", countKey: "campaignTotal",
        // children: [
        //   { label: "Campaign Reports", icon: "📄", to: "/superadmin/campaign_reports" },
        //   { label: "Daily Reports", icon: "📄", to: "/superadmin/daily_reports" },
        // ],
      },
      { label: "Bulk Campaign Details", icon: "📋", to: "/superadmin/bulk_campaigns_details" },
    ],
  },
  {
    section: "REPORTS",
    items: [
      {
        label: "Campaign Reports", icon: "📑", to: "/superadmin/campaign_reports",
      },
      {
        label: "Daily Reports", icon: "📅", to: "/superadmin/daily_reports",
        // children: [
        //   {
        //     label: "Pacing Details",
        //     icon: "⏱",
        //     to: "/superadmin/under-pacing",
        //     matchPaths: ["/superadmin/under-pacing", "/superadmin/over-pacing"],
        //   },
        // ],
      },
      {
        label: "Pacing Details", icon: "⏱", to: "/superadmin/over-pacing",
      }
    ],
  },
  {
    section: "FINANCE",
    items: [
      { label: "All Invoices", icon: "🧾", to: "/superadmin/all_invoices" },
    ],
  },
  {
    section: "COMMUNICATION",
    items: [
      { label: "Messages", icon: "💬", to: "/admin/admin_messages" },
    ],
  },
  {
    section: "TEAM",
    items: [
      { label: "Team & Access", icon: "👥", to: "/superadmin/team" },
    ],
  },
  {
    section: "SETTINGS",
    items: [
      { label: "System Settings", icon: "⚙️", to: "/superadmin/system-settings" },
      { label: "Admin Users", icon: "🔑", to: "/superadmin/admin-users" },
      { label: "Audit Logs", icon: "📋", to: "/superadmin/audit-logs" },
    ],
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface SuperAdminSidebarProps {
  counts: Counts;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SuperAdminSidebar({ counts }: SuperAdminSidebarProps) {
  const location = useLocation();

  return (
    <aside className="db-sidebar">
      {/* Logo */}
      <div className="db-logo">
        <div className="db-logo-brand">
          <div className="db-logo-icon">SA</div>
          <span className="db-logo-name">SUPER ADMIN</span>
        </div>
        <div className="db-logo-sub">BILLION TAGS</div>
      </div>

      {/* Nav */}
      <nav className="db-nav">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <div className="db-nav-section">{group.section}</div>
            )}

            {group.items.map((item) => {
              const active =
                location.pathname === item.to ||
                (item.to !== "/superadmin/overview" &&
                  location.pathname.startsWith(item.to));
              const count = item.countKey !== undefined ? counts[item.countKey] : undefined;
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.to}>
                  <Link
                    to={item.to}
                    className={`db-nav-item${active ? " active" : ""}`}
                    style={{ textDecoration: "none" }}
                  >
                    <span className="db-nav-icon">{item.icon}</span>
                    <span className="db-nav-label">{item.label}</span>
                    {item.dot && (
                      <span className={`db-nav-dot ${item.dot}`} />
                    )}
                    {item.badge !== undefined && (
                      <span className="db-nav-badge">{item.badge}</span>
                    )}
                    {count !== undefined && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: "2px 7px", borderRadius: 10,
                        background: item.accent ? `${item.accent}25` : "rgba(255,255,255,0.08)",
                        color: item.accent ?? "rgba(255,255,255,0.5)",
                      }}>{count}</span>
                    )}
                  </Link>

                  {/* Sub-items — always visible, no toggle */}
                  {hasChildren && (
                    <div style={{ paddingLeft: 18, marginBottom: 4 }}>
                      {item.children!.map((child) => {
                        const childActive = child.matchPaths
                          ? child.matchPaths.includes(location.pathname)
                          : location.pathname === child.to;

                        return (
                          <Link key={child.to} to={child.to} style={{ textDecoration: "none" }}>
                            <div
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "7px 10px", borderRadius: 6,
                                marginBottom: 2,
                                color: childActive ? "#fff" : "rgba(255,255,255,0.35)",
                                fontSize: 12, fontWeight: childActive ? 600 : 400,
                                background: childActive ? "rgba(37,99,235,0.6)" : "transparent",
                                borderLeft: "2px solid rgba(255,255,255,0.08)",
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                if (!childActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
                              }}
                              onMouseLeave={(e) => {
                                if (!childActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                              }}
                            >
                              <span style={{ fontSize: 13 }}>{child.icon}</span>
                              {child.label}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="db-sidebar-footer">
        <div className="db-sidebar-user">
          <div className="db-sidebar-avatar">SA</div>
          <div>
            <div className="db-sidebar-uname">Super Admin</div>
            <div className="db-sidebar-urole">ADMINISTRATOR</div>
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