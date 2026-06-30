// New_UI_Sidebar.tsx
// Value Analytics — sidebar with dark/light theme support
// Import dashboard.css in your root (e.g. main.tsx or App.tsx)

import { Link, useLocation } from "react-router-dom";

// ── Nav config ────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: string;
  to: string;
  dot?: "red" | "green";
  badge?: number | string;
}
interface NavGroup {
  section?: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    items: [
      { label: "Home",      icon: "🏠", to: "/superadmin/home" },
      { label: "Dashboard", icon: "📊", to: "/superadmin/overview" },
      { label: "Reports",   icon: "📄", to: "/superadmin/reports" },
    ],
  },
  {
    section: "Clients",
    items: [
      { label: "All Clients",      icon: "🏢", to: "/superadmin/clients",  badge: 3 },
      { label: "Pending Approval", icon: "⏳", to: "/superadmin/pending",  dot: "red",   badge: 1 },
    ],
  },
  {
    section: "Campaigns",
    items: [
      { label: "All Campaigns",        icon: "📈", to: "/superadmin/campaigns",              badge: 5 },
      { label: "Bulk Campaign Details",icon: "📋", to: "/superadmin/bulk_campaigns_details" },
    ],
  },
  {
    section: "Reports",
    items: [
      { label: "Campaign Reports", icon: "📑", to: "/superadmin/campaign_reports" },
      { label: "Daily Reports",    icon: "📅", to: "/superadmin/daily_reports" },
      { label: "Pacing Details",   icon: "⏱",  to: "/superadmin/under-pacing" },
    ],
  },
  {
    section: "Finance",
    items: [
      { label: "All Invoices", icon: "🧾", to: "/superadmin/all_invoices" },
    ],
  },
  {
    section: "Communication",
    items: [
      { label: "Messages",  icon: "💬", to: "/admin/admin_messages",    dot: "red" },
      { label: "Media",     icon: "🖼️", to: "/superadmin/media",        dot: "red" },
      { label: "Comments",  icon: "💭", to: "/superadmin/comments",     dot: "green" },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Settings",    icon: "⚙️",  to: "/superadmin/system-settings" },
      { label: "Help Center", icon: "❓",  to: "/superadmin/help" },
      { label: "Sign Out",    icon: "🚪",  to: "/login" },
    ],
  },
];

// ── Props ─────────────────────────────────────────────────────

interface SidebarProps {
  userName?: string;
  userRole?: string;
}

// ── Component ─────────────────────────────────────────────────

export default function New_UI_Sidebar({
  userName = "Mateus Barr",
  userRole = "Administrator",
}: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="db-sidebar">
      {/* Logo */}
      <div className="db-logo">
        <div className="db-logo-brand">
          <div className="db-logo-icon">V</div>
          <span className="db-logo-name">VALUE</span>
        </div>
        <div className="db-logo-sub">Analytics</div>
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

              return (
                <Link
                  key={item.to}
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
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / user */}
      <div className="db-sidebar-footer">
        <div className="db-sidebar-user">
          <div className="db-sidebar-avatar">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="db-sidebar-uname">{userName}</div>
            <div className="db-sidebar-urole">{userRole.toUpperCase()}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}