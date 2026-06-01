import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Spin, Tag, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Sidebar from '../shared/Sidebar';

const { Text } = Typography;

const BASE_URL = import.meta.env.VITE_BASE_URL;

const PURPLE = '#7c3aed';
const PURPLE_LIGHT = '#f5f3ff';
const PURPLE_MID = '#ddd6fe';
const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const SLATE = '#0F172A';
const SLATE_300 = '#CBD5E1';
const SLATE_500 = '#64748B';
const WHITE = '#FFFFFF';
const BG = '#F8FAFC';
const GREEN = '#059669';
const GREEN_LIGHT = '#f0fdf4';
const GREEN_MID = '#86efac';

const STATUS_COLOR: Record<string, string> = {
    live: 'green', active: 'blue', paused: 'orange',
    pending: 'gold', draft: 'default', completed: 'purple', cancelled: 'red',
};

interface CreativeDetail {
    type?: 'standard' | 'third_party';
    creative_name?: string;
    dimensions?: string;
    click_through_url?: string;
    appended_html_tag?: string;
    integration_code?: string;
    notes?: string;
    input_file?: string;
    backup_image_name?: string;
}

interface LineItem {
    line_item_id: string;
    line_item_name: string;
    start_date: string;
    end_date: string;
    ad_format: string | string[];
    ad_sub_format?: string;
    ethnicity?: string | string[];
    status?: string;
    ctr?: string;
    viewability?: string;
    vcr?: string;
    kpi_notes?: string;
    creatives?: CreativeDetail[];
    image_creatives?: string[];
    video_creatives?: string[];
    third_party_creatives?: { input_file: string; backup_image_name?: string }[];
}

interface Campaign {
    campaign_id: string;
    campaign_name: string;
    advertiser?: string;
    client_name?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    line_items?: LineItem[];
}

// ── Reusable badge pills ──
const ImgBadge = () => (
    <span style={{
        fontSize: 10, fontWeight: 700, color: BLUE,
        background: BLUE_LIGHT, padding: '1px 6px',
        borderRadius: 4, border: `1px solid #bfdbfe`, flexShrink: 0,
    }}>IMG</span>
);

const VidBadge = () => (
    <span style={{
        fontSize: 10, fontWeight: 700, color: PURPLE,
        background: PURPLE_LIGHT, padding: '1px 6px',
        borderRadius: 4, border: `1px solid ${PURPLE_MID}`, flexShrink: 0,
    }}>VID</span>
);

// ── Same InfoRow / SectionHeader style as View_Campaign ──
function InfoRow({ label, value, alt }: { label: string; value: React.ReactNode; alt?: boolean }) {
    return (
        <tr>
            <td style={{
                padding: '10px 16px', fontSize: 13, fontWeight: 500,
                color: SLATE_500, background: BG, width: 220,
                borderBottom: `1px solid ${SLATE_300}`, whiteSpace: 'nowrap',
            }}>
                {label}
            </td>
            <td style={{
                padding: '10px 16px', fontSize: 13, color: SLATE,
                background: alt ? '#F8FAFC' : WHITE,
                borderBottom: `1px solid ${SLATE_300}`,
            }}>
                {value ?? <span style={{ color: SLATE_500 }}>—</span>}
            </td>
        </tr>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <tr>
            <td colSpan={2} style={{
                padding: '8px 16px', background: '#F1F5F9',
                fontSize: 10, fontWeight: 700, color: SLATE_500,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                borderBottom: `1px solid ${SLATE_300}`,
            }}>
                {title}
            </td>
        </tr>
    );
}

// ── Line Item rendered as table (collapsible) ──
function LineItemBlock({ li, index }: { li: LineItem; index: number }) {
    const [open, setOpen] = useState(true);

    const formats = Array.isArray(li.ad_format)
        ? li.ad_format
        : li.ad_format ? [li.ad_format] : [];
    const ethnicities = Array.isArray(li.ethnicity)
        ? li.ethnicity
        : li.ethnicity ? [li.ethnicity] : [];

    // ── Separate by ACTUAL file type, not ad format ──
    const imageFileNames = li.image_creatives ?? [];
    const videoFileNames = li.video_creatives ?? [];
    const standardCreatives = (li.creatives ?? []).filter(c => !c.type || c.type === 'standard');
    const thirdPartyFromCreatives = (li.creatives ?? []).filter(c => c.type === 'third_party');
    const thirdPartyFromArray = li.third_party_creatives ?? [];
    const allThirdParty = thirdPartyFromCreatives.length > 0 ? thirdPartyFromCreatives : thirdPartyFromArray;

    const totalCreatives =
        imageFileNames.length + videoFileNames.length +
        standardCreatives.length + allThirdParty.length;

    return (
        <div>
            {/* Collapsible header */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    padding: '12px 16px', background: BG,
                    borderBottom: `1px solid ${SLATE_300}`,
                    cursor: 'pointer', userSelect: 'none',
                    display: 'flex', alignItems: 'center', gap: 12,
                }}
            >
                <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: PURPLE, color: WHITE,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                    {index + 1}
                </div>

                <Text strong style={{ fontSize: 13, color: SLATE }}>
                    {li.line_item_name || `Line Item ${index + 1}`}
                </Text>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                        fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                        color: PURPLE, background: PURPLE_LIGHT,
                        padding: '1px 6px', borderRadius: 4,
                    }}>
                        {li.line_item_id}
                    </span>
                    {formats.map(f => <Tag key={f} color="blue" style={{ fontSize: 10, margin: 0 }}>{f}</Tag>)}
                    {li.ad_sub_format && <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>{li.ad_sub_format}</Tag>}
                    {li.status && (
                        <Badge
                            color={STATUS_COLOR[li.status] ?? 'default'}
                            text={<span style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>{li.status}</span>}
                        />
                    )}
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{
                        background: PURPLE_LIGHT, border: `1px solid ${PURPLE_MID}`,
                        borderRadius: 6, padding: '3px 10px',
                        fontSize: 11, fontWeight: 700, color: PURPLE,
                    }}>
                        {totalCreatives} creatives
                    </div>
                    <span style={{
                        fontSize: 16, color: SLATE_500,
                        display: 'inline-block', transition: 'transform 0.2s',
                        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}>›</span>
                </div>
            </div>

            {/* Table body */}
            {open && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>

                        {/* ── Line Item Details ── */}
                        <SectionHeader title="Line Item Details" />
                        <InfoRow label="Line Item ID" value={
                            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: PURPLE }}>
                                {li.line_item_id}
                            </span>
                        } />
                        <InfoRow label="Start Date" value={li.start_date} alt />
                        <InfoRow label="End Date" value={li.end_date} />
                        <InfoRow label="Ad Format" alt value={
                            formats.length > 0
                                ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {formats.map(f => <Tag key={f} color="blue" style={{ fontSize: 11 }}>{f}</Tag>)}
                                    {li.ad_sub_format && <Tag color="purple" style={{ fontSize: 11 }}>{li.ad_sub_format}</Tag>}
                                </div>
                                : null
                        } />
                        {ethnicities.length > 0 && (
                            <InfoRow label="Ethnicity" value={
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {ethnicities.map(e => <Tag key={e} style={{ fontSize: 11 }}>{e}</Tag>)}
                                </div>
                            } />
                        )}

                        {/* ── KPIs ── */}
                        {(li.ctr || li.viewability || li.vcr) && (
                            <>
                                <SectionHeader title="KPIs" />
                                {li.ctr && <InfoRow label="CTR" value={`${li.ctr}%`} />}
                                {li.viewability && <InfoRow label="Viewability" alt value={`${li.viewability}%`} />}
                                {li.vcr && <InfoRow label="VCR" value={`${li.vcr}%`} />}
                                {li.kpi_notes && (
                                    <InfoRow label="KPI Notes" alt value={
                                        <span style={{ fontStyle: 'italic', color: '#92400e' }}>{li.kpi_notes}</span>
                                    } />
                                )}
                            </>
                        )}

                        {/* ── Image Creatives — always IMG badge ── */}
                        {imageFileNames.length > 0 && (
                            <>
                                <SectionHeader title={`Image Creatives (${imageFileNames.length})`} />
                                {imageFileNames.map((name, i) => (
                                    <InfoRow key={`img-${i}`} label={`Image ${i + 1}`} alt={i % 2 === 0} value={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <ImgBadge />
                                            <span>{name}</span>
                                        </div>
                                    } />
                                ))}
                            </>
                        )}

                        {/* ── Video Creatives — always VID badge ── */}
                        {videoFileNames.length > 0 && (
                            <>
                                <SectionHeader title={`Video Creatives (${videoFileNames.length})`} />
                                {videoFileNames.map((name, i) => (
                                    <InfoRow key={`vid-${i}`} label={`Video ${i + 1}`} alt={i % 2 === 0} value={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <VidBadge />
                                            <span>{name}</span>
                                        </div>
                                    } />
                                ))}
                            </>
                        )}

                        {/* ── Standard Creative Details — IMG badge (it's an image file) ── */}
                        {standardCreatives.length > 0 && (
                            <>
                                <SectionHeader title={`Creative Details (${standardCreatives.length})`} />
                                {standardCreatives.map((c, i) => (
                                    <>
                                        {i > 0 && (
                                            <tr key={`std-div-${i}`}>
                                                <td colSpan={2} style={{ padding: 0, height: 1, background: SLATE_300 }} />
                                            </tr>
                                        )}
                                        {/* Name row — IMG badge because these are image uploads */}
                                        {/* Name row */}
                                        <InfoRow
                                            key={`std-name-${i}`}
                                            label={`Creative ${i + 1}`}
                                            value={
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                                                    {(() => {
                                                        const adFormats = Array.isArray(li.ad_format)
                                                            ? li.ad_format.map(a => a.toLowerCase())
                                                            : [li.ad_format?.toLowerCase()];

                                                        const isVideo = adFormats.some(a => a?.includes('video'));

                                                        return isVideo ? <VidBadge /> : <ImgBadge />;
                                                    })()}

                                                    <span style={{ fontWeight: 600 }}>
                                                        {c.creative_name || `Creative ${i + 1}`}
                                                    </span>

                                                    {c.dimensions && (
                                                        <span
                                                            style={{
                                                                fontSize: 10.5,
                                                                color: SLATE_500,
                                                                background: '#f1f5f9',
                                                                padding: '1px 7px',
                                                                borderRadius: 4,
                                                                border: `1px solid ${SLATE_300}`,
                                                            }}
                                                        >
                                                            {c.dimensions}
                                                        </span>
                                                    )}
                                                </div>
                                            }
                                        />
                                        {c.click_through_url && (
                                            <InfoRow key={`std-url-${i}`} label="Click-Through URL" alt value={
                                                <a
                                                    href={c.click_through_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: BLUE, wordBreak: 'break-all', textDecoration: 'underline', fontSize: 13 }}
                                                >
                                                    {c.click_through_url}
                                                </a>
                                            } />
                                        )}
                                        {c.appended_html_tag && (
                                            <InfoRow key={`std-tag-${i}`} label="Appended HTML Tag" value={
                                                c.appended_html_tag.startsWith('http') ? (
                                                    <a
                                                        href={c.appended_html_tag}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{ color: BLUE, wordBreak: 'break-all', textDecoration: 'underline', fontSize: 13 }}
                                                    >
                                                        {c.appended_html_tag}
                                                    </a>
                                                ) : (
                                                    <code style={{
                                                        fontSize: 12, color: PURPLE,
                                                        background: PURPLE_LIGHT, padding: '3px 8px',
                                                        borderRadius: 4, wordBreak: 'break-all', display: 'block',
                                                    }}>
                                                        {c.appended_html_tag}
                                                    </code>
                                                )
                                            } />
                                        )}
                                        {c.integration_code && (
                                            <InfoRow key={`std-code-${i}`} label="Integration Code" alt value={
                                                <code style={{
                                                    fontSize: 12, color: GREEN,
                                                    background: GREEN_LIGHT, padding: '3px 8px',
                                                    borderRadius: 4, wordBreak: 'break-all', display: 'block',
                                                }}>
                                                    {c.integration_code}
                                                </code>
                                            } />
                                        )}
                                        {c.notes && (
                                            <InfoRow key={`std-notes-${i}`} label="Notes" value={
                                                <span style={{ fontStyle: 'italic', color: SLATE_500 }}>{c.notes}</span>
                                            } />
                                        )}
                                    </>
                                ))}
                            </>
                        )}

                        {/* ── Third Party Creatives — 3P badge with file name ── */}
                        {allThirdParty.length > 0 && (
                            <>
                                <SectionHeader title={`Third Party Creatives (${allThirdParty.length})`} />
                                {allThirdParty.map((tp, i) => {
                                    const fileName = (tp.input_file ? tp.input_file.split('/').pop() : undefined)
                                        || `Third Party ${i + 1}`;
                                    const ext = fileName.split('.').pop()?.toUpperCase() || '';
                                    const backupFileName = tp.backup_image_name || '';

                                    return (
                                        <React.Fragment key={`tp-block-${i}`}>
                                            {i > 0 && (
                                                <tr key={`tp-div-${i}`}>
                                                    <td colSpan={2} style={{ padding: 0, height: 1, background: SLATE_300 }} />
                                                </tr>
                                            )}
                                            <InfoRow
                                                label={`Third Party ${i + 1}`}
                                                alt={i % 2 === 0}
                                                value={
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

                                                        {fileName ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                {/* File extension pill */}
                                                                {ext && (
                                                                    <span style={{
                                                                        fontSize: 10,
                                                                        fontWeight: 700,
                                                                        color: '#92400e',
                                                                        background: '#fef3c7',
                                                                        padding: '1px 6px',
                                                                        borderRadius: 4,
                                                                        border: '1px solid #fcd34d',
                                                                        fontFamily: 'monospace',
                                                                        textTransform: 'uppercase',
                                                                    }}>
                                                                        {ext}
                                                                    </span>
                                                                )}
                                                                <span style={{ fontSize: 13, color: SLATE, fontWeight: 500 }}>
                                                                    {fileName}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: SLATE_500, fontSize: 12 }}>No file uploaded</span>
                                                        )}
                                                    </div>
                                                }
                                            />
                                            {backupFileName && (
                                                <InfoRow
                                                    label="Backup Image"
                                                    value={
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                                color: '#065f46',
                                                                background: '#d1fae5',
                                                                padding: '1px 6px',
                                                                borderRadius: 4,
                                                                border: '1px solid #6ee7b7',
                                                                fontFamily: 'monospace',
                                                                textTransform: 'uppercase',
                                                            }}>
                                                                {backupFileName.split('.').pop()?.toUpperCase()}
                                                            </span>
                                                            <span style={{ fontSize: 13, color: GREEN, fontWeight: 500 }}>
                                                                {backupFileName}
                                                            </span>
                                                        </div>
                                                    }
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </>
                        )}

                        {/* ── Empty state ── */}
                        {totalCreatives === 0 && (
                            <tr>
                                <td colSpan={2} style={{
                                    padding: '28px 16px', textAlign: 'center',
                                    color: SLATE_500, fontSize: 13,
                                    borderTop: `1px dashed ${SLATE_300}`,
                                }}>
                                    No creatives uploaded for this line item yet.
                                </td>
                            </tr>
                        )}

                    </tbody>
                </table>
            )}
        </div>
    );
}

export default function View_Creative() {
    const { campaign_id } = useParams<{ campaign_id: string }>();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const sideWidth = collapsed ? 64 : 240;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!campaign_id) return;
        setLoading(true);
        fetch(`${BASE_URL}/get_campaign_by_id/${campaign_id}/`, {
            headers: { 'ngrok-skip-browser-warning': '1' },
        })
            .then(r => {
                if (!r.ok) throw new Error(`Failed to fetch: ${r.status}`);
                return r.json();
            })
            .then(data => setCampaign(data?.campaign ?? data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [campaign_id]);

    const totalCreatives = campaign?.line_items?.reduce((acc, li) => {
        return acc +
            (li.image_creatives?.length ?? 0) +
            (li.video_creatives?.length ?? 0) +
            (li.creatives?.length ?? 0) +
            (li.third_party_creatives?.length ?? 0);
    }, 0) ?? 0;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

            <div style={{ marginLeft: sideWidth, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.25s', minWidth: 0 }}>

                {/* ── Top header bar ── */}
                <header style={{
                    background: WHITE, borderBottom: `1px solid ${SLATE_300}`,
                    padding: '0 28px', height: 64,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'sticky', top: 0, zIndex: 50,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate(-1)}
                            style={{ border: `1px solid ${SLATE_300}`, color: SLATE_500, fontWeight: 600 }}
                        >
                            Back
                        </Button>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: SLATE }}>Creative Details</div>
                            <Text style={{ fontSize: 11, color: SLATE_500, letterSpacing: '0.04em' }}>
                                {campaign_id}
                            </Text>
                        </div>
                    </div>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: PURPLE,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: WHITE, fontSize: 13, fontWeight: 700,
                    }}>CT</div>
                </header>

                <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                            <Spin size="large" />
                        </div>
                    )}
                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
                            {error}
                        </div>
                    )}

                    {!loading && !error && campaign && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* ── Campaign info strip ── */}
                            <div style={{
                                background: WHITE, border: `1px solid ${SLATE_300}`,
                                borderRadius: 12, padding: '14px 20px',
                                display: 'flex', alignItems: 'center', gap: 20,
                                flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            }}>
                                <div>
                                    <div style={{ fontSize: 11, color: SLATE_500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Campaign</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: SLATE }}>{campaign.campaign_name}</div>
                                </div>
                                {campaign.advertiser && (
                                    <>
                                        <div style={{ width: 1, height: 36, background: SLATE_300 }} />
                                        <div>
                                            <div style={{ fontSize: 11, color: SLATE_500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Advertiser</div>
                                            <div style={{ fontSize: 13, color: SLATE }}>{campaign.advertiser}</div>
                                        </div>
                                    </>
                                )}
                                {campaign.status && (
                                    <>
                                        <div style={{ width: 1, height: 36, background: SLATE_300 }} />
                                        <div>
                                            <div style={{ fontSize: 11, color: SLATE_500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Status</div>
                                            <Badge
                                                color={STATUS_COLOR[campaign.status] ?? 'default'}
                                                text={<span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{campaign.status}</span>}
                                            />
                                        </div>
                                    </>
                                )}
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                    <div style={{ background: PURPLE_LIGHT, border: `1px solid ${PURPLE_MID}`, borderRadius: 8, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: PURPLE }}>{campaign.line_items?.length ?? 0}</span>
                                        <span style={{ fontSize: 11, color: PURPLE, opacity: 0.75 }}>line items</span>
                                    </div>
                                    <div style={{ background: GREEN_LIGHT, border: `1px solid ${GREEN_MID}`, borderRadius: 8, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>{totalCreatives}</span>
                                        <span style={{ fontSize: 11, color: GREEN, opacity: 0.75 }}>total creatives</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Line Items & Creatives ── */}
                            <div style={{
                                background: WHITE, borderRadius: 12,
                                border: `1px solid ${SLATE_300}`,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                overflow: 'hidden',
                            }}>
                                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${SLATE_300}` }}>
                                    <Text style={{ fontSize: 11, fontWeight: 700, color: SLATE_500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                        Line Items &amp; Creatives ({campaign.line_items?.length ?? 0})
                                    </Text>
                                </div>

                                {(!campaign.line_items || campaign.line_items.length === 0) ? (
                                    <div style={{ padding: '32px 16px', textAlign: 'center', color: SLATE_500, fontSize: 13 }}>
                                        No line items found for this campaign.
                                    </div>
                                ) : (
                                    campaign.line_items.map((li, idx) => (
                                        <div
                                            key={li.line_item_id}
                                            style={{
                                                borderBottom: idx < campaign.line_items!.length - 1
                                                    ? `2px solid ${SLATE_300}`
                                                    : 'none',
                                            }}
                                        >
                                            <LineItemBlock li={li} index={idx} />
                                        </div>
                                    ))
                                )}

                                <div style={{
                                    padding: '12px 16px', background: '#FFFBEB',
                                    borderTop: `1px solid #FEF3C7`, fontSize: 12, color: '#92400E',
                                }}>
                                    Click-through URLs and HTML tags are clickable links where applicable.
                                </div>
                            </div>

                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}