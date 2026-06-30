import { useEffect, useState, useCallback } from "react";
import { Table, Input, Button, Modal, Tag, Image, Empty, message } from "antd";
import {
    SearchOutlined, ReloadOutlined, FilterOutlined, EyeOutlined,
    DownloadOutlined, FileImageOutlined, VideoCameraOutlined, FileOutlined,
    CheckCircleOutlined, ClockCircleOutlined, PlusOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Colors (kept consistent with the rest of the app) ───────────────────────
const C = {
    bg: "#F8FAFC",
    white: "#FFFFFF",
    slate: "#0F172A",
    slate700: "#334155",
    slate500: "#64748B",
    slate400: "#94A3B8",
    slate100: "#F1F5F9",
    border: "#E2E8F0",
    blue: "#2563EB",
    blueLight: "#EFF6FF",
    blueMid: "#BFDBFE",
    green: "#16A34A",
    greenLight: "#F0FDF4",
    greenMid: "#86EFAC",
    amber: "#D97706",
    amberLight: "#FFFBEB",
    amberMid: "#FDE68A",
    purple: "#7C3AED",
    purpleLight: "#F5F3FF",
    purpleMid: "#DDD6FE",
    red: "#DC2626",
    redLight: "#FEF2F2",
};

// ── Types ─────────────────────────────────────────────────────────────────
interface Attachment {
    id: number;
    file_url: string;
    file_name: string;
    file_type: string;
    uploaded_at: string;
}

interface BulkCampaignRow {
    id: number;
    client: number | null;
    client_id: string | null;
    client_name: string;
    advertiser: string;
    website_url: string | null;
    client_campaign_id: string | null;
    purchase_order_id: string | null;
    campaign_name: string;
    campaign_type: string;
    buying_type: string;
    objective: string;
    start_date: string | null;
    end_date: string | null;
    message: string;
    status: "pending" | "processed";
    created_at: string;
    attachments: Attachment[];
}

// ── Helpers ───────────────────────────────────────────────────────────────
function fmtDate(v?: string | null) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(v?: string | null) {
    if (!v) return "—";
    return new Date(v).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
}

function isImage(fileType: string) {
    return fileType?.startsWith("image/");
}
function isVideo(fileType: string) {
    return fileType?.startsWith("video/");
}

function attachmentIcon(fileType: string) {
    if (isImage(fileType)) return <FileImageOutlined style={{ color: C.blue, fontSize: 14 }} />;
    if (isVideo(fileType)) return <VideoCameraOutlined style={{ color: C.purple, fontSize: 14 }} />;
    return <FileOutlined style={{ color: C.slate500, fontSize: 14 }} />;
}

// ── Fetch-based download (works cross-origin, unlike <a download>) ───────
async function downloadFile(url: string, name: string) {
    try {
        const response = await fetch(url, {
            headers: { "ngrok-skip-browser-warning": "1" },
        });
        if (!response.ok) throw new Error("Download failed");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = name || "attachment";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch {
        message.error(`Failed to download "${name}"`);
    }
}

// ── Sequential download for "Download All" — avoids browser popup-blocking ──
async function downloadAllFiles(attachments: Attachment[]) {
    for (const att of attachments) {
        await downloadFile(att.file_url, att.file_name);
        // small gap so the browser doesn't throttle/block rapid-fire downloads
        await new Promise(res => setTimeout(res, 300));
    }
}

// ── Toast ─────────────────────────────────────────────────────────────────
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

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, color, bg, icon }: { label: string; value: number; color: string; bg: string; icon: string }) {
    return (
        <div style={{ background: C.white, borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 11, color, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
        </div>
    );
}

// ── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const isProcessed = status === "processed";
    const color = isProcessed ? C.green : C.amber;
    const bg = isProcessed ? C.greenLight : C.amberLight;
    const border = isProcessed ? C.greenMid : C.amberMid;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px",
            borderRadius: 20, background: bg, border: `1px solid ${border}`,
            fontSize: 10, fontWeight: 700, color, letterSpacing: "0.05em", textTransform: "uppercase" as const,
        }}>
            {isProcessed ? <CheckCircleOutlined style={{ fontSize: 10 }} /> : <ClockCircleOutlined style={{ fontSize: 10 }} />}
            {isProcessed ? "Processed" : "Pending"}
        </span>
    );
}

// ── Attachment thumbnail strip (used inside table cell) ──────────────────
function AttachmentStrip({ attachments, onViewAll }: { attachments: Attachment[]; onViewAll: () => void }) {
    if (!attachments.length) {
        return <span style={{ fontSize: 12, color: C.slate400 }}>No files</span>;
    }
    const preview = attachments.slice(0, 3);
    const remaining = attachments.length - preview.length;

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {preview.map(att => (
                <div
                    key={att.id}
                    onClick={onViewAll}
                    title={att.file_name}
                    style={{
                        width: 32, height: 32, borderRadius: 6, overflow: "hidden",
                        border: `1px solid ${C.border}`, display: "flex", alignItems: "center",
                        justifyContent: "center", background: C.slate100, cursor: "pointer", flexShrink: 0,
                    }}
                >
                    {isImage(att.file_type) ? (
                        <img src={att.file_url} alt={att.file_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        attachmentIcon(att.file_type)
                    )}
                </div>
            ))}
            {remaining > 0 && (
                <button
                    onClick={onViewAll}
                    style={{
                        height: 32, padding: "0 8px", borderRadius: 6, border: `1px solid ${C.blueMid}`,
                        background: C.blueLight, color: C.blue, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}
                >
                    +{remaining}
                </button>
            )}
        </div>
    );
}

// ── Detail Modal — full request + downloadable attachments ───────────────
function DetailModal({ open, record, onClose }: { open: boolean; record: BulkCampaignRow | null; onClose: () => void }) {
    if (!record) return null;

    const rows: { label: string; value: React.ReactNode }[] = [
        { label: "Client ID", value: record.client_id || "—" },
        { label: "Client Name", value: record.client_name || "—" },
        { label: "Advertiser", value: record.advertiser || "—" },
        { label: "Website URL", value: record.website_url || "—" },
        { label: "Client Campaign ID", value: record.client_campaign_id || "—" },
        { label: "Purchase Order ID", value: record.purchase_order_id || "—" },
        { label: "Campaign Name", value: record.campaign_name || "—" },
        { label: "Campaign Type", value: record.campaign_type || "—" },
        { label: "Buying Type", value: record.buying_type || "—" },
        { label: "Objective", value: record.objective || "—" },
        { label: "Campaign Duration", value: `${fmtDate(record.start_date)} → ${fmtDate(record.end_date)}` },
        { label: "Submitted On", value: fmtDateTime(record.created_at) },
        { label: "Status", value: <StatusBadge status={record.status} /> },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={760}
            centered
            destroyOnClose
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.slate }}>Bulk Campaign Request</span>
                    {record.client_id && (
                        <span style={{
                           fontSize: 11, fontWeight: 700, color: C.blue,
                            background: C.blueLight, padding: "2px 8px", borderRadius: 6, border: `1px solid ${C.blueMid}`,
                        }}>
                            {record.client_id}
                        </span>
                    )}
                </div>
            }
        >
            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>

                {/* Summary table */}
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
                    {rows.map((row, i) => (
                        <div
                            key={row.label}
                            style={{
                                display: "flex", padding: "8px 14px", fontSize: 12.5,
                                background: i % 2 === 0 ? "#fff" : C.slate100,
                                borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
                            }}
                        >
                            <span style={{ width: 180, flexShrink: 0, color: C.slate500, fontWeight: 600 }}>{row.label}</span>
                            <span style={{ color: C.slate700, fontWeight: 500 }}>{row.value}</span>
                        </div>
                    ))}
                </div>

                {/* Message */}
                <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.purple, marginBottom: 8 }}>✉️ Line Item Details (Message)</div>
                    <div style={{
                        background: C.purpleLight, border: `1px solid ${C.purpleMid}`, borderRadius: 10,
                        padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: C.slate700,
                        whiteSpace: "pre-wrap", maxHeight: 260, overflowY: "auto",
                    }}>
                        {record.message || <span style={{ color: C.slate400 }}>No message provided.</span>}
                    </div>
                </div>

                {/* Attachments */}
                <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.blue, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>📎 Attachments ({record.attachments.length})</span>
                        {record.attachments.length > 0 && (
                            <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => downloadAllFiles(record.attachments)}
                                style={{ height: 26, fontSize: 11, fontWeight: 600, borderRadius: 6 }}
                            >
                                Download All
                            </Button>
                        )}
                    </div>

                    {record.attachments.length === 0 ? (
                        <Empty description="No files attached" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: "20px 0" }} />
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                            {record.attachments.map(att => (
                                <div
                                    key={att.id}
                                    style={{
                                        border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden",
                                        background: "#fff", display: "flex", flexDirection: "column",
                                    }}
                                >
                                    <div style={{
                                        height: 100, background: C.slate100, display: "flex",
                                        alignItems: "center", justifyContent: "center", overflow: "hidden",
                                    }}>
                                        {isImage(att.file_type) ? (
                                            <Image
                                                src={att.file_url}
                                                alt={att.file_name}
                                                style={{ width: "100%", height: 100, objectFit: "cover" }}
                                                preview={{ mask: <EyeOutlined /> }}
                                            />
                                        ) : isVideo(att.file_type) ? (
                                            <video src={att.file_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                                        ) : (
                                            <FileOutlined style={{ fontSize: 28, color: C.slate400 }} />
                                        )}
                                    </div>
                                    <div style={{ padding: "8px 10px" }}>
                                        <div title={att.file_name} style={{
                                            fontSize: 11, fontWeight: 600, color: C.slate700,
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            display: "flex", alignItems: "center", gap: 5, marginBottom: 6,
                                        }}>
                                            {attachmentIcon(att.file_type)}
                                            {att.file_name}
                                        </div>
                                        <Button
                                            size="small"
                                            icon={<DownloadOutlined />}
                                            onClick={() => downloadFile(att.file_url, att.file_name)}
                                            style={{
                                                width: "100%", height: 26, fontSize: 10.5, fontWeight: 600,
                                                borderRadius: 6, border: `1px solid ${C.blueMid}`,
                                                background: C.blueLight, color: C.blue,
                                            }}
                                        >
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function Bulk_Campaigns_Details() {
    const [rows, setRows] = useState<BulkCampaignRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processed">("all");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<BulkCampaignRow | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") =>
        setToast({ message, type });

    const fetchData = useCallback(() => {
        setLoading(true);
        fetch(`${BASE_URL}/get_bulk_campaigns/`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then((data: BulkCampaignRow[]) => setRows(Array.isArray(data) ? data : []))
            .catch(() => showToast("Failed to load bulk campaign requests.", "error"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openDetail = (record: BulkCampaignRow) => {
        setSelectedRecord(record);
        setDetailOpen(true);
    };

    // ── Filter ──────────────────────────────────────────────────────────
    const filtered = rows.filter(r => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            return [r.client_id, r.client_name, r.advertiser, r.campaign_name, r.campaign_type, r.message]
                .some(f => f?.toLowerCase().includes(q));
        }
        return true;
    });

    // ── Stats ───────────────────────────────────────────────────────────
    const totalCount = rows.length;
    const pendingCount = rows.filter(r => r.status === "pending").length;
    const processedCount = rows.filter(r => r.status === "processed").length;
    const totalAttachments = rows.reduce((sum, r) => sum + r.attachments.length, 0);

    const filterPills = [
        { key: "all" as const, label: `All (${totalCount})`, color: C.slate500, bg: C.slate100, border: C.border },
        { key: "pending" as const, label: `Pending (${pendingCount})`, color: C.amber, bg: C.amberLight, border: C.amberMid },
        { key: "processed" as const, label: `Processed (${processedCount})`, color: C.green, bg: C.greenLight, border: C.greenMid },
    ];

    // ── Columns ─────────────────────────────────────────────────────────
    const columns: ColumnsType<BulkCampaignRow> = [
        {
            title: "Client ID",
            dataIndex: "client_id",
            key: "client_id",
            width: 140,
            render: (v: string | null) => v ? (
                <span style={{
                   fontSize: 11, fontWeight: 700, color: C.blue,
                    background: C.blueLight, padding: "3px 8px", borderRadius: 6,
                    border: `1px solid ${C.blueMid}`, display: "inline-block",
                }}>
                    {v}
                </span>
            ) : <span style={{ color: C.slate400, fontSize: 12 }}>—</span>,
        },
        {
            title: "Client / Advertiser",
            key: "client_advertiser",
            width: 200,
            render: (_: any, r: BulkCampaignRow) => (
                <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: C.slate }}>{r.client_name || "—"}</div>
                    <div style={{ fontSize: 11, color: C.slate500 }}>{r.advertiser}</div>
                </div>
            ),
        },
        {
            title: "Campaign Name",
            dataIndex: "campaign_name",
            key: "campaign_name",
            width: 190,
            render: (v: string) => <span style={{ fontSize: 13, fontWeight: 500, color: C.slate700 }}>{v}</span>,
        },
        {
            title: "Type / Objective",
            key: "type_objective",
            width: 180,
            render: (_: any, r: BulkCampaignRow) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Tag color="blue" style={{ fontSize: 10.5, width: "fit-content" }}>{r.campaign_type || "—"}</Tag>
                    <span style={{ fontSize: 11, color: C.slate500 }}>{r.objective || "—"}</span>
                </div>
            ),
        },
        {
            title: "Duration",
            key: "duration",
            width: 170,
            render: (_: any, r: BulkCampaignRow) => (
                <span style={{ fontSize: 12, color: C.slate }}>
                    {fmtDate(r.start_date)} → {fmtDate(r.end_date)}
                </span>
            ),
        },
        {
            title: "Attachments",
            key: "attachments",
            width: 150,
            render: (_: any, r: BulkCampaignRow) => (
                <AttachmentStrip attachments={r.attachments} onViewAll={() => openDetail(r)} />
            ),
        },
        {
            title: "Submitted",
            dataIndex: "created_at",
            key: "created_at",
            width: 130,
            render: (v: string) => <span style={{ fontSize: 11.5, color: C.slate500 }}>{fmtDate(v)}</span>,
        },
    
        {
            title: "Actions",
            key: "actions",
            width: 140,
            fixed: "right",
            render: (_: any, r: BulkCampaignRow) => (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => openDetail(r)}
                        style={{ height: 28, borderRadius: 6, border: `1px solid ${C.blueMid}`, background: C.blueLight, color: C.blue, fontSize: 11, fontWeight: 600 }}
                    >
                        View
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 18, fontWeight: 700, color: C.slate, margin: 0 }}>Bulk Campaign Requests</h1>
                    <p style={{ fontSize: 11, color: C.slate500, marginTop: 4, letterSpacing: "0.04em", fontWeight: 500 }}>
                        CLIENT-SUBMITTED BULK REQUESTS — REVIEW DETAILS & DOWNLOAD ATTACHMENTS
                    </p>
                </div>
                <div>
                    <Button
                        onClick={() => window.open('/campaign_create?adminMode=true', '_blank', 'noopener,noreferrer')}
                        style={{
                            borderRadius: 9, border: "none",
                            background: C.blue, color: "#fff",
                            fontSize: 13, fontWeight: 700,
                            boxShadow: `0 4px 14px ${C.green}44`,
                        }}
                    >
                        <PlusOutlined /> Add New Campaign
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                <StatCard label="Total Requests" value={totalCount} color={C.blue} bg={C.blueLight} icon="📋" />
                <StatCard label="Pending" value={pendingCount} color={C.amber} bg={C.amberLight} icon="⏳" />
                <StatCard label="Processed" value={processedCount} color={C.green} bg={C.greenLight} icon="✅" />
                <StatCard label="Total Files" value={totalAttachments} color={C.purple} bg={C.purpleLight} icon="📎" />
            </div>

            {/* Filters */}
            <div style={{ background: C.white, borderRadius: 12, padding: "14px 18px", border: `1px solid ${C.border}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Input
                    placeholder="Search by client ID, name, advertiser, campaign…"
                    prefix={<SearchOutlined style={{ color: C.slate500 }} />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    allowClear
                    style={{ flex: 1, minWidth: 260, height: 36 }}
                />
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <FilterOutlined style={{ color: C.slate500, fontSize: 13 }} />
                    {filterPills.map(pill => (
                        <button
                            key={pill.key}
                            onClick={() => setStatusFilter(pill.key)}
                            style={{
                                padding: "4px 12px", borderRadius: 20,
                                border: `1px solid ${statusFilter === pill.key ? pill.border : C.border}`,
                                background: statusFilter === pill.key ? pill.bg : C.white,
                                color: statusFilter === pill.key ? pill.color : C.slate500,
                                fontSize: 11, fontWeight: 700, cursor: "pointer", outline: "none", transition: "all 0.15s",
                            }}
                        >
                            {pill.label}
                        </button>
                    ))}
                </div>
                <Button onClick={fetchData} icon={<ReloadOutlined />} style={{ height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.slate500, fontSize: 12, fontWeight: 600 }}>
                    Refresh
                </Button>
                <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>
                    {filtered.length} of {rows.length} requests
                </span>
            </div>

            {/* Table */}
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1450 }}
                    onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: "pointer" } })}
                    pagination={{
                        pageSize: 20, showSizeChanger: true, pageSizeOptions: ["20", "50", "100"],
                        showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} requests`,
                        style: { padding: "12px 16px" },
                    }}
                    style={{ fontSize: 13 }}
                />
            </div>

            <DetailModal open={detailOpen} record={selectedRecord} onClose={() => setDetailOpen(false)} />

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
            `}</style>
        </>
    );
}