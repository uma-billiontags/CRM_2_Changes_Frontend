import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table, Tag, Badge, Button, Input, Select, Modal, Form,
    DatePicker, message, Divider,Tabs
} from "antd";
import {
    SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined,
    PlusOutlined, DeleteOutlined, FileImageOutlined, 
    CloudUploadOutlined, SaveOutlined, InfoCircleOutlined,
    CodeOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Option } = Select;
const BASE_URL = "http://127.0.0.1:8000";

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
    indigo: "#4F46E5",
    indigoLight: "#EEF2FF",
};

const STATUS_STYLE: Record<string, { bg: string; border: string; color: string; dot: string }> = {
    live: { bg: C.greenLight, border: "#BBF7D0", color: C.green, dot: C.green },
    active: { bg: C.blueLight, border: C.blueMid, color: C.blue, dot: C.blue },
    paused: { bg: C.amberLight, border: "#FDE68A", color: C.amber, dot: C.amber },
    pending: { bg: C.amberLight, border: "#FDE68A", color: C.amber, dot: C.amber },
    draft: { bg: C.slate100, border: C.border, color: C.slate500, dot: C.slate400 },
    completed: { bg: C.purpleLight, border: C.purpleMid, color: C.purple, dot: C.purple },
    cancelled: { bg: C.redLight, border: "#FECACA", color: C.red, dot: C.red },
};

// ── Constants matching Campaign_Create ───────────────────────────────────────
const AD_FORMAT_OPTIONS = [
    { value: "banner", label: "Banner" },
    { value: "video", label: "Video" },
    { value: "youtube", label: "Youtube" },
    { value: "Interstitial", label: "Interstitial" },
];

const ETHNICITY_OPTIONS = [
    "General", "Asian", "South Asian", "African American",
    "Hispanic / Latino", "Middle Eastern", "Caucasian", "Other",
];

const CPM_RATES: Record<string, number> = { banner: 1, Interstitial: 1, video: 1.25, youtube: 1.25 };
const CPC_RATES: Record<string, number> = { banner: 1, Interstitial: 1, video: 1.25, youtube: 1.25 };

// ── Types ─────────────────────────────────────────────────────────────────────
interface EditableCreative {
    key: string;
    type: "standard" | "third_party";
    creative_name: string;
    dimensions: string;
    aspect_ratio: string;
    file_size: string;
    click_through_url: string;
    appended_html_tag: string;
    integration_code: string;
    notes: string;
    main_asset: File | null;
    backup_image: File | null;
    // existing (already saved, no new file)
    isExisting?: boolean;
}

interface EditableLineItem {
    key: string;
    line_item_id: string;
    line_item_name: string;
    ethnicity: string[];
    start_date: string;
    end_date: string;
    ad_format: string;
    impressions: string;
    units: string;
    ctr: string;
    viewability: string;
    vcr: string;
    kpi_notes: string;
    unit_cost: string;
    unit_value: string;
    creatives: EditableCreative[];
}

interface GeoLocation {
    country?: string;
    state?: string;
    city?: string;
    zipcode?: string;
    range?: string;
}

interface Creative {
    creative_name?: string;
    dimensions?: string;
    aspect_ratio?: string;
    file_size?: string;
    click_through_url?: string;
    appended_html_tag?: string;
    integration_code?: string;
    notes?: string;
    type?: string;
}

interface LineItem {
    line_item_id: string;
    line_item_name?: string;
    lineItemName?: string;
    start_date?: string;
    end_date?: string;
    ad_format?: string | string[];
    impressions?: string;
    units?: string;
    ctr?: string;
    viewability?: string;
    vcr?: string;
    kpi_notes?: string;
    unit_cost?: string;
    unit_value?: string;
    ethnicity?: string[];
    status?: string;
    creatives?: Creative[];
    third_party_creatives?: Creative[];
}

interface Campaign {
    campaign_id: string;
    client_campaign_ID?: string;
    purchase_order_ID?: string;
    campaign_name: string;
    client_name: string;
    client?: string;
    client_id?: string;
    advertiser?: string;
    website_url?: string;
    campaign_type?: string;
    buying_type?: string;
    objective?: string;
    notes?: string;
    start_date?: string;
    end_date?: string;
    created_at: string;
    status?: string;
    age?: string;
    gender?: string;
    platforms?: string;
    frequency_cap?: string;
    brand_safety?: string;
    viewability_goal?: string;
    geo_targeting?: GeoLocation[] | string;
    line_items?: LineItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isActiveCampaign(c: Campaign): boolean {
    if (!c.start_date || !c.end_date) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(c.start_date);
    const end = new Date(c.end_date); end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
}

function isClosedCampaign(c: Campaign): boolean {
    if (!c.end_date) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(c.end_date); end.setHours(23, 59, 59, 999);
    return today > end;
}

function fmtDate(v?: string) {
    if (!v) return "—";
    return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function makeCreativeKey() {
    return `cr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function makeLineItemKey() {
    return `li_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function emptyCreative(type: "standard" | "third_party" = "standard"): EditableCreative {
    return {
        key: makeCreativeKey(), type,
        creative_name: "", dimensions: "", aspect_ratio: "", file_size: "",
        click_through_url: "", appended_html_tag: "", integration_code: "", notes: "",
        main_asset: null, backup_image: null, isExisting: false,
    };
}

function emptyLineItem(): EditableLineItem {
    return {
        key: makeLineItemKey(), line_item_id: "", line_item_name: "",
        ethnicity: [], start_date: "", end_date: "", ad_format: "",
        impressions: "", units: "", ctr: "0.4", viewability: "70", vcr: "70",
        kpi_notes: "", unit_cost: "", unit_value: "", creatives: [],
    };
}

function apiLineItemToEditable(li: LineItem): EditableLineItem {
    const allCreatives: EditableCreative[] = [
        ...(li.creatives || []).map(c => ({
            key: makeCreativeKey(), type: "standard" as const,
            creative_name: c.creative_name || "", dimensions: c.dimensions || "",
            aspect_ratio: c.aspect_ratio || "", file_size: c.file_size || "",
            click_through_url: c.click_through_url || "",
            appended_html_tag: c.appended_html_tag || "",
            integration_code: c.integration_code || "", notes: c.notes || "",
            main_asset: null, backup_image: null, isExisting: true,
        })),
        ...(li.third_party_creatives || []).map(c => ({
            key: makeCreativeKey(), type: "third_party" as const,
            creative_name: c.creative_name || "", dimensions: "", aspect_ratio: "",
            file_size: "", click_through_url: "", appended_html_tag: "",
            integration_code: "", notes: "",
            main_asset: null, backup_image: null, isExisting: true,
        })),
    ];

    const rawFormat = Array.isArray(li.ad_format)
        ? li.ad_format[0] || ""
        : typeof li.ad_format === "string"
            ? li.ad_format.split(" › ")[0].toLowerCase()
            : "";

    // Map display label back to value key
    const formatMap: Record<string, string> = {
        "banner": "banner", "video": "video", "youtube": "youtube", "interstitial": "Interstitial",
    };
    const resolvedFormat = formatMap[rawFormat.toLowerCase()] || rawFormat;

    return {
        key: makeLineItemKey(),
        line_item_id: li.line_item_id,
        line_item_name: li.line_item_name || li.lineItemName || "",
        ethnicity: li.ethnicity || [],
        start_date: li.start_date || "",
        end_date: li.end_date || "",
        ad_format: resolvedFormat,
        impressions: li.impressions || "",
        units: li.units || "",
        ctr: li.ctr || "0.4",
        viewability: li.viewability || "70",
        vcr: li.vcr || "70",
        kpi_notes: li.kpi_notes || "",
        unit_cost: li.unit_cost || "",
        unit_value: li.unit_value || "",
        creatives: allCreatives,
    };
}

async function readImageMeta(file: File): Promise<{ dimensions: string; aspect_ratio: string; file_size: string }> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth, h = img.naturalHeight;
            const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
            const d = gcd(w, h);
            resolve({ dimensions: `${w} × ${h}`, aspect_ratio: `${w / d}:${h / d}`, file_size: `${(file.size / 1024).toFixed(1)} KB` });
            URL.revokeObjectURL(url);
        };
        img.onerror = () => { resolve({ dimensions: "—", aspect_ratio: "—", file_size: `${(file.size / 1024).toFixed(1)} KB` }); URL.revokeObjectURL(url); };
        img.src = url;
    });
}

async function readVideoMeta(file: File): Promise<{ dimensions: string; aspect_ratio: string; file_size: string }> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video"); video.preload = "metadata";
        video.onloadedmetadata = () => {
            const w = video.videoWidth, h = video.videoHeight;
            const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
            const d = w && h ? gcd(w, h) : 1;
            resolve({ dimensions: w && h ? `${w} × ${h}` : "—", aspect_ratio: w && h ? `${w / d}:${h / d}` : "—", file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB` });
            URL.revokeObjectURL(url);
        };
        video.onerror = () => { resolve({ dimensions: "—", aspect_ratio: "—", file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB` }); URL.revokeObjectURL(url); };
        video.src = url;
    });
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
    const s = STATUS_STYLE[status ?? "pending"] ?? STATUS_STYLE.pending;
    return (
        <Badge color={s.dot} text={
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: s.color }}>
                {status ?? "pending"}
            </span>
        } />
    );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, bg, icon, active, onClick }: {
    label: string; value: number; color: string; bg: string;
    icon: string; active: boolean; onClick: () => void;
}) {
    return (
        <div onClick={onClick} style={{
            background: C.white, borderRadius: 14, padding: "20px",
            border: active ? `2px solid ${color}` : `1px solid ${C.border}`,
            boxShadow: active ? `0 0 0 3px ${color}22, 0 2px 8px rgba(0,0,0,0.08)` : "0 1px 4px rgba(0,0,0,0.06)",
            cursor: "pointer", transition: "all 0.18s", position: "relative", overflow: "hidden",
        }}>
            {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "14px 14px 0 0" }} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: active ? color : C.slate500, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: color, letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
        </div>
    );
}

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ icon, label }: { icon: string; label: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.blue, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        </div>
    );
}

// ── Field Label helper ────────────────────────────────────────────────────────
function FL({ children }: { children: React.ReactNode }) {
    return <span style={{ fontSize: 11, fontWeight: 700, color: C.slate500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</span>;
}

// ── Creative Preview Modal ────────────────────────────────────────────────────
interface PreviewTarget {
    type: "image" | "video" | "file";
    objectUrl: string | null;       // from File (new upload)
    fileName: string;
    creativeName: string;
    dimensions?: string;
    aspectRatio?: string;
    fileSize?: string;
    isExisting: boolean;
}

function CreativePreviewModal({ preview, onClose }: { preview: PreviewTarget | null; onClose: () => void }) {
    // Revoke object URL when modal closes to avoid memory leaks
    useEffect(() => {
        return () => {
            if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl);
        };
    }, [preview?.objectUrl]);

    if (!preview) return null;

    const hasMedia = !!preview.objectUrl;

    return (
        <Modal
            open={!!preview}
            onCancel={onClose}
            footer={null}
            width={preview.type === "video" ? 820 : 680}
            centered
            styles={{
                body: { padding: 0 },
                mask: { backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.7)" },
            }}
            closeIcon={
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13 }}>✕</div>
            }
        >
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: preview.type === "video" ? "rgba(79,70,229,0.3)" : preview.type === "image" ? "rgba(37,99,235,0.3)" : "rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {preview.type === "video" ? "🎬" : preview.type === "image" ? "🖼️" : "📄"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview.creativeName || preview.fileName}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                        {[preview.dimensions, preview.aspectRatio, preview.fileSize].filter(Boolean).join("  ·  ")}
                    </div>
                </div>
                {preview.isExisting && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenLight, padding: "2px 8px", borderRadius: 10, border: `1px solid #86efac`, flexShrink: 0 }}>Saved</span>
                )}
            </div>

            {/* Body */}
            <div style={{ background: "#0F172A", minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24 }}>
                {hasMedia ? (
                    preview.type === "image" ? (
                        <img
                            src={preview.objectUrl!}
                            alt={preview.creativeName}
                            style={{ maxWidth: "100%", maxHeight: 500, objectFit: "contain", borderRadius: 8, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
                        />
                    ) : preview.type === "video" ? (
                        <video
                            src={preview.objectUrl!}
                            controls
                            autoPlay
                            style={{ maxWidth: "100%", maxHeight: 480, borderRadius: 8, boxShadow: "0 8px 40px rgba(0,0,0,0.6)", background: "#000" }}
                        />
                    ) : (
                        /* File type (third-party tag files) */
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 6 }}>{preview.fileName}</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>{preview.fileSize}</div>
                            <a href={preview.objectUrl!} download={preview.fileName}>
                                <Button type="primary" style={{ background: C.indigo, borderColor: C.indigo, fontWeight: 600 }}>
                                    Download File
                                </Button>
                            </a>
                        </div>
                    )
                ) : (
                    /* Existing saved creative — no local file available */
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: 52, marginBottom: 14, opacity: 0.5 }}>
                            {preview.type === "video" ? "🎬" : "🖼️"}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                            Preview not available
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", maxWidth: 300, lineHeight: 1.6 }}>
                            This creative is already saved on the server. To preview it, replace the file using the <strong style={{ color: "rgba(255,255,255,0.6)" }}>Replace File</strong> button.
                        </div>
                        {/* Metadata pills */}
                        {(preview.dimensions || preview.aspectRatio || preview.fileSize) && (
                            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
                                {preview.dimensions && (
                                    <span style={{ fontSize: 11, fontWeight: 600, color: C.blue, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", padding: "3px 10px", borderRadius: 20 }}>📐 {preview.dimensions}</span>
                                )}
                                {preview.aspectRatio && (
                                    <span style={{ fontSize: 11, fontWeight: 600, color: C.indigo, background: "rgba(79,70,229,0.15)", border: "1px solid rgba(79,70,229,0.3)", padding: "3px 10px", borderRadius: 20 }}>⬜ {preview.aspectRatio}</span>
                                )}
                                {preview.fileSize && (
                                    <span style={{ fontSize: 11, fontWeight: 600, color: C.slate400, background: "rgba(148,163,184,0.15)", border: "1px solid rgba(148,163,184,0.3)", padding: "3px 10px", borderRadius: 20 }}>💾 {preview.fileSize}</span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ background: "#1E293B", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{preview.fileName || "—"}</span>
                <Button onClick={onClose} style={{ height: 32, borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600 }}>
                    Close
                </Button>
            </div>
        </Modal>
    );
}

// ── Creative Row Editor ───────────────────────────────────────────────────────
function CreativeRowEditor({
    creative, index, adFormat, onUpdate, onRemove,
}: {
    creative: EditableCreative;
    index: number;
    adFormat: string;
    onUpdate: (patch: Partial<EditableCreative>) => void;
    onRemove: () => void;
}) {
    const mainAssetRef = useRef<HTMLInputElement>(null);
    const backupRef = useRef<HTMLInputElement>(null);
    const isVideo = ["video", "youtube"].includes(adFormat);
    const isThirdParty = creative.type === "third_party";

    // Preview state — stores the active preview target
    const [preview, setPreview] = useState<PreviewTarget | null>(null);

    // Build a PreviewTarget from a File object
    const buildPreviewFromFile = (file: File, creativeName: string, dimensions?: string, aspectRatio?: string, fileSize?: string): PreviewTarget => {
        const isImg = file.type.startsWith("image/");
        const isVid = file.type.startsWith("video/");
        return {
            type: isVid ? "video" : isImg ? "image" : "file",
            objectUrl: URL.createObjectURL(file),
            fileName: file.name,
            creativeName,
            dimensions,
            aspectRatio,
            fileSize,
            isExisting: false,
        };
    };

    // Build a PreviewTarget for an existing (server-saved) creative — no File available
    const buildPreviewExisting = (creativeName: string, type: "image" | "video", dimensions?: string, aspectRatio?: string, fileSize?: string): PreviewTarget => ({
        type,
        objectUrl: null,
        fileName: creativeName,
        creativeName,
        dimensions,
        aspectRatio,
        fileSize,
        isExisting: true,
    });

    const handleMainFile = async (file: File) => {
        let meta = { dimensions: "", aspect_ratio: "", file_size: "" };
        if (isVideo || file.type.startsWith("video/")) {
            meta = await readVideoMeta(file);
        } else if (file.type.startsWith("image/")) {
            const r = await readImageMeta(file);
            meta = { dimensions: r.dimensions, aspect_ratio: r.aspect_ratio, file_size: r.file_size };
        } else {
            meta.file_size = `${(file.size / 1024).toFixed(1)} KB`;
        }
        onUpdate({ main_asset: file, creative_name: file.name.replace(/\.[^.]+$/, ""), ...meta, isExisting: false });
    };

    // Thumbnail for image-type new uploads
    const thumbnailUrl = creative.main_asset && creative.main_asset.type.startsWith("image/")
        ? URL.createObjectURL(creative.main_asset)
        : null;

    return (
        <>
        <CreativePreviewModal preview={preview} onClose={() => setPreview(null)} />

        <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", background: "#FAFBFC", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: isThirdParty ? C.purpleLight : C.blueLight, border: `1px solid ${isThirdParty ? C.purpleMid : C.blueMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: isThirdParty ? C.purple : C.blue }}>{index + 1}</div>
                    <Tag color={isThirdParty ? "purple" : "blue"} style={{ fontSize: 10, margin: 0 }}>{isThirdParty ? "3rd Party" : "Standard"}</Tag>
                    {creative.isExisting && <Tag color="green" style={{ fontSize: 10, margin: 0 }}>Saved</Tag>}
                    {creative.creative_name && <span style={{ fontSize: 12, fontWeight: 600, color: C.slate }}>{creative.creative_name}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Preview button — shown when there's a file or existing saved creative (non-third-party) */}
                    {!isThirdParty && (creative.main_asset || creative.isExisting) && (
                        <Button
                            size="small"
                            icon={<EyeOutlined style={{ fontSize: 11 }} />}
                            onClick={() => {
                                if (creative.main_asset) {
                                    setPreview(buildPreviewFromFile(creative.main_asset, creative.creative_name, creative.dimensions, creative.aspect_ratio, creative.file_size));
                                } else {
                                    setPreview(buildPreviewExisting(creative.creative_name, isVideo ? "video" : "image", creative.dimensions, creative.aspect_ratio, creative.file_size));
                                }
                            }}
                            style={{ fontSize: 11, fontWeight: 600, height: 26, color: C.blue, borderColor: C.blueMid, background: C.blueLight, borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}
                        >
                            Preview
                        </Button>
                    )}
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove} style={{ fontSize: 12 }} />
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* Creative Name */}
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Creative Name</div>
                    <Input value={creative.creative_name} onChange={e => onUpdate({ creative_name: e.target.value })} placeholder="e.g. Banner_300x250" style={{ height: 34, borderRadius: 7 }} />
                </div>

                {/* Main Asset */}
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {isThirdParty ? "Input File (txt/doc/xls)" : isVideo ? "Video Asset" : "Image Asset"}
                    </div>
                    <input ref={mainAssetRef} type="file"
                        accept={isThirdParty ? ".txt,.doc,.docx,.xls,.xlsx" : isVideo ? "video/mp4,video/webm,video/quicktime" : "image/*,text/html,.zip"}
                        style={{ display: "none" }}
                        onChange={async e => { const f = e.target.files?.[0]; if (f) await handleMainFile(f); if (mainAssetRef.current) mainAssetRef.current.value = ""; }}
                    />
                    {creative.main_asset ? (
                        /* File selected — show thumbnail (image) or play icon (video) + filename, click to preview */
                        <div
                            onClick={() => setPreview(buildPreviewFromFile(creative.main_asset!, creative.creative_name, creative.dimensions, creative.aspect_ratio, creative.file_size))}
                            style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 10px", background: isVideo ? C.purpleLight : C.blueLight, border: `1px solid ${isVideo ? C.purpleMid : C.blueMid}`, borderRadius: 7, cursor: "pointer", transition: "all 0.15s" }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                            title="Click to preview"
                        >
                            {/* Thumbnail or icon */}
                            {thumbnailUrl ? (
                                <img src={thumbnailUrl} alt="thumb" style={{ width: 22, height: 22, objectFit: "cover", borderRadius: 3, border: `1px solid ${C.blueMid}`, flexShrink: 0 }} />
                            ) : (
                                <span style={{ fontSize: 16, flexShrink: 0 }}>{isVideo ? "🎬" : "📄"}</span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 600, color: isVideo ? C.purple : C.blue, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {creative.main_asset.name}
                            </span>
                            <EyeOutlined style={{ fontSize: 11, color: isVideo ? C.purple : C.blue, flexShrink: 0 }} />
                        </div>
                    ) : creative.isExisting && !isThirdParty ? (
                        /* Saved on server — show a clickable "preview saved" row */
                        <div style={{ display: "flex", gap: 6 }}>
                            <div
                                onClick={() => setPreview(buildPreviewExisting(creative.creative_name, isVideo ? "video" : "image", creative.dimensions, creative.aspect_ratio, creative.file_size))}
                                style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 10px", background: C.greenLight, border: `1px solid #86efac`, borderRadius: 7, cursor: "pointer" }}
                                title="Click to preview saved creative"
                            >
                                <span style={{ fontSize: 14 }}>{isVideo ? "🎬" : "🖼️"}</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: C.green, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {creative.creative_name || "Saved creative"}
                                </span>
                                <EyeOutlined style={{ fontSize: 11, color: C.green }} />
                            </div>
                            <Button size="small" icon={<CloudUploadOutlined />} onClick={() => mainAssetRef.current?.click()}
                                style={{ height: 34, borderRadius: 7, fontSize: 11, color: C.blue, borderColor: C.blueMid, background: C.blueLight, flexShrink: 0 }}>
                                Replace
                            </Button>
                        </div>
                    ) : (
                        <Button size="small" icon={<CloudUploadOutlined />} onClick={() => mainAssetRef.current?.click()}
                            style={{ height: 34, borderRadius: 7, fontSize: 12, color: C.blue, borderColor: C.blueMid, background: C.blueLight, width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 4 }}>
                            Browse File
                        </Button>
                    )}
                </div>

                {/* Dimensions (auto) */}
                {!isThirdParty && (
                    <>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Dimensions</div>
                            <Input value={creative.dimensions} readOnly placeholder="Auto-detected" style={{ height: 34, borderRadius: 7, background: "#f8fafc", color: C.slate500 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Aspect Ratio</div>
                            <Input value={creative.aspect_ratio} readOnly placeholder="Auto-detected" style={{ height: 34, borderRadius: 7, background: "#f8fafc", color: C.slate500 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>File Size</div>
                            <Input value={creative.file_size} readOnly placeholder="Auto-detected" style={{ height: 34, borderRadius: 7, background: "#f8fafc", color: C.slate500 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Click-through URL</div>
                            <Input value={creative.click_through_url} onChange={e => onUpdate({ click_through_url: e.target.value })} placeholder="https://ad.doubleclick.net/ddm/trackclk/…" style={{ height: 34, borderRadius: 7 }} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Appended HTML Tag <span style={{ fontWeight: 400, color: C.slate400 }}>(optional)</span></div>
                            <Input.TextArea value={creative.appended_html_tag} onChange={e => onUpdate({ appended_html_tag: e.target.value })} placeholder="<IFRAME SRC=…/>" rows={2} style={{ borderRadius: 7, fontFamily: "monospace", fontSize: 11 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Integration Code <span style={{ fontWeight: 400, color: C.slate400 }}>(optional)</span></div>
                            <Input.TextArea value={creative.integration_code} onChange={e => onUpdate({ integration_code: e.target.value })} rows={2} style={{ borderRadius: 7, fontFamily: "monospace", fontSize: 11 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes <span style={{ fontWeight: 400, color: C.slate400 }}>(optional)</span></div>
                            <Input.TextArea value={creative.notes} onChange={e => onUpdate({ notes: e.target.value })} rows={2} style={{ borderRadius: 7 }} />
                        </div>
                    </>
                )}

                {/* Third party backup image */}
                {isThirdParty && (
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Backup Image <span style={{ fontWeight: 400, color: C.slate400 }}>(optional)</span></div>
                        <input ref={backupRef} type="file" accept="image/*" style={{ display: "none" }}
                            onChange={async e => { const f = e.target.files?.[0]; if (f) onUpdate({ backup_image: f }); if (backupRef.current) backupRef.current.value = ""; }}
                        />
                        {creative.backup_image ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <img
                                    src={URL.createObjectURL(creative.backup_image)}
                                    alt="backup"
                                    onClick={() => setPreview({
                                        type: "image",
                                        objectUrl: URL.createObjectURL(creative.backup_image!),
                                        fileName: creative.backup_image!.name,
                                        creativeName: `${creative.creative_name} — Backup`,
                                        isExisting: false,
                                    })}
                                    style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4, border: `1px solid ${C.border}`, cursor: "pointer" }}
                                    title="Click to preview"
                                />
                                <Tag color="green" style={{ cursor: "pointer", fontSize: 11 }} onClick={() => backupRef.current?.click()}>{creative.backup_image.name}</Tag>
                            </div>
                        ) : (
                            <Button size="small" icon={<CloudUploadOutlined />} onClick={() => backupRef.current?.click()}
                                style={{ height: 34, borderRadius: 7, fontSize: 12, color: C.green, borderColor: "#BBF7D0", background: C.greenLight, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                Browse Backup Image
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
        </>
    );
}

// ── Line Item Editor ──────────────────────────────────────────────────────────
function LineItemEditor({
    li, index, campaignStart, campaignEnd, onUpdate, onRemove, canRemove,
}: {
    li: EditableLineItem;
    index: number;
    campaignStart: string;
    campaignEnd: string;
    onUpdate: (patch: Partial<EditableLineItem>) => void;
    onRemove: () => void;
    canRemove: boolean;
}) {
    const isVideo = ["video", "youtube"].includes(li.ad_format);
    const isBanner = ["banner", "Interstitial"].includes(li.ad_format);
    const showCTR = isVideo || isBanner;
    const showVCR = isVideo;

    const calculatedBudget = (() => {
        const imp = parseFloat(li.impressions);
        const rate = parseFloat(li.unit_value) || (li.units === "CPM" ? (CPM_RATES[li.ad_format] ?? 1) : (CPC_RATES[li.ad_format] ?? 1));
        if (!imp || !li.units || !li.ad_format) return null;
        if (li.units === "CPM") return (imp * rate) / 1000;
        if (li.units === "CPC") return imp * rate;
        return null;
    })();

    function disabledDate(current: any): boolean {
        if (!campaignStart || !campaignEnd) return false;
        return current.isBefore(dayjs(campaignStart), "day") || current.isAfter(dayjs(campaignEnd), "day");
    }

    const addCreative = (type: "standard" | "third_party") => {
        onUpdate({ creatives: [...li.creatives, emptyCreative(type)] });
    };

    const updateCreative = (key: string, patch: Partial<EditableCreative>) => {
        onUpdate({ creatives: li.creatives.map(c => c.key === key ? { ...c, ...patch } : c) });
    };

    const removeCreative = (key: string) => {
        onUpdate({ creatives: li.creatives.filter(c => c.key !== key) });
    };

    return (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.white, marginBottom: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            {/* Header */}
            <div style={{ background: C.indigoLight, borderBottom: `1px solid ${C.purpleMid}`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.indigo, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{index + 1}</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.slate, flex: 1 }}>
                    {li.line_item_name || `Line Item ${index + 1}`}
                </span>
                {li.line_item_id && (
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: C.purple, background: C.purpleLight, padding: "2px 8px", borderRadius: 6, border: `1px solid ${C.purpleMid}` }}>
                        {li.line_item_id}
                    </span>
                )}
                {canRemove && (
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove}
                        style={{ border: `1px solid #fca5a5`, borderRadius: 6, fontSize: 12, color: C.red, padding: "2px 8px" }}>
                        Remove
                    </Button>
                )}
            </div>

            <div style={{ padding: "18px" }}>
                {/* Row 1: Name + Ethnicity */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Line Item Name <span style={{ color: C.red }}>*</span></div>
                        <Input value={li.line_item_name} onChange={e => onUpdate({ line_item_name: e.target.value })} placeholder="e.g. Mumbai Display — 18-34" style={{ height: 36, borderRadius: 8 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ethnicity</div>
                        <Select
                            mode="multiple" value={li.ethnicity}
                            onChange={vals => onUpdate({ ethnicity: vals })}
                            placeholder="Select ethnicity…" style={{ width: "100%" }} maxTagCount="responsive"
                            options={ETHNICITY_OPTIONS.map(e => ({ value: e, label: e }))}
                        />
                    </div>
                </div>

                {/* Row 2: Dates */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Start Date <span style={{ color: C.red }}>*</span></div>
                        <DatePicker
                            style={{ width: "100%", height: 36 }}
                            value={li.start_date ? dayjs(li.start_date) : null}
                            onChange={(_, ds) => onUpdate({ start_date: typeof ds === "string" ? ds : "" })}
                            disabledDate={disabledDate}
                            placeholder={campaignStart ? `From ${fmtDate(campaignStart)}` : "Select date"}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>End Date <span style={{ color: C.red }}>*</span></div>
                        <DatePicker
                            style={{ width: "100%", height: 36 }}
                            value={li.end_date ? dayjs(li.end_date) : null}
                            onChange={(_, ds) => onUpdate({ end_date: typeof ds === "string" ? ds : "" })}
                            disabledDate={disabledDate}
                            placeholder={campaignEnd ? `Until ${fmtDate(campaignEnd)}` : "Select date"}
                        />
                    </div>
                </div>

                {/* Row 3: Ad Format + Impressions + Units + Rate */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ad Format <span style={{ color: C.red }}>*</span></div>
                        <Select
                            value={li.ad_format || undefined}
                            onChange={val => {
                                const defaultRate = li.units === "CPM" ? (CPM_RATES[val] ?? 1) : (CPC_RATES[val] ?? 1);
                                onUpdate({ ad_format: val, unit_value: String(defaultRate) });
                            }}
                            placeholder="Select format…" style={{ width: "100%", height: 36 }}
                            options={AD_FORMAT_OPTIONS}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Impressions</div>
                        <Input value={li.impressions} onChange={e => onUpdate({ impressions: e.target.value.replace(/[^0-9]/g, "") })} placeholder="e.g. 1000000" suffix={<span style={{ fontSize: 10, color: C.slate400 }}>impr.</span>} style={{ height: 36, borderRadius: 8 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Units</div>
                        <Select
                            value={li.units || undefined}
                            onChange={val => {
                                const defaultRate = val === "CPM" ? (CPM_RATES[li.ad_format] ?? 1) : (CPC_RATES[li.ad_format] ?? 1);
                                onUpdate({ units: val, unit_value: li.ad_format ? String(defaultRate) : "" });
                            }}
                            placeholder="CPM / CPC" style={{ width: "100%", height: 36 }}
                            options={[{ value: "CPM", label: "CPM" }, { value: "CPC", label: "CPC" }]}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Rate ({li.units || "—"}) <span style={{ fontSize: 9, fontWeight: 500, color: C.indigo, background: C.indigoLight, padding: "1px 5px", borderRadius: 4 }}>Editable</span></div>
                        <Input
                            value={li.unit_value}
                            onChange={e => onUpdate({ unit_value: e.target.value.replace(/[^0-9.]/g, "") })}
                            prefix={<span style={{ fontSize: 11, color: C.slate400 }}>$</span>}
                            placeholder="e.g. 1.25"
                            suffix={<span style={{ fontSize: 10, color: C.slate400 }}>{li.units === "CPM" ? "per 1k" : "per click"}</span>}
                            style={{ height: 36, borderRadius: 8 }}
                        />
                    </div>
                </div>

                {/* Calculated Budget */}
                <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Unit Cost (Budget) <span style={{ fontSize: 9, fontWeight: 500, color: C.green, background: C.greenLight, padding: "1px 5px", borderRadius: 4 }}>Auto-calculated</span>
                    </div>
                    {calculatedBudget !== null ? (
                        <div style={{ height: 36, padding: "0 12px", background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)", border: "1.5px solid #86efac", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: C.green, fontFamily: "monospace" }}>
                                ${calculatedBudget.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span style={{ fontSize: 10, color: "#4ade80" }}>
                                {li.units === "CPM" ? `(${li.impressions} × ${li.unit_value || "rate"}) / 1000` : `${li.impressions} × ${li.unit_value || "rate"}`}
                            </span>
                        </div>
                    ) : (
                        <div style={{ height: 36, padding: "0 12px", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 8, display: "flex", alignItems: "center", color: C.slate400, fontSize: 12, gap: 6 }}>
                            <InfoCircleOutlined style={{ fontSize: 11 }} /> Enter impressions, format & unit to calculate
                        </div>
                    )}
                </div>

                {/* KPI: CTR, Viewability, VCR */}
                {(showCTR || showVCR) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                        {showCTR && (
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>CTR</div>
                                <Input value={li.ctr} onChange={e => onUpdate({ ctr: e.target.value.replace(/[^0-9.]/g, "") })} suffix={<span style={{ fontSize: 10, color: C.slate400 }}>%</span>} placeholder="0.4" style={{ height: 36, borderRadius: 8 }} />
                            </div>
                        )}
                        {showCTR && (
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Viewability</div>
                                <Input value={li.viewability} onChange={e => onUpdate({ viewability: e.target.value.replace(/[^0-9.]/g, "") })} suffix={<span style={{ fontSize: 10, color: C.slate400 }}>%</span>} placeholder="70" style={{ height: 36, borderRadius: 8 }} />
                            </div>
                        )}
                        {showVCR && (
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>VCR</div>
                                <Input value={li.vcr} onChange={e => onUpdate({ vcr: e.target.value.replace(/[^0-9.]/g, "") })} suffix={<span style={{ fontSize: 10, color: C.slate400 }}>%</span>} placeholder="70" style={{ height: 36, borderRadius: 8 }} />
                            </div>
                        )}
                    </div>
                )}

                {/* KPI Notes */}
                <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>KPI Notes <span style={{ fontWeight: 400, color: C.slate400 }}>(optional)</span></div>
                    <Input.TextArea value={li.kpi_notes} onChange={e => onUpdate({ kpi_notes: e.target.value })} placeholder="e.g. CTR adjusted based on client brief…" rows={2} style={{ borderRadius: 8 }} />
                </div>

                {/* Creatives Section */}
                <Divider style={{ margin: "12px 0" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.slate, display: "flex", alignItems: "center", gap: 6 }}>
                        <FileImageOutlined style={{ color: C.blue }} /> Creatives
                        {li.creatives.length > 0 && (
                            <Tag color="blue" style={{ fontSize: 10, marginLeft: 4 }}>{li.creatives.length} added</Tag>
                        )}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button
                            size="small" icon={<PlusOutlined />}
                            onClick={() => addCreative("standard")}
                            style={{ fontSize: 11, fontWeight: 600, height: 28, color: C.blue, borderColor: C.blueMid, background: C.blueLight, borderRadius: 6 }}
                        >
                            {isVideo ? "Add Video" : "Add Image"}
                        </Button>
                        <Button
                            size="small" icon={<CodeOutlined />}
                            onClick={() => addCreative("third_party")}
                            style={{ fontSize: 11, fontWeight: 600, height: 28, color: C.purple, borderColor: C.purpleMid, background: C.purpleLight, borderRadius: 6 }}
                        >
                            3rd Party
                        </Button>
                    </div>
                </div>

                {li.creatives.length === 0 ? (
                    <div style={{ border: "1px dashed #d1d5db", borderRadius: 8, padding: "14px", background: "#f9fafb", display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 12 }}>
                        <PlusOutlined style={{ color: "#d1d5db" }} /> No creatives added yet — click Add Image / 3rd Party above
                    </div>
                ) : (
                    li.creatives.map((cr, ci) => (
                        <CreativeRowEditor
                            key={cr.key}
                            creative={cr}
                            index={ci}
                            adFormat={li.ad_format}
                            onUpdate={patch => updateCreative(cr.key, patch)}
                            onRemove={() => removeCreative(cr.key)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// ── Edit Campaign Modal ───────────────────────────────────────────────────────
function EditCampaignModal({
    campaign, open, onClose, onSaved, uniqueTypes,
}: {
    campaign: Campaign | null;
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    uniqueTypes: string[];
}) {
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [lineItems, setLineItems] = useState<EditableLineItem[]>([]);
    const [activeTabKey, setActiveTabKey] = useState("campaign");

    useEffect(() => {
        if (campaign && open) {
            setActiveTabKey("campaign");
            form.setFieldsValue({
                campaign_name: campaign.campaign_name,
                client_campaign_ID: campaign.client_campaign_ID,
                purchase_order_ID: campaign.purchase_order_ID,
                advertiser: campaign.advertiser,
                website_url: campaign.website_url,
                campaign_type: campaign.campaign_type,
                objective: campaign.objective,
                notes: campaign.notes,
                buying_type: campaign.buying_type ? campaign.buying_type.split(", ") : [],
                start_date: campaign.start_date ? dayjs(campaign.start_date) : null,
                end_date: campaign.end_date ? dayjs(campaign.end_date) : null,
                age: campaign.age ? campaign.age.split(", ").filter(Boolean) : [],
                gender: campaign.gender ? campaign.gender.split(", ").filter(Boolean) : [],
                platforms: campaign.platforms ? campaign.platforms.split(", ").filter(Boolean) : [],
                frequency_cap: campaign.frequency_cap,
                brand_safety: campaign.brand_safety,
                viewability_goal: campaign.viewability_goal,
            });
            setLineItems((campaign.line_items || []).map(apiLineItemToEditable));
        }
    }, [campaign, open, form]);

    const startDateVal: string = Form.useWatch("start_date", form)?.format?.("YYYY-MM-DD") ?? campaign?.start_date ?? "";
    const endDateVal: string = Form.useWatch("end_date", form)?.format?.("YYYY-MM-DD") ?? campaign?.end_date ?? "";

    const updateLineItem = (key: string, patch: Partial<EditableLineItem>) => {
        setLineItems(prev => prev.map(li => li.key === key ? { ...li, ...patch } : li));
    };

    const addLineItem = () => {
        setLineItems(prev => [...prev, emptyLineItem()]);
    };

    const removeLineItem = (key: string) => {
        setLineItems(prev => prev.filter(li => li.key !== key));
    };

    const handleSave = async () => {
        if (!campaign) return;
        try {
            const values = await form.validateFields();
            setSaving(true);

            // Build the JSON payload
            const payload = {
                campaign_name: values.campaign_name,
                client_campaign_ID: values.client_campaign_ID,
                purchase_order_ID: values.purchase_order_ID,
                advertiser: values.advertiser,
                website_url: values.website_url,
                campaign_type: values.campaign_type,
                objective: values.objective,
                notes: values.notes,
                buying_type: Array.isArray(values.buying_type) ? values.buying_type.join(", ") : values.buying_type,
                start_date: values.start_date ? values.start_date.format("YYYY-MM-DD") : null,
                end_date: values.end_date ? values.end_date.format("YYYY-MM-DD") : null,
                age: Array.isArray(values.age) ? values.age.join(", ") : values.age,
                gender: Array.isArray(values.gender) ? values.gender.join(", ") : values.gender,
                platforms: Array.isArray(values.platforms) ? values.platforms.join(", ") : values.platforms,
                frequency_cap: values.frequency_cap,
                brand_safety: values.brand_safety,
                viewability_goal: values.viewability_goal,
                line_items: lineItems.map(li => ({
                    line_item_id: li.line_item_id,
                    line_item_name: li.line_item_name,
                    ethnicity: li.ethnicity,
                    start_date: li.start_date,
                    end_date: li.end_date,
                    ad_format: li.ad_format,
                    impressions: li.impressions,
                    units: li.units,
                    ctr: li.ctr,
                    viewability: li.viewability,
                    vcr: li.vcr,
                    kpi_notes: li.kpi_notes,
                    unit_value: li.unit_value,
                    creatives: li.creatives.filter(c => c.type !== "third_party").map(c => ({
                        creative_name: c.creative_name,
                        dimensions: c.dimensions,
                        aspect_ratio: c.aspect_ratio,
                        file_size: c.file_size,
                        click_through_url: c.click_through_url,
                        appended_html_tag: c.appended_html_tag,
                        integration_code: c.integration_code,
                        notes: c.notes,
                    })),
                    third_party_creatives: li.creatives.filter(c => c.type === "third_party").map(c => ({
                        creative_name: c.creative_name,
                        input_file_name: c.main_asset?.name ?? "",
                        backup_image_name: c.backup_image?.name ?? "",
                    })),
                })),
            };

            // Use FormData if there are new file uploads
            const hasNewFiles = lineItems.some(li => li.creatives.some(c => c.main_asset || c.backup_image));

            if (hasNewFiles) {
                const fd = new FormData();
                fd.append("data", JSON.stringify(payload));
                lineItems.forEach((li, liIdx) => {
                    let stdIdx = 0, tpIdx = 0;
                    li.creatives.forEach(c => {
                        if (c.type === "third_party") {
                            if (c.main_asset) fd.append(`line_item_${liIdx}thirdparty_file${tpIdx}`, c.main_asset, c.main_asset.name);
                            if (c.backup_image) fd.append(`line_item_${liIdx}thirdparty_backup${tpIdx}`, c.backup_image, c.backup_image.name);
                            tpIdx++;
                        } else {
                            if (c.main_asset) fd.append(`line_item_${liIdx}main_asset${stdIdx}`, c.main_asset, c.main_asset.name);
                            stdIdx++;
                        }
                    });
                });
                const res = await fetch(`${BASE_URL}/update_campaign/${campaign.campaign_id}/`, {
                    method: "PUT",
                    headers: { "ngrok-skip-browser-warning": "1" },
                    body: fd,
                });
                if (res.ok) { message.success("Campaign updated successfully!"); onClose(); onSaved(); }
                else { message.error("Failed to update campaign"); }
            } else {
                const res = await fetch(`${BASE_URL}/update_campaign/${campaign.campaign_id}/`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
                    body: JSON.stringify(payload),
                });
                if (res.ok) { message.success("Campaign updated successfully!"); onClose(); onSaved(); }
                else { message.error("Failed to update campaign"); }
            }
        } catch (e) {
            message.error("Please check all required fields");
        } finally {
            setSaving(false);
        }
    };

    if (!campaign) return null;

    const campaignState = isActiveCampaign(campaign) ? "active" : isClosedCampaign(campaign) ? "closed" : "upcoming";
    const stateStyle = campaignState === "active"
        ? { color: C.green }
        : campaignState === "closed"
            ? { color: C.red }
            : { color: C.amber };

    const tabItems = [
        {
            key: "campaign",
            label: <span style={{ fontSize: 12, fontWeight: 700 }}>📋 Campaign Details</span>,
            children: (
                <Form form={form} layout="vertical" style={{ fontFamily: "inherit" }}>
                    {/* Client & Advertiser */}
                    <SectionLabel icon="🏢" label="Client & Advertiser" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                        <Form.Item label={<FL>Advertiser</FL>} name="advertiser">
                            <Input style={{ height: 38, borderRadius: 8 }} placeholder="Enter advertiser name" />
                        </Form.Item>
                        <Form.Item label={<FL>Website URL</FL>} name="website_url">
                            <Input style={{ height: 38, borderRadius: 8 }} placeholder="https://" />
                        </Form.Item>
                    </div>

                    {/* Campaign Info */}
                    <SectionLabel icon="📋" label="Campaign Information" />
                    <Form.Item label={<FL>Campaign Name <span style={{ color: C.red }}>*</span></FL>} name="campaign_name" rules={[{ required: true, message: "Required" }]}>
                        <Input style={{ height: 38, borderRadius: 8 }} />
                    </Form.Item>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Form.Item label={<FL>Client Campaign ID</FL>} name="client_campaign_ID">
                            <Input style={{ height: 38, borderRadius: 8 }} />
                        </Form.Item>
                        <Form.Item label={<FL>Purchase Order ID</FL>} name="purchase_order_ID">
                            <Input style={{ height: 38, borderRadius: 8 }} />
                        </Form.Item>
                        <Form.Item label={<FL>Campaign Type</FL>} name="campaign_type">
                            <Select style={{ height: 38 }} placeholder="Select type">
                                {[...new Set([...uniqueTypes, "Brand Awareness", "Performance", "Retargeting", "Prospecting", "Lead Generation"])].map(t => <Option key={t} value={t}>{t}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label={<FL>Objective</FL>} name="objective">
                            <Select style={{ height: 38 }} placeholder="Select objective">
                                {["Increase Brand Awareness", "Drive Website Traffic", "Generate Leads", "Boost Sales", "App Installs"].map(o => <Option key={o} value={o}>{o}</Option>)}
                            </Select>
                        </Form.Item>
                    </div>
                    <Form.Item label={<FL>Buying Type</FL>} name="buying_type">
                        <Select mode="multiple" style={{ width: "100%" }} placeholder="Select buying types" maxTagCount="responsive">
                            {["Programmatic (DV360)", "Direct", "Programmatic Guaranteed", "Preferred Deal", "Open Auction"].map(b => <Option key={b} value={b}>{b}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item label={<FL>Notes</FL>} name="notes">
                        <Input.TextArea rows={3} style={{ borderRadius: 8 }} placeholder="Add any campaign notes…" />
                    </Form.Item>

                    {/* Schedule */}
                    <SectionLabel icon="📅" label="Schedule" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                        <Form.Item label={<FL>Start Date <span style={{ color: C.red }}>*</span></FL>} name="start_date" rules={[{ required: true, message: "Required" }]}>
                            <DatePicker style={{ width: "100%", height: 38, borderRadius: 8 }} />
                        </Form.Item>
                        <Form.Item label={<FL>End Date <span style={{ color: C.red }}>*</span></FL>} name="end_date" rules={[{ required: true, message: "Required" }]}>
                            <DatePicker style={{ width: "100%", height: 38, borderRadius: 8 }} />
                        </Form.Item>
                    </div>

                    {/* Audience & Targeting */}
                    <SectionLabel icon="🎯" label="Audience & Targeting" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                        <Form.Item label={<FL>Age</FL>} name="age">
                            <Select mode="multiple" style={{ width: "100%" }} placeholder="Select age ranges" maxTagCount="responsive">
                                {["18 to 24", "25 to 34", "35 to 44", "45 to 54", "55 to 64", "Others"].map(a => <Option key={a} value={a}>{a}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label={<FL>Gender</FL>} name="gender">
                            <Select mode="multiple" style={{ width: "100%" }} placeholder="Select gender" maxTagCount="responsive">
                                <Option value="Male">Male</Option>
                                <Option value="Female">Female</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label={<FL>Platform / Inventory</FL>} name="platforms">
                            <Select mode="multiple" style={{ width: "100%" }} placeholder="Select platforms" maxTagCount="responsive">
                                {["Display", "Video", "PMP", "CTV", "Audio", "Native", "DOOH", "Mobile"].map(p => <Option key={p} value={p}>{p}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label={<FL>Frequency Cap</FL>} name="frequency_cap">
                            <Input style={{ height: 38, borderRadius: 8 }} placeholder="e.g. 3" suffix="impressions/user" />
                        </Form.Item>
                        <Form.Item label={<FL>Brand Safety</FL>} name="brand_safety">
                            <Select style={{ height: 38 }} placeholder="Select level">
                                <Option value="Standard">Standard</Option>
                                <Option value="Strict">Strict</Option>
                                <Option value="Custom">Custom</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label={<FL>Viewability Goal (%)</FL>} name="viewability_goal">
                            <Input style={{ height: 38, borderRadius: 8 }} placeholder="e.g. 70" suffix="%" />
                        </Form.Item>
                    </div>
                </Form>
            ),
        },
        {
            key: "lineitems",
            label: (
                <span style={{ fontSize: 12, fontWeight: 700 }}>
                    📦 Line Items
                    {lineItems.length > 0 && (
                        <Tag color="purple" style={{ fontSize: 10, marginLeft: 6 }}>{lineItems.length}</Tag>
                    )}
                </span>
            ),
            children: (
                <div>
                    {lineItems.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 0", color: C.slate400 }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No line items yet</div>
                            <div style={{ fontSize: 12 }}>Click below to add the first line item</div>
                        </div>
                    ) : (
                        lineItems.map((li, idx) => (
                            <LineItemEditor
                                key={li.key}
                                li={li}
                                index={idx}
                                campaignStart={startDateVal}
                                campaignEnd={endDateVal}
                                onUpdate={patch => updateLineItem(li.key, patch)}
                                onRemove={() => removeLineItem(li.key)}
                                canRemove={lineItems.length > 1}
                            />
                        ))
                    )}
                    <button
                        onClick={addLineItem}
                        style={{ width: "100%", padding: "12px", border: `1px dashed ${C.indigo}`, borderRadius: 8, background: "none", cursor: "pointer", color: C.indigo, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}
                    >
                        <PlusOutlined /> Add Another Line Item
                    </button>
                </div>
            ),
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={900}
            centered
            styles={{
                body: { padding: 0, overflow: "hidden" },
                mask: { backdropFilter: "blur(4px)", background: "rgba(15,23,42,0.45)" },
            }}
            closeIcon={
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.slate100, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.slate500 }}>✕</div>
            }
        >
            {/* ── Modal Header ── */}
            <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", padding: "24px 28px 20px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(79,70,229,0.15)" }} />
                <div style={{ position: "absolute", top: 20, right: 60, width: 60, height: 60, borderRadius: "50%", background: "rgba(37,99,235,0.2)" }} />

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(79,70,229,0.25)", border: "1.5px solid rgba(79,70,229,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✏️</div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>Edit Campaign</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#93C5FD", fontFamily: "monospace" }}>{campaign.campaign_name}</span>
                                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>•</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#93C5FD", fontFamily: "monospace", letterSpacing: "0.05em" }}>{campaign.campaign_id}</span>
                                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>•</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: stateStyle.color, background: `${stateStyle.color}20`, border: `1px solid ${stateStyle.color}40`, padding: "2px 8px", borderRadius: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>{campaignState}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>Created {fmtDate(campaign.created_at)}</div>
                </div>
            </div>

            {/* ── Modal Body ── */}
            <div style={{ maxHeight: "70vh", overflowY: "auto", background: C.bg }}>
                <Tabs
                    activeKey={activeTabKey}
                    onChange={setActiveTabKey}
                    items={tabItems}
                    style={{ padding: "0 28px" }}
                    tabBarStyle={{ marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingTop: 12 }}
                />
            </div>

            {/* ── Modal Footer ── */}
            <div style={{ padding: "16px 28px", background: C.white, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, color: C.slate500 }}>
                    {lineItems.length} line item{lineItems.length !== 1 ? "s" : ""} •{" "}
                    {campaign.start_date ? fmtDate(campaign.start_date) : "—"} → {campaign.end_date ? fmtDate(campaign.end_date) : "—"}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <Button onClick={onClose} style={{ height: 38, borderRadius: 8, border: `1px solid ${C.border}`, color: C.slate500, fontSize: 13, fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        loading={saving}
                        onClick={handleSave}
                        icon={<SaveOutlined />}
                        style={{ height: 38, borderRadius: 8, background: C.green, borderColor: C.green, fontSize: 13, fontWeight: 700 }}
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message: msg, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    const color = type === "success" ? C.green : C.red;
    return (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, background: C.white, border: `1px solid ${color}55`, borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{msg}</span>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Admin_Campaigns() {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [cardFilter, setCardFilter] = useState<"all" | "active" | "closed">("all");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

    const fetchCampaigns = useCallback(() => {
        setLoading(true);
        fetch(`${BASE_URL}/get_campaigns/`, { headers: { "ngrok-skip-browser-warning": "1" } })
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(data => {
                const list: Campaign[] = Array.isArray(data) ? data : Array.isArray(data?.campaigns) ? data.campaigns : [];
                setCampaigns(list);
            })
            .catch(() => { setCampaigns([]); setToast({ message: "Failed to load campaigns.", type: "error" }); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    const totalCount = campaigns.length;
    const activeCount = campaigns.filter(isActiveCampaign).length;
    const closedCount = campaigns.filter(isClosedCampaign).length;
    const uniqueTypes = [...new Set(campaigns.map(c => c.campaign_type).filter(Boolean))] as string[];

    const filtered = campaigns.filter(c => {
        if (cardFilter === "active" && !isActiveCampaign(c)) return false;
        if (cardFilter === "closed" && !isClosedCampaign(c)) return false;
        if (typeFilter !== "all" && c.campaign_type !== typeFilter) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            const match = [c.campaign_name, c.campaign_id, c.client_campaign_ID, c.client_name, c.advertiser].some(f => f?.toLowerCase().includes(q));
            if (!match) return false;
        }
        return true;
    });

    const columns: ColumnsType<Campaign> = [
        {
            title: "Campaign ID", dataIndex: "campaign_id", key: "campaign_id", width: 160, fixed: "left",
            render: (id: string) => <span style={{ fontSize: 12, fontWeight: 700, color: C.blue, background: C.blueLight, padding: "3px 8px", borderRadius: 6, fontFamily: "monospace", whiteSpace: "nowrap" }}>{id}</span>,
        },
        { title: "Client Campaign ID", dataIndex: "client_campaign_ID", key: "client_campaign_ID", width: 160, render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span> },
        { title: "Purchase Order ID", dataIndex: "purchase_order_ID", key: "purchase_order_ID", width: 160, render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span> },
        { title: "Campaign Name", dataIndex: "campaign_name", key: "campaign_name", width: 200, render: (name: string) => <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{name || "—"}</span> },
        { title: "Advertiser", dataIndex: "advertiser", key: "advertiser", width: 160, render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span> },
        { title: "Company", dataIndex: "client_name", key: "client_name", width: 160, render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span> },
        { title: "Type", dataIndex: "campaign_type", key: "campaign_type", width: 150, render: (v: string) => v ? <Tag color="blue" style={{ fontSize: 11 }}>{v}</Tag> : <span style={{ color: C.slate500 }}>—</span> },
        { title: "Objective", dataIndex: "objective", key: "objective", width: 180, render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span> },
        { title: "Buying Type", dataIndex: "buying_type", key: "buying_type", width: 180, render: (v: string) => <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span> },
        { title: "Start Date", dataIndex: "start_date", key: "start_date", width: 130, render: (v: string) => v ? <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span> : <span style={{ color: C.slate500 }}>—</span> },
        { title: "End Date", dataIndex: "end_date", key: "end_date", width: 130, render: (v: string) => v ? <span style={{ fontSize: 12, color: C.slate }}>{fmtDate(v)}</span> : <span style={{ color: C.slate500 }}>—</span> },
        {
            title: "Campaign State", key: "campaign_state", width: 140,
            render: (_: any, record: Campaign) => {
                const isActive = isActiveCampaign(record);
                const isClosed = isClosedCampaign(record);
                const style = isActive
                    ? { bg: C.greenLight, border: "#BBF7D0", color: C.green, label: "Active" }
                    : isClosed
                        ? { bg: C.redLight, border: "#FECACA", color: C.red, label: "Closed" }
                        : { bg: C.amberLight, border: "#FDE68A", color: C.amber, label: "Upcoming" };
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: style.bg, border: `1px solid ${style.border}`, fontSize: 10, fontWeight: 700, color: style.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: style.color }} />
                        {style.label}
                    </span>
                );
            },
        },
        { title: "Status", dataIndex: "status", key: "status", width: 120, render: (v: string) => <StatusBadge status={v} /> },
        {
            title: "Line Items", key: "line_items", width: 100,
            render: (_: any, record: Campaign) => (
                <Tag color="purple" style={{ fontSize: 11 }}>
                    {record.line_items?.length ?? 0} item{(record.line_items?.length ?? 0) !== 1 ? "s" : ""}
                </Tag>
            ),
        },
        { title: "Created", dataIndex: "created_at", key: "created_at", width: 130, render: (v: string) => v ? <span style={{ fontSize: 12, color: C.slate500 }}>{fmtDate(v)}</span> : <span style={{ color: C.slate500 }}>—</span> },
        {
            title: "Actions", key: "actions", width: 165, fixed: "right",
            render: (_: any, record: Campaign) => (
                <div style={{ display: "flex", gap: 6 }}>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/campaign/${record.campaign_id}`)}
                        style={{ fontSize: 11, fontWeight: 600, color: C.blue, background: C.blueLight, border: `1px solid ${C.blueMid}`, borderRadius: 6 }}>
                        View
                    </Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => setEditCampaign(record)}
                        style={{ fontSize: 11, fontWeight: 600, color: C.slate, background: C.white, border: `1px solid ${C.slate300}`, borderRadius: 6 }}>
                        Edit
                    </Button>
                </div>
            ),
        },
    ];

    const lineItemColumns: ColumnsType<LineItem> = [
        { title: "Line Item ID", dataIndex: "line_item_id", key: "line_item_id", render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: C.purple, background: C.purpleLight, padding: "2px 6px", borderRadius: 4 }}>{v}</span> },
        { title: "Name", dataIndex: "line_item_name", key: "line_item_name", render: (v: string) => <span style={{ fontSize: 12 }}>{v || "—"}</span> },
        { title: "Start Date", dataIndex: "start_date", key: "start_date", render: (v: string) => <span style={{ fontSize: 12 }}>{v || "—"}</span> },
        { title: "End Date", dataIndex: "end_date", key: "end_date", render: (v: string) => <span style={{ fontSize: 12 }}>{v || "—"}</span> },
        {
            title: "Ad Format", dataIndex: "ad_format", key: "ad_format",
            render: (v: string | string[]) => {
                const formats = Array.isArray(v) ? v : (v ? [v] : []);
                return formats.length > 0 ? formats.map((f: string) => <Tag key={f} color="blue" style={{ fontSize: 10 }}>{f}</Tag>) : <span style={{ color: C.slate500 }}>—</span>;
            },
        },
        { title: "Impressions", dataIndex: "impressions", key: "impressions", render: (v: string) => <span style={{ fontSize: 12 }}>{v ? Number(v).toLocaleString("en-IN") : "—"}</span> },
        { title: "Status", dataIndex: "status", key: "status", render: (v: string) => <StatusBadge status={v} /> },
    ];

    return (
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0, letterSpacing: "-0.4px" }}>All Campaigns</h1>
                    <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.04em" }}>MANAGE & TRACK ALL CLIENT CAMPAIGNS</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                <StatCard label="Total Campaigns" value={totalCount} color={C.blue} bg={C.blueLight} icon="📊" active={cardFilter === "all"} onClick={() => setCardFilter("all")} />
                <StatCard label="Active Campaigns" value={activeCount} color={C.green} bg={C.greenLight} icon="🟢" active={cardFilter === "active"} onClick={() => setCardFilter(cardFilter === "active" ? "all" : "active")} />
                <StatCard label="Closed Campaigns" value={closedCount} color={C.red} bg={C.redLight} icon="🔴" active={cardFilter === "closed"} onClick={() => setCardFilter(cardFilter === "closed" ? "all" : "closed")} />
            </div>

            {cardFilter !== "all" && (
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: C.slate500 }}>Filtered by:</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 12px", borderRadius: 20, background: cardFilter === "active" ? C.greenLight : C.redLight, border: `1px solid ${cardFilter === "active" ? "#BBF7D0" : "#FECACA"}`, fontSize: 11, fontWeight: 700, color: cardFilter === "active" ? C.green : C.red }}>
                        {cardFilter === "active" ? "🟢 Active Campaigns" : "🔴 Closed Campaigns"}
                        <button onClick={() => setCardFilter("all")} style={{ background: "none", border: "none", cursor: "pointer", color: cardFilter === "active" ? C.green : C.red, fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
                    </span>
                </div>
            )}

            <div style={{ background: C.white, borderRadius: 12, padding: "14px 18px", border: `1px solid ${C.border}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Input placeholder="Search by name, ID, advertiser, company…" prefix={<SearchOutlined style={{ color: C.slate500 }} />} value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ flex: 1, minWidth: 240, height: 36 }} />
                <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 180, height: 36 }}>
                    <Option value="all">All Types</Option>
                    {uniqueTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
                <Button onClick={fetchCampaigns} icon={<ReloadOutlined />} style={{ height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.slate500, fontSize: 12, fontWeight: 600 }}>Refresh</Button>
                <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>{filtered.length} of {campaigns.length} campaigns</span>
            </div>

            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <Table
                    columns={columns} dataSource={filtered} rowKey="campaign_id" loading={loading}
                    scroll={{ x: 2100 }}
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"], showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} campaigns`, style: { padding: "12px 16px" } }}
                    expandable={{
                        expandedRowRender: (record: Campaign) => {
                            if (!record.line_items || record.line_items.length === 0) return <span style={{ color: C.slate500, fontSize: 12 }}>No line items.</span>;
                            return (
                                <div style={{ padding: "8px 0" }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: C.slate, marginBottom: 8, display: "block" }}>Line Items ({record.line_items.length})</span>
                                    <Table size="small" dataSource={record.line_items} rowKey="line_item_id" pagination={false} columns={lineItemColumns} style={{ background: "#F8FAFC", borderRadius: 8 }} />
                                </div>
                            );
                        },
                        rowExpandable: () => true,
                    }}
                    rowClassName={(record) => isClosedCampaign(record) ? "all-campaigns-row all-campaigns-row-closed" : "all-campaigns-row"}
                    style={{ fontSize: 13 }}
                />
            </div>

            <EditCampaignModal
                campaign={editCampaign}
                open={!!editCampaign}
                onClose={() => setEditCampaign(null)}
                onSaved={fetchCampaigns}
                uniqueTypes={uniqueTypes}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <style>{`
                .all-campaigns-row:hover td { background: #F8FAFC !important; }
                .all-campaigns-row-closed td { opacity: 0.75; }
                .ant-table-thead > tr > th { background: #F1F5F9 !important; font-size: 11px !important; font-weight: 700 !important; color: #64748B !important; text-transform: uppercase; letter-spacing: 0.04em; }
                .ant-table-row-expand-icon-cell { background: #F1F5F9; }
            `}</style>
        </div>
    );
}