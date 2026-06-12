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

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
    bg: "#F8FAFC",
    white: "#FFFFFF",
    slate: "#0F172A",
    slate500: "#64748B",
    slate300: "#CBD5E1",
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
    teal: "#0F766E",
    tealLight: "#F0FDFA",
    tealMid: "#99F6E4",
    red: "#DC2626",
    redLight: "#FEF2F2",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface CampaignRow {
    campaign_id: string;       // display: CA00005 or CA00005-A
    campaign_id_raw: string;   // actual: CA00005 (for API calls)
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
    publish_status: string | null;   // ✅ ADD THIS
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
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

// ── Preview Modal ─────────────────────────────────────────────────────────────
interface PreviewModalProps {
    open: boolean;
    editedData: any[][];        // current active sheet data
    sheetNames: string[];       // all sheet names
    activeSheet: string;        // currently selected sheet
    onSheetChange: (name: string) => void;
    campaignId: string;
    reportType: 'cpm' | 'cpc';
    saving: boolean;
    onClose: () => void;
    onSave: () => void;
    onChange: (rIdx: number, cIdx: number, value: string) => void;
}

const EDITABLE_ROW_MAP: Record<number, string> = {
    6: 'impressions',
    7: 'start_date',
    8: 'end_date',
    9: 'units',
    10: 'ctr',
    21: 'sitelist',
};
// Read-only rows — grayed out in preview
const READ_ONLY_ROWS = new Set([0, 1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);

function PreviewModal({ open, editedData, sheetNames, activeSheet, onSheetChange, campaignId, reportType, saving, onClose, onSave, onChange }: PreviewModalProps) {
    if (!open) return null;

    // Identify header row (row index 0 is title, rows 1+ are label/value pairs)
    const getLabelStyle = (rIdx: number, cIdx: number) => {
        if (rIdx === 0) {
            // Title row — dark blue header
            return {
                background: "#1F4E79",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 13,
                border: "none",
                width: "100%",
                padding: "4px 8px",
                outline: "none",
            };
        }
        if (cIdx === 0) {
            // Label column — light blue
            return {
                background: "#D9E1F2",
                color: "#1e293b",
                fontWeight: 600,
                fontSize: 12,
                border: "none",
                width: "100%",
                padding: "4px 8px",
                outline: "none",
            };
        }
        // Value column — editable
        return {
            background: "transparent",
            color: "#0f172a",
            fontWeight: 400,
            fontSize: 12,
            border: "none",
            width: "100%",
            padding: "4px 8px",
            outline: "none",
        };
    };

    const getCellBg = (rIdx: number, cIdx: number) => {
        if (rIdx === 0) return "#1F4E79";
        if (cIdx === 0) return "#D9E1F2";
        return rIdx % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
    };

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
            zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
        }}>
            <div style={{
                background: C.white, borderRadius: 16, width: "75vw", maxWidth: 900,
                maxHeight: "88vh", display: "flex", flexDirection: "column",
                boxShadow: "0 24px 64px rgba(0,0,0,0.2)", border: `1px solid ${C.border}`,
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: "18px 24px", borderBottom: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 9,
                            background: C.blueLight, display: "flex",
                            alignItems: "center", justifyContent: "center",
                        }}>
                            <FileExcelOutlined style={{ color: C.blue, fontSize: 17 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: C.slate }}>
                                Preview &amp; Edit Excel
                            </div>
                            <div style={{ fontSize: 11, color: C.slate500, marginTop: 1 }}>
                                <span style={{
                                    fontFamily: "monospace", fontWeight: 700,
                                    color: reportType === 'cpm' ? C.blue : C.teal,
                                }}>{campaignId}{reportType === 'cpc' ? '-A' : ''}</span>
                                &nbsp;·&nbsp;
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: "1px 7px",
                                    borderRadius: 10, textTransform: "uppercase",
                                    background: reportType === 'cpm' ? C.blueLight : C.tealLight,
                                    color: reportType === 'cpm' ? C.blue : C.teal,
                                    border: `1px solid ${reportType === 'cpm' ? C.blueMid : C.tealMid}`,
                                }}>
                                    {reportType === 'cpm' ? 'CPM — Impressions' : 'CPC — Clicks'}
                                </span>
                                &nbsp;·&nbsp;Click any value cell to edit
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: C.slate500, fontSize: 20, display: "flex",
                        alignItems: "center", padding: 4, borderRadius: 6,
                    }}>
                        <CloseOutlined style={{ fontSize: 16 }} />
                    </button>
                </div>
                {/* Sheet Tabs */}
                <div style={{
                    display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`,
                    padding: '0 24px', background: '#F8FAFC', flexShrink: 0,
                }}>
                    {sheetNames.map(name => (
                        <button
                            key={name}
                            onClick={() => onSheetChange(name)}
                            style={{
                                padding: '10px 18px',
                                fontSize: 12,
                                fontWeight: activeSheet === name ? 700 : 500,
                                color: activeSheet === name ? C.blue : C.slate500,
                                background: 'none',
                                border: 'none',
                                borderBottom: activeSheet === name ? `2px solid ${C.blue}` : '2px solid transparent',
                                cursor: 'pointer',
                                marginBottom: -1,
                                transition: 'all 0.15s',
                                fontFamily: 'monospace',
                            }}
                        >
                            📄 {name}
                        </button>
                    ))}
                </div>

                {/* Table — scrollable */}
                <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
                        <colgroup>
                            <col style={{ width: "35%" }} />
                            <col style={{ width: "65%" }} />
                        </colgroup>
                        <tbody>
                            {editedData.map((row, rIdx) => (
                                <tr key={rIdx}>
                                    {rIdx === 0 ? (
                                        // Title row — spans both columns
                                        <td colSpan={2} style={{
                                            background: "#1F4E79", padding: 0,
                                            border: "1px solid #1F4E79",
                                        }}>
                                            <input
                                                value={row[0] ?? ''}
                                                onChange={e => onChange(rIdx, 0, e.target.value)}
                                                style={getLabelStyle(rIdx, 0)}
                                            />
                                        </td>
                                    ) : (
                                        row.map((cell: any, cIdx: number) => (
                                            <td key={cIdx} style={{
                                                border: `1px solid ${C.border}`,
                                                padding: 0,
                                                background: getCellBg(rIdx, cIdx),
                                            }}>

                                                <input
                                                    value={cell ?? ''}
                                                    onChange={e => onChange(rIdx, cIdx, e.target.value)}
                                                    readOnly={cIdx === 0 || READ_ONLY_ROWS.has(rIdx)}
                                                    style={{
                                                        ...getLabelStyle(rIdx, cIdx),
                                                        cursor: (cIdx === 0 || READ_ONLY_ROWS.has(rIdx)) ? 'default' : 'text',
                                                        background: (READ_ONLY_ROWS.has(rIdx) && cIdx === 1) ? '#f1f5f9' : undefined,
                                                        color: (READ_ONLY_ROWS.has(rIdx) && cIdx === 1) ? '#94a3b8' : undefined,
                                                    }}
                                                />
                                            </td>
                                        ))
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal Footer */}
                <div style={{
                    padding: "14px 24px", borderTop: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexShrink: 0, background: "#FAFAFA", borderRadius: "0 0 16px 16px",
                }}>
                    <div style={{
                        fontSize: 11.5, color: C.slate500, display: "flex",
                        alignItems: "center", gap: 6,
                    }}>
                        <span style={{
                            width: 10, height: 10, borderRadius: 2,
                            background: "#D9E1F2", display: "inline-block",
                            border: `1px solid ${C.border}`,
                        }} />
                        Label columns are read-only &nbsp;·&nbsp;
                        <span style={{
                            width: 10, height: 10, borderRadius: 2,
                            background: C.white, display: "inline-block",
                            border: `1px solid ${C.border}`,
                        }} />
                        Value columns are editable
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <Button
                            onClick={onClose}
                            style={{ height: 36, borderRadius: 8, fontWeight: 600, fontSize: 13 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={saving}
                            onClick={onSave}
                            style={{
                                height: 36, borderRadius: 8, fontWeight: 600,
                                fontSize: 13, background: C.green,
                                borderColor: C.green,
                            }}
                        >
                            {saving ? "Saving…" : "Save to DB"}
                        </Button>
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

    // Preview modal state
    const [showPreview, setShowPreview] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // WITH this:
    const [allSheetsData, setAllSheetsData] = useState<Record<string, any[][]>>({});
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [activeSheet, setActiveSheet] = useState<string>('');
    const [previewCampaignId, setPreviewCampaignId] = useState('');
    const [previewReportType, setPreviewReportType] = useState<'cpm' | 'cpc'>('cpm');

    // Add this state to store the full workbook
    const [originalWorkbook, setOriginalWorkbook] = useState<XLSX.WorkBook | null>(null);

    const [publishing, setPublishing] = useState<string | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") =>
        setToast({ message, type });

    // ── Fetch list ──────────────────────────────────────────────────────────
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

    // ── Generate Excel ──────────────────────────────────────────────────────
    const handleGenerate = async (record: CampaignRow) => {
        const key = `${record.campaign_id_raw}_${record.report_type}`;
        setGenerating(key);
        try {
            const res = await fetch(
                `${BASE_URL}/generate_campaign_excel/${record.campaign_id_raw}/`,
                {
                    method: "POST",
                    headers: {
                        "ngrok-skip-browser-warning": "1",
                        "Content-Type": "application/json",
                    },
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

    // ── Preview Excel ──────────────────────────────────────────────────────
    const handlePreview = async (record: CampaignRow) => {
        if (!record.excel_url) return;
        setPreviewLoading(true);
        setShowPreview(true);
        setPreviewCampaignId(record.campaign_id_raw);
        setPreviewReportType(record.report_type);
        try {
            const res = await fetch(record.excel_url, {
                headers: { 'ngrok-skip-browser-warning': '1' }
            });
            const arrayBuffer = await res.arrayBuffer();
            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            setOriginalWorkbook(wb);

            // ✅ Load ALL sheets
            const allSheets: Record<string, any[][]> = {};
            wb.SheetNames.forEach(name => {
                const ws = wb.Sheets[name];
                allSheets[name] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
            });

            setAllSheetsData(JSON.parse(JSON.stringify(allSheets)));
            setSheetNames(wb.SheetNames);
            setActiveSheet(wb.SheetNames[0]); // default first sheet
        } catch {
            showToast("Failed to load Excel for preview.", "error");
            setShowPreview(false);
        } finally {
            setPreviewLoading(false);
        }
    };
    // ── Handle cell edit ──────────────────────────────────────────────────
    const handleCellChange = (rIdx: number, cIdx: number, value: string) => {
        setAllSheetsData(prev => {
            const sheetCopy = prev[activeSheet].map(r => [...r]);
            sheetCopy[rIdx][cIdx] = value;
            return { ...prev, [activeSheet]: sheetCopy };
        });
    };

    // ── Row index → DB field name mapping (matches build_campaign_excel rows order) ──
    // rIdx 0 = title, rows start at 1 (0-indexed in editedData)

    const handleSaveEdits = async () => {
        setSaving(true);
        try {
            if (!originalWorkbook) throw new Error("No workbook loaded");

            // ── Extract line_item_id from row index 11 (Line Item ID row) ──
            const currentData = allSheetsData[activeSheet];
            const lineItemId = currentData[11]?.[1] ? String(currentData[11][1]) : null;
            if (!lineItemId) throw new Error("Line Item ID not found in Excel");

            // ── Build payload from editable rows ──
            const payload: Record<string, any> = {
                report_type: previewReportType,
                line_item_id: lineItemId,
            };

            currentData.forEach((row, rIdx) => {
                const field = EDITABLE_ROW_MAP[rIdx];
                if (field && row[1] !== undefined && row[1] !== null) {
                    payload[field] = String(row[1]);
                }
            });

            // ── Call new save API ──
            const res = await fetch(
                `${BASE_URL}/save_excel_edits_to_db/${previewCampaignId}/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': '1',
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Save failed');
            }

            showToast("Saved to DB & Excel updated!");
            setShowPreview(false);
            fetchList();

        } catch (err: any) {
            showToast(err.message || "Failed to save.", "error");
        } finally {
            setSaving(false);
        }
    };
    // ── Download Excel ──────────────────────────────────────────────────────
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
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': '1',
                    },
                    body: JSON.stringify({ report_type: record.report_type }),
                }
            );
            if (!res.ok) throw new Error();

            // ✅ Update local state immediately
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
    // ── Filter ──────────────────────────────────────────────────────────────
    const filtered = campaigns.filter(c => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [c.campaign_id, c.campaign_name, c.client_name, c.client_id]
            .some(f => f?.toLowerCase().includes(q));
    });

    // ── Stats ───────────────────────────────────────────────────────────────
    const totalCount = campaigns.length;
    const generatedCount = campaigns.filter(c => c.excel_generated).length;
    const pendingCount = totalCount - generatedCount;

    // ── Columns ─────────────────────────────────────────────────────────────
    const columns: ColumnsType<CampaignRow> = [
        {
            title: "Campaign ID",
            dataIndex: "campaign_id",
            key: "campaign_id",
            width: 150,
            render: (v: string, record) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{
                        fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                        color: record.report_type === 'cpm' ? C.blue : C.teal,
                        background: record.report_type === 'cpm' ? C.blueLight : C.tealLight,
                        padding: "3px 8px", borderRadius: 6, display: "inline-block",
                    }}>{v}</span>
                </div>
            ),
        },
        {
            title: "Type",
            dataIndex: "report_type",
            key: "report_type",
            width: 130,
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
                    <div style={{ fontSize: 10, color: C.slate500, fontFamily: "monospace" }}>{record.client_id}</div>
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
                        background: C.greenLight, border: `1px solid ${C.greenMid}`,
                        fontSize: 11, fontWeight: 700, color: C.green,
                    }}>
                        <CheckCircleOutlined style={{ fontSize: 11 }} /> Generated
                    </span>
                </Tooltip>
            ) : (
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 20,
                    background: C.amberLight, border: "1px solid #FDE68A",
                    fontSize: 11, fontWeight: 700, color: C.amber,
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
                    background: C.greenLight, border: `1px solid ${C.greenMid}`,
                    fontSize: 11, fontWeight: 700, color: C.green,
                }}>
                    ✅ Published
                </span>
            ) : (
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 20,
                    background: '#F8FAFC', border: `1px solid ${C.border}`,
                    fontSize: 11, fontWeight: 700, color: C.slate500,
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

                        {/* ── NOT YET GENERATED: show only Generate button ── */}
                        {!record.excel_generated && (
                            <Button
                                size="small"
                                icon={<FileExcelOutlined />}
                                loading={isGenerating}
                                onClick={() => handleGenerate(record)}
                                style={{
                                    fontSize: 11, fontWeight: 600, height: 30,
                                    background: C.greenLight, color: C.green,
                                    border: `1px solid ${C.greenMid}`, borderRadius: 6,
                                }}
                            >
                                Generate
                            </Button>
                        )}

                        {/* ── GENERATED: show Preview, Download, Publish only ── */}
                        {record.excel_generated && (
                            <>
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview(record)}
                                    style={{
                                        fontSize: 11, fontWeight: 600, height: 30,
                                        background: C.amberLight, color: C.amber,
                                        border: "1px solid #FDE68A", borderRadius: 6,
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
                                        background: C.blueLight, color: C.blue,
                                        border: `1px solid ${C.blueMid}`, borderRadius: 6,
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
                                        background: C.blueLight, color: C.blue,
                                        border: `1px solid ${C.blueMid}`, borderRadius: 6,
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
        <>
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: C.slate }}>Reports</h1>
                <p style={{ fontSize: 11, color: C.slate500, marginTop: 1, letterSpacing: "0.04em", fontWeight: 500 }}>
                    GENERATE &amp; DOWNLOAD CAMPAIGN EXCEL REPORTS
                </p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                    { label: "Total Reports", value: totalCount, color: C.blue, bg: C.blueLight, icon: "📊" },
                    { label: "Excel Generated", value: generatedCount, color: C.green, bg: C.greenLight, icon: "✅" },
                    { label: "Pending", value: pendingCount, color: C.amber, bg: C.amberLight, icon: "⏳" },
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
                background: C.blueLight, border: `1px solid ${C.blueMid}`,
                borderRadius: 10, padding: "10px 16px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 12.5, color: C.blue, fontWeight: 500,
            }}>
                <FileExcelOutlined style={{ fontSize: 16 }} />
                Each campaign has two reports — <strong>CPM (Impressions)</strong> and <strong>CPC (Clicks)</strong>. Click <strong>Generate</strong>, then <strong>Preview</strong> to edit, then <strong>Download</strong>.
            </div>

            {/* Table */}
            <div style={{
                background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
                overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey={r => `${r.campaign_id_raw}_${r.report_type}`}
                    loading={loading}
                    scroll={{ x: 1300 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"],
                        showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} reports`,
                        style: { padding: "12px 16px" },
                    }}
                    style={{ fontSize: 13 }}
                    // Group rows visually by campaign
                    rowClassName={(record, index) => {
                        const prevRecord = filtered[index - 1];
                        return prevRecord && prevRecord.campaign_id_raw !== record.campaign_id_raw
                            ? 'campaign-group-start'
                            : '';
                    }}
                />
            </div>

            {/* Preview Modal */}
            {showPreview && (
                previewLoading ? (
                    <div style={{
                        position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
                        zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <div style={{
                            background: C.white, borderRadius: 16, padding: "40px 60px",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                        }}>
                            <Spin size="large" />
                            <span style={{ fontSize: 13, color: C.slate500, fontWeight: 500 }}>
                                Loading Excel…
                            </span>
                        </div>
                    </div>
                ) : (
                    <PreviewModal
                        open={showPreview}
                        editedData={allSheetsData[activeSheet] ?? []}   // ✅ active sheet data
                        sheetNames={sheetNames}
                        activeSheet={activeSheet}
                        onSheetChange={(name) => setActiveSheet(name)}   // ✅ switch sheet
                        campaignId={previewCampaignId}
                        reportType={previewReportType}
                        saving={saving}
                        onClose={() => setShowPreview(false)}
                        onSave={handleSaveEdits}
                        onChange={handleCellChange}
                    />
                )
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