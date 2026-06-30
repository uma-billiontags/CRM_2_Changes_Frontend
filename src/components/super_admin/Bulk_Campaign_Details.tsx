import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Table, Input, Button, Modal, Tag, Image, Empty, message } from "antd";
import {
    SearchOutlined, ReloadOutlined, FilterOutlined, EyeOutlined,
    DownloadOutlined, FileImageOutlined, VideoCameraOutlined, FileOutlined,
    CheckCircleOutlined, ClockCircleOutlined, PlusOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

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
    if (isImage(fileType)) return <FileImageOutlined style={{ color: "var(--accent)", fontSize: 14 }} />;
    if (isVideo(fileType)) return <VideoCameraOutlined style={{ color: "var(--accent)", fontSize: 14 }} />;
    return <FileOutlined style={{ color: "var(--text-muted)", fontSize: 14 }} />;
}

// ── Fetch-based download ──────────────────────────────────────────────────
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

async function downloadAllFiles(attachments: Attachment[]) {
    for (const att of attachments) {
        await downloadFile(att.file_url, att.file_name);
        await new Promise(res => setTimeout(res, 300));
    }
}

// ── Toast ─────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            background: "var(--bg-card)",
            border: `1px solid ${type === "success" ? "var(--green)" : "var(--red)"}`,
            borderRadius: 12,
            padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
            boxShadow: "var(--shadow)", minWidth: 280,
        }}>
            <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{message}</span>
        </div>
    );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, colorVar, bgVar, icon }: {
    label: string;
    value: number;
    colorVar: string;
    bgVar: string;
    icon: string;
}) {
    return (
        <div style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-card)",
            padding: 20,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: colorVar, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: bgVar, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: colorVar, letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
        </div>
    );
}

// ── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const isProcessed = status === "processed";
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px",
            borderRadius: 20,
            background: isProcessed ? "var(--green-bg)" : "var(--amber-bg)",
            border: `1px solid ${isProcessed ? "var(--green)" : "var(--amber)"}`,
            fontSize: 10, fontWeight: 700,
            color: isProcessed ? "var(--green)" : "var(--amber)",
            letterSpacing: "0.05em", textTransform: "uppercase" as const,
        }}>
            {isProcessed ? <CheckCircleOutlined style={{ fontSize: 10 }} /> : <ClockCircleOutlined style={{ fontSize: 10 }} />}
            {isProcessed ? "Processed" : "Pending"}
        </span>
    );
}

// ── Attachment thumbnail strip ─────────────────────────────────────────────
function AttachmentStrip({ attachments, onViewAll }: { attachments: Attachment[]; onViewAll: () => void }) {
    if (!attachments.length) {
        return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No files</span>;
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
                        border: "1px solid var(--border)", display: "flex", alignItems: "center",
                        justifyContent: "center", background: "var(--bg-input)", cursor: "pointer", flexShrink: 0,
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
                        height: 32, padding: "0 8px", borderRadius: 6,
                        border: "1px solid var(--accent)",
                        background: "var(--accent-light)",
                        color: "var(--accent)",
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}
                >
                    +{remaining}
                </button>
            )}
        </div>
    );
}

// ── Detail Modal ───────────────────────────────────────────────────────────
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
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Bulk Campaign Request</span>
                    {record.client_id && (
                        <span style={{
                            fontSize: 11, fontWeight: 700, color: "var(--accent)",
                            background: "var(--accent-light)", padding: "2px 8px", borderRadius: 6,
                            border: "1px solid var(--accent)",
                        }}>
                            {record.client_id}
                        </span>
                    )}
                </div>
            }
        >
            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>

                {/* Summary table */}
                <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
                    {rows.map((row, i) => (
                        <div
                            key={row.label}
                            style={{
                                display: "flex", padding: "8px 14px", fontSize: 12.5,
                                background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-input)",
                                borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                            }}
                        >
                            <span style={{ width: 180, flexShrink: 0, color: "var(--text-muted)", fontWeight: 600 }}>{row.label}</span>
                            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{row.value}</span>
                        </div>
                    ))}
                </div>

                {/* Message */}
                <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>✉️ Line Item Details (Message)</div>
                    <div style={{
                        background: "var(--accent-light)",
                        border: "1px solid var(--accent)",
                        borderRadius: 10,
                        padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)",
                        whiteSpace: "pre-wrap", maxHeight: 260, overflowY: "auto",
                    }}>
                        {record.message || <span style={{ color: "var(--text-muted)" }}>No message provided.</span>}
                    </div>
                </div>

                {/* Attachments */}
                <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                                        border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
                                        background: "var(--bg-card)", display: "flex", flexDirection: "column",
                                    }}
                                >
                                    <div style={{
                                        height: 100, background: "var(--bg-input)", display: "flex",
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
                                            <FileOutlined style={{ fontSize: 28, color: "var(--text-muted)" }} />
                                        )}
                                    </div>
                                    <div style={{ padding: "8px 10px" }}>
                                        <div title={att.file_name} style={{
                                            fontSize: 11, fontWeight: 600, color: "var(--text-primary)",
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
                                                borderRadius: 6, border: "1px solid var(--accent)",
                                                background: "var(--accent-light)", color: "var(--accent)",
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
    const location = useLocation();
    const isSuperAdmin = location.pathname.startsWith('/superadmin');

    const [rows, setRows] = useState<BulkCampaignRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processed">("all");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<BulkCampaignRow | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

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

    const handleMarkProcessed = async (record: BulkCampaignRow) => {
        setUpdatingStatusId(record.id);
        try {
            const res = await fetch(`${BASE_URL}/update_bulk_campaign_status/${record.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
                body: JSON.stringify({ status: "processed" }),
            });
            if (!res.ok) throw new Error();
            setRows(prev => prev.map(r => r.id === record.id ? { ...r, status: "processed" } : r));
            showToast(`Marked "${record.campaign_name}" as processed.`);
        } catch {
            showToast("Failed to update status.", "error");
        } finally {
            setUpdatingStatusId(null);
        }
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
        { key: "all" as const, label: `All (${totalCount})`, activeColor: "var(--text-muted)", activeBg: "var(--bg-input)", activeBorder: "var(--border)" },
        { key: "pending" as const, label: `Pending (${pendingCount})`, activeColor: "var(--amber)", activeBg: "var(--amber-bg)", activeBorder: "var(--amber)" },
        { key: "processed" as const, label: `Processed (${processedCount})`, activeColor: "var(--green)", activeBg: "var(--green-bg)", activeBorder: "var(--green)" },
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
                    fontSize: 11, fontWeight: 700, color: "var(--accent)",
                    background: "var(--accent-light)", padding: "3px 8px", borderRadius: 6,
                    border: "1px solid var(--accent)", display: "inline-block",
                }}>
                    {v}
                </span>
            ) : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
        },
        {
            title: "Client / Advertiser",
            key: "client_advertiser",
            width: 200,
            render: (_: any, r: BulkCampaignRow) => (
                <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>{r.client_name || "—"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.advertiser}</div>
                </div>
            ),
        },
        {
            title: "Campaign Name",
            dataIndex: "campaign_name",
            key: "campaign_name",
            width: 190,
            render: (v: string) => <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{v}</span>,
        },
        {
            title: "Type / Objective",
            key: "type_objective",
            width: 180,
            render: (_: any, r: BulkCampaignRow) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Tag color="purple" style={{ fontSize: 10.5, width: "fit-content" }}>{r.campaign_type || "—"}</Tag>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.objective || "—"}</span>
                </div>
            ),
        },
        {
            title: "Duration",
            key: "duration",
            width: 170,
            render: (_: any, r: BulkCampaignRow) => (
                <span style={{ fontSize: 12, color: "var(--text-primary)" }}>
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
            render: (v: string) => <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{fmtDate(v)}</span>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (v: string) => <StatusBadge status={v} />,
        },
        {
            title: "Actions",
            key: "actions",
            width: 200,
            fixed: "right",
            render: (_: any, r: BulkCampaignRow) => (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => openDetail(r)}
                        style={{
                            height: 28, borderRadius: 6,
                            border: "1px solid var(--accent)",
                            background: "var(--accent-light)",
                            color: "var(--accent)",
                            fontSize: 11, fontWeight: 600,
                        }}
                    >
                        View
                    </Button>
                    {r.status === "pending" && (
                        <Button
                            size="small"
                            loading={updatingStatusId === r.id}
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleMarkProcessed(r)}
                            style={{
                                height: 28, borderRadius: 6,
                                border: "1px solid var(--green)",
                                background: "var(--green-bg)",
                                color: "var(--green)",
                                fontSize: 11, fontWeight: 600,
                            }}
                        >
                            Mark Processed
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            {/* ── Page Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Bulk Campaign Requests</h1>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        CLIENT-SUBMITTED BULK REQUESTS — REVIEW DETAILS & DOWNLOAD ATTACHMENTS
                    </p>
                </div>
                <Button
                    onClick={() => window.open(
                        isSuperAdmin ? '/campaign_create?superadminMode=true' : '/campaign_create?adminMode=true',
                        '_blank',
                        'noopener,noreferrer'
                    )}
                    style={{
                        borderRadius: 9, border: "none",
                        background: "var(--accent)", color: "#fff",
                        fontSize: 13, fontWeight: 700,
                        padding: "8px 16px", cursor: "pointer",
                    }}
                >
                    <PlusOutlined /> Add New Campaign
                </Button>
            </div>

            {/* ── Stat Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                <StatCard label="Total Requests" value={totalCount} colorVar="var(--accent)" bgVar="var(--accent-light)" icon="📋" />
                <StatCard label="Pending" value={pendingCount} colorVar="var(--amber)" bgVar="var(--amber-bg)" icon="⏳" />
                <StatCard label="Processed" value={processedCount} colorVar="var(--green)" bgVar="var(--green-bg)" icon="✅" />
                <StatCard label="Total Files" value={totalAttachments} colorVar="var(--accent)" bgVar="var(--accent-light)" icon="📎" />
            </div>

            {/* ── Filters ── */}
            <div style={{
                background: "var(--bg-card)", borderRadius: 12, padding: "14px 18px",
                border: "1px solid var(--border)", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                boxShadow: "var(--shadow-card)",
            }}>
                <Input
                    placeholder="Search by client ID, name, advertiser, campaign…"
                    prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    allowClear
                    style={{ flex: 1, minWidth: 260, height: 36, background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <FilterOutlined style={{ color: "var(--text-muted)", fontSize: 13 }} />
                    {filterPills.map(pill => {
                        const isActive = statusFilter === pill.key;
                        return (
                            <button
                                key={pill.key}
                                onClick={() => setStatusFilter(pill.key)}
                                style={{
                                    padding: "4px 12px", borderRadius: 20,
                                    border: `1px solid ${isActive ? pill.activeBorder : "var(--border)"}`,
                                    background: isActive ? pill.activeBg : "transparent",
                                    color: isActive ? pill.activeColor : "var(--text-muted)",
                                    fontSize: 11, fontWeight: 700, cursor: "pointer", outline: "none", transition: "all 0.15s",
                                }}
                            >
                                {pill.label}
                            </button>
                        );
                    })}
                </div>
                <Button
                    onClick={fetchData}
                    icon={<ReloadOutlined />}
                    style={{
                        height: 36, borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg-input)",
                        color: "var(--text-muted)",
                        fontSize: 12, fontWeight: 600,
                    }}
                >
                    Refresh
                </Button>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
                    {filtered.length} of {rows.length} requests
                </span>
            </div>

            {/* ── Table ── */}
            <div style={{
                background: "var(--bg-card)", borderRadius: 14,
                border: "1px solid var(--border)", overflow: "hidden",
                boxShadow: "var(--shadow-card)",
            }}>
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1450 }}
                    onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: "pointer" } })}
                    rowClassName={() => "client-table-row"}
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
        </div>
    );
}