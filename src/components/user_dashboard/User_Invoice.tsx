import { useEffect, useState, useCallback } from "react";
import { Table, Button, Input, Tag, Tooltip } from "antd";
import {
    SearchOutlined,
    ReloadOutlined,
    FilePdfOutlined,
    DownloadOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
    bg: "#F8FAFC",
    white: "#FFFFFF",
    slate: "#0F172A",
    slate700: "#334155",
    slate500: "#64748B",
    slate300: "#CBD5E1",
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
    purple: "#7C3AED",
    purpleLight: "#F5F3FF",
    purpleMid: "#DDD6FE",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface InvoiceRow {
    campaign_id: string;
    campaign_name: string;
    advertiser: string;
    client_name: string;
    client_id: string;
    start_date: string;
    end_date: string;
    campaign_type: string;
    line_items_count: number;
    invoice_id: string | null;
    pdf_generated: boolean;
    pdf_url: string | null;
    created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({
    message,
    type,
    onClose,
}: {
    message: string;
    type: "success" | "error";
    onClose: () => void;
}) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    const color = type === "success" ? C.green : "#DC2626";
    return (
        <div
            style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                zIndex: 999,
                background: C.white,
                border: `1px solid ${color}55`,
                borderRadius: 12,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                minWidth: 280,
            }}
        >
            <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>
                {message}
            </span>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function User_Invoice() {
    const [rows, setRows] = useState<InvoiceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [generating, setGenerating] = useState<string | null>(null);
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);

    const clientId = localStorage.getItem("client_id");

    const showToast = (message: string, type: "success" | "error" = "success") =>
        setToast({ message, type });

    // ── Fetch list ──────────────────────────────────────────────────────────
    const fetchList = useCallback(() => {
        setLoading(true);
        fetch(`${BASE_URL}/get_invoice_list_by_client/${clientId}/`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then((data) => setRows(Array.isArray(data) ? data : []))
            .catch(() => showToast("Failed to load invoices.", "error"))
            .finally(() => setLoading(false));
    }, [clientId]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    // ── Generate Invoice PDF ────────────────────────────────────────────────
    const handleGenerate = async (campaignId: string) => {
        setGenerating(campaignId);
        try {
            const res = await fetch(
                `${BASE_URL}/generate_invoice_pdf/${campaignId}/`,
                {
                    method: "POST",
                    headers: { "ngrok-skip-browser-warning": "1" },
                }
            );
            if (!res.ok) throw new Error();
            const data = await res.json();

            setRows((prev) =>
                prev.map((r) =>
                    r.campaign_id === campaignId
                        ? {
                              ...r,
                              pdf_generated: true,
                              pdf_url: data.download_url,
                              invoice_id: data.invoice_id,
                          }
                        : r
                )
            );
            showToast(`Invoice PDF generated for ${campaignId}!`);
        } catch {
            showToast("Failed to generate Invoice PDF. Try again.", "error");
        } finally {
            setGenerating(null);
        }
    };

    // ── Download Invoice PDF ────────────────────────────────────────────────
    const handleDownload = (campaignId: string, invoiceId: string) => {
        const a = document.createElement("a");
        a.href = `${BASE_URL}/download_invoice_pdf/${campaignId}/`;
        a.download = `${invoiceId}.pdf`;
        a.click();
    };

    // ── Filter ──────────────────────────────────────────────────────────────
    const filtered = rows.filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [r.campaign_id, r.campaign_name, r.advertiser, r.client_name].some(
            (f) => f?.toLowerCase().includes(q)
        );
    });

    // ── Stats ───────────────────────────────────────────────────────────────
    const totalCount = rows.length;
    const generatedCount = rows.filter((r) => r.pdf_generated).length;
    const pendingCount = totalCount - generatedCount;

    // ── Columns ─────────────────────────────────────────────────────────────
    const columns: ColumnsType<InvoiceRow> = [
        {
            title: "Campaign ID",
            dataIndex: "campaign_id",
            key: "campaign_id",
            width: 150,
            render: (v: string) => (
                <span
                    style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.blue,
                        background: C.blueLight,
                        padding: "3px 8px",
                        borderRadius: 6,
                    }}
                >
                    {v}
                </span>
            ),
        },
        {
            title: "Invoice #",
            dataIndex: "invoice_id",
            key: "invoice_id",
            width: 130,
            render: (v: string | null) =>
                v ? (
                    <span
                        style={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            fontWeight: 700,
                            color: C.purple,
                            background: C.purpleLight,
                            padding: "3px 7px",
                            borderRadius: 5,
                            border: `1px solid ${C.purpleMid}`,
                        }}
                    >
                        {v}
                    </span>
                ) : (
                    <span style={{ color: C.slate300, fontSize: 12 }}>—</span>
                ),
        },
        {
            title: "Campaign Name",
            dataIndex: "campaign_name",
            key: "campaign_name",
            width: 240,
            render: (v: string, record: InvoiceRow) => (
                <div>
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.slate,
                            marginBottom: 4,
                        }}
                    >
                        {v || "—"}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            flexWrap: "wrap",
                        }}
                    >
                        {record.campaign_type && (
                            <Tag
                                color="blue"
                                style={{ fontSize: 10, margin: 0, lineHeight: "18px" }}
                            >
                                {record.campaign_type}
                            </Tag>
                        )}
                        <Tag
                            color="purple"
                            style={{ fontSize: 10, margin: 0, lineHeight: "18px" }}
                        >
                            {record.line_items_count} line item
                            {record.line_items_count !== 1 ? "s" : ""}
                        </Tag>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: 10,
                                fontWeight: 700,
                                color: C.green,
                                background: C.greenLight,
                                padding: "1px 6px",
                                borderRadius: 4,
                                border: "1px solid #BBF7D0",
                            }}
                        >
                            <CheckCircleOutlined style={{ fontSize: 9 }} />
                            Approved
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
            render: (v: string, record: InvoiceRow) => (
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.slate }}>
                        {v || record.client_name || "—"}
                    </div>
                    <div
                        style={{
                            fontSize: 10,
                            color: C.slate500,
                            fontFamily: "monospace",
                        }}
                    >
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
            title: "PDF Status",
            dataIndex: "pdf_generated",
            key: "pdf_generated",
            width: 140,
            render: (generated: boolean, record: InvoiceRow) =>
                generated ? (
                    <Tooltip title={`Invoice: ${record.invoice_id ?? "—"}`}>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "3px 10px",
                                borderRadius: 20,
                                background: C.greenLight,
                                border: `1px solid ${C.greenMid}`,
                                fontSize: 11,
                                fontWeight: 700,
                                color: C.green,
                            }}
                        >
                            <CheckCircleOutlined style={{ fontSize: 11 }} /> Generated
                        </span>
                    </Tooltip>
                ) : (
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 10px",
                            borderRadius: 20,
                            background: C.amberLight,
                            border: "1px solid #FDE68A",
                            fontSize: 11,
                            fontWeight: 700,
                            color: C.amber,
                        }}
                    >
                        <ClockCircleOutlined style={{ fontSize: 11 }} /> Pending
                    </span>
                ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 210,
            fixed: "right",
            render: (_: any, record: InvoiceRow) => {
                const isGenerating = generating === record.campaign_id;
                return (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {/* Generate / Re-generate */}
                        <Button
                            size="small"
                            icon={<FilePdfOutlined />}
                            loading={isGenerating}
                            onClick={() => handleGenerate(record.campaign_id)}
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                height: 30,
                                background: record.pdf_generated
                                    ? C.purpleLight
                                    : C.greenLight,
                                color: record.pdf_generated ? C.purple : C.green,
                                border: `1px solid ${
                                    record.pdf_generated ? C.purpleMid : C.greenMid
                                }`,
                                borderRadius: 6,
                            }}
                        >
                            {record.pdf_generated ? "Re-generate" : "Generate"}
                        </Button>

                        {/* Download — only if generated */}
                        {record.pdf_generated && (
                            <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() =>
                                    handleDownload(
                                        record.campaign_id,
                                        record.invoice_id ?? record.campaign_id
                                    )
                                }
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    height: 30,
                                    background: C.blueLight,
                                    color: C.blue,
                                    border: `1px solid ${C.blueMid}`,
                                    borderRadius: 6,
                                }}
                            >
                                Download
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <>
            {/* Page Header */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: C.slate }}>
                    Invoices
                </h1>
                <p
                    style={{
                        fontSize: 11,
                        color: C.slate500,
                        marginTop: 1,
                        letterSpacing: "0.04em",
                        fontWeight: 500,
                    }}
                >
                    GENERATE &amp; DOWNLOAD TAX INVOICES FOR YOUR CAMPAIGNS
                </p>
            </div>

            {/* Stat Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 14,
                    marginBottom: 20,
                }}
            >
                {[
                    {
                        label: "Total Invoices",
                        value: totalCount,
                        color: C.purple,
                        bg: C.purpleLight,
                        icon: "🧾",
                    },
                    {
                        label: "PDF Generated",
                        value: generatedCount,
                        color: C.green,
                        bg: C.greenLight,
                        icon: "✅",
                    },
                    {
                        label: "Pending",
                        value: pendingCount,
                        color: C.amber,
                        bg: C.amberLight,
                        icon: "⏳",
                    },
                ].map((card) => (
                    <div
                        key={card.label}
                        style={{
                            background: C.white,
                            borderRadius: 14,
                            padding: 20,
                            border: `1px solid ${C.border}`,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 12,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 11,
                                    color: card.color,
                                    fontWeight: 700,
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                }}
                            >
                                {card.label}
                            </span>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 9,
                                    background: card.bg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 16,
                                }}
                            >
                                {card.icon}
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: 32,
                                fontWeight: 800,
                                color: card.color,
                                letterSpacing: "-1px",
                                lineHeight: 1,
                            }}
                        >
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Refresh */}
            <div
                style={{
                    background: C.white,
                    borderRadius: 12,
                    padding: "14px 18px",
                    border: `1px solid ${C.border}`,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                }}
            >
                <Input
                    placeholder="Search by campaign ID, name, advertiser…"
                    prefix={<SearchOutlined style={{ color: C.slate500 }} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    allowClear
                    style={{ flex: 1, minWidth: 240, height: 36 }}
                />
                <Button
                    onClick={fetchList}
                    icon={<ReloadOutlined />}
                    style={{
                        height: 36,
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.white,
                        color: C.slate500,
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    Refresh
                </Button>
                <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>
                    {filtered.length} of {rows.length} Invoices
                </span>
            </div>

            {/* Info Banner */}
            <div
                style={{
                    background: C.amberLight,
                    border: "1px solid #FDE68A",
                    borderRadius: 10,
                    padding: "10px 16px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 12.5,
                    color: C.amber,
                    fontWeight: 500,
                }}
            >
                <DollarOutlined style={{ fontSize: 16 }} />
                Invoices are available only for campaigns whose end date has passed. Click{" "}
                <strong style={{ margin: "0 3px" }}>Generate</strong> to create the
                PDF, then <strong style={{ margin: "0 3px" }}>Download</strong> to
                save it.
            </div>

            {/* Table */}
            <div
                style={{
                    background: C.white,
                    borderRadius: 14,
                    border: `1px solid ${C.border}`,
                    overflow: "hidden",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
            >
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="campaign_id"
                    loading={loading}
                    scroll={{ x: 1350 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"],
                        showTotal: (total, range) =>
                            `${range[0]}–${range[1]} of ${total} invoices`,
                        style: { padding: "12px 16px" },
                    }}
                    style={{ fontSize: 13 }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: "32px 0", textAlign: "center" }}>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: C.slate,
                                        marginBottom: 4,
                                    }}
                                >
                                    No invoices yet
                                </div>
                                <div style={{ fontSize: 12, color: C.slate500 }}>
                                    Invoices appear here once your campaign's end date has passed.
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