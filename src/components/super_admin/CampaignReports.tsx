import { useEffect, useState, useCallback } from "react";
import { Table, Button, Input, Tag, Tooltip, Spin } from "antd";
import {
    SearchOutlined, ReloadOutlined,
    FileExcelOutlined, DownloadOutlined, CheckCircleOutlined,
    ClockCircleOutlined, EyeOutlined, SaveOutlined, CloseOutlined, CloudUploadOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import * as XLSX from 'xlsx';

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
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

// ── Internal edits state type ──────────────────────────────────────────────────
interface InternalEdits {
    impressions: string;
    start_date: string;
    end_date: string;
    advertiser_id: string;
    target_cpm: string;
    target_ctr: string;
    target_cpc: string;
    booked_budget: string;
    sitelist: string;
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
interface PreviewModalProps {
    open: boolean;
    sheetNames: string[];
    activeSheet: string;
    onSheetChange: (name: string) => void;
    campaignId: string;
    reportType: 'cpm' | 'cpc';
    saving: boolean;
    onClose: () => void;
    clientData: any[][];
    internalEdits: InternalEdits;
    onInternalChange: (field: keyof InternalEdits, value: string) => void;
    onSave: () => void;
}

function PreviewModal({
    open, sheetNames, activeSheet, onSheetChange,
    campaignId, reportType, saving, onClose,
    clientData, internalEdits, onInternalChange, onSave
}: PreviewModalProps) {
    const [activeTab, setActiveTab] = useState<'client' | 'internal'>('client');

    if (!open) return null;

    const isCpc = reportType === 'cpc';

    const getInternalFields = () => {
        if (isCpc) {
            return [
                { label: "Advertiser ID",  field: "advertiser_id" as keyof InternalEdits, placeholder: "e.g. CL00001" },
                { label: "Clicks Booked",  field: "impressions"   as keyof InternalEdits, placeholder: "e.g. 50000" },
                { label: "Start Date",     field: "start_date"    as keyof InternalEdits, placeholder: "YYYY-MM-DD" },
                { label: "End Date",       field: "end_date"      as keyof InternalEdits, placeholder: "YYYY-MM-DD" },
                { label: "Target CPC",     field: "target_cpc"    as keyof InternalEdits, placeholder: "e.g. 1 INR" },
                { label: "Booked Budget",  field: "booked_budget" as keyof InternalEdits, placeholder: "e.g. 5000" },
                { label: "Sitelist",       field: "sitelist"      as keyof InternalEdits, placeholder: "Site list…" },
            ];
        }
        return [
            { label: "Advertiser ID",      field: "advertiser_id" as keyof InternalEdits, placeholder: "e.g. CL00001" },
            { label: "Impressions Booked", field: "impressions"   as keyof InternalEdits, placeholder: "e.g. 500000" },
            { label: "Start Date",         field: "start_date"    as keyof InternalEdits, placeholder: "YYYY-MM-DD" },
            { label: "End Date",           field: "end_date"      as keyof InternalEdits, placeholder: "YYYY-MM-DD" },
            { label: "Target CPM",         field: "target_cpm"    as keyof InternalEdits, placeholder: "e.g. 10 INR" },
            { label: "Target CTR",         field: "target_ctr"    as keyof InternalEdits, placeholder: "e.g. 0.30%" },
            { label: "Sitelist",           field: "sitelist"      as keyof InternalEdits, placeholder: "Site list…" },
        ];
    };

    const isCpm = reportType === 'cpm';

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
            zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
            <div style={{
                background: "var(--bg-card)", borderRadius: 16, width: "80vw", maxWidth: 960,
                maxHeight: "90vh", display: "flex", flexDirection: "column",
                boxShadow: "var(--shadow)", border: "1px solid var(--border)",
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: "18px 24px", borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 9, background: "var(--accent-light)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <FileExcelOutlined style={{ color: "var(--accent)", fontSize: 17 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                                Campaign Excel Preview
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                                <span style={{
                                    fontWeight: 700,
                                    color: isCpm ? "var(--accent)" : "var(--accent-3)",
                                }}>
                                    {campaignId}{!isCpm ? '-A' : ''}
                                </span>
                                &nbsp;·&nbsp;
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10,
                                    textTransform: "uppercase",
                                    background: isCpm ? "var(--accent-light)" : "rgba(67,188,205,0.12)",
                                    color: isCpm ? "var(--accent)" : "var(--accent-3)",
                                    border: `1px solid ${isCpm ? "var(--accent)" : "var(--accent-3)"}`,
                                }}>
                                    {isCpm ? 'CPM — Impressions' : 'CPC — Clicks'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4, borderRadius: 6,
                    }}>
                        <CloseOutlined style={{ fontSize: 16 }} />
                    </button>
                </div>

                {/* Two main tabs: Client vs Internal */}
                <div style={{
                    display: 'flex', gap: 0, borderBottom: "1px solid var(--border)",
                    padding: '0 24px', background: 'var(--bg-input)', flexShrink: 0,
                }}>
                    {[
                        { key: 'client',   label: '👤 Client Campaign Details', desc: 'Read-only' },
                        { key: 'internal', label: '🛠 Internal Team',            desc: 'Editable' },
                    ].map(tab => {
                        const isActive = activeTab === tab.key;
                        const isInternal = tab.key === 'internal';
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as 'client' | 'internal')}
                                style={{
                                    padding: '12px 20px', fontSize: 13,
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive
                                        ? (isInternal ? "var(--green)" : "var(--accent)")
                                        : "var(--text-muted)",
                                    background: 'none', border: 'none',
                                    borderBottom: isActive
                                        ? `2px solid ${isInternal ? "var(--green)" : "var(--accent)"}`
                                        : '2px solid transparent',
                                    cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}
                            >
                                {tab.label}
                                <span style={{
                                    fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8,
                                    background: isInternal ? "var(--green-bg)" : "var(--accent-light)",
                                    color: isInternal ? "var(--green)" : "var(--accent)",
                                    border: `1px solid ${isInternal ? "var(--green)" : "var(--accent)"}`,
                                    textTransform: 'uppercase',
                                }}>
                                    {tab.desc}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Sheet Tabs — only shown for client tab */}
                {activeTab === 'client' && (
                    <div style={{
                        display: 'flex', gap: 0, borderBottom: "1px solid var(--border)",
                        padding: '0 24px', background: 'var(--bg-card-hover)', flexShrink: 0,
                    }}>
                        {sheetNames.map(name => (
                            <button
                                key={name}
                                onClick={() => onSheetChange(name)}
                                style={{
                                    padding: '8px 16px', fontSize: 11,
                                    fontWeight: activeSheet === name ? 700 : 500,
                                    color: activeSheet === name ? "var(--accent)" : "var(--text-muted)",
                                    background: 'none', border: 'none',
                                    borderBottom: activeSheet === name ? "2px solid var(--accent)" : '2px solid transparent',
                                    cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s',
                                }}
                            >
                                📄 {name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Body */}
                <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px" }}>

                    {/* ── CLIENT TAB ── */}
                    {activeTab === 'client' && (
                        <>
                            <div style={{
                                marginBottom: 12, padding: "8px 12px",
                                background: "var(--accent-light)", borderRadius: 8,
                                border: "1px solid var(--accent)",
                                fontSize: 12, color: "var(--accent)", fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                🔒 This is the original data submitted by the client. It is read-only and cannot be modified.
                            </div>
                            <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
                                <colgroup>
                                    <col style={{ width: "35%" }} />
                                    <col style={{ width: "65%" }} />
                                </colgroup>
                                <tbody>
                                    {clientData.map((row, rIdx) => (
                                        <tr key={rIdx}>
                                            {rIdx === 0 ? (
                                                <td colSpan={2} style={{
                                                    background: "var(--accent)", padding: "8px 12px",
                                                    border: "1px solid var(--accent)",
                                                    color: "#fff", fontWeight: 700, fontSize: 13,
                                                }}>
                                                    {row[0] ?? ''}
                                                </td>
                                            ) : (
                                                row.map((cell: any, cIdx: number) => (
                                                    <td key={cIdx} style={{
                                                        border: "1px solid var(--border)",
                                                        padding: "6px 10px",
                                                        background: cIdx === 0
                                                            ? "var(--accent-light)"
                                                            : (rIdx % 2 === 0 ? "var(--bg-input)" : "var(--bg-card)"),
                                                        fontSize: 12,
                                                        fontWeight: cIdx === 0 ? 600 : 400,
                                                        color: cIdx === 0 ? "var(--text-primary)" : "var(--text-muted)",
                                                    }}>
                                                        {cell ?? ''}
                                                    </td>
                                                ))
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    {/* ── INTERNAL TAB ── */}
                    {activeTab === 'internal' && (
                        <>
                            <div style={{
                                marginBottom: 16, padding: "8px 12px",
                                background: "var(--green-bg)", borderRadius: 8,
                                border: "1px solid var(--green)",
                                fontSize: 12, color: "var(--green)", fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                ✏️ These fields are for internal use only. The client's original data is never modified.
                            </div>

                            <div style={{
                                marginBottom: 14, padding: "6px 12px",
                                background: "var(--accent-light)", borderRadius: 8,
                                border: "1px solid var(--accent)",
                                fontSize: 11, color: "var(--accent)", fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                📋 Currently editing: <span style={{ fontWeight: 700 }}>{activeSheet}</span>
                                &nbsp;— Switch line item using the sheet tabs in Client Campaign Details tab
                            </div>

                            <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
                                <colgroup>
                                    <col style={{ width: "35%" }} />
                                    <col style={{ width: "65%" }} />
                                </colgroup>
                                <tbody>
                                    {getInternalFields().map(({ label, field, placeholder }) => (
                                        <tr key={field}>
                                            <td style={{
                                                border: "1px solid var(--border)",
                                                padding: "8px 12px",
                                                background: "var(--accent-light)",
                                                fontSize: 12, fontWeight: 600, color: "var(--text-primary)",
                                            }}>
                                                {label}
                                            </td>
                                            <td style={{
                                                border: "1px solid var(--border)",
                                                padding: "4px 8px",
                                                background: "var(--bg-card)",
                                            }}>
                                                <input
                                                    value={internalEdits[field] ?? ''}
                                                    onChange={e => onInternalChange(field, e.target.value)}
                                                    placeholder={placeholder}
                                                    style={{
                                                        width: "100%", border: "none", outline: "none",
                                                        fontSize: 12, color: "var(--text-primary)", background: "transparent",
                                                        padding: "4px 0",
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "14px 24px", borderTop: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexShrink: 0, background: "var(--bg-input)", borderRadius: "0 0 16px 16px",
                }}>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                        {activeTab === 'client'
                            ? '🔒 Client data is read-only'
                            : '💾 Saves to CampaignLineItemExcel only — original data preserved'}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <Button onClick={onClose} style={{ height: 36, borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
                            Cancel
                        </Button>
                        {activeTab === 'internal' && (
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={saving}
                                onClick={onSave}
                                style={{
                                    height: 36, borderRadius: 8, fontWeight: 600,
                                    fontSize: 13, background: "var(--green)", borderColor: "var(--green)",
                                }}
                            >
                                {saving ? "Saving…" : "Save to DB"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CampaignReports() {
    const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [generating, setGenerating] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [showPreview, setShowPreview] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [allSheetsData, setAllSheetsData] = useState<Record<string, any[][]>>({});
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [activeSheet, setActiveSheet] = useState<string>('');
    const [previewCampaignId, setPreviewCampaignId] = useState('');
    const [previewReportType, setPreviewReportType] = useState<'cpm' | 'cpc'>('cpm');

    const [internalEdits, setInternalEdits] = useState<InternalEdits>({
        impressions: '', start_date: '', end_date: '',
        advertiser_id: '', target_cpm: '', target_ctr: '',
        target_cpc: '', booked_budget: '', sitelist: '',
    });

    const [publishing, setPublishing] = useState<string | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") =>
        setToast({ message, type });

    const fetchList = useCallback(() => {
        setLoading(true);
        fetch(`${BASE_URL}/get_campaigns_excel_list/`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(data => setCampaigns(Array.isArray(data) ? data : []))
            .catch(() => showToast("Failed to load campaigns.", "error"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchList(); }, [fetchList]);

    const handleGenerate = async (record: CampaignRow) => {
        const key = `${record.campaign_id_raw}_${record.report_type}`;
        setGenerating(key);
        try {
            const res = await fetch(
                `${BASE_URL}/generate_campaign_excel/${record.campaign_id_raw}/`,
                {
                    method: "POST",
                    headers: { "ngrok-skip-browser-warning": "1", "Content-Type": "application/json" },
                    body: JSON.stringify({ report_type: record.report_type }),
                }
            );
            if (!res.ok) throw new Error();
            const data = await res.json();
            setCampaigns(prev => prev.map(c =>
                c.campaign_id_raw === record.campaign_id_raw && c.report_type === record.report_type
                    ? { ...c, excel_generated: true, excel_url: data.download_url, generated_at: data.generated_at }
                    : c
            ));
            showToast(`Excel generated for ${record.campaign_id}!`);
        } catch {
            showToast("Failed to generate Excel. Try again.", "error");
        } finally {
            setGenerating(null);
        }
    };

    const handlePreview = async (record: CampaignRow) => {
        if (!record.excel_url) return;
        setPreviewLoading(true);
        setShowPreview(true);
        setPreviewCampaignId(record.campaign_id_raw);
        setPreviewReportType(record.report_type);
        try {
            await fetch(`${BASE_URL}/generate_campaign_excel/${record.campaign_id_raw}/`, {
                method: "POST",
                headers: { "ngrok-skip-browser-warning": "1", "Content-Type": "application/json" },
                body: JSON.stringify({ report_type: record.report_type }),
            });

            const downloadUrl = `${BASE_URL}/download_campaign_excel/${record.campaign_id_raw}/?report_type=${record.report_type}`;
            const res = await fetch(downloadUrl, { headers: { 'ngrok-skip-browser-warning': '1' } });
            const arrayBuffer = await res.arrayBuffer();
            const wb = XLSX.read(arrayBuffer, { type: 'array' });

            const allSheets: Record<string, any[][]> = {};
            wb.SheetNames.forEach(name => {
                const ws = wb.Sheets[name];
                allSheets[name] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
            });
            setAllSheetsData(JSON.parse(JSON.stringify(allSheets)));
            setSheetNames(wb.SheetNames);
            const firstSheet = wb.SheetNames[0];
            setActiveSheet(firstSheet);

            const editsRes = await fetch(
                `${BASE_URL}/get_line_item_excel_data/${record.campaign_id_raw}/?report_type=${record.report_type}`,
                { headers: { 'ngrok-skip-browser-warning': '1' } }
            );
            if (editsRes.ok) {
                const editsData = await editsRes.json();
                const existing = editsData[firstSheet] || {};
                setInternalEdits({
                    impressions: existing.impressions ? String(existing.impressions) :
                        (existing.clicks ? String(existing.clicks) : ''),
                    start_date: existing.start_date || '',
                    end_date: existing.end_date || '',
                    advertiser_id: existing.advertiser_id || '',
                    target_cpm: existing.target_cpm != null ? String(existing.target_cpm) : '',
                    target_ctr: existing.target_ctr != null ? String(existing.target_ctr) : '',
                    target_cpc: existing.target_cpc != null ? String(existing.target_cpc) : '',
                    booked_budget: existing.booked_budget != null ? String(existing.booked_budget) : '',
                    sitelist: existing.sitelist || '',
                });
            }
        } catch {
            showToast("Failed to load Excel for preview.", "error");
            setShowPreview(false);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSheetChange = async (name: string) => {
        setActiveSheet(name);
        try {
            const editsRes = await fetch(
                `${BASE_URL}/get_line_item_excel_data/${previewCampaignId}/?report_type=${previewReportType}`,
                { headers: { 'ngrok-skip-browser-warning': '1' } }
            );
            if (editsRes.ok) {
                const editsData = await editsRes.json();
                const existing = editsData[name] || {};
                setInternalEdits({
                    impressions: existing.impressions ? String(existing.impressions) :
                        (existing.clicks ? String(existing.clicks) : ''),
                    start_date: existing.start_date || '',
                    end_date: existing.end_date || '',
                    advertiser_id: existing.advertiser_id || '',
                    target_cpm: existing.target_cpm != null ? String(existing.target_cpm) : '',
                    target_ctr: existing.target_ctr != null ? String(existing.target_ctr) : '',
                    target_cpc: existing.target_cpc != null ? String(existing.target_cpc) : '',
                    booked_budget: existing.booked_budget != null ? String(existing.booked_budget) : '',
                    sitelist: existing.sitelist || '',
                });
            }
        } catch { /* ignore */ }
    };

    const handleSaveEdits = async () => {
        setSaving(true);
        try {
            const payload = {
                report_type: previewReportType,
                line_item_id: activeSheet,
                ...internalEdits,
            };
            const res = await fetch(
                `${BASE_URL}/save_excel_edits_to_db/${previewCampaignId}/`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
                    body: JSON.stringify(payload),
                }
            );
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Save failed');
            }
            showToast("Saved to internal DB — client data unchanged!");
            setShowPreview(false);
            fetchList();
        } catch (err: any) {
            showToast(err.message || "Failed to save.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = (record: CampaignRow) => {
        const url = `${BASE_URL}/download_campaign_excel/${record.campaign_id_raw}/?report_type=${record.report_type}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `${record.campaign_id}.xlsx`;
        a.click();
    };

    const handlePublish = async (record: CampaignRow) => {
        const key = `${record.campaign_id_raw}_${record.report_type}`;
        setPublishing(key);
        try {
            const res = await fetch(
                `${BASE_URL}/publish_campaign_excel/${record.campaign_id_raw}/`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
                    body: JSON.stringify({ report_type: record.report_type }),
                }
            );
            if (!res.ok) throw new Error();
            setCampaigns(prev => prev.map(c =>
                c.campaign_id_raw === record.campaign_id_raw && c.report_type === record.report_type
                    ? { ...c, publish_status: 'published' }
                    : c
            ));
            showToast(`${record.campaign_id} published successfully!`);
        } catch {
            showToast('Failed to publish. Try again.', 'error');
        } finally {
            setPublishing(null);
        }
    };

    const filtered = campaigns.filter(c => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [c.campaign_id, c.campaign_name, c.client_name, c.client_id]
            .some(f => f?.toLowerCase().includes(q));
    });

    const totalCount = campaigns.length;
    const generatedCount = campaigns.filter(c => c.excel_generated).length;
    const pendingCount = totalCount - generatedCount;

    // ── Columns ──────────────────────────────────────────────────────────────
    const columns: ColumnsType<CampaignRow> = [
        {
            title: "Campaign ID",
            dataIndex: "campaign_id",
            key: "campaign_id",
            width: 140,
            render: (v: string, record) => {
                const isCpm = record.report_type === 'cpm';
                return (
                    <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: isCpm ? "var(--accent)" : "var(--accent-3)",
                        background: isCpm ? "var(--accent-light)" : "rgba(67,188,205,0.12)",
                        padding: "3px 8px", borderRadius: 6, display: "inline-block",
                    }}>{v}</span>
                );
            },
        },
        {
            title: "Type",
            dataIndex: "report_type",
            key: "report_type",
            width: 190,
            render: (v: 'cpm' | 'cpc') => {
                const isCpm = v === 'cpm';
                return (
                    <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px",
                        borderRadius: 20, textTransform: "uppercase",
                        background: isCpm ? "var(--accent-light)" : "rgba(67,188,205,0.12)",
                        color: isCpm ? "var(--accent)" : "var(--accent-3)",
                        border: `1px solid ${isCpm ? "var(--accent)" : "var(--accent-3)"}`,
                    }}>
                        {isCpm ? '📊 CPM — Impressions' : '🖱️ CPC — Clicks'}
                    </span>
                );
            },
        },
        {
            title: "Campaign Name",
            dataIndex: "campaign_name",
            key: "campaign_name",
            width: 200,
            render: (v: string) => (
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{v || "—"}</span>
            ),
        },
        {
            title: "Client",
            dataIndex: "client_name",
            key: "client_name",
            width: 150,
            render: (v: string, record) => (
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{v || "—"}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{record.client_id}</div>
                </div>
            ),
        },
        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",
            width: 110,
            render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{fmtDate(v)}</span>,
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            width: 110,
            render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{fmtDate(v)}</span>,
        },
        {
            title: "Line Items",
            dataIndex: "line_items_count",
            key: "line_items_count",
            width: 90,
            render: (v: number) => (
                <Tag color="purple" style={{ fontSize: 11 }}>{v} sheet{v !== 1 ? "s" : ""}</Tag>
            ),
        },
        {
            title: "Excel Status",
            dataIndex: "excel_generated",
            key: "excel_generated",
            width: 130,
            render: (generated: boolean, record) => generated ? (
                <Tooltip title={`Generated: ${record.generated_at ? fmtDate(record.generated_at) : "—"}`}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 10px", borderRadius: 20,
                        background: "var(--green-bg)", border: "1px solid var(--green)",
                        fontSize: 11, fontWeight: 700, color: "var(--green)",
                    }}>
                        <CheckCircleOutlined style={{ fontSize: 11 }} /> Generated
                    </span>
                </Tooltip>
            ) : (
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 20,
                    background: "var(--amber-bg)", border: "1px solid var(--amber)",
                    fontSize: 11, fontWeight: 700, color: "var(--amber)",
                }}>
                    <ClockCircleOutlined style={{ fontSize: 11 }} /> Pending
                </span>
            ),
        },
        {
            title: "Publish Status",
            dataIndex: "publish_status",
            key: "publish_status",
            width: 130,
            render: (v: string | null) => v === 'published' ? (
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 20,
                    background: "var(--green-bg)", border: "1px solid var(--green)",
                    fontSize: 11, fontWeight: 700, color: "var(--green)",
                }}>
                    ✅ Published
                </span>
            ) : (
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 20,
                    background: "var(--bg-input)", border: "1px solid var(--border)",
                    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                }}>
                    — Not Published
                </span>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 240,
            fixed: "right",
            render: (_: any, record: CampaignRow) => {
                const key = `${record.campaign_id_raw}_${record.report_type}`;
                const isGenerating = generating === key;
                return (
                    <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                        {!record.excel_generated && (
                            <Button
                                size="small"
                                icon={<FileExcelOutlined />}
                                loading={isGenerating}
                                onClick={() => handleGenerate(record)}
                                style={{
                                    fontSize: 11, fontWeight: 600, height: 30,
                                    background: "var(--green-bg)", color: "var(--green)",
                                    border: "1px solid var(--green)", borderRadius: 6,
                                }}
                            >
                                Generate
                            </Button>
                        )}

                        {record.excel_generated && (
                            <>
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview(record)}
                                    style={{
                                        fontSize: 11, fontWeight: 600, height: 30,
                                        background: "var(--amber-bg)", color: "var(--amber)",
                                        border: "1px solid var(--amber)", borderRadius: 6,
                                    }}
                                >
                                    Preview
                                </Button>

                                <Button
                                    size="small"
                                    icon={<DownloadOutlined />}
                                    onClick={() => handleDownload(record)}
                                    style={{
                                        fontSize: 11, fontWeight: 600, height: 30,
                                        background: "var(--accent-light)", color: "var(--accent)",
                                        border: "1px solid var(--accent)", borderRadius: 6,
                                    }}
                                >
                                    Download
                                </Button>

                                <Button
                                    size="small"
                                    icon={record.publish_status === 'published' ? null : <CloudUploadOutlined />}
                                    loading={publishing === key}
                                    onClick={() => handlePublish(record)}
                                    disabled={record.publish_status === 'published'}
                                    style={{
                                        fontSize: 11, fontWeight: 600, height: 30,
                                        background: "var(--accent-light)", color: "var(--accent)",
                                        border: "1px solid var(--accent)", borderRadius: 6,
                                    }}
                                >
                                    {record.publish_status === 'published' ? '✅ Published' : 'Publish'}
                                </Button>
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div>
            {/* ── Page Header ── */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Reports</h1>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    GENERATE &amp; DOWNLOAD CAMPAIGN EXCEL REPORTS
                </p>
            </div>

            {/* ── Stat Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                    { label: "Total Reports",   value: totalCount,     color: "var(--accent)", bg: "var(--accent-light)", icon: "📊" },
                    { label: "Excel Generated", value: generatedCount, color: "var(--green)",  bg: "var(--green-bg)",    icon: "✅" },
                    { label: "Pending",         value: pendingCount,   color: "var(--amber)",  bg: "var(--amber-bg)",    icon: "⏳" },
                ].map(card => (
                    <div key={card.label} style={{
                        background: "var(--bg-card)", borderRadius: "var(--radius-card)", padding: 20,
                        border: "1px solid var(--border)", boxShadow: "var(--shadow-card)",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <span style={{ fontSize: 11, color: card.color, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
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

            {/* ── Filters ── */}
            <div style={{
                background: "var(--bg-card)", borderRadius: 12, padding: "14px 18px",
                border: "1px solid var(--border)", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                boxShadow: "var(--shadow-card)",
            }}>
                <Input
                    placeholder="Search by campaign ID, name, client…"
                    prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    allowClear
                    style={{ flex: 1, minWidth: 240, height: 36, background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
                <Button
                    onClick={fetchList}
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
                    {filtered.length} of {campaigns.length} reports
                </span>
            </div>

            {/* ── Info Banner ── */}
            <div style={{
                background: "var(--accent-light)", border: "1px solid var(--accent)",
                borderRadius: 10, padding: "10px 16px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 12.5, color: "var(--accent)", fontWeight: 500,
            }}>
                <FileExcelOutlined style={{ fontSize: 16 }} />
                Each campaign has two reports — <strong>CPM (Impressions)</strong> and <strong>CPC (Clicks)</strong>. Click <strong>Generate</strong>, then <strong>Preview</strong> to edit, then <strong>Download</strong>.
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
                    rowKey={r => `${r.campaign_id_raw}_${r.report_type}`}
                    loading={loading}
                    scroll={{ x: 1300 }}
                    pagination={{
                        pageSize: 10, showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"],
                        showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} reports`,
                        style: { padding: "12px 16px" },
                    }}
                    style={{ fontSize: 13 }}
                    rowClassName={(record, index) => {
                        const prevRecord = filtered[index - 1];
                        const groupClass = prevRecord && prevRecord.campaign_id_raw !== record.campaign_id_raw
                            ? 'campaign-group-start'
                            : '';
                        return `client-table-row ${groupClass}`.trim();
                    }}
                />
            </div>

            {/* ── Preview Modal ── */}
            {showPreview && (
                previewLoading ? (
                    <div style={{
                        position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
                        zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <div style={{
                            background: "var(--bg-card)", borderRadius: 16, padding: "40px 60px",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                        }}>
                            <Spin size="large" />
                            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
                                Loading Excel…
                            </span>
                        </div>
                    </div>
                ) : (
                    <PreviewModal
                        open={showPreview}
                        clientData={allSheetsData[activeSheet] ?? []}
                        sheetNames={sheetNames}
                        activeSheet={activeSheet}
                        onSheetChange={handleSheetChange}
                        campaignId={previewCampaignId}
                        reportType={previewReportType}
                        saving={saving}
                        onClose={() => setShowPreview(false)}
                        onSave={handleSaveEdits}
                        internalEdits={internalEdits}
                        onInternalChange={(field, value) => setInternalEdits(prev => ({ ...prev, [field]: value }))}
                    />
                )
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <style>{`
                .client-table-row:hover td { background: var(--bg-card-hover) !important; }
                .campaign-group-start td { border-top: 2px solid var(--border-strong) !important; }
            `}</style>
        </div>
    );
}