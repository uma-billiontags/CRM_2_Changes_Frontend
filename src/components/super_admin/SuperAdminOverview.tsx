import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { SuperAdminOutletContext } from "./SuperAdminLayout";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from "recharts";
import { RocketOutlined } from "@ant-design/icons";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Pull palette from CSS ──────────────────────────────────────
function useChartColors() {
  const [colors, setColors] = useState({
    accent: "",
    pink: "",
    teal: "",
    amber: "",
    purple: "",
    green: "",
    red: "",
  });

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);

    setColors({
      accent: cs.getPropertyValue("--color-accent").trim(),
      pink: cs.getPropertyValue("--color-pink").trim(),
      teal: cs.getPropertyValue("--color-teal").trim(),
      amber: cs.getPropertyValue("--color-amber").trim(),
      purple: cs.getPropertyValue("--color-purple").trim(),
      green: cs.getPropertyValue("--color-green").trim(),
      red: cs.getPropertyValue("--color-red").trim(),
    });
  }, []);

  return colors;
}

const customTooltipStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  fontSize: 11,
  color: "var(--text-primary)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
};

// ── Interfaces ────────────────────────────────────────────────
interface LineItemWithCampaign {
  line_item_id: string;
  line_item_name?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  campaignName: string;
}

interface CampaignRaw {
  campaign_id: string | null;
  campaign_name: string;
  client_name: string;
  approval_status?: string;
  created_at: string;
  line_items?: any[];
}

function fmtDate(v?: string) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Status pill ───────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    live: { bg: "var(--green-bg)", color: "var(--green)", label: "Live" },
    upcoming: { bg: "var(--amber-bg)", color: "var(--amber)", label: "Upcoming" },
    paused: { bg: "var(--accent-light)", color: "var(--text-secondary)", label: "Paused" },
    completed: { bg: "var(--red-bg)", color: "var(--red)", label: "Completed" },
  };
  const cfg = map[status] || map.upcoming;
  return (
    <span className="db-badge" style={{ background: cfg.bg, color: cfg.color }}>
      <span className="db-badge-dot" />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// DONUT CARD — exact same style as the Devices card
// Used for: Client approval, Campaign approval, Sub-campaign status
// ─────────────────────────────────────────────────────────────
interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

function DonutStatCard({
  label,
  centerValue,
  centerSub,
  slices,
}: {
  label: string;
  centerValue: number | string;
  centerSub: string;
  slices: DonutSlice[];
}) {
  const total = slices.reduce((s, d) => s + d.value, 0);

  return (
    <div className="db-donut-card">
      <div className="db-donut-label">{label}</div>

      {total === 0 ? (
        <div style={{ padding: "16px 0", textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={110}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={46}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
            >
              {slices.map((s, i) => (
                <Cell key={i} fill={s.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={customTooltipStyle}
              formatter={(v, name) => {
                const n = typeof v === "number" ? v : Number(v) || 0;
                return [`${n} (${Math.round((n / total) * 100)}%)`, String(name)];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      {/* Center number overlay */}
      <div style={{ textAlign: "center", marginTop: -8 }}>
        <div className="db-donut-center-val">{centerValue}</div>
        <div className="db-donut-center-sub">{centerSub}</div>
      </div>

      {/* Compact legend */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px 10px",
        marginTop: 10,
        justifyContent: "center",
      }}>
        {slices.map((s) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: s.color, flexShrink: 0,
            }} />
            <span style={{ fontSize: 10, color: "var(--text-primary)" }}>
              {s.name}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CAMPAIGNS OVER TIME
// ─────────────────────────────────────────────────────────────
function buildCampaignTimeSeries(campaigns: CampaignRaw[]) {
  const counts: Record<string, number> = {};
  campaigns.forEach((c) => {
    const d = new Date(c.created_at);
    const key = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    counts[key] = (counts[key] || 0) + 1;
  });
  const sorted = Object.entries(counts)
    .map(([label, count]) => ({ label, count, dateObj: new Date(label) }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  let cumulative = 0;
  return sorted.map(({ label, count }) => {
    cumulative += count;
    return { label, count, cumulative };
  });
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function SuperAdminOverview() {
  const { counts } = useOutletContext<SuperAdminOutletContext>();
  const navigate = useNavigate();
  const C = useChartColors();

  const [campaigns, setCampaigns] = useState<CampaignRaw[]>([]);
  const [_loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const timeSeriesData = buildCampaignTimeSeries(campaigns);

  const fetchCampaigns = () => {
    setLoading(true);
    fetch(`${BASE_URL}/get_campaigns/`, { headers: { "ngrok-skip-browser-warning": "1" } })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.campaigns || [];
        setCampaigns(list);
        setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaigns(); }, []);

  // Derive counts
  const allLineItems: LineItemWithCampaign[] = [];
  campaigns.forEach((c) => {
    (c.line_items || []).forEach((li) => {
      allLineItems.push({ ...li, campaignName: c.campaign_name });
    });
  });

  const live = allLineItems.filter((li) => li.status === "live");
  const upcoming = allLineItems.filter((li) => li.status === "upcoming");
  const paused = allLineItems.filter((li) => li.status === "paused");
  const completed = allLineItems.filter((li) => li.status === "completed");
  const totalLI = allLineItems.length;

  const approvedCampaigns = campaigns.filter((c) => c.approval_status === "approved").length;
  const pendingCampaigns = campaigns.length - approvedCampaigns;
  const pendingClients = counts.total - counts.approved;

  // Campaigns per client (top 5)
  const clientCampaignMap: Record<string, number> = {};
  campaigns.forEach((c) => {
    clientCampaignMap[c.client_name] = (clientCampaignMap[c.client_name] || 0) + 1;
  });
  const clientSliceColors = [C.accent, C.teal, C.pink, C.amber, C.purple];
  const clientSlices: DonutSlice[] = Object.entries(clientCampaignMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], i) => ({ name, value, color: clientSliceColors[i] }));

  const recent = [...campaigns]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const ROW: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10,
    padding: "11px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer",
  };

  const statusBarData = [
    { name: "Live", value: live.length, color: C.accent },
    { name: "Upcoming", value: upcoming.length, color: C.pink },
    { name: "Paused", value: paused.length, color: C.teal },
    { name: "Completed", value: completed.length, color: C.red },
  ];

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Platform Overview</h1>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 500,
              margin: 0,
            }}
          >
            {lastUpdated ? `Last updated ${lastUpdated}` : "Loading..."}
          </p>

          <button
            onClick={fetchCampaigns}
            className="db-card-action"
            style={{ background: "var(--bg-input)" }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="db-stat-grid">

        {/* IDEA 1 — Client approval status */}
        <DonutStatCard
          label="🏢 Clients"
          centerValue={counts.total}
          centerSub="Total clients"
          slices={[
            { name: "Approved", value: counts.approved, color: C.accent },
            { name: "Pending", value: pendingClients, color: C.pink },
          ]}
        />

        {/* IDEA 2 — Campaign approval status */}
        <DonutStatCard
          label="📋 Campaigns"
          centerValue={campaigns.length}
          centerSub="Total campaigns"
          slices={[
            { name: "Approved", value: approvedCampaigns, color: C.accent },
            { name: "Pending", value: pendingCampaigns, color: C.amber },
          ]}
        />

        {/* IDEA 3 — Sub-campaign status breakdown */}
        <DonutStatCard
          label="📦 Sub Campaigns"
          centerValue={totalLI}
          centerSub="Total sub campaigns"
          slices={[
            { name: "Live", value: live.length, color: C.accent },
            { name: "Upcoming", value: upcoming.length, color: C.amber },
            { name: "Paused", value: paused.length, color: C.red },
            { name: "Completed", value: completed.length, color: C.pink },
          ]}
        />

        {/* IDEA 4 — Campaigns per client */}
        <DonutStatCard
          label="👥 By Client"
          centerValue={Object.keys(clientCampaignMap).length}
          centerSub="Active clients"
          slices={clientSlices.length > 0 ? clientSlices : [
            { name: "No data", value: 1, color: "var(--border-strong)" },
          ]}
        />
      </div>

      <div className="db-grid-2" style={{ marginBottom: 18 }}>
        {/* Campaigns Over Time */}
        <div className="db-chart-card">
          <div className="db-card-header">
            <span className="db-card-title">Campaigns Over Time</span>
            <div style={{ display: "flex", gap: 6 }}>
              <span className="db-card-action">This year</span>
            </div>
          </div>

          {/* Mini stats row — like SESSIONS / USERS / NEW */}
          <div style={{ display: "flex", gap: 18, padding: "4px 18px 10px" }}>
            {[
              { label: "Total", value: campaigns.length, color: C.accent },
              { label: "Approved", value: approvedCampaigns, color: C.pink },
              { label: "Pending", value: pendingCampaigns, color: C.teal },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 9, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="db-chart-wrap" style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.accent} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.pink} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={C.pink} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-primary)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-primary)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Area type="monotone" dataKey="cumulative" stroke={C.accent} strokeWidth={2} fill="url(#cg1)"
                />
                <Area type="monotone" dataKey="count" stroke={C.pink} strokeWidth={2} fill="url(#cg2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sub-Campaign Status Bar */}
        <div className="db-chart-card">
          <div className="db-card-header">
            <span className="db-card-title">Sub-Campaign Status</span>
            <span className="db-card-action">Current</span>
          </div>

          {/* Mini stats row */}
          <div style={{ display: "flex", gap: 18, padding: "4px 18px 10px" }}>
            {[
              { label: "Live", value: live.length, color: C.accent },
              { label: "Upcoming", value: upcoming.length, color: C.pink },
              { label: "Paused", value: paused.length, color: C.teal },
              { label: "Completed", value: completed.length, color: C.red },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 9, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="db-chart-wrap" style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBarData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-primary)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-primary)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {statusBarData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Row 5: Recent campaigns ──────────────────────────── */}
      <div className="db-chart-card" style={{ padding: 0, overflow: "hidden", marginBottom: 18 }}>
        <div className="db-card-header" style={{ padding: "12px 16px" }}>
          <span className="db-card-title" style={{ textTransform: "none", flex: 1 }}>
            Recent campaigns
          </span>
          <button onClick={() => navigate("/admin/campaigns")} className="db-card-action">
            View all
          </button>
        </div>
        {recent.map((c, i) => (
          <div
            key={c.campaign_id || i}
            style={{
              ...ROW,
              borderBottom: i < recent.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{
              width: 25, height: 25, borderRadius: 8,
              background: "var(--color-accent)",
              display: "flex", alignItems: "center", justifyContent: "center",

            }}>
              <RocketOutlined
                style={{
                  fontSize: 12,
                  color: "#FFFFFF",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {c.campaign_name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {c.client_name} · {fmtDate(c.created_at)}
              </div>
            </div>
            <StatusPill status={c.approval_status === "approved" ? "live" : "upcoming"} />
          </div>
        ))}
      </div>
    </div>
  );
}