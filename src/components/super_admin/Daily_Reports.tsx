import { useEffect, useState, useCallback, useRef } from "react";
import { Table, Input, Button, Modal, Form, DatePicker } from "antd";
import {
    SearchOutlined,
    ReloadOutlined,
    FilterOutlined,
    PlusOutlined,
    DownloadOutlined,
    UploadOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

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
    greenMid: "#86EFAC",
    amber: "#D97706",
    amberLight: "#FFFBEB",
    amberMid: "#FDE68A",
    purple: "#7C3AED",
    purpleLight: "#F5F3FF",
    purpleMid: "#DDD6FE",
    teal: "#0F766E",
    tealLight: "#F0FDFA",
    tealMid: "#99F6E4",
    red: "#DC2626",
    redLight: "#FEF2F2",
};

interface LineItemRow {
    _key: string;
    // rowspan helpers
    _campaignRowSpan: number;   // >0 for first row of a campaign group, 0 for rest
    _campaignIndex: number;     // which campaign group (for alternating bg)
    // campaign-level
    campaign_id: string;
    campaign_name: string;
    client_name: string;
    // line item-level
    line_item_id: string;
    line_item_name: string;
    start_date: string;
    end_date: string;
    ad_format: string;
    impressions: string;
    units: string;
    status: string;
    dv_id: string;  // ✅ ADD THIS
}

function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

function fmtImpressions(v?: string) {
    if (!v) return "—";
    const n = Number(v);
    return isNaN(n) ? v : n.toLocaleString("en-IN");
}

function resolveAdFormat(raw: string | string[] | undefined): string {
    if (!raw) return "—";
    if (Array.isArray(raw)) return raw.join(", ") || "—";
    return raw || "—";
}

function isVideoFormat(adFormat?: string): boolean {
    if (!adFormat) return false;
    return adFormat.toLowerCase().includes("video") || adFormat.toLowerCase().includes("youtube");
}

function getLineItemStatus(s: string, e: string): "active" | "upcoming" | "closed" {
    if (!s || !e) return "upcoming";
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(s);
    const end = new Date(e); end.setHours(23, 59, 59, 999);
    if (today > end) return "closed";
    if (today >= start) return "active";
    return "upcoming";
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: C.white, border: `1px solid ${type === "success" ? C.green : C.red}55`, borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 280 }}>
            <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{message}</span>
        </div>
    );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
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

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; border: string; color: string; label: string }> = {
        active: { bg: C.greenLight, border: C.greenMid, color: C.green, label: "Active" },
        upcoming: { bg: C.amberLight, border: C.amberMid, color: C.amber, label: "Upcoming" },
        closed: { bg: C.redLight, border: "#FECACA", color: C.red, label: "Closed" },
    };
    const s = map[status] ?? map.upcoming;
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            {s.label}
        </span>
    );
}

// ── Ad Format Badge ───────────────────────────────────────────────────────────
function AdFormatBadge({ format }: { format: string }) {
    if (!format || format === "—") return <span style={{ color: C.slate400 }}>—</span>;
    const colorMap: Record<string, { color: string; bg: string; border: string }> = {
        banner: { color: C.blue, bg: C.blueLight, border: C.blueMid },
        video: { color: C.purple, bg: C.purpleLight, border: C.purpleMid },
        youtube: { color: C.red, bg: C.redLight, border: "#FECACA" },
        interstitial: { color: C.teal, bg: C.tealLight, border: C.tealMid },
    };
    const base = format.split(" › ")[0].toLowerCase().trim();
    const st = colorMap[base] ?? { color: C.slate500, bg: C.slate100, border: C.border };
    return (
        <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 8, background: st.bg, border: `1px solid ${st.border}`, fontSize: 11, fontWeight: 600, color: st.color, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }} title={format}>
            {format}
        </span>
    );
}

// ── CAMPAIGN GROUP CELL (renders merged Campaign ID + Name + client) ───────────
function CampaignGroupCell({ record }: { record: LineItemRow }) {
    // alternating group background
    const isEven = record._campaignIndex % 2 === 0;
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "4px 0",
            paddingLeft: 10,
        }}>
            {/* Campaign ID badge */}
            <span style={{
                fontFamily: "monospace",
                fontSize: 12,
                fontWeight: 700,
                color: C.blue,
                background: C.blueLight,
                padding: "3px 8px",
                borderRadius: 6,
                border: `1px solid ${isEven ? C.blueMid : C.purpleMid}`,
                display: "inline-block",
                alignSelf: "flex-start",
            }}>
                {record.campaign_id}
            </span>
        </div>
    );
}

// ── CAMPAIGN DOWNLOAD CELL (one download button per campaign group, merged like CampaignGroupCell) ───
function CampaignDownloadCell({ record, onDownload }: { record: LineItemRow; onDownload: (campaignId: string) => void }) {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "4px 0",
            paddingLeft: 10,
        }}>
            <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => onDownload(record.campaign_id)}
                style={{
                    height: 28,
                    borderRadius: 6,
                    border: `1px solid ${C.blueMid}`,
                    background: C.blueLight,
                    color: C.purple,
                    fontSize: 11,
                    fontWeight: 600,
                    alignSelf: "flex-start",
                }}
            >
                Download
            </Button>
        </div>
    );
}

function AddReportModal({
    open,
    record,
    onClose,
    onSubmit,
    disabledDates, // NEW
}: {
    open: boolean;
    record: LineItemRow | null;
    onClose: () => void;
    onSubmit: (values: { date: string; impressions: number; clicks: number; ctr: number; viewable_impression: number; measurable_impression: number; video_start: number; video_end: number; revenue: number; media_cost: number; vcr?: number; viewability?: number; }) => void;
    disabledDates: string[]; // NEW — array of "YYYY-MM-DD" already used for this line item
}) {
    const [form] = Form.useForm();
    const isVideo = isVideoFormat(record?.ad_format); // ✅ NEW

    useEffect(() => {
        if (open) form.resetFields();
    }, [open, form]);

    const handleOk = () => {
        form.validateFields().then((values) => {
            onSubmit({
                date: values.date.format("YYYY-MM-DD"),
                impressions: values.impressions,
                clicks: values.clicks,
                ctr: values.ctr,
                viewable_impression: values.viewable_impression,
                measurable_impression: values.measurable_impression,
                video_start: values.video_start,
                video_end: values.video_end,
                revenue: values.revenue,
                media_cost: values.media_cost,
                // ✅ NEW — only include when video format
                ...(isVideo ? { vcr: values.vcr, viewability: values.viewability } : {}),
            });

            form.resetFields();
        });
    };

    // NEW: block any date already submitted, and block outside the line item's start/end range
    const isDateDisabled = (current: any) => {
        if (!current) return false;
        const dateStr = current.format("YYYY-MM-DD");
        if (disabledDates.includes(dateStr)) return true;
        if (record?.start_date && current.isBefore(record.start_date, "day")) return true;
        if (record?.end_date && current.isAfter(record.end_date, "day")) return true;
        return false;
    };

    return (
        <Modal
            title={
                <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: C.slate, letterSpacing: "-0.2px" }}>
                        Add Daily Entry
                    </div>
                    {record && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                            <span style={{
                                fontFamily: "monospace",
                                fontSize: 11,
                                fontWeight: 700,
                                color: C.purple,
                                background: C.purpleLight,
                                padding: "2px 8px",
                                borderRadius: 6,
                                border: `1px solid ${C.purpleMid}`,
                            }}>
                                {record.line_item_id}
                            </span>
                            <span style={{ fontSize: 12, color: C.slate500, fontWeight: 500 }}>
                                {record.line_item_name}
                            </span>
                        </div>
                    )}
                </div>
            }
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            okText="Save"
            cancelText="Cancel"
            destroyOnClose
            centered
            width={700}
            styles={{
                header: { borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 4 },
                body: { background: C.bg, padding: 16, borderRadius: 8 },
                footer: { borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 8 },
            }}
            okButtonProps={{
                style: {
                    height: 38,
                    borderRadius: 8,
                    background: C.blue,
                    fontWeight: 600,
                    fontSize: 13,
                    paddingInline: 20,
                    boxShadow: "none",
                },
            }}
            cancelButtonProps={{
                style: {
                    height: 38,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    color: C.slate700,
                    fontWeight: 600,
                    fontSize: 13,
                    paddingInline: 18,
                },
            }}
        >
            <Form form={form} layout="vertical" style={{ marginTop: 1 }} requiredMark="optional">
                <Form.Item
                    label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>Date</span>}
                    name="date"
                    rules={[{ required: true, message: "Please select a date" }]}
                    style={{ marginBottom: 16 }}
                >
                    <DatePicker
                        style={{ width: "100%", height: 40, borderRadius: 8, border: `1px solid ${C.border}` }}
                        format="DD-MMM-YYYY"
                        placeholder="Select date"
                        disabledDate={isDateDisabled}
                    />
                </Form.Item>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Form.Item
                        label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>Impressions</span>}
                        name="impressions"
                        rules={[
                            { required: true, message: "Required" },
                            { pattern: /^[0-9]+$/, message: "Numbers only" },
                        ]}
                        style={{ marginBottom: 16 }}
                    >
                        <Input
                            placeholder="e.g. 50000"
                            inputMode="numeric"
                            style={{
                                height: 40,
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                fontFamily: "monospace",
                                fontSize: 13,
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>Clicks</span>}
                        name="clicks"
                        rules={[
                            { required: true, message: "Required" },
                            { pattern: /^[0-9]+$/, message: "Numbers only" },
                        ]}
                        style={{ marginBottom: 16 }}
                    >
                        <Input
                            placeholder="e.g. 1200"
                            inputMode="numeric"
                            style={{
                                height: 40,
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                fontFamily: "monospace",
                                fontSize: 13,
                            }}
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>CTR (%)</span>}
                    name="ctr"
                    rules={[
                        { required: true, message: "Please enter CTR" },
                        { pattern: /^[0-9]+(\.[0-9]{1,2})?$/, message: "Enter a valid number" },
                    ]}
                    style={{ marginBottom: 4 }}
                >
                    <Input
                        placeholder="e.g. 2.45"
                        inputMode="decimal"
                        suffix={<span style={{ color: C.slate400, fontSize: 12, fontWeight: 600 }}>%</span>}
                        style={{
                            height: 40,
                            borderRadius: 8,
                            border: `1px solid ${C.border}`,
                            fontFamily: "monospace",
                            fontSize: 13,
                        }}
                    />
                </Form.Item>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Form.Item
                        label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>Viewable Impressions</span>}
                        name="viewable_impression"
                        rules={[
                            { required: true, message: "Required" },
                            { pattern: /^[0-9]+$/, message: "Numbers only" },
                        ]}
                        style={{ marginBottom: 16 }}
                    >
                        <Input
                            placeholder="e.g. 2000"
                            inputMode="numeric"
                            style={{
                                height: 40,
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                fontFamily: "monospace",
                                fontSize: 13,
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>Measurable Impression</span>}
                        name="measurable_impression"
                        rules={[
                            { required: true, message: "Required" },
                            { pattern: /^[0-9]+$/, message: "Numbers only" },
                        ]}
                        style={{ marginBottom: 16 }}
                    >
                        <Input
                            placeholder="e.g. 1000"
                            inputMode="numeric"
                            style={{
                                height: 40,
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                fontFamily: "monospace",
                                fontSize: 13,
                            }}
                        />
                    </Form.Item>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Form.Item
                        label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>Video Start</span>}
                        name="video_start"
                        rules={[
                            { required: true, message: "Required" },
                            { pattern: /^[0-9]+$/, message: "Numbers only" },
                        ]}
                        style={{ marginBottom: 16 }}
                    >
                        <Input
                            placeholder="e.g. 1000"
                            inputMode="numeric"
                            style={{
                                height: 40,
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                fontFamily: "monospace",
                                fontSize: 13,
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>Video End</span>}
                        name="video_end"
                        rules={[
                            { required: true, message: "Required" },
                            { pattern: /^[0-9]+$/, message: "Numbers only" },
                        ]}
                        style={{ marginBottom: 16 }}
                    >
                        <Input
                            placeholder="e.g. 1000"
                            inputMode="numeric"
                            style={{
                                height: 40,
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                fontFamily: "monospace",
                                fontSize: 13,
                            }}
                        />
                    </Form.Item>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Form.Item
                        label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>Revenue (Adv Currency)</span>}
                        name="revenue"
                        rules={[
                            { required: true, message: "Required" },
                            { pattern: /^[0-9]+$/, message: "Numbers only" },
                        ]}
                        style={{ marginBottom: 16 }}
                    >
                        <Input
                            placeholder="e.g. 5000"
                            inputMode="numeric"
                            style={{
                                height: 40,
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                fontFamily: "monospace",
                                fontSize: 13,
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>Media Cost (Advertiser Currency)</span>}
                        name="media_cost"
                        rules={[
                            { required: true, message: "Required" },
                            { pattern: /^[0-9]+$/, message: "Numbers only" },
                        ]}
                        style={{ marginBottom: 16 }}
                    >
                        <Input
                            placeholder="e.g. 5000"
                            inputMode="numeric"
                            style={{
                                height: 40,
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                fontFamily: "monospace",
                                fontSize: 13,
                            }}
                        />
                    </Form.Item>
                </div>

                {/* ✅ NEW — only shown when ad format is video */}
                {isVideo && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Form.Item
                            label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>Video Completion Rate (VCR)</span>}
                            name="vcr"
                            rules={[
                                { required: true, message: "Required" },
                                { pattern: /^[0-9]+(\.[0-9]{1,2})?$/, message: "Enter a valid number" },
                            ]}
                            style={{ marginBottom: 16 }}
                        >
                            <Input
                                placeholder="e.g. 65.5"
                                inputMode="decimal"
                                suffix={<span style={{ color: C.slate400, fontSize: 12, fontWeight: 600 }}>%</span>}
                                style={{
                                    height: 40,
                                    borderRadius: 8,
                                    border: `1px solid ${C.border}`,
                                    fontFamily: "monospace",
                                    fontSize: 13,
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={{ fontSize: 12, fontWeight: 700, color: C.slate700, letterSpacing: "0.02em" }}>Viewability</span>}
                            name="viewability"
                            rules={[
                                { required: true, message: "Required" },
                                { pattern: /^[0-9]+(\.[0-9]{1,2})?$/, message: "Enter a valid number" },
                            ]}
                            style={{ marginBottom: 16 }}
                        >
                            <Input
                                placeholder="e.g. 72.3"
                                inputMode="decimal"
                                suffix={<span style={{ color: C.slate400, fontSize: 12, fontWeight: 600 }}>%</span>}
                                style={{
                                    height: 40,
                                    borderRadius: 8,
                                    border: `1px solid ${C.border}`,
                                    fontFamily: "monospace",
                                    fontSize: 13,
                                }}
                            />
                        </Form.Item>
                    </div>
                )}
            </Form>
        </Modal>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Daily_Reports() {
    const [rows, setRows] = useState<LineItemRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "upcoming" | "closed">("all");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // ── Add modal state ──
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<LineItemRow | null>(null);
    const [usedDatesByLineItem, setUsedDatesByLineItem] = useState<Record<string, string[]>>({}); // NEW

    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [bulkSelectedFile, setBulkSelectedFile] = useState<File | null>(null); // NEW — staged file
    const [bulkResult, setBulkResult] = useState<null | {
        inserted: number; skipped: number; errors: number;
        details: { inserted: any[]; skipped: any[]; errors: any[] };
    }>(null);
    const bulkFileRef = useRef<HTMLInputElement>(null);

    const openAddModal = (record: LineItemRow) => {
        setSelectedRecord(record);
        setAddModalOpen(true);
    };

    const closeAddModal = () => {
        setAddModalOpen(false);
        setSelectedRecord(null);
    };

    const handleAddSubmit = async (values: {
        date: string; impressions: number; clicks: number; ctr: number; viewable_impression: number; measurable_impression: number; video_start: number; video_end: number; revenue: number; media_cost: number; vcr?: number; viewability?: number;
    }) => {
        if (!selectedRecord) return;

        try {
            const res = await fetch(
                `${BASE_URL}/add_daily_entry/${selectedRecord.campaign_id}/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "1",
                    },
                    body: JSON.stringify({
                        line_item_id: selectedRecord.line_item_id,
                        date: values.date,
                        impressions: values.impressions,
                        clicks: values.clicks,
                        ctr: values.ctr,
                        // ✅ ADD THESE
                        viewable_impression: values.viewable_impression,
                        measurable_impression: values.measurable_impression,
                        video_start: values.video_start,
                        video_end: values.video_end,
                        revenue: values.revenue,
                        media_cost: values.media_cost,
                        // ✅ NEW — only present when video format was active
                        ...(values.vcr !== undefined ? { vcr: values.vcr } : {}),
                        ...(values.viewability !== undefined ? { viewability: values.viewability } : {}),
                    }),
                }
            );

            const data = await res.json();

            if (res.status === 409) {
                showToast(data.error || "Entry already exists for this date.", "error");
                return;
            }

            if (!res.ok) {
                showToast(data.error || "Failed to add entry.", "error");
                return;
            }

            showToast("Entry added successfully.", "success");
            setUsedDatesByLineItem(prev => ({
                ...prev,
                [selectedRecord.line_item_id]: [...(prev[selectedRecord.line_item_id] || []), values.date],
            }));
            closeAddModal();
        } catch {
            showToast("Failed to add entry. Check your connection.", "error");
        }
    };

    const handleDownloadCampaignExcel = (campaignId: string) => {
        window.open(`${BASE_URL}/download_daily_report_excel/${campaignId}/`, "_blank");
    };


    // Step 1: just stage the file, NO network call here
    const handleBulkFileSelect = (file: File) => {
        setBulkResult(null);
        setBulkSelectedFile(file);
    };

    // Step 2: only this triggers the actual upload, called from the Upload button
    const handleBulkUploadConfirm = async () => {
        if (!bulkSelectedFile) return;

        setBulkUploading(true);
        setBulkResult(null);

        const formData = new FormData();
        formData.append("file", bulkSelectedFile);

        try {
            const res = await fetch(`${BASE_URL}/bulk_upload_daily_entries/`, {
                method: "POST",
                headers: { "ngrok-skip-browser-warning": "1" },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || "Bulk upload failed.", "error");
            } else {
                setBulkResult(data);
                if (data.inserted > 0) fetchData(); // refresh table
            }
        } catch {
            showToast("Bulk upload failed. Check your connection.", "error");
        } finally {
            setBulkUploading(false);
        }
    };

    const clearBulkSelection = () => {
        setBulkSelectedFile(null);
        setBulkResult(null);
        if (bulkFileRef.current) bulkFileRef.current.value = "";
    };

    const showToast = (msg: string, type: "success" | "error" = "success") =>
        setToast({ message: msg, type });

    // ── Fetch & flatten ─────────────────────────────────────────────────────
    const fetchData = useCallback(() => {
        setLoading(true);
        fetch(`${BASE_URL}/get_campaigns/`, {
            headers: { "ngrok-skip-browser-warning": "1" },
        })
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then((data: any[]) => {
                const campaigns = Array.isArray(data) ? data : [];
                const flatRows: LineItemRow[] = [];
                const campaignIds = new Set<string>();

                campaigns.forEach((campaign: any, campaignIndex: number) => {
                    if (campaign.campaign_id) campaignIds.add(campaign.campaign_id);
                    const lineItems: any[] = Array.isArray(campaign.line_items) ? campaign.line_items : [];
                    const liCount = lineItems.length;

                    lineItems.forEach((li: any, liIndex: number) => {
                        flatRows.push({
                            _key: `${campaign.campaign_id}_${li.line_item_id}_${liIndex}`,
                            _campaignRowSpan: liIndex === 0 ? liCount : 0,
                            _campaignIndex: campaignIndex,
                            campaign_id: campaign.campaign_id || "—",
                            campaign_name: campaign.campaign_name || "—",
                            client_name: campaign.client_name || "—",
                            line_item_id: li.line_item_id || "—",
                            line_item_name: li.line_item_name || li.lineItemName || "—",
                            start_date: li.start_date || "",
                            end_date: li.end_date || "",
                            ad_format: resolveAdFormat(li.ad_format),
                            impressions: li.impressions || "",
                            units: li.units || "",
                            status: getLineItemStatus(li.start_date || "", li.end_date || ""),
                            dv_id: li.dv_id || "",  // ✅ ADD THIS
                        });
                    });
                });

                setRows(flatRows);

                // NEW: pull already-submitted entries for every campaign so Add buttons stay disabled after reload
                Promise.all(
                    Array.from(campaignIds).map(cid =>
                        fetch(`${BASE_URL}/get_daily_entries/${cid}/`, {
                            headers: { "ngrok-skip-browser-warning": "1" },
                        })
                            .then(r => (r.ok ? r.json() : []))
                            .catch(() => [])
                    )
                ).then(results => {
                    const map: Record<string, string[]> = {};
                    results.flat().forEach((entry: any) => {
                        if (!map[entry.line_item_id]) map[entry.line_item_id] = [];
                        map[entry.line_item_id].push(entry.date); // "YYYY-MM-DD"
                    });
                    setUsedDatesByLineItem(map);
                });
            })
            .catch(() => showToast("Failed to load line items.", "error"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Search filter (re-compute rowspans after filtering) ─────────────────
    const preFiltered = rows.filter(r => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            return [r.campaign_id, r.campaign_name, r.client_name, r.line_item_id, r.line_item_name, r.ad_format]
                .some(f => f?.toLowerCase().includes(q));
        }
        return true;
    });

    // Recompute rowspans after filtering so merged cells stay correct
    const filtered: LineItemRow[] = [];
    const seenCampaigns = new Map<string, number>(); // campaign_id → index in filtered where first row sits

    preFiltered.forEach(row => {
        const cid = row.campaign_id;
        if (!seenCampaigns.has(cid)) {
            seenCampaigns.set(cid, filtered.length);
            filtered.push({ ...row, _campaignRowSpan: 1 });
        } else {
            const firstIdx = seenCampaigns.get(cid)!;
            filtered[firstIdx] = { ...filtered[firstIdx], _campaignRowSpan: filtered[firstIdx]._campaignRowSpan + 1 };
            filtered.push({ ...row, _campaignRowSpan: 0 });
        }
    });

    // Stats
    const totalCount = rows.length;
    const activeCount = rows.filter(r => r.status === "active").length;
    const upcomingCount = rows.filter(r => r.status === "upcoming").length;
    const closedCount = rows.filter(r => r.status === "closed").length;

    // Filter pills
    const filterPills = [
        { key: "all" as const, label: `All (${totalCount})`, color: C.slate500, bg: C.slate100, border: C.border },
        { key: "active" as const, label: `Active (${activeCount})`, color: C.green, bg: C.greenLight, border: C.greenMid },
        { key: "upcoming" as const, label: `Upcoming (${upcomingCount})`, color: C.amber, bg: C.amberLight, border: C.amberMid },
        { key: "closed" as const, label: `Closed (${closedCount})`, color: C.red, bg: C.redLight, border: "#FECACA" },
    ];

    // ── Columns ─────────────────────────────────────────────────────────────
    const columns: ColumnsType<LineItemRow> = [
        {
            title: "Campaign ID",
            key: "campaign",
            width: 120,
            fixed: "left",
            onCell: (record) => ({ rowSpan: record._campaignRowSpan }),
            render: (_: any, record: LineItemRow) =>
                record._campaignRowSpan > 0 ? <CampaignGroupCell record={record} /> : null,
        },
        {
            title: "Line Item ID",
            dataIndex: "line_item_id",
            key: "line_item_id",
            width: 150,
            render: (v: string) => (
                <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: C.purple, background: C.purpleLight, padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.purpleMid}`, display: "inline-block" }}>
                    {v}
                </span>
            ),
        },
        {
            title: "DV ID",
            dataIndex: "dv_id",
            key: "dv_id",
            width: 150,
            render: (v: string) => v ? (
                <span style={{
                    fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                    color: "#4F46E5", background: "#EEF2FF",
                    padding: "3px 8px", borderRadius: 6,
                    border: "1px solid #C7D2FE", display: "inline-block"
                }}>
                    {v}
                </span>
            ) : (
                <span style={{ color: C.slate400, fontSize: 12 }}>—</span>
            ),
        },
        {
            title: "Line Item Name",
            dataIndex: "line_item_name",
            key: "line_item_name",
            width: 200,
            render: (v: string) => (
                <span style={{ fontSize: 13, fontWeight: 500, color: C.slate700 }}>{v}</span>
            ),
        },
        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",
            width: 120,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>,
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            width: 120,
            render: (v: string) => <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span>,
        },
        {
            title: "Ad Format",
            dataIndex: "ad_format",
            key: "ad_format",
            width: 190,
            render: (v: string) => <AdFormatBadge format={v} />,
        },
        {
            title: "Impressions",
            dataIndex: "impressions",
            key: "impressions",
            width: 140,
            render: (v: string, record: LineItemRow) => (
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.slate, fontFamily: "monospace" }}>
                        {fmtImpressions(v)}
                    </div>
                    {record.units && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, textTransform: "uppercase" as const, background: record.units === "CPM" ? C.blueLight : C.tealLight, color: record.units === "CPM" ? C.blue : C.teal, border: `1px solid ${record.units === "CPM" ? C.blueMid : C.tealMid}`, marginTop: 3, display: "inline-block" }}>
                            {record.units}
                        </span>
                    )}
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 110,
            render: (v: string) => <StatusBadge status={v} />,
        },
        {
            title: "Actions",
            key: "actions",
            width: 100,
            fixed: "right",
            render: (_: any, record: LineItemRow) => (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => openAddModal(record)}
                        style={{ height: 28, borderRadius: 6, border: `1px solid ${C.blueMid}`, background: C.blueLight, color: C.blue, fontSize: 11, fontWeight: 600 }}
                    >
                        Add
                    </Button>
                </div>
            ),
        },
        {
            title: "Download",
            key: "download",
            width: 130,
            fixed: "right",
            onCell: (record) => ({ rowSpan: record._campaignRowSpan }), // NEW: merge across the campaign group
            render: (_: any, record: LineItemRow) =>
                record._campaignRowSpan > 0 ? (
                    <CampaignDownloadCell record={record} onDownload={handleDownloadCampaignExcel} />
                ) : null,
        },
    ];

    return (
        <>
            {/* Header */}
            <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 16, }}>
                <div>
                    <h1 style={{ fontSize: 18, fontWeight: 700, color: C.slate, margin: 0 }}>Daily Reports</h1>
                    <p style={{ fontSize: 11, color: C.slate500, marginTop: 4, letterSpacing: "0.04em", fontWeight: 500 }}>
                        ALL LINE ITEMS ACROSS CAMPAIGNS
                    </p>
                </div>
                <Button
                    icon={<span style={{ fontSize: 15 }}>📤</span>}
                    onClick={() => setBulkModalOpen(true)}
                    style={{
                        height: 38, borderRadius: 8,
                        border: `1px solid ${C.greenMid}`,
                        background: C.blue, color: C.white,
                        fontWeight: 600, fontSize: 13,
                    }}
                >
                    Bulk Upload
                </Button>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                <StatCard label="Total Line Items" value={totalCount} color={C.blue} bg={C.blueLight} icon="📋" />
                <StatCard label="Active" value={activeCount} color={C.green} bg={C.greenLight} icon="🟢" />
                <StatCard label="Upcoming" value={upcomingCount} color={C.amber} bg={C.amberLight} icon="⏳" />
                <StatCard label="Closed" value={closedCount} color={C.red} bg={C.redLight} icon="🔴" />
            </div>

            {/* Filters */}
            <div style={{ background: C.white, borderRadius: 12, padding: "14px 18px", border: `1px solid ${C.border}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Input
                    placeholder="Search by campaign ID, name, line item, format…"
                    prefix={<SearchOutlined style={{ color: C.slate500 }} />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    allowClear
                    style={{ flex: 1, minWidth: 260, height: 36 }}
                />
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <FilterOutlined style={{ color: C.slate500, fontSize: 13 }} />
                    {filterPills.map(pill => (
                        <button key={pill.key} onClick={() => setStatusFilter(pill.key)} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${statusFilter === pill.key ? pill.border : C.border}`, background: statusFilter === pill.key ? pill.bg : C.white, color: statusFilter === pill.key ? pill.color : C.slate500, fontSize: 11, fontWeight: 700, cursor: "pointer", outline: "none", transition: "all 0.15s" }}>
                            {pill.label}
                        </button>
                    ))}
                </div>
                <Button onClick={fetchData} icon={<ReloadOutlined />} style={{ height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.slate500, fontSize: 12, fontWeight: 600 }}>
                    Refresh
                </Button>
                <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>
                    {filtered.length} of {rows.length} line items
                </span>
            </div>

            {/* Table */}
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="_key"
                    loading={loading}
                    scroll={{ x: 1530 }}
                    pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ["20", "50", "100"], showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} line items`, style: { padding: "12px 16px" } }}
                    style={{ fontSize: 13 }}
                    rowClassName={(record) => {
                        const isEven = record._campaignIndex % 2 === 0;
                        return `dr-row ${record.status === "closed" ? "dr-row-closed" : ""} ${isEven ? "dr-group-even" : "dr-group-odd"}`;
                    }}
                    bordered
                />
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <AddReportModal
                open={addModalOpen}
                record={selectedRecord}
                onClose={closeAddModal}
                onSubmit={handleAddSubmit}
                disabledDates={selectedRecord ? (usedDatesByLineItem[selectedRecord.line_item_id] || []) : []}
            />

            {/* Bulk Upload Modal */}

            {/* Bulk Upload Modal */}
            <Modal
                title={<span style={{ fontSize: 16, fontWeight: 700, color: C.slate }}>📤 Bulk Upload Daily Entries</span>}
                open={bulkModalOpen}
                onCancel={() => {
                    setBulkModalOpen(false);
                    clearBulkSelection();
                }}
                footer={null}
                centered
                width={560}
                destroyOnClose
            >
                {/* Instructions */}
                <div style={{ background: C.blueLight, border: `1px solid ${C.blueMid}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.blue }}>
                    <strong>Accepted files:</strong> .csv or .xlsx (DV360 export format)<br />
                    <strong>Required columns:</strong> Campaign, Line Item ID, Date, Impressions, Clicks, Click Rate (CTR), Revenue (Adv Currency), Media Cost (Advertiser Currency), Start Views, Complete Views, Viewable Impressions, Measurable Impressions
                </div>

                {/* File input (hidden) — now accepts .csv too */}
                <input
                    ref={bulkFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: "none" }}
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleBulkFileSelect(file);
                    }}
                />

                {/* Step 1: Select file — only stages it, does NOT upload */}
                <Button
                    icon={<span>📂</span>}
                    onClick={() => bulkFileRef.current?.click()}
                    disabled={bulkUploading}
                    style={{
                        width: "100%", height: 44, borderRadius: 8,
                        border: `1px solid ${C.border}`, background: C.white,
                        fontSize: 13, fontWeight: 600, color: C.slate700, marginBottom: 12,
                    }}
                >
                    {bulkSelectedFile ? "Change File (.csv / .xlsx)" : "Select File (.csv / .xlsx)"}
                </Button>

                {/* Step 2: Shown only after a file is selected — Upload triggers the real request */}
                {bulkSelectedFile && (
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: C.slate100, border: `1px solid ${C.border}`, borderRadius: 8,
                        padding: "10px 14px", marginBottom: 16, gap: 10,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                            <span style={{ fontSize: 16 }}>📄</span>
                            <span style={{
                                fontSize: 12, fontWeight: 600, color: C.slate700,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                                {bulkSelectedFile.name}
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            <Button
                                size="small"
                                onClick={clearBulkSelection}
                                disabled={bulkUploading}
                                style={{ height: 30, borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, color: C.slate500 }}
                            >
                                Remove
                            </Button>
                            <Button
                                size="small"
                                type="primary"
                                icon={<UploadOutlined />}
                                loading={bulkUploading}
                                onClick={handleBulkUploadConfirm}
                                style={{ height: 30, borderRadius: 6, background: C.blue, border: "none", fontSize: 11, fontWeight: 700 }}
                            >
                                {bulkUploading ? "Uploading…" : "Upload"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Results */}
                {bulkResult && (
                    <div>
                        {/* Summary */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                            <div style={{ textAlign: "center", padding: "10px", background: C.greenLight, borderRadius: 8, border: `1px solid ${C.greenMid}` }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{bulkResult.inserted}</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: C.green }}>Inserted</div>
                            </div>
                            <div style={{ textAlign: "center", padding: "10px", background: C.amberLight, borderRadius: 8, border: `1px solid ${C.amberMid}` }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: C.amber }}>{bulkResult.skipped}</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: C.amber }}>Skipped</div>
                            </div>
                            <div style={{ textAlign: "center", padding: "10px", background: C.redLight, borderRadius: 8, border: `1px solid #FECACA` }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: C.red }}>{bulkResult.errors}</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: C.red }}>Errors</div>
                            </div>
                        </div>

                        {/* Error details */}
                        {bulkResult.details.errors.length > 0 && (
                            <div style={{ maxHeight: 180, overflowY: "auto", background: C.redLight, borderRadius: 8, border: `1px solid #FECACA`, padding: "8px 12px" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 6 }}>Error Details:</div>
                                {bulkResult.details.errors.map((e: any, i: number) => (
                                    <div key={i} style={{ fontSize: 11, color: C.red, marginBottom: 3 }}>
                                        Row {e.row}: {e.reason} — <span style={{ fontFamily: "monospace" }}>{e.data}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Skipped details */}
                        {bulkResult.details.skipped.length > 0 && (
                            <div style={{ maxHeight: 120, overflowY: "auto", background: C.amberLight, borderRadius: 8, border: `1px solid ${C.amberMid}`, padding: "8px 12px", marginTop: 8 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, marginBottom: 6 }}>Skipped (already exist):</div>
                                {bulkResult.details.skipped.map((s: any, i: number) => (
                                    <div key={i} style={{ fontSize: 11, color: C.amber, marginBottom: 3 }}>
                                        Row {s.row}: <span style={{ fontFamily: "monospace" }}>{s.data}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <style>{`
                .ant-table-thead > tr > th {
                    background: #F1F5F9 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: #64748B !important;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    border-right: 1px solid #E2E8F0 !important;
                }
                .dr-row:hover td { background: #F0F7FF !important; }
                .dr-row-closed td { opacity: 0.72; }
                .dr-row-closed:hover td { background: #FEF2F2 !important; opacity: 1; }
                .dr-group-even td { background: #FFFFFF; }
                .dr-group-odd td { background: #FAFBFF; }
                /* Thick bottom border between campaign groups */
                .ant-table-tbody > tr.dr-row td {
                    border-right: 1px solid #E2E8F0;
                }
            `}</style>
        </>
    );
}