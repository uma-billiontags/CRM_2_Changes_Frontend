// Status.tsx
import { useEffect, useState, useCallback } from "react";
import { Table, Input, Button, Select } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  white: "#FFFFFF",
  slate: "#0F172A",
  slate500: "#64748B",
  slate300: "#CBD5E1",
  border: "#E2E8F0",
  blue: "#2563EB",
  blueLight: "#EFF6FF",
  blueMid: "#BFDBFE",
  green: "#16A34A",
  greenLight: "#F0FDF4",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  red: "#DC2626",
  redLight: "#FEF2F2",
  purple: "#7C3AED",
  purpleLight: "#EDE9FE",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface LineItemRow {
  campaign_id: string | null;
  campaign_name: string;
  client_name: string;
  line_item_id: string;
  line_item_name: string;
  status: string;
  start_date?: string;
  end_date?: string;
}

interface CampaignRaw {
  campaign_id: string | null;
  campaign_name: string;
  client_name: string;
  line_items?: {
    line_item_id: string;
    line_item_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }[];
}

type StatusFilter = "all" | "live" | "upcoming" | "paused" | "completed";

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    live: { bg: C.greenLight, color: C.green, dot: C.green, label: "Live" },
    upcoming: { bg: C.amberLight, color: C.amber, dot: C.amber, label: "Upcoming" },
    paused: { bg: C.purpleLight, color: C.purple, dot: C.purple, label: "Paused" },
    completed: { bg: C.redLight, color: C.red, dot: C.red, label: "Completed" },
  };
  const cfg = map[status] || map.upcoming;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ── Filter card ───────────────────────────────────────────────────────────────
function FilterCard({ label, value, icon, color, bg, active, onClick }: {
  label: string; value: number; icon: string; color: string; bg: string; active: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.white, borderRadius: 14, padding: "16px 18px",
        border: active ? `2px solid ${color}` : `1px solid ${C.border}`,
        boxShadow: active ? `0 0 0 3px ${color}22, 0 2px 8px rgba(0,0,0,0.08)` : "0 1px 4px rgba(0,0,0,0.06)",
        cursor: "pointer", transition: "all 0.18s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: active ? color : C.slate500, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function User_Staus() {
  const [rows, setRows] = useState<LineItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`${BASE_URL}/get_campaigns/`, { headers: { "ngrok-skip-browser-warning": "1" } })
      .then(r => r.json())
      .then(data => {
        const campaigns: CampaignRaw[] = Array.isArray(data) ? data : data?.campaigns || [];
        const flattened: LineItemRow[] = [];
        campaigns.forEach(c => {
          (c.line_items || []).forEach(li => {
            flattened.push({
              campaign_id: c.campaign_id,
              campaign_name: c.campaign_name,
              client_name: c.client_name,
              line_item_id: li.line_item_id,
              line_item_name: li.line_item_name || "—",
              status: li.status || "upcoming",
              start_date: li.start_date,
              end_date: li.end_date,
            });
          });
        });
        setRows(flattened);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const live = rows.filter(r => r.status === "live").length;
  const upcoming = rows.filter(r => r.status === "upcoming").length;
  const paused = rows.filter(r => r.status === "paused").length;
  const completed = rows.filter(r => r.status === "completed").length;

  const filtered = rows.filter(r => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = [r.campaign_id, r.campaign_name, r.client_name, r.line_item_id, r.line_item_name]
        .some(f => f?.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  const columns: ColumnsType<LineItemRow> = [
    {
      title: "Campaign ID", dataIndex: "campaign_id", key: "campaign_id", width: 150,
      render: (id: string | null) => id ? (
        <span style={{ fontSize: 12, fontWeight: 700, color: C.blue, background: C.blueLight, padding: "3px 8px", borderRadius: 6, fontFamily: "monospace" }}>{id}</span>
      ) : (
        <span style={{ fontSize: 11, fontWeight: 600, color: C.amber, background: C.amberLight, padding: "3px 8px", borderRadius: 6, border: "1px dashed #FDE68A" }}>Pending</span>
      ),
    },
    {
      title: "Campaign Name", dataIndex: "campaign_name", key: "campaign_name", width: 200,
      render: (v: string) => <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{v || "—"}</span>,
    },
    {
      title: "Client", dataIndex: "client_name", key: "client_name", width: 160,
      render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>,
    },
    {
      title: "Line Item ID", dataIndex: "line_item_id", key: "line_item_id", width: 160,
      render: (v: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: C.purple, background: C.purpleLight, padding: "2px 8px", borderRadius: 6 }}>{v}</span>
      ),
    },
    {
      title: "Line Item Name", dataIndex: "line_item_name", key: "line_item_name", width: 220,
      render: (v: string) => <span style={{ fontSize: 12, color: C.slate }}>{v}</span>,
    },
    {
      title: "Start Date", dataIndex: "start_date", key: "start_date", width: 120,
      render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{fmtDate(v)}</span>,
    },
    {
      title: "End Date", dataIndex: "end_date", key: "end_date", width: 120,
      render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{fmtDate(v)}</span>,
    },
    {
      title: "Status", dataIndex: "status", key: "status", width: 130,
      render: (v: string) => <StatusPill status={v} />,
    },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0 }}>Line Item Status</h1>
        <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.04em" }}>
          TRACK STATUS ACROSS ALL CAMPAIGNS
        </p>
      </div>

      {/* Filter cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        <FilterCard label="All" value={rows.length} icon="📦" color={C.slate} bg="#F1F5F9" active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterCard label="Live" value={live} icon="🟢" color={C.green} bg={C.greenLight} active={filter === "live"} onClick={() => setFilter(filter === "live" ? "all" : "live")} />
        <FilterCard label="Upcoming" value={upcoming} icon="🕐" color={C.amber} bg={C.amberLight} active={filter === "upcoming"} onClick={() => setFilter(filter === "upcoming" ? "all" : "upcoming")} />
        <FilterCard label="Paused" value={paused} icon="⏸" color={C.purple} bg={C.purpleLight} active={filter === "paused"} onClick={() => setFilter(filter === "paused" ? "all" : "paused")} />
        <FilterCard label="Completed" value={completed} icon="✅" color={C.red} bg={C.redLight} active={filter === "completed"} onClick={() => setFilter(filter === "completed" ? "all" : "completed")} />
      </div>

      {/* Active filter chip */}
      {filter !== "all" && (
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: C.slate500 }}>Filtered by:</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 12px", borderRadius: 20, background: C.blueLight, border: `1px solid ${C.blueMid}`, fontSize: 11, fontWeight: 700, color: C.blue }}>
            {filter}
            <button onClick={() => setFilter("all")} style={{ background: "none", border: "none", cursor: "pointer", color: C.blue, fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
          </span>
        </div>
      )}

      {/* Search + status filter + refresh */}
      <div style={{ background: C.white, borderRadius: 12, padding: "14px 18px", border: `1px solid ${C.border}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Input
          placeholder="Search by campaign, client, or line item…"
          prefix={<SearchOutlined style={{ color: C.slate500 }} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ flex: 1, minWidth: 240, height: 36 }}
        />

        <Select<StatusFilter>
          value={filter}
          onChange={(value) => setFilter(value)}
          style={{ width: 160, height: 36 }}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "live", label: "Live" },
            { value: "upcoming", label: "Upcoming" },
            { value: "paused", label: "Paused" },
            { value: "completed", label: "Completed" },
          ]}
        />

        <Button onClick={fetchData} icon={<ReloadOutlined />} style={{ height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.slate500, fontSize: 12, fontWeight: 600 }}>
          Refresh
        </Button>
        <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>{filtered.length} of {rows.length} line items</span>
      </div>

      {/* Table */}
      <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="line_item_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} line items`,
            style: { padding: "12px 16px" },
          }}
          style={{ fontSize: 13 }}
        />
      </div>

      <style>{`
        .ant-table-thead > tr > th {
          background: #F1F5F9 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #64748B !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}