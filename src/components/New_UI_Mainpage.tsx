// New_UI_Mainpage.tsx
// Value Analytics — full dashboard with dark / light theme toggle
// Charts powered by recharts. Import dashboard.css in root.

import { useEffect, useRef, useState } from "react";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import New_UI_Sidebar from "./New_UI_Sidebar";

// ── Palette (matches CSS vars for chart colours) ───────────────
const C = {
  accent: "#983EF5",
  pink: "#FF6584",
  teal: "#43BCCD",
  amber: "#FFB547",
  purple: "#A78BFA",
  green: "#4ADE80",
  red: "#F87171",
};

// ── Mock data ─────────────────────────────────────────────────

const realtimeData = [
  { t: "8am", sessions: 320, users: 240 },
  { t: "9am", sessions: 421, users: 310 },
  { t: "10am", sessions: 540, users: 395 },
  { t: "11am", sessions: 478, users: 340 },
  { t: "12pm", sessions: 600, users: 480 },
  { t: "1pm", sessions: 530, users: 400 },
  { t: "2pm", sessions: 700, users: 560 },
  { t: "3pm", sessions: 620, users: 470 },
  { t: "4pm", sessions: 856, users: 523 },
];

const siteTrafficData = [
  { t: "Mon", organic: 340, referral: 180, direct: 120 },
  { t: "Tue", organic: 420, referral: 210, direct: 145 },
  { t: "Wed", organic: 380, referral: 195, direct: 130 },
  { t: "Thu", organic: 500, referral: 260, direct: 175 },
  { t: "Fri", organic: 460, referral: 240, direct: 160 },
  { t: "Sat", organic: 320, referral: 170, direct: 100 },
  { t: "Sun", organic: 290, referral: 150, direct: 90 },
];

const middleTimeData = [
  { t: "Jan", value: 1120 },
  { t: "Feb", value: 1340 },
  { t: "Mar", value: 1210 },
  { t: "Apr", value: 1540 },
  { t: "May", value: 1390 },
  { t: "Jun", value: 1680 },
  { t: "Jul", value: 1820 },
  { t: "Aug", value: 1620 },
];

const barData = [
  { name: "Facebook", value: 712, color: C.accent },
  { name: "Twitter", value: 430, color: C.pink },
  { name: "YouTube", value: 590, color: C.teal },
  { name: "Reddit", value: 320, color: C.amber },
  { name: "LinkedIn", value: 480, color: C.purple },
];

const sparkSessions = [30, 50, 40, 70, 60, 80, 90, 75, 100];
const sparkUsers = [20, 35, 30, 55, 45, 60, 70, 58, 80];
const sparkTime = [5, 8, 6, 9, 7, 10, 8, 11, 9];

const pagesData = [
  { page: "/home", views: 14500, change: "+12.3%", up: true },
  { page: "/dashboard", views: 9200, change: "+8.1%", up: true },
  { page: "/reports", views: 6700, change: "-2.4%", up: false },
  { page: "/campaigns", views: 5100, change: "+5.0%", up: true },
  { page: "/clients", views: 3800, change: "-1.1%", up: false },
];

const trafficSocialData = [
  { name: "Facebook", value: 35, color: C.accent },
  { name: "Twitter", value: 20, color: C.pink },
  { name: "YouTube", value: 25, color: C.teal },
  { name: "Reddit", value: 10, color: C.amber },
  { name: "Other", value: 10, color: C.purple },
];

// ── Helpers ───────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const W = 80, H = 38;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * H;
    return `${x},${y}`;
  });
  const area = `M0,${H} ` + pts.join(" L") + ` L${W},${H} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const fmtNum = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const customTooltipStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  fontSize: 11,
  color: "var(--text-primary)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
};

// ── Component ─────────────────────────────────────────────────

export default function New_UI_Mainpage() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const rootRef = useRef<HTMLDivElement>(null);

  // Apply theme to root div so CSS vars cascade
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div
      className="db-root"
      data-theme={theme}
      ref={rootRef}
    >
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <New_UI_Sidebar userName="Mateus Barr" userRole="Administrator" />

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="db-main">

        {/* Header */}
        <header className="db-header">
          <div className="db-header-left">
            <span className="db-page-title">Dashboard</span>
            <div className="db-header-tabs">
              <span className="db-tab active">Overview</span>
              <span className="db-tab">Clients</span>
              <span className="db-tab">Campaigns</span>
            </div>
          </div>
          <div className="db-header-right">
            {/* Search */}
            <div className="db-search-box">
              <span className="db-search-icon">🔍</span>
              <input placeholder="Search…" />
            </div>

            {/* Notifications */}
            <div className="db-icon-btn" title="Notifications">
              🔔
              <span style={{
                position: "absolute", top: -4, right: -4,
                width: 14, height: 14,
                background: C.red, borderRadius: "50%",
                fontSize: 8, fontWeight: 700,
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid var(--bg-header)",
              }}>3</span>
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
              <div className="db-header-avatar">MB</div>
              <span className="db-header-uname">Mateus Barr</span>
            </div>
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────── */}
        <main className="db-content">

          {/* ── Row 1: 4 stat cards ──────────────────────── */}
          <div className="db-stat-grid">

            {/* Sessions */}
            <div className="db-stat-card">
              <div className="db-stat-label">Sessions</div>
              <div className="db-stat-value">856</div>
              <div className="db-stat-change up">↑ 3.48%</div>
              <div className="db-stat-sparkline">
                <Sparkline data={sparkSessions} color={C.pink} />
              </div>
            </div>

            {/* Users */}
            <div className="db-stat-card">
              <div className="db-stat-label">Users</div>
              <div className="db-stat-value">523</div>
              <div className="db-stat-change up">↑ 1.7%</div>
              <div className="db-stat-sparkline">
                <Sparkline data={sparkUsers} color={C.teal} />
              </div>
            </div>

            {/* Time spent */}
            <div className="db-stat-card">
              <div className="db-stat-label">Time Spent</div>
              <div className="db-stat-value">9:56</div>
              <div className="db-stat-change down">↓ 0.4%</div>
              <div className="db-stat-sparkline">
                <Sparkline data={sparkTime} color={C.amber} />
              </div>
            </div>

            {/* Devices — donut */}
            <div className="db-donut-card">
              <div className="db-donut-label">Devices</div>
              <ResponsiveContainer width="100%" height={90}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Desktop", value: 55, color: C.accent },
                      { name: "Mobile", value: 30, color: C.pink },
                      { name: "Tablet", value: 15, color: C.teal },
                    ]}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={40}
                    paddingAngle={2}
                  >
                    {[C.accent, C.pink, C.teal].map((c, i) => (
                      <Cell key={i} fill={c} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    formatter={(v) => [`${v}%`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ textAlign: "center" }}>
                <div className="db-donut-center-val">545</div>
                <div className="db-donut-center-sub">Total devices</div>
              </div>
            </div>
          </div>

          {/* ── Row 2: Real-time + Site traffic ─────────── */}
          <div className="db-grid-2">

            {/* Real-time Data */}
            <div className="db-chart-card">
              <div className="db-card-header">
                <span className="db-card-title">Real-time Data</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <span className="db-badge live"><span className="db-badge-dot" />Live</span>
                  <span className="db-card-action">Last 7d</span>
                </div>
              </div>
              {/* mini stats */}
              <div style={{ display: "flex", gap: 18, padding: "4px 18px 10px" }}>
                {[
                  { label: "Sessions", value: "545", color: C.accent },
                  { label: "Users", value: "421", color: C.pink },
                  { label: "New", value: "134", color: C.teal },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="db-chart-wrap" style={{ height: 130 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={realtimeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rtg1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.accent} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rtg2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.pink} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={C.pink} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Area type="monotone" dataKey="sessions" stroke={C.accent} strokeWidth={2} fill="url(#rtg1)" />
                    <Area type="monotone" dataKey="users" stroke={C.pink} strokeWidth={2} fill="url(#rtg2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Site Traffic */}
            <div className="db-chart-card">
              <div className="db-card-header">
                <span className="db-card-title">Site Traffic</span>
                <span className="db-card-action">Last week</span>
              </div>
              {/* mini stats */}
              <div style={{ display: "flex", gap: 18, padding: "4px 18px 10px" }}>
                {[
                  { label: "Organic", value: "1.2k", color: C.accent },
                  { label: "Referral", value: "420", color: C.pink },
                  { label: "Direct", value: "210", color: C.teal },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="db-chart-wrap" style={{ height: 130 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={siteTrafficData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stg1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.accent} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="stg2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.pink} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={C.pink} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="stg3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.teal} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={C.teal} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Area type="monotone" dataKey="organic" stroke={C.accent} strokeWidth={2} fill="url(#stg1)" />
                    <Area type="monotone" dataKey="referral" stroke={C.pink} strokeWidth={2} fill="url(#stg2)" />
                    <Area type="monotone" dataKey="direct" stroke={C.teal} strokeWidth={2} fill="url(#stg3)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Row 3: Traffic social + Middle time + Pages ── */}
          <div className="db-grid-3541">

            {/* Traffic from social */}
            <div className="db-chart-card">
              <div className="db-card-header">
                <span className="db-card-title">Traffic from Social</span>
                <span className="db-card-action">Last 30d</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0 0 4px" }}>
                {/* Donut */}
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={trafficSocialData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={58}
                      paddingAngle={2}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {trafficSocialData.map((d, i) => (
                        <Cell key={i} fill={d.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={customTooltipStyle} formatter={(v) => [`${v}%`]} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {trafficSocialData.map((d) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: "var(--text-secondary)", minWidth: 60 }}>{d.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)", marginLeft: "auto" }}>{d.value}%</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>1379</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total visits</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle time on site */}
            <div className="db-chart-card">
              <div className="db-card-header">
                <span className="db-card-title">Middle Time on Site</span>
                <span className="db-card-action">This year</span>
              </div>
              <div style={{ padding: "4px 0 0" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", padding: "0 18px 6px" }}>
                  14:22 <span style={{ fontSize: 11, fontWeight: 500, color: "var(--green)" }}>↑ 3.02</span>
                </div>
              </div>
              <div className="db-chart-wrap" style={{ height: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={middleTimeData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="value" fill={C.accent} radius={[4, 4, 0, 0]}>
                      {middleTimeData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={i === middleTimeData.length - 2 ? C.pink : C.accent}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pages */}
            <div className="db-chart-card">
              <div className="db-card-header">
                <span className="db-card-title">Pages</span>
                <span className="db-card-action">Top 5</span>
              </div>
              <div style={{ padding: "4px 0" }}>
                {pagesData.map((p, i) => (
                  <div key={i} style={{ padding: "6px 18px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 500 }}>{p.page}</span>
                      <span style={{ fontSize: 10, color: p.up ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{p.change}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="db-progress-bar" style={{ flex: 1 }}>
                        <div
                          className="db-progress-fill"
                          style={{
                            width: `${Math.round((p.views / 15000) * 100)}%`,
                            background: [C.accent, C.pink, C.teal, C.amber, C.purple][i],
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)", minWidth: 36, textAlign: "right" }}>
                        {fmtNum(p.views)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Row 4: Social bar chart ───────────────────── */}
          <div className="db-chart-card" style={{ marginBottom: 18 }}>
            <div className="db-card-header">
              <span className="db-card-title">Traffic from Social — Detailed</span>
              <span className="db-card-action">Monthly</span>
            </div>
            <div className="db-chart-wrap" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}