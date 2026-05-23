import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Tag, Badge, Button, Input, Select } from "antd";
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Option } = Select;

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
    bg: "#F8FAFC",
    white: "#FFFFFF",
    slate: "#0F172A",
    slate700: "#334155",
    slate500: "#64748B",
    slate400: "#94A3B8",
    slate300: "#CBD5E1",
    slate100: "#F1F5F9",
    border: "#E2E8F0",
    borderLight: "#F1F5F9",
    blue: "#2563EB",
    blueLight: "#EFF6FF",
    blueMid: "#BFDBFE",
    green: "#16A34A",
    greenLight: "#F0FDF4",
    red: "#DC2626",
    redLight: "#FEF2F2",
    amber: "#D97706",
    amberLight: "#FFFBEB",
    purple: "#7C3AED",
    purpleLight: "#F5F3FF",
    purpleMid: "#DDD6FE",
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; border: string; color: string; dot: string }> = {
    live:      { bg: C.greenLight,  border: "#BBF7D0", color: C.green,  dot: C.green  },
    active:    { bg: C.blueLight,   border: C.blueMid, color: C.blue,   dot: C.blue   },
    paused:    { bg: C.amberLight,  border: "#FDE68A", color: C.amber,  dot: C.amber  },
    pending:   { bg: C.amberLight,  border: "#FDE68A", color: C.amber,  dot: C.amber  },
    draft:     { bg: C.slate100,    border: C.border,  color: C.slate500, dot: C.slate400 },
    completed: { bg: C.purpleLight, border: C.purpleMid, color: C.purple, dot: C.purple },
    cancelled: { bg: C.redLight,    border: "#FECACA", color: C.red,    dot: C.red    },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface LineItem {
    line_item_id: string;
    line_item_name: string;
    start_date: string;
    end_date: string;
    ad_format: string | string[];
    impressions: string;
    status?: string;
}

interface Campaign {
    campaign_id: string;
    client_campaign_ID?: string;
    purchase_order_ID?: string;
    campaign_name: string;
    client_name: string;
    advertiser?: string;
    campaign_type?: string;
    buying_type?: string;
    objective?: string;
    start_date?: string;
    end_date?: string;
    created_at: string;
    status?: string;
    line_items?: LineItem[];
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function isActiveCampaign(c: Campaign): boolean {
    if (!c.start_date || !c.end_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(c.start_date);
    const end = new Date(c.end_date);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
}

function isClosedCampaign(c: Campaign): boolean {
    if (!c.end_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(c.end_date);
    end.setHours(23, 59, 59, 999);
    return today > end;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status?: string }) {
    const s = STATUS_STYLE[status ?? "pending"] ?? STATUS_STYLE.pending;
    return (
        <Badge
            color={s.dot}
            text={
                <span style={{
                    fontSize: 11, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                    color: s.color,
                }}>
                    {status ?? "pending"}
                </span>
            }
        />
    );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({
    label, value, color, bg, icon, active, onClick,
}: {
    label: string; value: number; color: string; bg: string;
    icon: string; active: boolean; onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                background: C.white,
                borderRadius: 14,
                padding: "20px",
                border: active ? `2px solid ${color}` : `1px solid ${C.border}`,
                boxShadow: active
                    ? `0 0 0 3px ${color}22, 0 2px 8px rgba(0,0,0,0.08)`
                    : "0 1px 4px rgba(0,0,0,0.06)",
                cursor: "pointer",
                transition: "all 0.18s",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {active && (
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: color, borderRadius: "14px 14px 0 0",
                }} />
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{
                    fontSize: 11, color: active ? color : C.slate500,
                    fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                }}>
                    {label}
                </span>
                <div style={{
                    width: 36, height: 36, borderRadius: 9, background: bg,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                }}>
                    {icon}
                </div>
            </div>
            <div style={{
                fontSize: 32, fontWeight: 800, color: color,
                letterSpacing: "-1px", lineHeight: 1,
            }}>
                {value}
            </div>
        </div>
    );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    const color = type === "success" ? C.green : C.red;
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 999,
            background: C.white, border: `1px solid ${color}55`, borderRadius: 12,
            padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}>
            <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{message}</span>
        </div>
    );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({
    campaign, onConfirm, onClose, deleting,
}: {
    campaign: Campaign;
    onConfirm: () => void;
    onClose: () => void;
    deleting: boolean;
}) {
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 400,
            background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
            <div style={{
                background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
                width: "100%", maxWidth: 440, padding: 28,
                boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: C.redLight, border: "1px solid #FECACA",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                    }}>🗑️</div>
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        style={{
                            width: 30, height: 30, borderRadius: 8,
                            border: `1px solid ${C.border}`, background: C.slate100,
                            cursor: "pointer", fontSize: 15, color: C.slate500,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >✕</button>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, margin: "0 0 8px" }}>
                    Delete Campaign
                </h3>
                <p style={{ fontSize: 13, color: C.slate500, margin: "0 0 6px", lineHeight: 1.6 }}>
                    Are you sure you want to delete{" "}
                    <strong style={{ color: C.slate }}>{campaign.campaign_name}</strong>?
                </p>
                <p style={{ fontSize: 12, color: C.slate400, margin: "0 0 24px" }}>
                    Campaign ID:{" "}
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.blue }}>
                        {campaign.campaign_id}
                    </span>
                    . This action <strong style={{ color: C.red }}>cannot be undone</strong>.
                </p>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        style={{
                            padding: "9px 20px", borderRadius: 8,
                            border: `1px solid ${C.border}`,
                            background: "transparent", color: C.slate500,
                            fontSize: 13, fontWeight: 500, cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        style={{
                            padding: "9px 24px", borderRadius: 8, border: "none",
                            background: C.red, color: "#fff",
                            fontSize: 13, fontWeight: 700,
                            cursor: deleting ? "not-allowed" : "pointer",
                            opacity: deleting ? 0.7 : 1,
                            display: "flex", alignItems: "center", gap: 7,
                            boxShadow: "0 2px 8px rgba(220,38,38,0.25)",
                        }}
                    >
                        {deleting ? "Deleting…" : "Yes, Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function All_Campaigns() {
    const navigate = useNavigate();

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [cardFilter, setCardFilter] = useState<"all" | "active" | "closed">("all");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);
    const [deleting, setDeleting] = useState(false);

    const showToast = (message: string, type: "success" | "error" = "success") =>
        setToast({ message, type });

    const fetchCampaigns = useCallback(() => {
        setLoading(true);
        fetch("http://127.0.0.1:8000/get_campaigns/", {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
            .then((data) => {
                const list: Campaign[] = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.campaigns) ? data.campaigns : [];
                setCampaigns(list);
            })
            .catch(() => {
                setCampaigns([]);
                showToast("Failed to load campaigns.", "error");
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    // ── Counts ────────────────────────────────────────────────────────────────
    const totalCount  = campaigns.length;
    const activeCount = campaigns.filter(isActiveCampaign).length;
    const closedCount = campaigns.filter(isClosedCampaign).length;

    // ── Delete handler ────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteCampaign) return;
        setDeleting(true);
        try {
            const res = await fetch(
                `http://127.0.0.1:8000/delete_campaign/${deleteCampaign.campaign_id}/`,
                {
                    method: "DELETE",
                    headers: { "ngrok-skip-browser-warning": "1" },
                }
            );
            if (res.ok) {
                setCampaigns((prev) => prev.filter((c) => c.campaign_id !== deleteCampaign.campaign_id));
                setDeleteCampaign(null);
                showToast("Campaign deleted successfully!");
            } else {
                showToast("Failed to delete campaign.", "error");
            }
        } catch {
            showToast("Network error. Please try again.", "error");
        } finally {
            setDeleting(false);
        }
    };

    // ── Filter logic ──────────────────────────────────────────────────────────
    const filtered = campaigns.filter((c) => {
        // card filter
        if (cardFilter === "active" && !isActiveCampaign(c)) return false;
        if (cardFilter === "closed" && !isClosedCampaign(c)) return false;

        // type filter
        if (typeFilter !== "all" && c.campaign_type !== typeFilter) return false;

        // search
        if (search.trim()) {
            const q = search.toLowerCase();
            const match = [c.campaign_name, c.campaign_id, c.client_campaign_ID, c.client_name, c.advertiser]
                .some((f) => f?.toLowerCase().includes(q));
            if (!match) return false;
        }

        return true;
    });

    const uniqueTypes = [...new Set(campaigns.map((c) => c.campaign_type).filter(Boolean))] as string[];

    // ── Table Columns ─────────────────────────────────────────────────────────
    const columns: ColumnsType<Campaign> = [
        {
            title: "Campaign ID",
            dataIndex: "campaign_id",
            key: "campaign_id",
            width: 160,
            fixed: "left",
            render: (id: string) => (
                <span style={{
                    fontSize: 12, fontWeight: 700, color: C.blue,
                    background: C.blueLight, padding: "3px 8px",
                    borderRadius: 6, fontFamily: "monospace",
                    letterSpacing: "0.02em", whiteSpace: "nowrap",
                }}>
                    {id}
                </span>
            ),
        },
        {
            title: "Client Campaign ID",
            dataIndex: "client_campaign_ID",
            key: "client_campaign_ID",
            width: 160,
            render: (v: string) => (
                <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>
            ),
        },
        {
            title: "Purchase Order ID",
            dataIndex: "purchase_order_ID",
            key: "purchase_order_ID",
            width: 160,
            render: (v: string) => (
                <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>
            ),
        },
        {
            title: "Campaign Name",
            dataIndex: "campaign_name",
            key: "campaign_name",
            width: 200,
            render: (name: string) => (
                <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{name || "—"}</span>
            ),
        },
        {
            title: "Advertiser",
            dataIndex: "advertiser",
            key: "advertiser",
            width: 160,
            render: (v: string) => (
                <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>
            ),
        },
        {
            title: "Company",
            dataIndex: "client_name",
            key: "client_name",
            width: 160,
            render: (v: string) => (
                <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>
            ),
        },
        {
            title: "Type",
            dataIndex: "campaign_type",
            key: "campaign_type",
            width: 150,
            render: (v: string) => v
                ? <Tag color="blue" style={{ fontSize: 11 }}>{v}</Tag>
                : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "Objective",
            dataIndex: "objective",
            key: "objective",
            width: 180,
            render: (v: string) => (
                <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>
            ),
        },
        {
            title: "Buying Type",
            dataIndex: "buying_type",
            key: "buying_type",
            width: 180,
            render: (v: string) => (
                <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>
            ),
        },
        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",
            width: 130,
            render: (v: string) => v
                ? <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>
                : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            width: 130,
            render: (v: string) => v
                ? <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>
                : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "Campaign State",
            key: "campaign_state",
            width: 140,
            render: (_: any, record: Campaign) => {
                if (isActiveCampaign(record)) {
                    return (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "3px 10px", borderRadius: 20,
                            background: C.greenLight, border: "1px solid #BBF7D0",
                            fontSize: 10, fontWeight: 700, color: C.green,
                            letterSpacing: "0.06em", textTransform: "uppercase",
                        }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
                            Active
                        </span>
                    );
                }
                if (isClosedCampaign(record)) {
                    return (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "3px 10px", borderRadius: 20,
                            background: C.redLight, border: "1px solid #FECACA",
                            fontSize: 10, fontWeight: 700, color: C.red,
                            letterSpacing: "0.06em", textTransform: "uppercase",
                        }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.red }} />
                            Closed
                        </span>
                    );
                }
                return (
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 10px", borderRadius: 20,
                        background: "#FFFBEB", border: "1px solid #FDE68A",
                        fontSize: 10, fontWeight: 700, color: "#D97706",
                        letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#D97706" }} />
                        Upcoming
                    </span>
                );
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (v: string) => <StatusBadge status={v} />,
        },
        {
            title: "Line Items",
            key: "line_items",
            width: 100,
            render: (_: any, record: Campaign) => (
                <Tag color="purple" style={{ fontSize: 11 }}>
                    {record.line_items?.length ?? 0} item{(record.line_items?.length ?? 0) !== 1 ? "s" : ""}
                </Tag>
            ),
        },
        {
            title: "Created",
            dataIndex: "created_at",
            key: "created_at",
            width: 130,
            render: (v: string) => v
                ? <span style={{ fontSize: 12, color: C.slate500 }}>{fmtDate(v)}</span>
                : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "Actions",
            key: "actions",
            width: 185,
            fixed: "right",
            render: (_: any, record: Campaign) => (
                <div style={{ display: "flex", gap: 6 }}>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/campaign/${record.campaign_id}`)}
                        style={{
                            fontSize: 11, fontWeight: 600,
                            color: C.blue, background: C.blueLight,
                            border: `1px solid ${C.blueMid}`, borderRadius: 6,
                        }}
                    >
                        View
                    </Button>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/update_campaign/${record.campaign_id}`)}
                        style={{
                            fontSize: 11, fontWeight: 600,
                            color: C.slate, background: C.white,
                            border: `1px solid ${C.slate300}`, borderRadius: 6,
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => setDeleteCampaign(record)}
                        style={{
                            fontSize: 11, fontWeight: 600,
                            color: C.red, background: C.redLight,
                            border: "1px solid #FECACA", borderRadius: 6,
                        }}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    // ── Expanded line items ───────────────────────────────────────────────────
    const lineItemColumns: ColumnsType<LineItem> = [
        {
            title: "Line Item ID",
            dataIndex: "line_item_id",
            key: "line_item_id",
            render: (v: string) => (
                <span style={{
                    fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                    color: C.purple, background: C.purpleLight,
                    padding: "2px 6px", borderRadius: 4,
                }}>{v}</span>
            ),
        },
        {
            title: "Name",
            dataIndex: "line_item_name",
            key: "line_item_name",
            render: (v: string) => <span style={{ fontSize: 12 }}>{v || "—"}</span>,
        },
        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",
            render: (v: string) => <span style={{ fontSize: 12 }}>{v || "—"}</span>,
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            render: (v: string) => <span style={{ fontSize: 12 }}>{v || "—"}</span>,
        },
        {
            title: "Ad Format",
            dataIndex: "ad_format",
            key: "ad_format",
            render: (v: string | string[]) => {
                const formats = Array.isArray(v) ? v : (v ? [v] : []);
                return formats.length > 0
                    ? formats.map((f: string) => (
                        <Tag key={f} color="blue" style={{ fontSize: 10 }}>{f}</Tag>
                    ))
                    : <span style={{ color: C.slate500 }}>—</span>;
            },
        },
        {
            title: "Impressions",
            dataIndex: "impressions",
            key: "impressions",
            render: (v: string) => (
                <span style={{ fontSize: 12 }}>
                    {v ? Number(v).toLocaleString("en-IN") : "—"}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (v: string) => <StatusBadge status={v} />,
        },
    ];

    return (
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

            {/* ── Page Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0, letterSpacing: "-0.4px" }}>
                        All Campaigns
                    </h1>
                    <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.04em" }}>
                        MANAGE &amp; TRACK ALL CLIENT CAMPAIGNS
                    </p>
                </div>
            </div>

            {/* ── Stat Cards (clickable filters) ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                <StatCard
                    label="Total Campaigns"
                    value={totalCount}
                    color={C.blue}
                    bg={C.blueLight}
                    icon="📊"
                    active={cardFilter === "all"}
                    onClick={() => setCardFilter("all")}
                />
                <StatCard
                    label="Active Campaigns"
                    value={activeCount}
                    color={C.green}
                    bg={C.greenLight}
                    icon="🟢"
                    active={cardFilter === "active"}
                    onClick={() => setCardFilter(cardFilter === "active" ? "all" : "active")}
                />
                <StatCard
                    label="Closed Campaigns"
                    value={closedCount}
                    color={C.red}
                    bg={C.redLight}
                    icon="🔴"
                    active={cardFilter === "closed"}
                    onClick={() => setCardFilter(cardFilter === "closed" ? "all" : "closed")}
                />
            </div>

            {/* ── Active filter pill ── */}
            {cardFilter !== "all" && (
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: C.slate500 }}>Filtered by:</span>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "3px 12px", borderRadius: 20,
                        background: cardFilter === "active" ? C.greenLight : C.redLight,
                        border: `1px solid ${cardFilter === "active" ? "#BBF7D0" : "#FECACA"}`,
                        fontSize: 11, fontWeight: 700,
                        color: cardFilter === "active" ? C.green : C.red,
                    }}>
                        {cardFilter === "active" ? "🟢 Active Campaigns" : "🔴 Closed Campaigns"}
                        <button
                            onClick={() => setCardFilter("all")}
                            style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: cardFilter === "active" ? C.green : C.red,
                                fontSize: 12, padding: 0, lineHeight: 1,
                            }}
                        >✕</button>
                    </span>
                </div>
            )}

            {/* ── Filters ── */}
            <div style={{
                background: C.white, borderRadius: 12, padding: "14px 18px",
                border: `1px solid ${C.border}`, marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
                <Input
                    placeholder="Search by name, ID, advertiser, company…"
                    prefix={<SearchOutlined style={{ color: C.slate500 }} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    allowClear
                    style={{ flex: 1, minWidth: 240, height: 36 }}
                />
                <Select
                    value={typeFilter}
                    onChange={setTypeFilter}
                    style={{ width: 180, height: 36 }}
                >
                    <Option value="all">All Types</Option>
                    {uniqueTypes.map((t) => (
                        <Option key={t} value={t}>{t}</Option>
                    ))}
                </Select>
                <Button
                    onClick={fetchCampaigns}
                    icon={<ReloadOutlined />}
                    style={{
                        height: 36, borderRadius: 8, border: `1px solid ${C.border}`,
                        background: C.white, color: C.slate500, fontSize: 12, fontWeight: 600,
                    }}
                >
                    Refresh
                </Button>
                <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>
                    {filtered.length} of {campaigns.length} campaigns
                </span>
            </div>

            {/* ── Table ── */}
            <div style={{
                background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
                overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="campaign_id"
                    loading={loading}
                    scroll={{ x: 2100 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"],
                        showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} campaigns`,
                        style: { padding: "12px 16px" },
                    }}
                    expandable={{
                        expandedRowRender: (record: Campaign) => {
                            if (!record.line_items || record.line_items.length === 0) {
                                return (
                                    <span style={{ color: C.slate500, fontSize: 12 }}>
                                        No line items for this campaign.
                                    </span>
                                );
                            }
                            return (
                                <div style={{ padding: "8px 0" }}>
                                    <span style={{
                                        fontSize: 12, fontWeight: 700, color: C.slate,
                                        marginBottom: 8, display: "block",
                                    }}>
                                        Line Items ({record.line_items.length})
                                    </span>
                                    <Table
                                        size="small"
                                        dataSource={record.line_items}
                                        rowKey="line_item_id"
                                        pagination={false}
                                        columns={lineItemColumns}
                                        style={{ background: "#F8FAFC", borderRadius: 8 }}
                                    />
                                </div>
                            );
                        },
                        rowExpandable: () => true,
                    }}
                    rowClassName={(record) =>
                        isClosedCampaign(record)
                            ? "all-campaigns-row all-campaigns-row-closed"
                            : "all-campaigns-row"
                    }
                    style={{ fontSize: 13 }}
                />
            </div>

            {/* ── Toast ── */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* ── Delete Modal ── */}
            {deleteCampaign && (
                <DeleteModal
                    campaign={deleteCampaign}
                    onConfirm={handleDelete}
                    onClose={() => setDeleteCampaign(null)}
                    deleting={deleting}
                />
            )}

            <style>{`
                .all-campaigns-row:hover td { background: #F8FAFC !important; }
                .all-campaigns-row-closed td { opacity: 0.75; }
                .ant-table-thead > tr > th {
                    background: #F1F5F9 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: #64748B !important;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .ant-table-row-expand-icon-cell { background: #F1F5F9; }
            `}</style>
        </div>
    );
}