import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table, Tag, Button, Input, Select, Modal, Form,
    DatePicker, message, Divider, Tabs, Dropdown
} from "antd";
import {
    SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined,
    PlusOutlined, DeleteOutlined, FileImageOutlined,
    CloudUploadOutlined, SaveOutlined, InfoCircleOutlined,
    CodeOutlined, CheckCircleOutlined, CloseOutlined,
    MessageOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import Admin_Campaign_Chat from "./Admin_Campaign_Chat";
import Creative_Team_Chat from "../creatives_team_dashboard/Internal_Team_Campaign_Chat";

const { Option } = Select;
const BASE_URL = import.meta.env.VITE_BASE_URL;

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
    id?: number;
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
    creatives?: Creative[];
    third_party_creatives?: Creative[];
    dv_id?: string;
    status?: 'live' | 'upcoming' | 'completed' | 'paused';
}

interface Campaign {
    id: number;
    campaign_id: string | null;
    approval_status?: 'pending' | 'approved';
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
    age?: string;
    gender?: string;
    platforms?: string;
    frequency_cap?: string;
    brand_safety?: string;
    geo_targeting?: GeoLocation[] | string;
    line_items?: LineItem[];
    new_cpm?: string | number;
    new_price?: string | number;
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
            key: makeCreativeKey(),
            id: (c as any).id,
            type: "standard" as const,
            creative_name: c.creative_name || "", dimensions: c.dimensions || "",
            aspect_ratio: c.aspect_ratio || "", file_size: c.file_size || "",
            click_through_url: c.click_through_url || "",
            appended_html_tag: c.appended_html_tag || "",
            integration_code: c.integration_code || "", notes: c.notes || "",
            main_asset: null, backup_image: null, isExisting: true,
        })),
        ...(li.third_party_creatives || []).map(c => ({
            key: makeCreativeKey(),
            id: (c as any).id,
            type: "third_party" as const,
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

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon, active, onClick }: {
    label: string; value: number; color: string;
    icon: string; active: boolean; onClick: () => void;
}) {
    return (
        <div onClick={onClick} style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-card)",
            padding: "20px",
            border: active ? `2px solid ${color}` : `1px solid var(--border)`,
            boxShadow: active ? `0 0 0 3px ${color}22, var(--shadow-card)` : "var(--shadow-card)",
            cursor: "pointer", transition: "all 0.18s", position: "relative", overflow: "hidden",
        }}>
            {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "14px 14px 0 0" }} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: active ? color : "var(--text-muted)", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: color, letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
        </div>
    );
}

function SectionLabel({ icon, label }: { icon: string; label: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: `1px solid var(--border)`, marginBottom: 16 }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        </div>
    );
}

function FL({ children }: { children: React.ReactNode }) {
    return <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</span>;
}

// ── Creative Preview Modal ────────────────────────────────────────────────────
interface PreviewTarget {
    type: "image" | "video" | "file";
    objectUrl: string | null;
    fileName: string;
    creativeName: string;
    dimensions?: string;
    aspectRatio?: string;
    fileSize?: string;
    isExisting: boolean;
}

function CreativePreviewModal({ preview, onClose }: { preview: PreviewTarget | null; onClose: () => void }) {
    useEffect(() => {
        return () => {
            if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl);
        };
    }, [preview?.objectUrl]);

    if (!preview) return null;

    const hasMedia = !!preview.objectUrl;
    const metaParts = [preview.dimensions, preview.aspectRatio, preview.fileSize].filter(Boolean);

    return (
        <>
            <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1050, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />
            <div style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                zIndex: 1051, width: preview.type === "video" ? 780 : 640, maxWidth: "92vw",
                borderRadius: 16, overflow: "hidden",
                boxShadow: "0 24px 80px rgba(0,0,0,0.45)", background: "var(--bg-card)",
            }}>
                <div style={{ background: "linear-gradient(135deg,#0F172A 0%,#1E293B 100%)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: "rgba(79,70,229,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {preview.type === "video" ? "🎬" : preview.type === "image" ? "🖼️" : "📄"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview.creativeName || preview.fileName}</div>
                        {metaParts.length > 0 && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{metaParts.join("  ·  ")}</div>}
                    </div>
                    {preview.isExisting && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", background: "var(--green-bg)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(74,222,128,0.35)", flexShrink: 0 }}>Saved</span>
                    )}
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 13, flexShrink: 0, padding: 0 }}>
                        <CloseOutlined style={{ fontSize: 12 }} />
                    </button>
                </div>
                <div style={{ background: "#0F172A", minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 24px" }}>
                    {hasMedia ? (
                        preview.type === "image" ? (
                            <img src={preview.objectUrl!} alt={preview.creativeName} style={{ maxWidth: "100%", maxHeight: 460, objectFit: "contain", borderRadius: 8 }} />
                        ) : preview.type === "video" ? (
                            <video src={preview.objectUrl!} controls autoPlay style={{ maxWidth: "100%", maxHeight: 440, borderRadius: 8, background: "#000" }} />
                        ) : (
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 52, marginBottom: 14 }}>📄</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 6 }}>{preview.fileName}</div>
                                <a href={preview.objectUrl!} download={preview.fileName}>
                                    <Button type="primary" style={{ background: "var(--accent)", borderColor: "var(--accent)", fontWeight: 600 }}>Download File</Button>
                                </a>
                            </div>
                        )
                    ) : (
                        <div style={{ textAlign: "center", padding: "10px 0" }}>
                            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>{preview.type === "video" ? "🎬" : "🖼️"}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>Preview not available</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", maxWidth: 280, lineHeight: 1.6 }}>
                                This creative is saved on the server. Use the <strong style={{ color: "rgba(255,255,255,0.55)" }}>Replace File</strong> button to upload a new version.
                            </div>
                            {metaParts.length > 0 && (
                                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
                                    {preview.dimensions && (
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-light)", border: "1px solid var(--border-strong)", padding: "3px 10px", borderRadius: 20 }}>📐 {preview.dimensions}</span>
                                    )}
                                    {preview.aspectRatio && (
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-light)", border: "1px solid var(--border-strong)", padding: "3px 10px", borderRadius: 20 }}>⬜ {preview.aspectRatio}</span>
                                    )}
                                    {preview.fileSize && (
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", background: "var(--bg-input)", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: 20 }}>💾 {preview.fileSize}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div style={{ background: "#1E293B", padding: "11px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{preview.fileName || "—"}</span>
                    <button onClick={onClose} style={{ height: 32, padding: "0 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Close</button>
                </div>
            </div>
        </>
    );
}

// ── Creative Row Editor ───────────────────────────────────────────────────────
function CreativeRowEditor({ creative, index, adFormat, onUpdate, onRemove }: {
    creative: EditableCreative; index: number; adFormat: string;
    onUpdate: (patch: Partial<EditableCreative>) => void; onRemove: () => void;
}) {
    const mainAssetRef = useRef<HTMLInputElement>(null);
    const backupRef = useRef<HTMLInputElement>(null);
    const isVideo = ["video", "youtube"].includes(adFormat);
    const isThirdParty = creative.type === "third_party";
    const [preview, setPreview] = useState<PreviewTarget | null>(null);

    const buildPreviewFromFile = (file: File, creativeName: string, dimensions?: string, aspectRatio?: string, fileSize?: string): PreviewTarget => {
        const isImg = file.type.startsWith("image/");
        const isVid = file.type.startsWith("video/");
        return { type: isVid ? "video" : isImg ? "image" : "file", objectUrl: URL.createObjectURL(file), fileName: file.name, creativeName, dimensions, aspectRatio, fileSize, isExisting: false };
    };

    const loadServerPreview = async (creative: EditableCreative, isVideo: boolean) => {
        if (!creative.id) return;
        const url = creative.type === "third_party"
            ? `${BASE_URL}/download_thirdparty/${creative.id}/`
            : `${BASE_URL}/download_creative/${creative.id}/`;
        try {
            const res = await fetch(url, { headers: { "ngrok-skip-browser-warning": "1" } });
            const blob = await res.blob();
            setPreview({ type: isVideo ? "video" : "image", objectUrl: URL.createObjectURL(blob), fileName: creative.creative_name, creativeName: creative.creative_name, dimensions: creative.dimensions, aspectRatio: creative.aspect_ratio, fileSize: creative.file_size, isExisting: true });
        } catch (e) { console.error("Failed to load preview", e); }
    };

    const handleMainFile = async (file: File) => {
        let meta = { dimensions: "", aspect_ratio: "", file_size: "" };
        if (isVideo || file.type.startsWith("video/")) { meta = await readVideoMeta(file); }
        else if (file.type.startsWith("image/")) { const r = await readImageMeta(file); meta = { dimensions: r.dimensions, aspect_ratio: r.aspect_ratio, file_size: r.file_size }; }
        else { meta.file_size = `${(file.size / 1024).toFixed(1)} KB`; }
        onUpdate({ main_asset: file, creative_name: file.name.replace(/\.[^.]+$/, ""), ...meta, isExisting: false });
    };

    const thumbnailUrl = creative.main_asset && creative.main_asset.type.startsWith("image/")
        ? URL.createObjectURL(creative.main_asset)
        : null;

    return (
        <>
            <CreativePreviewModal preview={preview} onClose={() => setPreview(null)} />
            <div style={{ border: `1px solid var(--border)`, borderRadius: 10, padding: "14px 16px", background: "var(--bg-card-hover)", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent-light)", border: `1px solid var(--border-strong)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>{index + 1}</div>
                        <Tag color={isThirdParty ? "purple" : "blue"} style={{ fontSize: 10, margin: 0 }}>{isThirdParty ? "3rd Party" : "Standard"}</Tag>
                        {creative.isExisting && <Tag color="green" style={{ fontSize: 10, margin: 0 }}>Saved</Tag>}
                        {creative.creative_name && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{creative.creative_name}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {!isThirdParty && (creative.main_asset || creative.isExisting) && (
                            <Button size="small" icon={<EyeOutlined style={{ fontSize: 11 }} />}
                                onClick={() => {
                                    if (creative.main_asset) setPreview(buildPreviewFromFile(creative.main_asset, creative.creative_name, creative.dimensions, creative.aspect_ratio, creative.file_size));
                                    else if (creative.isExisting && creative.id) loadServerPreview(creative, isVideo);
                                }}
                                style={{ fontSize: 11, fontWeight: 600, height: 26, color: "var(--accent)", borderColor: "var(--accent)", background: "var(--accent-light)", borderRadius: 6 }}>Preview</Button>
                        )}
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove} style={{ fontSize: 12 }} />
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Creative Name</div>
                        <Input value={creative.creative_name} onChange={e => onUpdate({ creative_name: e.target.value })} placeholder="e.g. Banner_300x250" style={{ height: 34, borderRadius: 7 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {isThirdParty ? "Input File (txt/doc/xls)" : isVideo ? "Video Asset" : "Image Asset"}
                        </div>
                        <input ref={mainAssetRef} type="file"
                            accept={isThirdParty ? ".txt,.doc,.docx,.xls,.xlsx" : isVideo ? "video/mp4,video/webm,video/quicktime" : "image/*,text/html,.zip"}
                            style={{ display: "none" }}
                            onChange={async e => { const f = e.target.files?.[0]; if (f) await handleMainFile(f); if (mainAssetRef.current) mainAssetRef.current.value = ""; }}
                        />
                        {creative.main_asset ? (
                            <div onClick={() => setPreview(buildPreviewFromFile(creative.main_asset!, creative.creative_name))}
                                style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 10px", background: "var(--accent-light)", border: `1px solid var(--accent)`, borderRadius: 7, cursor: "pointer" }}>
                                {thumbnailUrl
                                    ? <img src={thumbnailUrl} alt="thumb" style={{ width: 22, height: 22, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
                                    : <span style={{ fontSize: 16 }}>{isVideo ? "🎬" : "📄"}</span>}
                                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{creative.main_asset.name}</span>
                                <EyeOutlined style={{ fontSize: 11, color: "var(--accent)", flexShrink: 0 }} />
                            </div>
                        ) : creative.isExisting && !isThirdParty ? (
                            <div style={{ display: "flex", gap: 6 }}>
                                <div onClick={() => loadServerPreview(creative, isVideo)}
                                    style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 10px", background: "var(--green-bg)", border: `1px solid var(--green)`, borderRadius: 7, cursor: "pointer" }}>
                                    <span style={{ fontSize: 14 }}>{isVideo ? "🎬" : "🖼️"}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{creative.creative_name || "Saved creative"}</span>
                                    <EyeOutlined style={{ fontSize: 11, color: "var(--green)" }} />
                                </div>
                                <Button size="small" icon={<CloudUploadOutlined />} onClick={() => mainAssetRef.current?.click()}
                                    style={{ height: 34, borderRadius: 7, fontSize: 11, color: "var(--accent)", borderColor: "var(--accent)", background: "var(--accent-light)", flexShrink: 0 }}>Replace</Button>
                            </div>
                        ) : (
                            <Button size="small" icon={<CloudUploadOutlined />} onClick={() => mainAssetRef.current?.click()}
                                style={{ height: 34, borderRadius: 7, fontSize: 12, color: "var(--accent)", borderColor: "var(--accent)", background: "var(--accent-light)", width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 4 }}>Browse File</Button>
                        )}
                    </div>

                    {!isThirdParty && (
                        <>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>Dimensions</div>
                                <Input value={creative.dimensions} readOnly placeholder="Auto-detected" style={{ height: 34, borderRadius: 7, background: "var(--bg-input)", color: "var(--text-muted)" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>Aspect Ratio</div>
                                <Input value={creative.aspect_ratio} readOnly placeholder="Auto-detected" style={{ height: 34, borderRadius: 7, background: "var(--bg-input)", color: "var(--text-muted)" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>File Size</div>
                                <Input value={creative.file_size} readOnly placeholder="Auto-detected" style={{ height: 34, borderRadius: 7, background: "var(--bg-input)", color: "var(--text-muted)" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>Click-through URL</div>
                                <Input value={creative.click_through_url} onChange={e => onUpdate({ click_through_url: e.target.value })} placeholder="https://ad.doubleclick.net/ddm/trackclk/…" style={{ height: 34, borderRadius: 7 }} />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>Appended HTML Tag <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>(optional)</span></div>
                                <Input.TextArea value={creative.appended_html_tag} onChange={e => onUpdate({ appended_html_tag: e.target.value })} placeholder="<IFRAME SRC=…/>" rows={2} style={{ borderRadius: 7, fontSize: 11 }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>Integration Code <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>(optional)</span></div>
                                <Input.TextArea value={creative.integration_code} onChange={e => onUpdate({ integration_code: e.target.value })} rows={2} style={{ borderRadius: 7, fontSize: 11 }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>Notes <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>(optional)</span></div>
                                <Input.TextArea value={creative.notes} onChange={e => onUpdate({ notes: e.target.value })} rows={2} style={{ borderRadius: 7 }} />
                            </div>
                        </>
                    )}

                    {isThirdParty && (
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>Backup Image <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>(optional)</span></div>
                            <input ref={backupRef} type="file" accept="image/*" style={{ display: "none" }}
                                onChange={async e => { const f = e.target.files?.[0]; if (f) onUpdate({ backup_image: f }); if (backupRef.current) backupRef.current.value = ""; }}
                            />
                            {creative.backup_image ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <img src={URL.createObjectURL(creative.backup_image)} alt="backup"
                                        onClick={() => setPreview({ type: "image", objectUrl: URL.createObjectURL(creative.backup_image!), fileName: creative.backup_image!.name, creativeName: `${creative.creative_name} — Backup`, isExisting: false })}
                                        style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4, border: `1px solid var(--border)`, cursor: "pointer" }} />
                                    <Tag color="green" style={{ cursor: "pointer", fontSize: 11 }} onClick={() => backupRef.current?.click()}>{creative.backup_image.name}</Tag>
                                </div>
                            ) : (
                                <Button size="small" icon={<CloudUploadOutlined />} onClick={() => backupRef.current?.click()}
                                    style={{ height: 34, borderRadius: 7, fontSize: 12, color: "var(--green)", borderColor: "var(--green)", background: "var(--green-bg)", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>Browse Backup Image</Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Line Item Editor ──────────────────────────────────────────────────────────
function LineItemEditor({ li, index, campaignStart, campaignEnd, onUpdate, onRemove, canRemove }: {
    li: EditableLineItem; index: number; campaignStart: string; campaignEnd: string;
    onUpdate: (patch: Partial<EditableLineItem>) => void; onRemove: () => void; canRemove: boolean;
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

    const addCreative = (type: "standard" | "third_party") => onUpdate({ creatives: [...li.creatives, emptyCreative(type)] });
    const updateCreative = (key: string, patch: Partial<EditableCreative>) => onUpdate({ creatives: li.creatives.map(c => c.key === key ? { ...c, ...patch } : c) });
    const removeCreative = (key: string) => onUpdate({ creatives: li.creatives.filter(c => c.key !== key) });

    return (
        <div style={{ border: `1px solid var(--border)`, borderRadius: 12, background: "var(--bg-card)", marginBottom: 14, overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
            <div style={{ background: "var(--accent-light)", borderBottom: `1px solid var(--border)`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{index + 1}</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{li.line_item_name || `Line Item ${index + 1}`}</span>
                {li.line_item_id && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "var(--bg-card)", padding: "2px 8px", borderRadius: 6, border: `1px solid var(--accent)` }}>{li.line_item_id}</span>
                )}
                {canRemove && (
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={onRemove}
                        style={{ border: `1px solid var(--red)`, borderRadius: 6, fontSize: 12, color: "var(--red)", padding: "2px 8px" }}>Remove</Button>
                )}
            </div>

            <div style={{ padding: "18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Line Item Name <span style={{ color: "var(--red)" }}>*</span></div>
                        <Input value={li.line_item_name} onChange={e => onUpdate({ line_item_name: e.target.value })} placeholder="e.g. Mumbai Display — 18-34" style={{ height: 36, borderRadius: 8 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ethnicity</div>
                        <Select mode="multiple" value={li.ethnicity} onChange={vals => onUpdate({ ethnicity: vals })} placeholder="Select ethnicity…" style={{ width: "100%" }} maxTagCount="responsive" options={ETHNICITY_OPTIONS.map(e => ({ value: e, label: e }))} />
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Start Date <span style={{ color: "var(--red)" }}>*</span></div>
                        <DatePicker style={{ width: "100%", height: 36 }} value={li.start_date ? dayjs(li.start_date) : null} onChange={(_, ds) => onUpdate({ start_date: typeof ds === "string" ? ds : "" })} disabledDate={disabledDate} placeholder={campaignStart ? `From ${fmtDate(campaignStart)}` : "Select date"} />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>End Date <span style={{ color: "var(--red)" }}>*</span></div>
                        <DatePicker style={{ width: "100%", height: 36 }} value={li.end_date ? dayjs(li.end_date) : null} onChange={(_, ds) => onUpdate({ end_date: typeof ds === "string" ? ds : "" })} disabledDate={disabledDate} placeholder={campaignEnd ? `Until ${fmtDate(campaignEnd)}` : "Select date"} />
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ad Format <span style={{ color: "var(--red)" }}>*</span></div>
                        <Select value={li.ad_format || undefined} onChange={val => { const defaultRate = li.units === "CPM" ? (CPM_RATES[val] ?? 1) : (CPC_RATES[val] ?? 1); onUpdate({ ad_format: val, unit_value: String(defaultRate) }); }} placeholder="Select format…" style={{ width: "100%", height: 36 }} options={AD_FORMAT_OPTIONS} />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Impressions</div>
                        <Input value={li.impressions} onChange={e => onUpdate({ impressions: e.target.value.replace(/[^0-9]/g, "") })} placeholder="e.g. 1000000" suffix={<span style={{ fontSize: 10, color: "var(--text-muted)" }}>impr.</span>} style={{ height: 36, borderRadius: 8 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Units</div>
                        <Select value={li.units || undefined} onChange={val => { const defaultRate = val === "CPM" ? (CPM_RATES[li.ad_format] ?? 1) : (CPC_RATES[li.ad_format] ?? 1); onUpdate({ units: val, unit_value: li.ad_format ? String(defaultRate) : "" }); }} placeholder="CPM / CPC" style={{ width: "100%", height: 36 }} options={[{ value: "CPM", label: "CPM" }, { value: "CPC", label: "CPC" }]} />
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Rate ({li.units || "—"}) <span style={{ fontSize: 9, fontWeight: 500, color: "var(--accent)", background: "var(--accent-light)", padding: "1px 5px", borderRadius: 4 }}>Editable</span>
                        </div>
                        <Input value={li.unit_value} onChange={e => onUpdate({ unit_value: e.target.value.replace(/[^0-9.]/g, "") })} prefix={<span style={{ fontSize: 11, color: "var(--text-muted)" }}>$</span>} placeholder="e.g. 1.25" suffix={<span style={{ fontSize: 10, color: "var(--text-muted)" }}>{li.units === "CPM" ? "per 1k" : "per click"}</span>} style={{ height: 36, borderRadius: 8 }} />
                    </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Unit Cost (Budget) <span style={{ fontSize: 9, fontWeight: 500, color: "var(--green)", background: "var(--green-bg)", padding: "1px 5px", borderRadius: 4 }}>Auto-calculated</span>
                    </div>
                    {calculatedBudget !== null ? (
                        <div style={{ height: 36, padding: "0 12px", background: "var(--green-bg)", border: `1.5px solid var(--green)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--green)" }}>${calculatedBudget.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span style={{ fontSize: 10, color: "var(--green)" }}>{li.units === "CPM" ? `(${li.impressions} × ${li.unit_value || "rate"}) / 1000` : `${li.impressions} × ${li.unit_value || "rate"}`}</span>
                        </div>
                    ) : (
                        <div style={{ height: 36, padding: "0 12px", background: "var(--bg-input)", border: `1px dashed var(--border-strong)`, borderRadius: 8, display: "flex", alignItems: "center", color: "var(--text-muted)", fontSize: 12, gap: 6 }}>
                            <InfoCircleOutlined style={{ fontSize: 11 }} /> Enter impressions, format & unit to calculate
                        </div>
                    )}
                </div>

                {(showCTR || showVCR) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                        {showCTR && (
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>CTR</div>
                                <Input value={li.ctr} onChange={e => onUpdate({ ctr: e.target.value.replace(/[^0-9.]/g, "") })} suffix={<span style={{ fontSize: 10, color: "var(--text-muted)" }}>%</span>} placeholder="0.4" style={{ height: 36, borderRadius: 8 }} />
                            </div>
                        )}
                        {showCTR && (
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Viewability</div>
                                <Input value={li.viewability} onChange={e => onUpdate({ viewability: e.target.value.replace(/[^0-9.]/g, "") })} suffix={<span style={{ fontSize: 10, color: "var(--text-muted)" }}>%</span>} placeholder="70" style={{ height: 36, borderRadius: 8 }} />
                            </div>
                        )}
                        {showVCR && (
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>VCR</div>
                                <Input value={li.vcr} onChange={e => onUpdate({ vcr: e.target.value.replace(/[^0-9.]/g, "") })} suffix={<span style={{ fontSize: 10, color: "var(--text-muted)" }}>%</span>} placeholder="70" style={{ height: 36, borderRadius: 8 }} />
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>KPI Notes <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>(optional)</span></div>
                    <Input.TextArea value={li.kpi_notes} onChange={e => onUpdate({ kpi_notes: e.target.value })} placeholder="e.g. CTR adjusted based on client brief…" rows={2} style={{ borderRadius: 8 }} />
                </div>

                <Divider style={{ margin: "12px 0", borderColor: "var(--border)" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                        <FileImageOutlined style={{ color: "var(--accent)" }} /> Creatives
                        {li.creatives.length > 0 && <Tag color="blue" style={{ fontSize: 10, marginLeft: 4 }}>{li.creatives.length} added</Tag>}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button size="small" icon={<PlusOutlined />} onClick={() => addCreative("standard")}
                            style={{ fontSize: 11, fontWeight: 600, height: 28, color: "var(--accent)", borderColor: "var(--accent)", background: "var(--accent-light)", borderRadius: 6 }}>
                            {isVideo ? "Add Video" : "Add Image"}
                        </Button>
                        <Button size="small" icon={<CodeOutlined />} onClick={() => addCreative("third_party")}
                            style={{ fontSize: 11, fontWeight: 600, height: 28, color: "var(--accent-2)", borderColor: "var(--accent-2)", background: "rgba(255,101,132,0.1)", borderRadius: 6 }}>
                            3rd Party
                        </Button>
                    </div>
                </div>

                {li.creatives.length === 0 ? (
                    <div style={{ border: `1px dashed var(--border-strong)`, borderRadius: 8, padding: "14px", background: "var(--bg-input)", display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12 }}>
                        <PlusOutlined /> No creatives added yet — click Add Image / 3rd Party above
                    </div>
                ) : (
                    li.creatives.map((cr, ci) => (
                        <CreativeRowEditor key={cr.key} creative={cr} index={ci} adFormat={li.ad_format} onUpdate={patch => updateCreative(cr.key, patch)} onRemove={() => removeCreative(cr.key)} />
                    ))
                )}
            </div>
        </div>
    );
}

// ── Edit Campaign Modal ───────────────────────────────────────────────────────
function EditCampaignModal({ campaign, open, onClose, onSaved, uniqueTypes }: {
    campaign: Campaign | null; open: boolean; onClose: () => void; onSaved: () => void; uniqueTypes: string[];
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
                new_cpm: campaign.new_cpm,
                new_price: campaign.new_price,
            });
            setLineItems((campaign.line_items || []).map(apiLineItemToEditable));
        }
    }, [campaign, open, form]);

    const startDateVal: string = Form.useWatch("start_date", form)?.format?.("YYYY-MM-DD") ?? campaign?.start_date ?? "";
    const endDateVal: string = Form.useWatch("end_date", form)?.format?.("YYYY-MM-DD") ?? campaign?.end_date ?? "";

    const updateLineItem = (key: string, patch: Partial<EditableLineItem>) => setLineItems(prev => prev.map(li => li.key === key ? { ...li, ...patch } : li));
    const addLineItem = () => setLineItems(prev => [...prev, emptyLineItem()]);
    const removeLineItem = (key: string) => setLineItems(prev => prev.filter(li => li.key !== key));

    const handleSave = async () => {
        if (!campaign) return;
        try { await form.validateFields(); } catch { return; }
        const values = form.getFieldsValue();
        setSaving(true);
        const fd = new FormData();
        fd.append("client", String(campaign.client ?? ""));
        fd.append("client_name", campaign.client_name ?? "");
        fd.append("advertiser", values.advertiser ?? "");
        fd.append("campaign_name", values.campaign_name ?? "");
        fd.append("campaign_type", values.campaign_type ?? "");
        fd.append("buying_type", (values.buying_type ?? []).join(", "));
        fd.append("objective", values.objective ?? "");
        fd.append("age", (values.age ?? []).join(", "));
        fd.append("gender", (values.gender ?? []).join(", "));
        fd.append("platforms", (values.platforms ?? []).join(", "));
        fd.append("brand_safety", values.brand_safety ?? "");
        fd.append("start_date", values.start_date?.format("YYYY-MM-DD") ?? "");
        fd.append("end_date", values.end_date?.format("YYYY-MM-DD") ?? "");
        if (values.website_url) fd.append("website_url", values.website_url);
        if (values.client_campaign_ID) fd.append("client_campaign_ID", values.client_campaign_ID);
        if (values.purchase_order_ID) fd.append("purchase_order_ID", values.purchase_order_ID);
        if (values.notes) fd.append("notes", values.notes);
        if (values.frequency_cap) fd.append("frequency_cap", values.frequency_cap);
        if (values.new_cpm) fd.append("new_cpm", values.new_cpm);
        if (values.new_price) fd.append("new_price", values.new_price);
        fd.append("line_items", JSON.stringify(lineItems.map(li => ({
            line_item_id: li.line_item_id, lineItemName: li.line_item_name, ethnicity: li.ethnicity,
            startDate: li.start_date, endDate: li.end_date, adFormat: li.ad_format,
            impressions: li.impressions, units: li.units, ctr: li.ctr, viewability: li.viewability,
            vcr: li.vcr, kpi_notes: li.kpi_notes, unit_cost: li.unit_cost, unit_value: li.unit_value,
            creatives: li.creatives.filter(c => c.type !== "third_party").map(c => ({ creative_name: c.creative_name, dimensions: c.dimensions, aspect_ratio: c.aspect_ratio, file_size: c.file_size, click_through_url: c.click_through_url, appended_html_tag: c.appended_html_tag, integration_code: c.integration_code, notes: c.notes })),
            third_party_creatives: li.creatives.filter(c => c.type === "third_party").map(c => ({ creative_name: c.creative_name, input_file_name: c.main_asset?.name ?? "", backup_image_name: c.backup_image?.name ?? "" })),
        }))));
        lineItems.forEach((li, i) => {
            let si = 0, ti = 0;
            li.creatives.forEach(cr => {
                if (cr.type === "third_party") { if (cr.main_asset) fd.append(`line_item_${i}thirdparty_file${ti}`, cr.main_asset, cr.main_asset.name); if (cr.backup_image) fd.append(`line_item_${i}thirdparty_backup${ti}`, cr.backup_image, cr.backup_image.name); ti++; }
                else { if (cr.main_asset) fd.append(`line_item_${i}main_asset${si}`, cr.main_asset, cr.main_asset.name); si++; }
            });
        });
        try {
            const res = await fetch(`${BASE_URL}/update_campaign/${campaign.campaign_id}/`, { method: "PUT", body: fd, headers: { "ngrok-skip-browser-warning": "1" } });
            if (res.ok) { message.success("Campaign updated successfully!"); onSaved(); onClose(); }
            else { const text = await res.text(); message.error(text || `Server error: ${res.status}`); }
        } catch (err) { message.error(err instanceof Error ? err.message : "Network error"); }
        finally { setSaving(false); }
    };

    if (!campaign) return null;
    const campaignState = isActiveCampaign(campaign) ? "active" : isClosedCampaign(campaign) ? "closed" : "upcoming";
    const stateColor = campaignState === "active" ? "var(--green)" : campaignState === "closed" ? "var(--red)" : "var(--amber)";

    const tabItems = [
        {
            key: "campaign",
            label: <span style={{ fontSize: 12, fontWeight: 700 }}>📋 Campaign Details</span>,
            children: (
                <Form form={form} layout="vertical">
                    <SectionLabel icon="🏢" label="Client & Advertiser" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                        <Form.Item label={<FL>Advertiser</FL>} name="advertiser"><Input style={{ height: 38, borderRadius: 8 }} placeholder="Enter advertiser name" /></Form.Item>
                        <Form.Item label={<FL>Website URL</FL>} name="website_url"><Input style={{ height: 38, borderRadius: 8 }} placeholder="https://" /></Form.Item>
                    </div>
                    <SectionLabel icon="📋" label="Campaign Information" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Form.Item label={<FL>Campaign Name <span style={{ color: "var(--red)" }}>*</span></FL>} name="campaign_name" rules={[{ required: true, message: "Required" }]}>
                            <Input style={{ height: 38, borderRadius: 8 }} />
                        </Form.Item>
                        <Form.Item label={<FL>Client Campaign ID</FL>} name="client_campaign_ID"><Input style={{ height: 38, borderRadius: 8 }} /></Form.Item>
                        <Form.Item label={<FL>Purchase Order ID</FL>} name="purchase_order_ID"><Input style={{ height: 38, borderRadius: 8 }} /></Form.Item>
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
                        <Form.Item label={<FL>Buying Type</FL>} name="buying_type">
                            <Select mode="multiple" style={{ width: "100%" }} placeholder="Select buying types" maxTagCount="responsive">
                                {["Programmatic (DV360)", "Direct", "Programmatic Guaranteed", "Preferred Deal", "Open Auction"].map(b => <Option key={b} value={b}>{b}</Option>)}
                            </Select>
                        </Form.Item>
                    </div>
                    <Form.Item label={<FL>Notes</FL>} name="notes"><Input.TextArea rows={3} style={{ borderRadius: 8 }} placeholder="Add any campaign notes…" /></Form.Item>
                    <SectionLabel icon="📅" label="Schedule" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                        <Form.Item label={<FL>Start Date <span style={{ color: "var(--red)" }}>*</span></FL>} name="start_date" rules={[{ required: true, message: "Required" }]}><DatePicker style={{ width: "100%", height: 38, borderRadius: 8 }} /></Form.Item>
                        <Form.Item label={<FL>End Date <span style={{ color: "var(--red)" }}>*</span></FL>} name="end_date" rules={[{ required: true, message: "Required" }]}><DatePicker style={{ width: "100%", height: 38, borderRadius: 8 }} /></Form.Item>
                    </div>
                    <SectionLabel icon="🎯" label="Audience & Targeting" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                        <Form.Item label={<FL>Age</FL>} name="age">
                            <Select mode="multiple" style={{ width: "100%" }} placeholder="Select age ranges" maxTagCount="responsive">
                                {["18 to 24", "25 to 34", "35 to 44", "45 to 54", "55 to 64", "Others"].map(a => <Option key={a} value={a}>{a}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label={<FL>Gender</FL>} name="gender">
                            <Select mode="multiple" style={{ width: "100%" }} placeholder="Select gender" maxTagCount="responsive">
                                <Option value="Male">Male</Option><Option value="Female">Female</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label={<FL>Platform / Inventory</FL>} name="platforms">
                            <Select mode="multiple" style={{ width: "100%" }} placeholder="Select platforms" maxTagCount="responsive">
                                {["Display", "Video", "PMP", "CTV", "Audio", "Native", "DOOH", "Mobile"].map(p => <Option key={p} value={p}>{p}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label={<FL>Frequency Cap</FL>} name="frequency_cap"><Input style={{ height: 38, borderRadius: 8 }} placeholder="e.g. 3" suffix="impressions/user" /></Form.Item>
                        <Form.Item label={<FL>Brand Safety</FL>} name="brand_safety">
                            <Select style={{ height: 38 }} placeholder="Select level">
                                <Option value="Standard">Standard</Option><Option value="Strict">Strict</Option><Option value="Custom">Custom</Option>
                            </Select>
                        </Form.Item>
                    </div>
                    <SectionLabel icon="💰" label="Enter Final CPM and Price Value" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                        <Form.Item label={<FL>CPM</FL>} name="new_cpm"><Input type="number" style={{ height: 38, borderRadius: 8 }} /></Form.Item>
                        <Form.Item label={<FL>Price</FL>} name="new_price"><Input type="number" style={{ height: 38, borderRadius: 8 }} /></Form.Item>
                    </div>
                </Form>
            ),
        },
        {
            key: "lineitems",
            label: (<span style={{ fontSize: 12, fontWeight: 700 }}>📦 Line Items {lineItems.length > 0 && <Tag color="purple" style={{ fontSize: 10, marginLeft: 6 }}>{lineItems.length}</Tag>}</span>),
            children: (
                <div>
                    {lineItems.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>No line items yet</div>
                            <div style={{ fontSize: 12 }}>Click below to add the first line item</div>
                        </div>
                    ) : lineItems.map((li, idx) => (
                        <LineItemEditor key={li.key} li={li} index={idx} campaignStart={startDateVal} campaignEnd={endDateVal}
                            onUpdate={patch => updateLineItem(li.key, patch)} onRemove={() => removeLineItem(li.key)} canRemove={lineItems.length > 1} />
                    ))}
                    <button onClick={addLineItem} style={{ width: "100%", padding: "12px", border: `1px dashed var(--accent)`, borderRadius: 8, background: "none", cursor: "pointer", color: "var(--accent)", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
                        <PlusOutlined /> Add Another Line Item
                    </button>
                </div>
            ),
        },
    ];

    return (
        <Modal open={open} onCancel={onClose} footer={null} width={920} centered destroyOnClose className="edit-campaign-modal"
            closeIcon={<div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, cursor: "pointer" }}><CloseOutlined style={{ fontSize: 13 }} /></div>}
            style={{ padding: 10, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", padding: "22px 28px 18px", position: "relative", overflow: "hidden", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ position: "absolute", top: -24, right: -24, width: 130, height: 130, borderRadius: "50%", background: "rgba(79,70,229,0.14)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: 18, right: 70, width: 64, height: 64, borderRadius: "50%", background: "rgba(37,99,235,0.18)", pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 14, zIndex: 1 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(79,70,229,0.25)", border: "1.5px solid rgba(79,70,229,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✏️</div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Edit Campaign</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#93C5FD" }}>{campaign.campaign_name}</span>
                            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>•</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#93C5FD", letterSpacing: "0.05em" }}>{campaign.campaign_id}</span>
                            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>•</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: stateColor, background: `${stateColor}22`, padding: "2px 9px", borderRadius: 12, textTransform: "uppercase" }}>{campaignState}</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Created {fmtDate(campaign.created_at)}</span>
                    <Button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.22)", color: "#fff", flexShrink: 0, padding: 0 }}>
                        <CloseOutlined style={{ fontSize: 13 }} />
                    </Button>
                </div>
            </div>
            <div style={{ maxHeight: "66vh", overflowY: "auto", background: "var(--bg-page)" }}>
                <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabItems} style={{ padding: "0 28px" }} tabBarStyle={{ marginBottom: 20, borderBottom: `1px solid var(--border)`, paddingTop: 12 }} />
            </div>
            <div style={{ padding: "14px 28px", background: "var(--bg-card)", borderTop: `1px solid var(--border)`, display: "flex", justifyContent: "flex-end" }}>
                <div style={{ display: "flex", gap: 10 }}>
                    <Button onClick={onClose} style={{ height: 38, borderRadius: 8, border: `1px solid var(--border)`, color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>Cancel</Button>
                    <Button type="primary" loading={saving} onClick={handleSave} icon={<SaveOutlined />}
                        style={{ height: 38, borderRadius: 8, background: "var(--accent)", borderColor: "var(--accent)", fontSize: 13, fontWeight: 700 }}>
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
    const color = type === "success" ? "var(--green)" : "var(--red)";
    return (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1999, background: "var(--bg-card)", border: `1px solid ${color}`, borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow)" }}>
            <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{msg}</span>
        </div>
    );
}

// ── Inline DV ID Editor ───────────────────────────────────────────────────────
function DvIdCell({ lineItemId, initialValue }: { lineItemId: string; initialValue?: string }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(initialValue || "");
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/update_line_item_dv_id/${lineItemId}/`, { method: "PATCH", headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" }, body: JSON.stringify({ dv_id: value }) });
            if (res.ok) setEditing(false);
            else alert("Failed to save DV ID");
        } catch { alert("Network error"); }
        finally { setSaving(false); }
    };

    if (editing) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
                    style={{ height: 28, padding: "0 8px", borderRadius: 6, border: `1px solid var(--accent)`, fontSize: 12, width: 120, outline: "none", background: "var(--accent-light)", color: "var(--text-primary)" }}
                    placeholder="Enter DV ID" />
                <Button size="small" loading={saving} onClick={handleSave} style={{ height: 26, borderRadius: 6, fontSize: 11, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600 }}>
                    {saving ? "" : "Save"}
                </Button>
                <Button size="small" onClick={() => { setEditing(false); setValue(initialValue || ""); }} style={{ height: 26, borderRadius: 6, fontSize: 11, border: `1px solid var(--border)`, color: "var(--text-muted)" }}>✕</Button>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {value ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", background: "var(--accent-light)", padding: "2px 8px", borderRadius: 6, border: `1px solid var(--border-strong)` }}>{value}</span>
            ) : (
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>—</span>
            )}
            <Button size="small" icon={<EditOutlined style={{ fontSize: 10 }} />} onClick={() => setEditing(true)}
                style={{ height: 22, width: 22, padding: 0, borderRadius: 5, border: `1px solid var(--border)`, background: "var(--bg-card)", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }} />
        </div>
    );
}

// ── Line Item Status Cell ─────────────────────────────────────────────────────
function LineItemStatusCell({ lineItemId, initialStatus }: { lineItemId: string; initialStatus?: string }) {
    const [status, setStatus] = useState(initialStatus || 'upcoming');
    const [saving, setSaving] = useState(false);

    const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
        live: { color: 'var(--green)', bg: 'var(--green-bg)', label: '🟢 Live' },
        upcoming: { color: 'var(--amber)', bg: 'var(--amber-bg)', label: '🟡 Upcoming' },
        completed: { color: 'var(--red)', bg: 'var(--red-bg)', label: '🔴 Completed' },
        paused: { color: 'var(--accent)', bg: 'var(--accent-light)', label: '⏸ Paused' },
    };

    const handleChange = async (newStatus: string) => {
        setSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/update_line_item_status/${lineItemId}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' }, body: JSON.stringify({ status: newStatus }) });
            if (res.ok) setStatus(newStatus);
            else alert('Failed to update status');
        } catch { alert('Network error'); }
        finally { setSaving(false); }
    };

    return (
        <Select value={status} onChange={handleChange} loading={saving} size="small" style={{ width: 130 }} styles={{ popup: { root: { minWidth: 130 } } }}>
            {Object.entries(statusConfig).map(([key, cfg]) => (
                <Option key={key} value={key}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '1px 7px' }}>{cfg.label}</span>
                </Option>
            ))}
        </Select>
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
    const [chatCampaign, setChatCampaign] = useState<Campaign | null>(null);
    const [chatAudience, setChatAudience] = useState<"client" | "creative" | "campaign_team" | null>(null);

    const closeChat = () => { setChatCampaign(null); setChatAudience(null); };

    const chatMenuItems = [
        { key: "client", label: "💬 Client", bg: "var(--accent-light)" },
        { key: "creative", label: "🎨 Creative Team", bg: "var(--accent-light)" },
        { key: "campaign_team", label: "📋 Campaign Team", bg: "var(--accent-light)" },
    ].map(opt => ({
        key: opt.key,
        label: (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 2px" }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{opt.label.split(" ")[0]}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{opt.label.split(" ").slice(1).join(" ")}</span>
            </div>
        ),
    }));

    const fetchCampaigns = useCallback(() => {
        setLoading(true);
        fetch(`${BASE_URL}/get_campaigns/`, { headers: { "ngrok-skip-browser-warning": "1" } })
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(data => { const list: Campaign[] = Array.isArray(data) ? data : Array.isArray(data?.campaigns) ? data.campaigns : []; setCampaigns(list); })
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

    const handleApproveCampaign = async (record: Campaign) => {
        Modal.confirm({
            title: "Approve Campaign?",
            content: `This will generate a Campaign ID for "${record.campaign_name}". This cannot be undone.`,
            okText: "Yes, Approve",
            okButtonProps: { style: { background: "var(--accent)", borderColor: "var(--accent)" } },
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    const res = await fetch(`${BASE_URL}/approve_campaign/${record.id}/`, { method: "POST", headers: { "ngrok-skip-browser-warning": "1" } });
                    if (res.ok) { const data = await res.json(); setToast({ message: `Campaign approved! ID: ${data.campaign_id}`, type: "success" }); fetchCampaigns(); }
                    else setToast({ message: "Failed to approve campaign", type: "error" });
                } catch { setToast({ message: "Network error", type: "error" }); }
            },
        });
    };

    const columns: ColumnsType<Campaign> = [
        {
            title: "Campaign ID", dataIndex: "campaign_id", key: "campaign_id", width: 140, fixed: "left",
            render: (id: string | null) => id ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", background: "var(--accent-light)", padding: "3px 8px", borderRadius: 6 }}>{id}</span>
            ) : (
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--amber)", background: "var(--amber-bg)", padding: "3px 8px", borderRadius: 6, border: `1px dashed var(--amber)` }}>Pending Approval</span>
            ),
        },
        { title: "Client Campaign ID", dataIndex: "client_campaign_ID", key: "client_campaign_ID", width: 160, render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v || "—"}</span> },
        { title: "Purchase Order ID", dataIndex: "purchase_order_ID", key: "purchase_order_ID", width: 160, render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v || "—"}</span> },
        { title: "Campaign Name", dataIndex: "campaign_name", key: "campaign_name", width: 200, render: (name: string) => <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{name || "—"}</span> },
        { title: "Advertiser", dataIndex: "advertiser", key: "advertiser", width: 160, render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v || "—"}</span> },
        { title: "Company", dataIndex: "client_name", key: "client_name", width: 160, render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v || "—"}</span> },
        { title: "Type", dataIndex: "campaign_type", key: "campaign_type", width: 150, render: (v: string) => v ? <Tag color="purple" style={{ fontSize: 11 }}>{v}</Tag> : <span style={{ color: "var(--text-muted)" }}>—</span> },
        { title: "Objective", dataIndex: "objective", key: "objective", width: 180, render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v || "—"}</span> },
        { title: "Buying Type", dataIndex: "buying_type", key: "buying_type", width: 180, render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v || "—"}</span> },
        { title: "Start Date", dataIndex: "start_date", key: "start_date", width: 130, render: (v: string) => v ? <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{fmtDate(v)}</span> : <span style={{ color: "var(--text-muted)" }}>—</span> },
        { title: "End Date", dataIndex: "end_date", key: "end_date", width: 130, render: (v: string) => v ? <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{fmtDate(v)}</span> : <span style={{ color: "var(--text-muted)" }}>—</span> },
        {
            title: "Campaign State", key: "campaign_state", width: 140,
            render: (_: any, record: Campaign) => {
                const isActive = isActiveCampaign(record);
                const isClosed = isClosedCampaign(record);
                const cfg = isActive
                    ? { color: "var(--green)", label: "Active" }
                    : isClosed
                        ? { color: "var(--red)", label: "Closed" }
                        : { color: "var(--amber)", label: "Upcoming" };
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: `${cfg.color}18`, border: `1px solid ${cfg.color}`, fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />{cfg.label}
                    </span>
                );
            },
        },
        {
            title: "Line Items", key: "line_items", width: 100,
            render: (_: any, record: Campaign) => <Tag color="blue" style={{ fontSize: 11 }}>{record.line_items?.length ?? 0} item{(record.line_items?.length ?? 0) !== 1 ? "s" : ""}</Tag>,
        },
        { title: "Created", dataIndex: "created_at", key: "created_at", width: 130, render: (v: string) => v ? <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDate(v)}</span> : <span style={{ color: "var(--text-muted)" }}>—</span> },
        {
            title: "Actions", key: "actions", width: 320, fixed: "right",
            render: (_: any, record: Campaign) => (
                <div style={{ display: "flex", gap: 6 }}>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/campaign/${record.campaign_id}`)} disabled={!record.campaign_id}
                        style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-light)", border: `1px solid var(--accent)`, borderRadius: 6 }}>View</Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => setEditCampaign(record)}
                        style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", background: "var(--bg-input)", border: `1px solid var(--border)`, borderRadius: 6 }}>Edit</Button>
                    <Dropdown
                        menu={{
                            items: chatMenuItems,
                            onClick: ({ key }) => {
                                setChatCampaign(record);
                                setChatAudience(key as "client" | "creative" | "campaign_team");
                            },
                        }}
                        trigger={["click"]}
                        placement="bottomRight"
                        disabled={!record.campaign_id}
                    >
                        <Button size="small" icon={<MessageOutlined />} disabled={!record.campaign_id}
                            style={{ fontSize: 11, fontWeight: 600, color: chatCampaign?.id === record.id ? "#fff" : "var(--accent)", background: chatCampaign?.id === record.id ? "var(--accent)" : "var(--accent-light)", border: `1px solid var(--accent)`, borderRadius: 6 }}>
                            Chat
                        </Button>
                    </Dropdown>
                    {record.approval_status !== "approved" ? (
                        <Button size="small" onClick={() => handleApproveCampaign(record)}
                            style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", background: "var(--green-bg)", border: `1px solid var(--green)`, borderRadius: 6 }}>✓ Approve</Button>
                    ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--green)", background: "var(--green-bg)", border: `1px solid var(--green)`, borderRadius: 6, padding: "3px 8px", height: 26 }}>
                            <CheckCircleOutlined /> Approved
                        </span>
                    )}
                </div>
            ),
        },
    ];

    const lineItemColumns: ColumnsType<LineItem> = [
        { title: "Line Item ID", dataIndex: "line_item_id", key: "line_item_id", render: (v: string) => <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", background: "var(--accent-light)", padding: "2px 6px", borderRadius: 4 }}>{v}</span> },
        { title: "DV ID", key: "dv_id", width: 180, render: (_: any, record: LineItem) => <DvIdCell lineItemId={record.line_item_id} initialValue={record.dv_id || ""} /> },
        { title: "Status", key: "status", width: 150, render: (_: any, record: LineItem) => <LineItemStatusCell lineItemId={record.line_item_id} initialStatus={record.status || "upcoming"} /> },
        { title: "Name", dataIndex: "line_item_name", key: "line_item_name", render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{v || "—"}</span> },
        { title: "Start Date", dataIndex: "start_date", key: "start_date", render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v || "—"}</span> },
        { title: "End Date", dataIndex: "end_date", key: "end_date", render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v || "—"}</span> },
        {
            title: "Ad Format", dataIndex: "ad_format", key: "ad_format",
            render: (v: string | string[]) => { const formats = Array.isArray(v) ? v : (v ? [v] : []); return formats.length > 0 ? formats.map((f: string) => <Tag key={f} color="blue" style={{ fontSize: 10 }}>{f}</Tag>) : <span style={{ color: "var(--text-muted)" }}>—</span>; },
        },
        { title: "Impressions", dataIndex: "impressions", key: "impressions", render: (v: string) => <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{v ? Number(v).toLocaleString("en-IN") : "—"}</span> },
    ];

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>All Campaigns</h1>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>MANAGE & TRACK ALL CLIENT CAMPAIGNS</p>
                </div>
                <Button onClick={() => navigate('/campaign_create', { state: { adminMode: true } })}
                    style={{ borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, boxShadow: `0 4px 14px var(--accent)44` }}>
                    <PlusOutlined /> Add New Campaign
                </Button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                <StatCard label="Total Campaigns" value={totalCount} color="var(--accent)" icon="📊" active={cardFilter === "all"} onClick={() => setCardFilter("all")} />
                <StatCard label="Active Campaigns" value={activeCount} color="var(--green)" icon="🟢" active={cardFilter === "active"} onClick={() => setCardFilter(cardFilter === "active" ? "all" : "active")} />
                <StatCard label="Closed Campaigns" value={closedCount} color="var(--red)" icon="🔴" active={cardFilter === "closed"} onClick={() => setCardFilter(cardFilter === "closed" ? "all" : "closed")} />
            </div>

            {cardFilter !== "all" && (
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Filtered by:</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 12px", borderRadius: 20, background: cardFilter === "active" ? "var(--green-bg)" : "var(--red-bg)", border: `1px solid ${cardFilter === "active" ? "var(--green)" : "var(--red)"}`, fontSize: 11, fontWeight: 700, color: cardFilter === "active" ? "var(--green)" : "var(--red)" }}>
                        {cardFilter === "active" ? "🟢 Active Campaigns" : "🔴 Closed Campaigns"}
                        <button onClick={() => setCardFilter("all")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 12, padding: 0 }}>✕</button>
                    </span>
                </div>
            )}

            <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: "14px 18px", border: `1px solid var(--border)`, marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Input placeholder="Search by name, ID, advertiser, company…" prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />} value={search} onChange={e => setSearch(e.target.value)} allowClear
                    style={{ flex: 1, minWidth: 240, height: 36, background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 180, height: 36 }}>
                    <Option value="all">All Types</Option>
                    {uniqueTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
                <Button onClick={fetchCampaigns} icon={<ReloadOutlined />} style={{ height: 36, borderRadius: 8, border: `1px solid var(--border)`, background: "var(--bg-input)", color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>Refresh</Button>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>{filtered.length} of {campaigns.length} campaigns</span>
            </div>

            <div style={{ background: "var(--bg-card)", borderRadius: 14, border: `1px solid var(--border)`, overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
                <Table
                    columns={columns} dataSource={filtered} rowKey="campaign_id" loading={loading}
                    scroll={{ x: 2100 }}
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"], showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} campaigns`, style: { padding: "12px 16px" } }}
                    expandable={{
                        expandedRowRender: (record: Campaign) => {
                            if (!record.line_items || record.line_items.length === 0) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No line items.</span>;
                            return (
                                <div style={{ padding: "8px 0" }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, display: "block" }}>Line Items ({record.line_items.length})</span>
                                    <Table size="small" dataSource={record.line_items} rowKey="line_item_id" pagination={false} columns={lineItemColumns} style={{ background: "var(--bg-page)", borderRadius: 8 }} />
                                </div>
                            );
                        },
                        rowExpandable: () => true,
                    }}
                    rowClassName={(record) => isClosedCampaign(record) ? "all-campaigns-row all-campaigns-row-closed" : "all-campaigns-row"}
                    style={{ fontSize: 13 }}
                />
            </div>

            <EditCampaignModal campaign={editCampaign} open={!!editCampaign} onClose={() => setEditCampaign(null)} onSaved={fetchCampaigns} uniqueTypes={uniqueTypes} />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {chatCampaign && chatAudience === "client" && (
                <Admin_Campaign_Chat campaign={chatCampaign} onClose={closeChat} />
            )}
            {chatCampaign && chatCampaign.campaign_id && (chatAudience === "creative" || chatAudience === "campaign_team") && (
                <Creative_Team_Chat
                    campaign={{ campaign_id: chatCampaign.campaign_id, campaign_name: chatCampaign.campaign_name }}
                    teamType={chatAudience}
                    role="admin"
                    onClose={closeChat}
                />
            )}

            <style>{`
                .all-campaigns-row:hover td { background: var(--bg-card-hover) !important; }
                .all-campaigns-row-closed td { opacity: 0.75; }
                .ant-table-thead > tr > th {
                    background: var(--bg-input) !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: var(--text-muted) !important;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    border-right: none !important;
                    border-bottom: 1px solid var(--border) !important;
                }
                .ant-table-tbody > tr > td {
                    background: var(--bg-card) !important;
                    color: var(--text-primary) !important;
                    border-bottom: 1px solid var(--border) !important;
                    border-right: none !important;
                }
                .ant-table { background: var(--bg-card) !important; }
                .ant-table-container { border: none !important; }
                .ant-table-row-expand-icon-cell { background: var(--bg-input) !important; }
                .edit-campaign-modal .ant-modal-content {
                    padding: 0 !important;
                    border-radius: 16px !important;
                    overflow: hidden !important;
                    border: none !important;
                }
                .edit-campaign-modal .ant-modal-header { display: none !important; }
                .edit-campaign-modal .ant-modal-close { display: none !important; }
                .edit-campaign-modal .ant-modal-body { padding: 0 !important; }
            `}</style>
        </div>
    );
}