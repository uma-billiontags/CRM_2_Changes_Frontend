import { useEffect, useState, useCallback } from "react";
import { Table, Tabs, Select, Input, Button } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export interface PacingRow {
    s_no: number;
    campaign_id: string;
    campaign_name: string;
    io_id: string;
    io_name: string;
    line_item_id: string;
    line_item_name: string;
    flight_dates: string;
    total_volume_booked: number;
    total_volume_delivered: number;
    total_clicks: number;
    daily_target: number;
    last_day_impression: number | null;
    last_day_date: string | null;
    pct: number | null;
    status: "under" | "over";
}

type PacingStatus = "under" | "over";

const TAB_CONFIG: { key: PacingStatus; label: string; path: string }[] = [
    { key: "under", label: "Under Pacing", path: "/admin/under-pacing" },
    { key: "over", label: "Over Pacing", path: "/admin/over-pacing" },
];

function fmtNumber(v?: number | null) {
    if (v === null || v === undefined) return "—";
    return v.toLocaleString("en-IN");
}

function fmtDate(v?: string | null) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

// ── Campaign ID badge ────────────────────────────────────────────────────────
function CampaignBadge({ id }: { id: string }) {
    return (
        <span style={{
            fontSize: 12, fontWeight: 700,
            color: "var(--accent)", background: "var(--accent-light)",
            padding: "3px 8px", borderRadius: 6,
            border: "1px solid var(--border-strong)",
            display: "inline-block",
        }}>
            {id}
        </span>
    );
}

// ── Line Item ID badge ───────────────────────────────────────────────────────
function LineItemBadge({ id }: { id: string }) {
    return (
        <span style={{
            fontSize: 11, fontWeight: 700,
            color: "var(--accent)", background: "var(--accent-light)",
            padding: "3px 8px", borderRadius: 6,
            border: "1px solid var(--border-strong)",
            display: "inline-block",
        }}>
            {id}
        </span>
    );
}

// ── IO ID badge ───────────────────────────────────────────────────────────────
function IoBadge({ id }: { id: string }) {
    if (!id) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
    return (
        <span style={{
            fontSize: 11, fontWeight: 700,
            color: "var(--accent)", background: "var(--accent-light)",
            padding: "3px 8px", borderRadius: 6,
            border: "1px solid var(--border-strong)",
            display: "inline-block",
        }}>
            {id}
        </span>
    );
}

// ── "Last Day Impression" cell — diff + % + status, stacked layout ─────────
function LastDayCell({ row }: { row: PacingRow }) {
    const isUnder = row.status === "under";
    const color = isUnder ? "var(--red)" : "var(--green)";
    const sign = row.pct !== null && row.pct >= 0 ? "+" : "";

    const diff =
        row.last_day_impression !== null && row.daily_target !== null
            ? row.last_day_impression - row.daily_target
            : null;
    const diffSign = diff !== null && diff >= 0 ? "+" : "-";
    const diffAbs = diff !== null ? Math.abs(diff) : null;

    return (
        <div style={{ lineHeight: 1.5 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                {fmtNumber(row.last_day_impression)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Report date:</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDate(row.last_day_date)}</div>
            {diff !== null && row.pct !== null && (
                <div style={{ fontSize: 12, fontWeight: 600, color }}>
                    {diffSign}{fmtNumber(diffAbs)} ({sign}{row.pct}%)
                </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase" as const }}>
                {isUnder ? "Under Pacing" : "Over Pacing"}
            </div>
        </div>
    );
}

// ── Helper: derive the active tab from the current URL path ────────────────
function resolveStatusFromPath(pathname: string): PacingStatus {
    const match = TAB_CONFIG.find(t => pathname === t.path || pathname.startsWith(t.path));
    return match?.key ?? "under";
}

export default function Pacing_Details() {
    const location = useLocation();
    const navigate = useNavigate();

    const [status, setStatus] = useState<PacingStatus>(() => resolveStatusFromPath(location.pathname));
    const [rows, setRows] = useState<PacingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [campaignFilter, setCampaignFilter] = useState<string | undefined>();

    useEffect(() => {
        setStatus(resolveStatusFromPath(location.pathname));
    }, [location.pathname]);

    const fetchData = useCallback((currentStatus: PacingStatus) => {
        setLoading(true);
        fetch(`${BASE_URL}/get_pacing_report/?status=${currentStatus}`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then(async (r) => {
                const data = await r.json().catch(() => null);
                if (!r.ok) {
                    console.error("get_pacing_report failed:", r.status, data);
                    setRows([]);
                    return;
                }
                setRows(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("get_pacing_report network error:", err);
                setRows([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchData(status);
    }, [status, fetchData]);

    const handleTabChange = (key: string) => {
        const tab = TAB_CONFIG.find(t => t.key === key);
        if (!tab) return;
        setStatus(tab.key);
        navigate(tab.path);
    };

    const campaignOptions = Array.from(new Set(rows.map(r => r.campaign_id))).map(id => ({
        value: id,
        label: id,
    }));

    const filtered = rows.filter(r => {
        if (campaignFilter && r.campaign_id !== campaignFilter) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            return [r.campaign_id, r.campaign_name, r.io_id, r.io_name, r.line_item_id, r.line_item_name]
                .some(f => f?.toLowerCase().includes(q));
        }
        return true;
    });

    const columns: ColumnsType<PacingRow> = [
        {
            title: "S.No", dataIndex: "s_no", width: 56,
            render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{v}</span>,
        },
        {
            title: "Campaign ID", dataIndex: "campaign_id", width: 120, fixed: "left",
            render: (v: string) => <CampaignBadge id={v} />,
        },
        {
            title: "Campaign Name", dataIndex: "campaign_name", width: 200,
            render: (v: string) => <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{v}</span>,
        },
        {
            title: "IO ID", dataIndex: "io_id", width: 110,
            render: (v: string) => <IoBadge id={v} />,
        },
        {
            title: "IO Name", dataIndex: "io_name", width: 190,
            render: (v: string) => <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{v}</span>,
        },
        {
            title: "Line Item ID", dataIndex: "line_item_id", width: 140,
            render: (v: string) => <LineItemBadge id={v} />,
        },
        {
            title: "Line Item Name", dataIndex: "line_item_name", width: 200,
            render: (v: string) => <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{v}</span>,
        },
        {
            title: "Flight Dates", dataIndex: "flight_dates", width: 220,
            render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{v}</span>,
        },
        {
            title: "Total Volume Booked", dataIndex: "total_volume_booked", width: 150, align: "right",
            render: (v) => <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{fmtNumber(v)}</span>,
        },
        {
            title: "Total Volume Delivered", dataIndex: "total_volume_delivered", width: 160, align: "right",
            render: (v) => <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-3)" }}>{fmtNumber(v)}</span>,
        },
        {
            title: "Total Clicks", dataIndex: "total_clicks", width: 110, align: "right",
            render: (v) => <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{fmtNumber(v)}</span>,
        },
        {
            title: "Daily Target", dataIndex: "daily_target", width: 120, align: "right",
            render: (v) => <span style={{ fontSize: 13, fontWeight: 600, color: "var(--amber)" }}>{fmtNumber(v)}</span>,
        },
        {
            title: "Last Day Impression", key: "last_day_impression", width: 170,
            render: (_, row) => <LastDayCell row={row} />,
        },
    ];

    return (
        <>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Pacing Report</h1>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.04em", fontWeight: 500 }}>
                    LAST DAY IMPRESSION VS DAILY TARGET ACROSS CAMPAIGNS
                </p>
            </div>

            <Tabs
                activeKey={status}
                onChange={handleTabChange}
                items={TAB_CONFIG.map(t => ({ key: t.key, label: t.label }))}
            />

            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <Select
                    allowClear
                    placeholder="Select Campaign"
                    style={{ width: 220 }}
                    options={campaignOptions}
                    value={campaignFilter}
                    onChange={setCampaignFilter}
                />
                <Input
                    placeholder="Search line item, campaign, IO…"
                    prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    allowClear
                    style={{ width: 280, background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
                <Button icon={<ReloadOutlined />} onClick={() => fetchData(status)}
                    style={{ border: `1px solid var(--border)`, background: "var(--bg-input)", color: "var(--text-muted)" }}>
                    Refresh
                </Button>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>
                    {filtered.length} of {rows.length} line items
                </span>
            </div>

            <Table
                columns={columns}
                dataSource={filtered}
                rowKey={(r) => `${r.campaign_id}_${r.line_item_id}`}
                loading={loading}
                scroll={{ x: 1850 }}
                pagination={{
                    pageSize: 20, showSizeChanger: true,
                    pageSizeOptions: ["20", "50", "100"],
                    showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} line items`,
                    style: { padding: "12px 16px" },
                }}
                style={{ fontSize: 13 }}
                rowClassName="pr-row"
                bordered
            />

            <style>{`
                .ant-table-thead > tr > th {
                    background: var(--bg-input) !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: var(--text-muted) !important;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    border-right: 1px solid var(--border) !important;
                    border-bottom: 1px solid var(--border) !important;
                }
                .ant-table-tbody > tr.pr-row > td {
                    background: var(--bg-card) !important;
                    color: var(--text-primary) !important;
                    border-right: 1px solid var(--border) !important;
                    border-bottom: 1px solid var(--border) !important;
                }
                .pr-row:hover td { background: var(--bg-card-hover) !important; }
                .ant-table { background: var(--bg-card) !important; }
                .ant-table-container { border-color: var(--border) !important; }
            `}</style>
        </>
    );
}