import { useEffect, useState, useCallback } from "react";
import { Table, Button, Input, Tag, Select, Checkbox } from "antd";
import {
    SearchOutlined,
    ReloadOutlined,
    FilePdfOutlined,
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

interface ClientOption {
    client_id: string;
    name: string;
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
            background: C.white, border: `1px solid ${type === "success" ? C.green : "#DC2626"}55`,
            borderRadius: 12, padding: "14px 20px", display: "flex",
            alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 280,
        }}>
            <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{message}</span>
        </div>
    );
}

export default function All_Invoices() {
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") =>
        setToast({ message, type });

    // ── Fetch all clients for dropdown ──
    useEffect(() => {
        fetch(`${BASE_URL}/get_all_clients/`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then(r => r.json())
            .then(data => setClients(Array.isArray(data) ? data : []))
            .catch(() => showToast("Failed to load clients.", "error"));
    }, []);

    // ── Fetch campaigns when client selected ──
    const fetchCampaigns = useCallback((clientId: string) => {
        setLoading(true);
        setCampaigns([]);
        setSelectedCampaignIds([]);
        fetch(`${BASE_URL}/get_invoice_list_by_client/${clientId}/`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then(r => r.json())
            .then(data => setCampaigns(Array.isArray(data) ? data : []))
            .catch(() => showToast("Failed to load campaigns.", "error"))
            .finally(() => setLoading(false));
    }, []);

    const handleClientChange = (clientId: string) => {
        setSelectedClientId(clientId);
        fetchCampaigns(clientId);
    };

    // ── Toggle campaign selection ──
    const toggleCampaign = (campaignId: string) => {
        setSelectedCampaignIds(prev =>
            prev.includes(campaignId)
                ? prev.filter(id => id !== campaignId)
                : [...prev, campaignId]
        );
    };

    const toggleSelectAll = () => {
        const notGenerated = campaigns.filter(c => !c.all_generated).map(c => c.campaign_id);
        if (selectedCampaignIds.length === notGenerated.length) {
            setSelectedCampaignIds([]);
        } else {
            setSelectedCampaignIds(notGenerated);
        }
    };

    // ── Generate invoices for selected campaigns ──
    const handleGenerate = async () => {
        if (selectedCampaignIds.length === 0) {
            showToast("Please select at least one campaign.", "error");
            return;
        }
        setGenerating(true);
        let successCount = 0;
        let failCount = 0;

        for (const campaignId of selectedCampaignIds) {
            try {
                const res = await fetch(`${BASE_URL}/generate_invoice_pdf/${campaignId}/`, {
                    method: "POST",
                    headers: { "ngrok-skip-browser-warning": "1" },
                });
                if (!res.ok) throw new Error();
                successCount++;
            } catch {
                failCount++;
            }
        }

        if (successCount > 0) showToast(`${successCount} campaign(s) invoiced successfully!`);
        if (failCount > 0) showToast(`${failCount} campaign(s) failed.`, "error");

        setGenerating(false);
        setSelectedCampaignIds([]);
        if (selectedClientId) fetchCampaigns(selectedClientId);
    };

    const handleDownload = (invoiceId: string) => {
        const a = document.createElement("a");
        a.href = `${BASE_URL}/download_invoice_pdf/${invoiceId}/`;
        a.download = `${invoiceId}.pdf`;
        a.click();
    };

    const filtered = campaigns.filter(c => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [c.campaign_id, c.campaign_name, c.advertiser].some(f => f?.toLowerCase().includes(q));
    });

    const notGeneratedCampaigns = campaigns.filter(c => !c.all_generated);
    const totalCount = campaigns.length;
    const generatedCount = campaigns.filter(c => c.all_generated).length;
    const pendingCount = totalCount - generatedCount;

    // ── Expandable row: shows month-wise invoices ──
    const expandedRowRender = (record: CampaignRow) => {
        if (record.invoices.length === 0) {
            return (
                <div style={{ padding: "12px 16px", color: C.slate500, fontSize: 12 }}>
                    No invoices generated yet. Select this campaign and click Generate.
                </div>
            );
        }
        return (
            <div style={{ padding: "8px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 8, textTransform: "uppercase" }}>
                    Month-wise Invoices
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {record.invoices.map(inv => (
                        <div key={inv.invoice_id} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            background: C.bg, borderRadius: 8, padding: "8px 14px",
                            border: `1px solid ${C.border}`,
                        }}>
                            <span style={{
                                fontSize: 11, fontWeight: 700,
                                color: C.purple, background: C.purpleLight,
                                padding: "2px 7px", borderRadius: 5, border: `1px solid ${C.purpleMid}`,
                            }}>
                                {inv.invoice_id}
                            </span>
                            <span style={{ fontSize: 12, color: C.slate }}>
                                {fmtDate(inv.invoice_from)} → {fmtDate(inv.invoice_to)}
                            </span>
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                fontSize: 11, fontWeight: 700,
                                color: inv.pdf_generated ? C.green : C.amber,
                                background: inv.pdf_generated ? C.greenLight : C.amberLight,
                                padding: "2px 8px", borderRadius: 12,
                                border: `1px solid ${inv.pdf_generated ? C.greenMid : "#FDE68A"}`,
                            }}>
                                {inv.pdf_generated
                                    ? <><CheckCircleOutlined style={{ fontSize: 10 }} /> Generated</>
                                    : <><ClockCircleOutlined style={{ fontSize: 10 }} /> Pending</>
                                }
                            </span>
                            {inv.pdf_generated && (
                                <Button
                                    size="small"
                                    icon={<DownloadOutlined />}
                                    onClick={() => handleDownload(inv.invoice_id)}
                                    style={{
                                        fontSize: 11, fontWeight: 600, height: 26,
                                        background: C.blueLight, color: C.blue,
                                        border: `1px solid ${C.blueMid}`, borderRadius: 6,
                                        marginLeft: "auto",
                                    }}
                                >
                                    Download
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const columns: ColumnsType<CampaignRow> = [
        {
            title: (
                <Checkbox
                    checked={selectedCampaignIds.length === notGeneratedCampaigns.length && notGeneratedCampaigns.length > 0}
                    indeterminate={selectedCampaignIds.length > 0 && selectedCampaignIds.length < notGeneratedCampaigns.length}
                    onChange={toggleSelectAll}
                />
            ),
            key: "select",
            width: 50,
            render: (_: any, record: CampaignRow) =>
                record.all_generated ? null : (
                    <Checkbox
                        checked={selectedCampaignIds.includes(record.campaign_id)}
                        onChange={() => toggleCampaign(record.campaign_id)}
                    />
                ),
        },
        {
            title: "Campaign ID",
            dataIndex: "campaign_id",
            key: "campaign_id",
            width: 140,
            render: (v: string) => (
                <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: C.blue, background: C.blueLight, padding: "3px 8px", borderRadius: 6,
                }}>{v}</span>
            ),
        },
        {
            title: "Campaign Name",
            dataIndex: "campaign_name",
            key: "campaign_name",
            width: 220,
            render: (v: string, record: CampaignRow) => (
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.slate, marginBottom: 4 }}>{v || "—"}</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {record.campaign_type && (
                            <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{record.campaign_type}</Tag>
                        )}
                        <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>
                            {record.line_items_count} line item{record.line_items_count !== 1 ? "s" : ""}
                        </Tag>
                    </div>
                </div>
            ),
        },
        {
            title: "Advertiser",
            dataIndex: "advertiser",
            key: "advertiser",
            width: 150,
            render: (v: string, record: CampaignRow) => (
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.slate }}>{v || record.client_name || "—"}</div>
                    <div style={{ fontSize: 10, color: C.slate500,}}>{record.client_id}</div>
                </div>
            ),
        },
        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",
            width: 110,
            render: (v: string) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span>,
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            width: 110,
            render: (v: string) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span>,
        },
        {
            title: "Invoices",
            key: "invoices",
            width: 120,
            render: (_: any, record: CampaignRow) => (
                <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.slate }}>
                        {record.invoices.length} invoice{record.invoices.length !== 1 ? "s" : ""}
                    </div>
                    <div style={{ fontSize: 10, color: record.all_generated ? C.green : C.amber, fontWeight: 600 }}>
                        {record.all_generated ? "✅ All Generated" : record.invoices.length > 0 ? "⚠️ Partial" : "⏳ Pending"}
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
                const allGenerated = record.all_generated;

                return (
                    <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        disabled={!allGenerated}
                        onClick={() => {
                            // Download all invoices with delay so browser doesn't block
                            record.invoices.forEach((inv, index) => {
                                if (inv.pdf_generated) {
                                    setTimeout(() => {
                                        const a = document.createElement("a");
                                        a.href = `${BASE_URL}/download_invoice_pdf/${inv.invoice_id}/`;
                                        a.download = `${inv.invoice_id}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                    }, index * 800); // 800ms gap between each download
                                }
                            });
                        }}
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            height: 30,
                            background: allGenerated ? C.blueLight : C.slate100,
                            color: allGenerated ? C.blue : C.slate300,
                            border: `1px solid ${allGenerated ? C.blueMid : C.slate300}`,
                            borderRadius: 6,
                            cursor: allGenerated ? "pointer" : "not-allowed",
                        }}
                    >
                        Download
                    </Button>
                );
            },
        },
    ];

    return (
        <>
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: C.slate }}>Invoice Generator</h1>
                <p style={{ fontSize: 11, color: C.slate500, marginTop: 1, fontWeight: 500, letterSpacing: "0.04em" }}>
                    SELECT CLIENT → SELECT CAMPAIGNS → GENERATE INVOICES
                </p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                    { label: "Total Campaigns", value: totalCount, color: C.purple, bg: C.purpleLight, icon: "🧾" },
                    { label: "Fully Invoiced", value: generatedCount, color: C.green, bg: C.greenLight, icon: "✅" },
                    { label: "Pending", value: pendingCount, color: C.amber, bg: C.amberLight, icon: "⏳" },
                ].map(card => (
                    <div key={card.label} style={{
                        background: C.white, borderRadius: 14, padding: 20,
                        border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <span style={{ fontSize: 11, color: card.color, fontWeight: 700, textTransform: "uppercase" }}>
                                {card.label}
                            </span>
                            <div style={{
                                width: 36, height: 36, borderRadius: 9, background: card.bg,
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                            }}>{card.icon}</div>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: card.color, letterSpacing: "-1px", lineHeight: 1 }}>
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Step 1: Select Client */}
            <div style={{
                background: C.white, borderRadius: 12, padding: "16px 20px",
                border: `1px solid ${C.border}`, marginBottom: 16,
            }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.slate, marginBottom: 10 }}>
                    Step 1 — Select Client
                </div>
                <Select
                    showSearch
                    placeholder="Search and select a client..."
                    style={{ width: "100%", height: 40 }}
                    value={selectedClientId}
                    onChange={handleClientChange}
                    filterOption={(input, option) =>
                        (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    options={clients.map(c => ({ value: c.client_id, label: `${c.name} (${c.client_id})` }))}
                />
            </div>

            {/* Step 2: Select Campaigns + Generate */}
            {selectedClientId && (
                <div style={{
                    background: C.white, borderRadius: 12, padding: "16px 20px",
                    border: `1px solid ${C.border}`, marginBottom: 16,
                    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.slate }}>
                        Step 2 — Select Campaigns & Generate
                    </div>
                    <Input
                        placeholder="Search campaigns..."
                        prefix={<SearchOutlined style={{ color: C.slate500 }} />}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        allowClear
                        style={{ flex: 1, minWidth: 200, height: 36 }}
                    />
                    <Button
                        onClick={() => selectedClientId && fetchCampaigns(selectedClientId)}
                        icon={<ReloadOutlined />}
                        style={{ height: 36, borderRadius: 8, border: `1px solid ${C.border}`, color: C.slate500, fontSize: 12 }}
                    >
                        Refresh
                    </Button>
                    <Button
                        type="primary"
                        icon={<FilePdfOutlined />}
                        loading={generating}
                        disabled={selectedCampaignIds.length === 0}
                        onClick={handleGenerate}
                        style={{ height: 36, borderRadius: 8, fontWeight: 700, fontSize: 13 }}
                    >
                        Generate Invoices {selectedCampaignIds.length > 0 ? `(${selectedCampaignIds.length})` : ""}
                    </Button>
                </div>
            )}

            {/* Campaign Table */}
            {selectedClientId && (
                <div style={{
                    background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
                    overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                    <Table
                        columns={columns}
                        dataSource={filtered}
                        rowKey="campaign_id"
                        loading={loading}
                        expandable={{ expandedRowRender }}
                        scroll={{ x: 1000 }}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} campaigns`,
                            style: { padding: "12px 16px" },
                        }}
                        locale={{
                            emptyText: (
                                <div style={{ padding: "32px 0", textAlign: "center" }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: C.slate, marginBottom: 4 }}>
                                        No campaigns found
                                    </div>
                                    <div style={{ fontSize: 12, color: C.slate500 }}>
                                        No approved campaigns for this client.
                                    </div>
                                </div>
                            ),
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
                }
                .ant-table-row:hover td { background: #F8FAFC !important; }
            `}</style>
        </>
    );
}