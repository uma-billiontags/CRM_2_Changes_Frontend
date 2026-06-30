import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Tag, Button, Input, Select } from "antd";
import { SearchOutlined, ReloadOutlined, EyeOutlined, CopyOutlined, CheckOutlined, MessageOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import TeamMember_General_Chat from "../creatives_team_dashboard/TeamMember_General_Chat";
import Creative_Team_Chat from '../creatives_team_dashboard/Internal_Team_Campaign_Chat';

const BASE_URL = import.meta.env.VITE_BASE_URL;

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

// ── Types ─────────────────────────────────────────────────────────────────────
interface LineItem {
    line_item_id: string;
    line_item_name: string;
    start_date: string;
    end_date: string;
    ad_format: string | string[];
    impressions?: string;
    units?: string;
    unit_cost?: string;
    ctr?: string;
    viewability?: string;
    vcr?: string;
    status?: string;
    ethnicity?: string | string[];
    creatives?: { creative_id?: string }[];
    third_party_creatives?: { creative_id?: string }[];
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
    approval_status?: string;
    notes?: string;
    geo_targeting?: any[];
    platforms?: string;
    brand_safety?: string;
    frequency_cap?: string;
    age?: string;
    gender?: string;
    website_url?: string;
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

function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
                    <span style={{ fontWeight: 700, color: C.blue }}>
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

function CreativeIdCell({ id }: { id: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
                fontSize: 10, fontWeight: 700,
                color: '#4f46e5', background: '#eef2ff',
                padding: '2px 8px', borderRadius: 4,
                border: '1px solid #c7d2fe',
            }}>{id}</span>
            <button
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy Creative ID'}
                style={{
                    background: copied ? '#f0fdf4' : '#f8fafc',
                    border: `1px solid ${copied ? '#86efac' : '#e2e8f0'}`,
                    borderRadius: 4, cursor: 'pointer', padding: '2px 5px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', outline: 'none',
                }}
            >
                {copied
                    ? <CheckOutlined style={{ fontSize: 10, color: '#16a34a' }} />
                    : <CopyOutlined style={{ fontSize: 10, color: '#64748B' }} />}
            </button>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Campaign_Dashboard() {
    const navigate = useNavigate();

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [cardFilter, setCardFilter] = useState<"all" | "active" | "closed">("all");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [chatCampaign, setChatCampaign] = useState<Campaign | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") =>
        setToast({ message, type });

    const fetchCampaigns = useCallback(() => {
        setLoading(true);
        fetch(`${BASE_URL}/get_campaigns/`, {
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

    const totalCount = campaigns.length;
    const activeCount = campaigns.filter(isActiveCampaign).length;
    const closedCount = campaigns.filter(isClosedCampaign).length;

    const handleDelete = async () => {
        if (!deleteCampaign) return;
        setDeleting(true);
        try {
            const res = await fetch(
                `${BASE_URL}/delete_campaign/${deleteCampaign.campaign_id}/`,
                { method: "DELETE", headers: { "ngrok-skip-browser-warning": "1" } }
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

    const filtered = campaigns.filter((c) => {
        if (cardFilter === "active" && !isActiveCampaign(c)) return false;
        if (cardFilter === "closed" && !isClosedCampaign(c)) return false;
        if (typeFilter !== "all" && c.campaign_type !== typeFilter) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            const match = [c.campaign_name, c.campaign_id, c.client_campaign_ID, c.client_name, c.advertiser]
                .some((f) => f?.toLowerCase().includes(q));
            if (!match) return false;
        }
        return true;
    });

    const uniqueTypes = [...new Set(campaigns.map((c) => c.campaign_type).filter(Boolean))] as string[];

    // ── Line Item sub-table columns (NO creatives) ────────────────────────────
    const lineItemColumns: ColumnsType<LineItem> = [
        {
            title: "Line Item ID",
            dataIndex: "line_item_id",
            key: "line_item_id",
            render: (v: string) => (
                <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: C.purple, background: C.purpleLight,
                    padding: "2px 6px", borderRadius: 4,
                }}>{v}</span>
            ),
        },
        {
            title: "Name",
            dataIndex: "line_item_name",
            key: "line_item_name",
            render: (v: string) => <span style={{ fontSize: 12, fontWeight: 600, color: C.slate }}>{v || "—"}</span>,
        },
        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>,
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>,
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
            title: "Ethnicity",
            dataIndex: "ethnicity",
            key: "ethnicity",
            render: (v: string | string[]) => {
                const arr = Array.isArray(v) ? v : (v ? [v] : []);
                return arr.length > 0
                    ? <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {arr.map((e: string) => <Tag key={e} style={{ fontSize: 10 }}>{e}</Tag>)}
                    </div>
                    : <span style={{ color: C.slate500, fontSize: 12 }}>—</span>;
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
            title: "Units",
            dataIndex: "units",
            key: "units",
            render: (v: string) => v
                ? <Tag color="geekblue" style={{ fontSize: 10 }}>{v}</Tag>
                : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "Unit Cost",
            dataIndex: "unit_cost",
            key: "unit_cost",
            render: (v: string) => v
                ? <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{v}</span>
                : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "CTR",
            dataIndex: "ctr",
            key: "ctr",
            render: (v: string) => v ? <span style={{ fontSize: 12 }}>{v}%</span> : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "Viewability",
            dataIndex: "viewability",
            key: "viewability",
            render: (v: string) => v ? <span style={{ fontSize: 12 }}>{v}%</span> : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "VCR",
            dataIndex: "vcr",
            key: "vcr",
            render: (v: string) => v ? <span style={{ fontSize: 12 }}>{v}%</span> : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "Creative ID",
            key: "creatives",
            width: 100,
            render: (_: any, record: LineItem) => {
                const allCreatives = [
                    ...(record.creatives ?? []),
                    ...(record.third_party_creatives ?? []),
                ];

                const ids = allCreatives
                    .map((c: any) => c.creative_id)
                    .filter(Boolean);

                if (ids.length === 0) {
                    return <span style={{ color: C.slate400, fontSize: 11 }}>—</span>;
                }

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {ids.map((id: string, i: number) => (
                            <CreativeIdCell key={i} id={id} />
                        ))}

                    </div>
                );
            },
        },
    ];

    // ── Main campaign table columns ───────────────────────────────────────────
    const columns: ColumnsType<Campaign> = [
        {
            title: "Campaign ID", dataIndex: "campaign_id", key: "campaign_id", width: 140, fixed: "left",
            render: (id: string | null) => id ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: C.blue, background: C.blueLight, padding: "3px 8px", borderRadius: 6,}}>
                    {id}
                </span>
            ) : (
                <span style={{ fontSize: 11, fontWeight: 600, color: C.amber, background: C.amberLight, padding: "3px 8px", borderRadius: 6, border: `1px dashed #FDE68A` }}>
                    Pending Approval
                </span>
            ),
        },
        {
            title: "Client Campaign ID", dataIndex: "client_campaign_ID", key: "client_campaign_ID", width: 160,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>,
        },
        {
            title: "Purchase Order ID", dataIndex: "purchase_order_ID", key: "purchase_order_ID", width: 160,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>,
        },
        {
            title: "Campaign Name", dataIndex: "campaign_name", key: "campaign_name", width: 200,
            render: (name: string) => <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{name || "—"}</span>,
        },
        {
            title: "Advertiser", dataIndex: "advertiser", key: "advertiser", width: 160,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>,
        },
        {
            title: "Company", dataIndex: "client_name", key: "client_name", width: 160,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>,
        },
        {
            title: "Type", dataIndex: "campaign_type", key: "campaign_type", width: 150,
            render: (v: string) => v
                ? <Tag color="blue" style={{ fontSize: 11 }}>{v}</Tag>
                : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "Objective", dataIndex: "objective", key: "objective", width: 180,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>,
        },
        {
            title: "Buying Type", dataIndex: "buying_type", key: "buying_type", width: 180,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>,
        },
        {
            title: "Start Date", dataIndex: "start_date", key: "start_date", width: 130,
            render: (v: string) => v
                ? <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>
                : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "End Date", dataIndex: "end_date", key: "end_date", width: 130,
            render: (v: string) => v
                ? <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>
                : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "Campaign State", key: "campaign_state", width: 140,
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
            title: "Approval Status", dataIndex: "approval_status", key: "approval_status", width: 140,
            render: (v: string) => {
                const style =
                    v === "approved"
                        ? { color: C.green, bg: C.greenLight, border: "#BBF7D0" }
                        : v === "rejected"
                            ? { color: C.red, bg: C.redLight, border: "#FECACA" }
                            : { color: C.amber, bg: C.amberLight, border: "#FDE68A" };
                return (
                    <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.06em", color: style.color,
                        background: style.bg, border: `1px solid ${style.border}`,
                        padding: "3px 10px", borderRadius: 20,
                    }}>
                        {v || "pending"}
                    </span>
                );
            },
        },
        {
            title: "Line Items", key: "line_items", width: 100,
            render: (_: any, record: Campaign) => (
                <Tag color="purple" style={{ fontSize: 11 }}>
                    {record.line_items?.length ?? 0} item{(record.line_items?.length ?? 0) !== 1 ? "s" : ""}
                </Tag>
            ),
        },
        {
            title: "Created", dataIndex: "created_at", key: "created_at", width: 130,
            render: (v: string) => v
                ? <span style={{ fontSize: 12, color: C.slate500 }}>{fmtDate(v)}</span>
                : <span style={{ color: C.slate500 }}>—</span>,
        },
        {
            title: "Actions", key: "actions", width: 150, fixed: "right",
            render: (_: any, record: Campaign) => (
                <div style={{ display: "flex", gap: 6 }}>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/campaign_view_team/${record.campaign_id}`)}
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
                        icon={<MessageOutlined />}
                        onClick={() =>
                            setChatCampaign(prev => (prev?.campaign_id === record.campaign_id ? null : record))
                        }
                        style={{
                            fontSize: 11, fontWeight: 600,
                            color: chatCampaign?.campaign_id === record.campaign_id ? "#fff" : C.purple,
                            background: chatCampaign?.campaign_id === record.campaign_id ? C.purple : C.purpleLight,
                            border: `1px solid ${C.purpleMid}`, borderRadius: 6,
                        }}
                    >
                        Chat
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            {/* Page heading */}
            <div style={{ marginBottom: 20 }}>
                <h1
                    style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", }}>
                    Campaign Dashboard
                </h1>
                <p
                    style={{ fontSize: 11, color: "#64748B", marginTop: 1, letterSpacing: "0.04em", fontWeight: 500, }}
                >
                    MANAGE &amp; TRACK ALL CLIENT CAMPAIGNS
                </p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                <StatCard label="Total Campaigns" value={totalCount} color={C.blue} bg={C.blueLight} icon="📊" active={cardFilter === "all"} onClick={() => setCardFilter("all")} />
                <StatCard label="Active Campaigns" value={activeCount} color={C.green} bg={C.greenLight} icon="🟢" active={cardFilter === "active"} onClick={() => setCardFilter(cardFilter === "active" ? "all" : "active")} />
                <StatCard label="Closed Campaigns" value={closedCount} color={C.red} bg={C.redLight} icon="🔴" active={cardFilter === "closed"} onClick={() => setCardFilter(cardFilter === "closed" ? "all" : "closed")} />
            </div>

            {/* Active filter pill */}
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
                        <button onClick={() => setCardFilter("all")} style={{ background: "none", border: "none", cursor: "pointer", color: cardFilter === "active" ? C.green : C.red, fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
                    </span>
                </div>
            )}

            {/* Filters */}
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
                <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 180, height: 36 }}>
                    <Option value="all">All Types</Option>
                    {uniqueTypes.map((t) => <Option key={t} value={t}>{t}</Option>)}
                </Select>
                <Button
                    onClick={fetchCampaigns}
                    icon={<ReloadOutlined />}
                    style={{ height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.slate500, fontSize: 12, fontWeight: 600 }}
                >
                    Refresh
                </Button>
                <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>
                    {filtered.length} of {campaigns.length} campaigns
                </span>
            </div>

            {/* Table */}
            <div style={{
                background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
                overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="campaign_id"
                    loading={loading}
                    scroll={{ x: 2200 }}
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
                                return <span style={{ color: C.slate500, fontSize: 12 }}>No line items for this campaign.</span>;
                            }
                            return (
                                <div style={{ padding: "8px 0" }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: C.slate, marginBottom: 8, display: "block" }}>
                                        Line Items ({record.line_items.length})
                                    </span>
                                    <Table
                                        size="small"
                                        dataSource={record.line_items}
                                        rowKey="line_item_id"
                                        pagination={false}
                                        columns={lineItemColumns}
                                        scroll={{ x: 1200 }}
                                        style={{ background: "#F8FAFC", borderRadius: 8 }}
                                    />
                                </div>
                            );
                        },
                        rowExpandable: () => true,
                    }}
                    rowClassName={(record) =>
                        isClosedCampaign(record)
                            ? "campaign-dashboard-row campaign-dashboard-row-closed"
                            : "campaign-dashboard-row"
                    }
                    style={{ fontSize: 13 }}
                />
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Delete Modal */}
            {deleteCampaign && (
                <DeleteModal
                    campaign={deleteCampaign}
                    onConfirm={handleDelete}
                    onClose={() => setDeleteCampaign(null)}
                    deleting={deleting}
                />
            )}

            <style>{`
                .campaign-dashboard-row:hover td { background: #F8FAFC !important; }
                .campaign-dashboard-row-closed td { opacity: 0.75; }
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
            <TeamMember_General_Chat />
            {chatCampaign && (
                <Creative_Team_Chat
                    campaign={chatCampaign}
                    teamType="campaign_team"
                    onClose={() => setChatCampaign(null)}
                />
            )}
        </>
    );
}