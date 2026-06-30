import { useEffect, useState, useCallback } from "react";
import { Table, Button, Input, Tag, Tooltip } from "antd";
import {
    SearchOutlined, ReloadOutlined,
    DownloadOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const C = {
    white: "#FFFFFF",
    slate: "#0F172A",
    slate500: "#64748B",
    border: "#E2E8F0",
    blue: "#2563EB",
    blueLight: "#EFF6FF",
    blueMid: "#BFDBFE",
    green: "#16A34A",
    greenLight: "#F0FDF4",
    greenMid: "#86EFAC",
    amber: "#D97706",
    amberLight: "#FFFBEB",
    teal: "#0F766E",
    tealLight: "#F0FDFA",
    tealMid: "#99F6E4",
    red: "#DC2626",
};

interface CampaignRow {
    campaign_id: string;
    campaign_id_raw: string;
    report_type: 'cpm' | 'cpc';
    campaign_name: string;
    client_name: string;
    client_id: string;
    start_date: string;
    end_date: string;
    line_items_count: number;
    excel_generated: boolean;
    excel_url: string | null;
    generated_at: string | null;
    publish_status: string | null;
}

function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    const color = type === "success" ? C.green : C.red;
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            background: C.white, border: `1px solid ${color}55`, borderRadius: 12,
            padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 280,
        }}>
            <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{message}</span>
        </div>
    );
}

export default function Reports() {
    const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") =>
        setToast({ message, type });

    const fetchList = useCallback(() => {
        setLoading(true);
        fetch(`${BASE_URL}/get_campaigns_excel_list/`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then((data: CampaignRow[]) => {
                // ── Only show published reports ──
                const published = Array.isArray(data)
                    ? data.filter(c => c.publish_status === 'published')
                    : [];
                setCampaigns(published);
            })
            .catch(() => showToast("Failed to load reports.", "error"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchList(); }, [fetchList]);

    const handleDownload = (record: CampaignRow) => {
        const url = `${BASE_URL}/download_campaign_excel/${record.campaign_id_raw}/?report_type=${record.report_type}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `${record.campaign_id}.xlsx`;
        a.click();
    };

    const filtered = campaigns.filter(c => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [c.campaign_id, c.campaign_name, c.client_name, c.client_id]
            .some(f => f?.toLowerCase().includes(q));
    });

    const totalCount = campaigns.length;
    const cpmCount = campaigns.filter(c => c.report_type === 'cpm').length;
    const cpcCount = campaigns.filter(c => c.report_type === 'cpc').length;

    const columns: ColumnsType<CampaignRow> = [
        {
            title: "Campaign ID",
            dataIndex: "campaign_id",
            key: "campaign_id",
            width: 140,
            render: (v: string, record) => (
                <span style={{
                     fontSize: 12, fontWeight: 700,
                    color: record.report_type === 'cpm' ? C.blue : C.teal,
                    background: record.report_type === 'cpm' ? C.blueLight : C.tealLight,
                    padding: "3px 8px", borderRadius: 6, display: "inline-block",
                }}>{v}</span>
            ),
        },
        {
            title: "Type",
            dataIndex: "report_type",
            key: "report_type",
            width: 200,
            render: (v: 'cpm' | 'cpc') => (
                <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px",
                    borderRadius: 20, textTransform: "uppercase",
                    background: v === 'cpm' ? C.blueLight : C.tealLight,
                    color: v === 'cpm' ? C.blue : C.teal,
                    border: `1px solid ${v === 'cpm' ? C.blueMid : C.tealMid}`,
                }}>
                    {v === 'cpm' ? '📊 CPM — Impressions' : '🖱️ CPC — Clicks'}
                </span>
            ),
        },
        {
            title: "Campaign Name",
            dataIndex: "campaign_name",
            key: "campaign_name",
            width: 200,
            render: (v: string) => (
                <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{v || "—"}</span>
            ),
        },
        {
            title: "Client",
            dataIndex: "client_name",
            key: "client_name",
            width: 150,
            render: (v: string, record) => (
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.slate }}>{v || "—"}</div>
                    <div style={{ fontSize: 10, color: C.slate500,  }}>{record.client_id}</div>
                </div>
            ),
        },
        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",
            width: 110,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>,
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            width: 110,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>,
        },
        {
            title: "Line Items",
            dataIndex: "line_items_count",
            key: "line_items_count",
            width: 100,
            render: (v: number) => (
                <Tag color="purple" style={{ fontSize: 11 }}>{v} sheet{v !== 1 ? "s" : ""}</Tag>
            ),
        },
        {
            title: "Published On",
            dataIndex: "generated_at",
            key: "generated_at",
            width: 120,
            render: (v: string) => (
                <Tooltip title={v ? new Date(v).toLocaleString() : "—"}>
                    <span style={{
                        fontSize: 11, display: "inline-flex", alignItems: "center", gap: 5,
                        color: C.green, fontWeight: 600,
                    }}>
                        <CheckCircleOutlined style={{ fontSize: 11 }} />
                        {fmtDate(v)}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            fixed: "right",
            render: (_: any, record: CampaignRow) => (
                <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(record)}
                    style={{
                        fontSize: 11, fontWeight: 600, height: 30,
                        background: C.blueLight, color: C.blue,
                        border: `1px solid ${C.blueMid}`, borderRadius: 6,
                    }}
                >
                    Download
                </Button>
            ),
        },
    ];

    return (
        <>
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: C.slate }}>Reports</h1>
                <p style={{ fontSize: 11, color: C.slate500, marginTop: 1, letterSpacing: "0.04em", fontWeight: 500 }}>
                    PUBLISHED CAMPAIGN EXCEL REPORTS — AVAILABLE FOR DOWNLOAD
                </p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                    { label: "Total Published", value: totalCount, color: C.green, bg: C.greenLight, icon: "✅" },
                    { label: "CPM Reports", value: cpmCount, color: C.blue, bg: C.blueLight, icon: "📊" },
                    { label: "CPC Reports", value: cpcCount, color: C.teal, bg: C.tealLight, icon: "🖱️" },
                ].map(card => (
                    <div key={card.label} style={{
                        background: C.white, borderRadius: 14, padding: 20,
                        border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <span style={{ fontSize: 11, color: card.color, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                {card.label}
                            </span>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                                {card.icon}
                            </div>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: card.color, letterSpacing: "-1px", lineHeight: 1 }}>
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{
                background: C.white, borderRadius: 12, padding: "14px 18px",
                border: `1px solid ${C.border}`, marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
                <Input
                    placeholder="Search by campaign ID, name, client…"
                    prefix={<SearchOutlined style={{ color: C.slate500 }} />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    allowClear
                    style={{ flex: 1, minWidth: 240, height: 36 }}
                />
                <Button
                    onClick={fetchList}
                    icon={<ReloadOutlined />}
                    style={{ height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.slate500, fontSize: 12, fontWeight: 600 }}
                >
                    Refresh
                </Button>
                <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>
                    {filtered.length} of {campaigns.length} reports
                </span>
            </div>

            {/* Info Banner */}
            <div style={{
                background: C.greenLight, border: `1px solid ${C.greenMid}`,
                borderRadius: 10, padding: "10px 16px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 12.5, color: C.green, fontWeight: 500,
            }}>
                <CheckCircleOutlined style={{ fontSize: 16 }} />
                Showing only <strong>published</strong> reports. Click <strong>Download</strong> to save the Excel file.
            </div>

            {/* Empty State */}
            {!loading && filtered.length === 0 && (
                <div style={{
                    background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
                    padding: "48px 24px", textAlign: "center",
                }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.slate, marginBottom: 6 }}>
                        No published reports yet
                    </div>
                    <div style={{ fontSize: 13, color: C.slate500 }}>
                        Reports will appear here once admin generates and publishes them.
                    </div>
                </div>
            )}

            {/* Table */}
            {(loading || filtered.length > 0) && (
                <div style={{
                    background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
                    overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                    <Table
                        columns={columns}
                        dataSource={filtered}
                        rowKey={r => `${r.campaign_id_raw}_${r.report_type}`}
                        loading={loading}
                        scroll={{ x: 1200 }}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "20", "50"],
                            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} reports`,
                            style: { padding: "12px 16px" },
                        }}
                        style={{ fontSize: 13 }}
                        rowClassName={(record, index) => {
                            const prevRecord = filtered[index - 1];
                            return prevRecord && prevRecord.campaign_id_raw !== record.campaign_id_raw
                                ? 'campaign-group-start'
                                : '';
                        }}
                    />
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <style>{`
                .ant-table-thead > tr > th {
                    background: #F1F5F9 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: #64748B !important;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .ant-table-row:hover td { background: #F8FAFC !important; }
                .campaign-group-start td {
                    border-top: 2px solid #E2E8F0 !important;
                }
            `}</style>
        </>
    );
}