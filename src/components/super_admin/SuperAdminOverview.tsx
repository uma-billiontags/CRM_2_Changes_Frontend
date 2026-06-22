import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { C } from "../types/types";
import type { SuperAdminOutletContext } from "./SuperAdminLayout";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from "recharts";

const BASE_URL = import.meta.env.VITE_BASE_URL;

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
  return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    live: { bg: C.greenLight, color: C.green, dot: C.green, label: "Live" },
    upcoming: { bg: C.amberLight, color: C.amber, dot: C.amber, label: "Upcoming" },
    paused: { bg: C.slate100, color: C.slate500, dot: C.slate500, label: "Paused" },
    completed: { bg: C.redLight, color: C.red, dot: C.red, label: "Completed" },
  };
  const cfg = map[status] || map.upcoming;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: cfg.bg, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function MetricCard({ label, value, icon, color, sub, pct }: { label: string; value: number | string; icon: string; color: string; sub: string; pct?: number }) {
  return (
    <div style={{ background: C.slate100, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: C.slate500, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>{icon} {label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.slate500 }}>{sub}</div>
      {pct !== undefined && (
        <div style={{ height: 4, borderRadius: 2, background: C.slate300, overflow: "hidden", marginTop: 6 }}>
          <div style={{ height: "100%", borderRadius: 2, background: color, width: `${pct}%`, transition: "width 0.4s" }} />
        </div>
      )}
    </div>
  );
}

function StatusDonut({ live, upcoming, paused, completed }: { live: number; upcoming: number; paused: number; completed: number }) {
  const data = [
    { name: "Live", value: live, color: C.green },
    { name: "Upcoming", value: upcoming, color: C.amber },
    { name: "Paused", value: paused, color: C.slate500 },
    { name: "Completed", value: completed, color: C.red },
  ];

  const total = live + upcoming + paused + completed;

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", position: "relative" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.slate, marginBottom: 8 }}>
        Line item status breakdown
      </div>
      {total === 0 ? (
        <div style={{ padding: 30, textAlign: "center", fontSize: 12, color: C.slate500 }}>No line items yet</div>
      ) : (
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const num = typeof value === "number" ? value : Number(value) || 0;
                  return [`${num} (${Math.round((num / total) * 100)}%)`, String(name)];
                }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div style={{ position: "absolute", top: "42%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.slate }}>{total}</div>
            <div style={{ fontSize: 10, color: C.slate500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total</div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildCampaignTimeSeries(campaigns: CampaignRaw[]) {
  // Group by month (e.g. "Jan 2026")
  const counts: Record<string, number> = {};

  campaigns.forEach(c => {
    const d = new Date(c.created_at);
    const key = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    counts[key] = (counts[key] || 0) + 1;
  });

  // Sort chronologically
  const sorted = Object.entries(counts)
    .map(([label, count]) => ({ label, count, dateObj: new Date(label) }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Running cumulative total (optional — shows growth)
  let cumulative = 0;
  return sorted.map(({ label, count }) => {
    cumulative += count;
    return { label, count, cumulative };
  });
}

function CampaignsOverTime({ campaigns }: { campaigns: CampaignRaw[] }) {
  const data = buildCampaignTimeSeries(campaigns);

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.slate, marginBottom: 8 }}>
        Campaigns created over time
      </div>
      {data.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", fontSize: 12, color: C.slate500 }}>No campaigns yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="campaignGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.blue} stopOpacity={0.3} />
                <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.slate500 }} axisLine={{ stroke: C.border }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.slate500 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <RTooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }}
              formatter={(value, name) => [value, name === "count" ? "New campaigns" : "Total to date"]}
            />
            <Area type="monotone" dataKey="cumulative" stroke={C.blue} strokeWidth={2} fill="url(#campaignGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function SuperAdminOverview() {
  const { counts } = useOutletContext<SuperAdminOutletContext>();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<CampaignRaw[]>([]);
  const [_loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchCampaigns = () => {
    setLoading(true);
    fetch(`${BASE_URL}/get_campaigns/`, { headers: { "ngrok-skip-browser-warning": "1" } })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.campaigns || [];
        setCampaigns(list);
        setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const allLineItems: LineItemWithCampaign[] = [];
  campaigns.forEach(c => {
    (c.line_items || []).forEach(li => {
      allLineItems.push({ ...li, campaignName: c.campaign_name });
    });
  });

  const live = allLineItems.filter(li => li.status === "live");
  const upcoming = allLineItems.filter(li => li.status === "upcoming");
  const paused = allLineItems.filter(li => li.status === "paused");
  const completed = allLineItems.filter(li => li.status === "completed");
  const totalLI = allLineItems.length;
  const approvedCampaigns = campaigns.filter(c => c.approval_status === "approved").length;
  const recent = [...campaigns].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const ROW = { display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer" } as const;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0 }}>Platform Overview</h1>
          <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", fontWeight: 500 }}>
            {lastUpdated ? `Last updated ${lastUpdated}` : "Loading..."}
          </p>
        </div>
        <button onClick={fetchCampaigns} style={{ fontSize: 12, color: C.slate500, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Client stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        <MetricCard label="Total clients" value={counts.total} icon="🏢" color={C.blue} sub="Registered" />
        <MetricCard label="Approved clients" value={counts.approved} icon="✓" color={C.green} sub="Active" />
        <MetricCard label="Total campaigns" value={campaigns.length} icon="📋" color={C.blue} sub="All time" />
        <MetricCard label="Approved campaigns" value={approvedCampaigns} icon="🎯" color={C.green} sub="IDs generated" pct={campaigns.length > 0 ? Math.round((approvedCampaigns / campaigns.length) * 100) : 0} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
        Campaign & line item activity
      </div>

      {/* Campaign + line item stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
        <MetricCard label="Total Sub Campaigns" value={totalLI} icon="📦" color={C.blue} sub="Across all campaigns" />
        <MetricCard label="Live Sub Campaigns" value={live.length} icon="🟢" color={C.green} sub="Running now" />
        <MetricCard label="Upcoming Sub Campaigns" value={upcoming.length} icon="🕐" color={C.amber} sub="Scheduled" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        <MetricCard label="Paused Sub Campaigns" value={paused.length} icon="⏸" color={C.slate500} sub="On hold" />
        <MetricCard label="Completed Sub Campaigns" value={completed.length} icon="✅" color={C.red} sub="Finished" pct={totalLI > 0 ? Math.round((completed.length / totalLI) * 100) : 0} />
      </div>

      {/* Live + Upcoming side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {[{ title: "Live line items", items: live, color: C.green }, { title: "Upcoming line items", items: upcoming, color: C.amber }].map(({ title, items, color }) => (
          <div key={title} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.slate, flex: 1 }}>{title}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color, background: color === C.green ? C.greenLight : C.amberLight, padding: "2px 8px", borderRadius: 10 }}>{items.length}</span>
            </div>
            {items.length === 0
              ? <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: C.slate500 }}>None right now</div>
              : items.slice(0, 4).map(li => (
                <div key={li.line_item_id} style={{ ...ROW, borderBottom: `1px solid ${C.borderLight}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{li.line_item_name || li.line_item_id}</div>
                    <div style={{ fontSize: 11, color: C.slate500, marginTop: 2 }}>{li.campaignName} · {fmtDate(li.end_date)}</div>
                  </div>
                  <StatusPill status={li.status || "upcoming"} />
                </div>
              ))
            }
          </div>
        ))}
      </div>

      {/* Status donut + Campaigns over time */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14, marginBottom: 14 }}>
        <StatusDonut live={live.length} upcoming={upcoming.length} paused={paused.length} completed={completed.length} />
        <CampaignsOverTime campaigns={campaigns} />
      </div>

      {/* Recent campaigns */}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.slate, flex: 1 }}>Recent campaigns</span>
          <button onClick={() => navigate("/admin/campaigns")} style={{ fontSize: 11, color: C.blue, background: C.blueLight, border: `1px solid ${C.blueMid}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>View all</button>
        </div>
        {recent.map((c, i) => (
          <div key={c.campaign_id || i} style={{ ...ROW, borderBottom: i < recent.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.blueLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>📣</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.campaign_name}</div>
              <div style={{ fontSize: 11, color: C.slate500, marginTop: 2 }}>{c.client_name} · {fmtDate(c.created_at)}</div>
            </div>
            <StatusPill status={c.approval_status === "approved" ? "live" : "upcoming"} />
          </div>
        ))}
      </div>
    </div>
  );
}