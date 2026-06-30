import { useEffect, useState, useCallback } from "react";
import { Table, Button, Input, Tag } from "antd";
import {
    SearchOutlined,
    ReloadOutlined,
    DownloadOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const C = {
    bg: "#F8FAFC", white: "#FFFFFF", slate: "#0F172A",
    slate500: "#64748B", slate300: "#CBD5E1", border: "#E2E8F0", slate100: "#F1F5F9",
    blue: "#2563EB", blueLight: "#EFF6FF", blueMid: "#BFDBFE",
    green: "#16A34A", greenLight: "#F0FDF4", greenMid: "#86EFAC",
    amber: "#D97706", amberLight: "#FFFBEB",
    purple: "#7C3AED", purpleLight: "#F5F3FF", purpleMid: "#DDD6FE",
};

interface MonthInvoice {
    invoice_id: string;
    invoice_from: string;
    invoice_to: string;
    pdf_generated: boolean;
    pdf_url: string | null;
}

interface CampaignRow {
    campaign_id: string;
    campaign_name: string;
    advertiser: string;
    client_name: string;
    client_id: string;
    start_date: string;
    end_date: string;
    campaign_type: string;
    line_items_count: number;
    invoices: MonthInvoice[];
    all_generated: boolean;
    created_at: string;
}

function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

function Toast({ message, type, onClose }: {
    message: string; type: "success" | "error"; onClose: () => void;
}) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 999,
            background: C.white,
            border: `1px solid ${type === "success" ? C.green : "#DC2626"}55`,
            borderRadius: 12, padding: "14px 20px", display: "flex",
            alignItems: "center", gap: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 280,
        }}>
            <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{message}</span>
        </div>
    );
}

export default function User_Invoices() {
    const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // ── Get client_id from localStorage (set during login)
    const clientId = localStorage.getItem("client_id");

    const showToast = (message: string, type: "success" | "error" = "success") =>
        setToast({ message, type });

    // ── Fetch campaigns + invoices for this client ──
    const fetchCampaigns = useCallback(() => {
        if (!clientId) return;
        setLoading(true);
        fetch(`${BASE_URL}/get_invoice_list_by_client/${clientId}/`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then(r => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then(data => setCampaigns(Array.isArray(data) ? data : []))
            .catch(() => showToast("Failed to load invoices.", "error"))
            .finally(() => setLoading(false));
    }, [clientId]);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    // ── Download single invoice ──
    const handleDownload = (invoiceId: string) => {
        const a = document.createElement("a");
        a.href = `${BASE_URL}/download_invoice_pdf/${invoiceId}/`;
        a.download = `${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`Downloading ${invoiceId}.pdf`);
    };

    // ── Download all invoices for a campaign ──
    const handleDownloadAll = (record: CampaignRow) => {
        const generated = record.invoices.filter(inv => inv.pdf_generated);
        generated.forEach((inv, index) => {
            setTimeout(() => {
                const a = document.createElement("a");
                a.href = `${BASE_URL}/download_invoice_pdf/${inv.invoice_id}/`;
                a.download = `${inv.invoice_id}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }, index * 800);
        });
        showToast(`Downloading ${generated.length} invoice(s) for ${record.campaign_name}`);
    };

    // ── Filter ──
    const filtered = campaigns.filter(c => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [c.campaign_id, c.campaign_name, c.advertiser].some(
            f => f?.toLowerCase().includes(q)
        );
    });

    // ── Stats ──
    const totalCampaigns = campaigns.length;
    const totalInvoices = campaigns.reduce((sum, c) => sum + c.invoices.length, 0);
    const generatedInvoices = campaigns.reduce(
        (sum, c) => sum + c.invoices.filter(i => i.pdf_generated).length, 0
    );

    // ── Expandable row: month-wise invoices ──
    const expandedRowRender = (record: CampaignRow) => {
        if (record.invoices.length === 0) {
            return (
                <div style={{
                    padding: "14px 18px", color: C.slate500, fontSize: 12,
                    fontStyle: "italic",
                }}>
                    No invoices generated yet for this campaign.
                </div>
            );
        }

        return (
            <div style={{ padding: "10px 18px 14px" }}>
                <div style={{
                    fontSize: 11, fontWeight: 700, color: C.slate500,
                    marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                    Month-wise Invoices
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {record.invoices.map(inv => (
                        <div key={inv.invoice_id} style={{
                            display: "flex", alignItems: "center", gap: 14,
                            background: C.white, borderRadius: 10, padding: "10px 16px",
                            border: `1px solid ${C.border}`,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}>
                            {/* Invoice ID */}
                            <span style={{
                                color: C.purple, background: C.purpleLight,
                                padding: "3px 9px", borderRadius: 6,
                                border: `1px solid ${C.purpleMid}`,
                                minWidth: 100, textAlign: "center",
                            }}>
                                {inv.invoice_id}
                            </span>

                            {/* Date range */}
                            <span style={{ fontSize: 12, color: C.slate, fontWeight: 500 }}>
                                {fmtDate(inv.invoice_from)} → {fmtDate(inv.invoice_to)}
                            </span>

                            {/* Status badge */}
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                fontSize: 11, fontWeight: 700,
                                color: inv.pdf_generated ? C.green : C.amber,
                                background: inv.pdf_generated ? C.greenLight : C.amberLight,
                                padding: "3px 10px", borderRadius: 20,
                                border: `1px solid ${inv.pdf_generated ? C.greenMid : "#FDE68A"}`,
                            }}>
                                {inv.pdf_generated
                                    ? <><CheckCircleOutlined style={{ fontSize: 10 }} /> Ready</>
                                    : <><ClockCircleOutlined style={{ fontSize: 10 }} /> Pending</>
                                }
                            </span>

                            {/* Download button — only if generated */}
                            <div style={{ marginLeft: "auto" }}>
                                {inv.pdf_generated ? (
                                    <Button
                                        size="small"
                                        icon={<DownloadOutlined />}
                                        onClick={() => handleDownload(inv.invoice_id)}
                                        style={{
                                            fontSize: 11, fontWeight: 600, height: 28,
                                            background: C.blueLight, color: C.blue,
                                            border: `1px solid ${C.blueMid}`, borderRadius: 6,
                                        }}
                                    >
                                        Download
                                    </Button>
                                ) : (
                                    <Button
                                        size="small"
                                        icon={<DownloadOutlined />}
                                        disabled
                                        style={{
                                            fontSize: 11, fontWeight: 600, height: 28,
                                            borderRadius: 6,
                                        }}
                                    >
                                        Download
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ── Table columns ──
    const columns: ColumnsType<CampaignRow> = [
        {
            title: "Campaign ID",
            dataIndex: "campaign_id",
            key: "campaign_id",
            width: 140,
            render: (v: string) => (
                <span style={{
                   fontSize: 12, fontWeight: 700,
                    color: C.blue, background: C.blueLight,
                    padding: "3px 8px", borderRadius: 6,
                }}>{v}</span>
            ),
        },
        {
            title: "Campaign Name",
            dataIndex: "campaign_name",
            key: "campaign_name",
            width: 230,
            render: (v: string, record: CampaignRow) => (
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.slate, marginBottom: 4 }}>
                        {v || "—"}
                    </div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {record.campaign_type && (
                            <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                                {record.campaign_type}
                            </Tag>
                        )}
                        <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>
                            {record.line_items_count} line item{record.line_items_count !== 1 ? "s" : ""}
                        </Tag>
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            fontSize: 10, fontWeight: 700, color: C.green,
                            background: C.greenLight, padding: "1px 6px",
                            borderRadius: 4, border: "1px solid #BBF7D0",
                        }}>
                            <CheckCircleOutlined style={{ fontSize: 9 }} /> Approved
                        </span>
                    </div>
                </div>
            ),
        },
        {
            title: "Advertiser",
            dataIndex: "advertiser",
            key: "advertiser",
            width: 160,
            render: (v: string, record: CampaignRow) => (
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.slate }}>
                        {v || record.client_name || "—"}
                    </div>
                    <div style={{ fontSize: 10, color: C.slate500, }}>
                        {record.client_id}
                    </div>
                </div>
            ),
        },
        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",
            width: 120,
            render: (v: string) => (
                <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>
            ),
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            width: 120,
            render: (v: string) => (
                <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>
            ),
        },
        {
            title: "Invoices",
            key: "invoices",
            width: 130,
            render: (_: any, record: CampaignRow) => (
                <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.slate }}>
                        {record.invoices.length} invoice{record.invoices.length !== 1 ? "s" : ""}
                    </div>
                    <div style={{
                        fontSize: 10, fontWeight: 600,
                        color: record.all_generated ? C.green : record.invoices.length > 0 ? C.amber : C.slate300,
                    }}>
                        {record.all_generated
                            ? "✅ All Generated"
                            : record.invoices.length > 0
                                ? "⚠️ Partial"
                                : "⏳ Pending"}
                    </div>
                </div>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 140,
            fixed: "right" as const,
            render: (_: any, record: CampaignRow) => {
                const hasGenerated = record.invoices.some(i => i.pdf_generated);
                return (
                    <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        disabled={!hasGenerated}
                        onClick={() => handleDownloadAll(record)}
                        style={{
                            fontSize: 11, fontWeight: 600, height: 30,
                            background: hasGenerated ? C.blueLight : C.slate100,
                            color: hasGenerated ? C.blue : C.slate300,
                            border: `1px solid ${hasGenerated ? C.blueMid : C.slate300}`,
                            borderRadius: 6,
                            cursor: hasGenerated ? "pointer" : "not-allowed",
                        }}
                    >
                        Download All
                    </Button>
                );
            },
        },
    ];

    return (
        <>
            {/* Page Header */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: C.slate }}>My Invoices</h1>
                <p style={{
                    fontSize: 11, color: C.slate500, marginTop: 1,
                    fontWeight: 500, letterSpacing: "0.04em",
                }}>
                    VIEW & DOWNLOAD YOUR TAX INVOICES
                </p>
            </div>

            {/* Stat Cards */}
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 14, marginBottom: 20,
            }}>
                {[
                    {
                        label: "Total Campaigns",
                        value: totalCampaigns,
                        color: C.purple, bg: C.purpleLight, icon: "📋",
                    },
                    {
                        label: "Total Invoices",
                        value: totalInvoices,
                        color: C.blue, bg: C.blueLight, icon: "🧾",
                    },
                    {
                        label: "Ready to Download",
                        value: generatedInvoices,
                        color: C.green, bg: C.greenLight, icon: "✅",
                    },
                ].map(card => (
                    <div key={card.label} style={{
                        background: C.white, borderRadius: 14, padding: 20,
                        border: `1px solid ${C.border}`,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}>
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "flex-start", marginBottom: 12,
                        }}>
                            <span style={{
                                fontSize: 11, color: card.color, fontWeight: 700,
                                textTransform: "uppercase", letterSpacing: "0.04em",
                            }}>
                                {card.label}
                            </span>
                            <div style={{
                                width: 36, height: 36, borderRadius: 9, background: card.bg,
                                display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 16,
                            }}>
                                {card.icon}
                            </div>
                        </div>
                        <div style={{
                            fontSize: 32, fontWeight: 800, color: card.color,
                            letterSpacing: "-1px", lineHeight: 1,
                        }}>
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Refresh */}
            <div style={{
                background: C.white, borderRadius: 12, padding: "14px 18px",
                border: `1px solid ${C.border}`, marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
                <Input
                    placeholder="Search by campaign ID, name, advertiser…"
                    prefix={<SearchOutlined style={{ color: C.slate500 }} />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    allowClear
                    style={{ flex: 1, minWidth: 240, height: 36 }}
                />
                <Button
                    onClick={fetchCampaigns}
                    icon={<ReloadOutlined />}
                    style={{
                        height: 36, borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.white, color: C.slate500, fontSize: 12, fontWeight: 600,
                    }}
                >
                    Refresh
                </Button>
                <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>
                    {filtered.length} of {campaigns.length} campaigns
                </span>
            </div>

            {/* Info Banner */}
            <div style={{
                background: C.blueLight, border: `1px solid ${C.blueMid}`,
                borderRadius: 10, padding: "10px 16px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 12.5, color: C.blue, fontWeight: 500,
            }}>
                🧾 Click the <strong style={{ margin: "0 3px" }}>+</strong> to expand a campaign
                and see month-wise invoices. Click
                <strong style={{ margin: "0 3px" }}>Download All</strong> to download
                all invoices for that campaign at once.
            </div>

            {/* Campaign Table */}
            <div style={{
                background: C.white, borderRadius: 14,
                border: `1px solid ${C.border}`, overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="campaign_id"
                    loading={loading}
                    expandable={{ expandedRowRender }}
                    scroll={{ x: 1050 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"],
                        showTotal: (total, range) =>
                            `${range[0]}–${range[1]} of ${total} campaigns`,
                        style: { padding: "12px 16px" },
                    }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: "40px 0", textAlign: "center" }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
                                <div style={{
                                    fontSize: 14, fontWeight: 600,
                                    color: C.slate, marginBottom: 4,
                                }}>
                                    No invoices yet
                                </div>
                                <div style={{ fontSize: 12, color: C.slate500 }}>
                                    Your invoices will appear here once they are generated.
                                </div>
                            </div>
                        ),
                    }}
                />
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

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