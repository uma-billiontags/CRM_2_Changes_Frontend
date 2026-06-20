import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Spin, Tag, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Text } = Typography;

const BASE_URL = import.meta.env.VITE_BASE_URL;

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_MID = '#BFDBFE';
const PURPLE = '#7c3aed';
const PURPLE_LIGHT = '#f5f3ff';
const PURPLE_MID = '#ddd6fe';
const SLATE = '#0F172A';
const SLATE_300 = '#CBD5E1';
const SLATE_500 = '#64748B';
const WHITE = '#FFFFFF';
const BG = '#F8FAFC';
const GREEN = '#059669';
const GREEN_LIGHT = '#f0fdf4';
const GREEN_MID = '#86efac';
const RED = '#DC2626';
const RED_LIGHT = '#FEF2F2';
const AMBER = '#D97706';
const AMBER_LIGHT = '#FFFBEB';

const STATUS_COLOR: Record<string, string> = {
    live: 'green', active: 'blue', paused: 'orange',
    pending: 'gold', draft: 'default', completed: 'purple', cancelled: 'red',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface LineItem {
    line_item_id: string;
    line_item_name: string;
    start_date: string;
    end_date: string;
    ad_format: string | string[];
    ad_sub_format?: string;
    ethnicity?: string | string[];
    status?: string;
    impressions?: string;
    units?: string;
    unit_cost?: string;
    unit_value?: string;
    ctr?: string;
    viewability?: string;
    vcr?: string;
    kpi_notes?: string;
}

interface GeoLocation {
    country?: string;
    state?: string;
    city?: string;
    zipcode?: string;
    range?: string;
}

interface Campaign {
    campaign_id: string;
    campaign_name: string;
    client_name?: string;
    client_campaign_ID?: string;
    purchase_order_ID?: string;
    advertiser?: string;
    website_url?: string;
    campaign_type?: string;
    buying_type?: string;
    objective?: string;
    notes?: string;
    start_date?: string;
    end_date?: string;
    age?: string;
    gender?: string;
    geo_targeting?: GeoLocation[];
    platforms?: string;
    frequency_cap?: string;
    brand_safety?: string;
    status?: string;
    approval_status?: string;
    created_at?: string;
    line_items?: LineItem[];
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
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

// ── SectionHeader ─────────────────────────────────────────────────────────────
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

// ── LineItemBlock ─────────────────────────────────────────────────────────────
function LineItemBlock({ li, index }: { li: LineItem; index: number }) {
    const [open, setOpen] = useState(true);

    const formats = Array.isArray(li.ad_format)
        ? li.ad_format
        : li.ad_format ? [li.ad_format] : [];

    const ethnicities = Array.isArray(li.ethnicity)
        ? li.ethnicity
        : li.ethnicity ? [li.ethnicity] : [];

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
                    background: BLUE, color: WHITE,
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
                    {li.unit_cost && (
                        <div style={{
                            background: GREEN_LIGHT, border: `1px solid ${GREEN_MID}`,
                            borderRadius: 6, padding: '3px 10px',
                            fontSize: 11, fontWeight: 700, color: GREEN,
                        }}>
                            {li.unit_cost}
                        </div>
                    )}
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
                        <InfoRow label="Line Item Name" value={li.line_item_name} alt />
                        <InfoRow label="Start Date" value={li.start_date} />
                        <InfoRow label="End Date" value={li.end_date} alt />
                        <InfoRow label="Ad Format" value={
                            formats.length > 0
                                ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {formats.map(f => <Tag key={f} color="blue" style={{ fontSize: 11 }}>{f}</Tag>)}
                                    {li.ad_sub_format && <Tag color="purple" style={{ fontSize: 11 }}>{li.ad_sub_format}</Tag>}
                                </div>
                                : null
                        } />
                        {ethnicities.length > 0 && (
                            <InfoRow label="Ethnicity" alt value={
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {ethnicities.map(e => <Tag key={e} style={{ fontSize: 11 }}>{e}</Tag>)}
                                </div>
                            } />
                        )}

                        {/* ── Delivery ── */}
                        {(li.impressions || li.units || li.unit_cost || li.unit_value) && (
                            <>
                                <SectionHeader title="Delivery & Budget" />
                                {li.impressions && (
                                    <InfoRow label="Impressions" value={
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                                            {Number(li.impressions).toLocaleString('en-IN')}
                                        </span>
                                    } />
                                )}
                                {li.units && (
                                    <InfoRow label="Units" alt value={
                                        <Tag color="geekblue" style={{ fontSize: 11 }}>{li.units}</Tag>
                                    } />
                                )}
                                {li.unit_value && (
                                    <InfoRow label={`Rate (${li.units ?? ''})`} value={
                                        <span style={{ fontSize: 13, fontWeight: 600, color: BLUE }}>{li.unit_value}</span>
                                    } />
                                )}
                                {li.unit_cost && (
                                    <InfoRow label="Unit Cost (Budget)" alt value={
                                        <span style={{
                                            fontSize: 14, fontWeight: 800, color: GREEN,
                                            background: GREEN_LIGHT, padding: '2px 10px',
                                            borderRadius: 6, border: `1px solid ${GREEN_MID}`,
                                        }}>
                                            {li.unit_cost}
                                        </span>
                                    } />
                                )}
                            </>
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

                    </tbody>
                </table>
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function View_Campaign_Team() {
    const { campaign_id } = useParams<{ campaign_id: string }>();
    const navigate = useNavigate();

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

    const durationDays = campaign?.start_date && campaign?.end_date
        ? Math.abs(
            Math.round(
                (new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime())
                / (1000 * 60 * 60 * 24)
            )
        )
        : null;

    const geoString = campaign?.geo_targeting && campaign.geo_targeting.length > 0
        ? campaign.geo_targeting
            .map((l: GeoLocation) => [l.country, l.state, l.city, l.zipcode, l.range].filter(Boolean).join(' › '))
            .join(', ')
        : null;

    const approvalStyle =
        campaign?.approval_status === 'approved'
            ? { color: GREEN, bg: GREEN_LIGHT, border: GREEN_MID }
            : campaign?.approval_status === 'rejected'
                ? { color: RED, bg: RED_LIGHT, border: '#FECACA' }
                : { color: AMBER, bg: AMBER_LIGHT, border: '#FDE68A' };

    return (
        <>

            <div>

                {/* ── Top header bar ── */}
                <div style={{
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
                            <div style={{ fontSize: 15, fontWeight: 700, color: SLATE }}>Campaign Details</div>
                            <Text style={{ fontSize: 11, color: SLATE_500, letterSpacing: '0.04em' }}>
                                {campaign_id}
                            </Text>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, paddingTop: 20, overflowY: 'auto' }}>

                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                            <Spin size="large" />
                        </div>
                    )}

                    {error && (
                        <div style={{ background: RED_LIGHT, border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', color: RED, fontSize: 13, fontWeight: 500 }}>
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

                                {campaign.approval_status && (
                                    <>
                                        <div style={{ width: 1, height: 36, background: SLATE_300 }} />
                                        <div>
                                            <div style={{ fontSize: 11, color: SLATE_500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Approval</div>
                                            <span style={{
                                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                                color: approvalStyle.color, background: approvalStyle.bg,
                                                border: `1px solid ${approvalStyle.border}`,
                                                padding: '3px 10px', borderRadius: 20,
                                            }}>
                                                {campaign.approval_status}
                                            </span>
                                        </div>
                                    </>
                                )}

                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                    <div style={{ background: BLUE_LIGHT, border: `1px solid ${BLUE_MID}`, borderRadius: 8, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: BLUE }}>{campaign.line_items?.length ?? 0}</span>
                                        <span style={{ fontSize: 11, color: BLUE, opacity: 0.75 }}>line items</span>
                                    </div>
                                    {durationDays !== null && (
                                        <div style={{ background: PURPLE_LIGHT, border: `1px solid ${PURPLE_MID}`, borderRadius: 8, padding: '5px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: PURPLE }}>{durationDays}</span>
                                            <span style={{ fontSize: 11, color: PURPLE, opacity: 0.75 }}>days</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Campaign Details Table ── */}
                            <div style={{
                                background: WHITE, borderRadius: 12,
                                border: `1px solid ${SLATE_300}`,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                overflow: 'hidden',
                            }}>
                                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${SLATE_300}` }}>
                                    <Text style={{ fontSize: 11, fontWeight: 700, color: SLATE_500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                        Campaign Summary
                                    </Text>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>

                                        {/* Client & Advertiser */}
                                        <SectionHeader title="Client & Advertiser" />
                                        <InfoRow label="Client / Company" value={campaign.client_name} />
                                        <InfoRow label="Advertiser (Brand)" value={campaign.advertiser} alt />
                                        {campaign.website_url && (
                                            <InfoRow label="Website URL" value={
                                                <a href={campaign.website_url} target="_blank" rel="noreferrer"
                                                    style={{ color: BLUE, textDecoration: 'underline', wordBreak: 'break-all' }}>
                                                    {campaign.website_url}
                                                </a>
                                            } />
                                        )}

                                        {/* Campaign Info */}
                                        <SectionHeader title="Campaign Info" />
                                        <InfoRow label="Campaign ID" value={
                                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: BLUE, fontSize: 13 }}>{campaign.campaign_id}</span>
                                        } />
                                        {campaign.client_campaign_ID && (
                                            <InfoRow label="Client Campaign ID" alt value={campaign.client_campaign_ID} />
                                        )}
                                        {campaign.purchase_order_ID && (
                                            <InfoRow label="Purchase Order ID" value={campaign.purchase_order_ID} />
                                        )}
                                        <InfoRow label="Campaign Name" alt value={
                                            <span style={{ fontWeight: 600, color: SLATE }}>{campaign.campaign_name}</span>
                                        } />
                                        <InfoRow label="Campaign Type" value={
                                            campaign.campaign_type
                                                ? <Tag color="blue" style={{ fontSize: 11 }}>{campaign.campaign_type}</Tag>
                                                : null
                                        } />
                                        <InfoRow label="Buying Type" alt value={campaign.buying_type} />
                                        <InfoRow label="Objective" value={campaign.objective} />
                                        <InfoRow label="Start Date" alt value={campaign.start_date
                                            ? new Date(campaign.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : null
                                        } />
                                        <InfoRow label="End Date" value={campaign.end_date
                                            ? new Date(campaign.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : null
                                        } />
                                        {durationDays !== null && (
                                            <InfoRow label="Duration" alt value={`${durationDays} days`} />
                                        )}
                                        {campaign.notes && (
                                            <InfoRow label="Notes" value={
                                                <span style={{ fontStyle: 'italic', color: SLATE_500 }}>{campaign.notes}</span>
                                            } />
                                        )}

                                        {/* Audience & Targeting */}
                                        <SectionHeader title="Audience & Targeting" />
                                        {campaign.age && <InfoRow label="Age" value={campaign.age} />}
                                        {campaign.gender && <InfoRow label="Gender" alt value={campaign.gender} />}
                                        {geoString && (
                                            <InfoRow label="Geo Targeting" value={
                                                <span style={{ wordBreak: 'break-word' }}>{geoString}</span>
                                            } />
                                        )}
                                        {campaign.platforms && <InfoRow label="Platforms" alt value={campaign.platforms} />}

                                        {/* Campaign Settings */}
                                        <SectionHeader title="Campaign Settings" />
                                        {campaign.frequency_cap && (
                                            <InfoRow label="Frequency Cap" value={`${campaign.frequency_cap} impressions / user`} />
                                        )}
                                        {campaign.brand_safety && (
                                            <InfoRow label="Brand Safety" alt value={
                                                <Tag color={campaign.brand_safety === 'Strict' ? 'red' : campaign.brand_safety === 'Custom' ? 'orange' : 'blue'} style={{ fontSize: 11 }}>
                                                    {campaign.brand_safety}
                                                </Tag>
                                            } />
                                        )}

                                        {/* Status */}
                                        <SectionHeader title="Status" />
                                        <InfoRow label="Campaign Status" value={
                                            <Badge
                                                color={STATUS_COLOR[campaign.status ?? 'pending'] ?? 'default'}
                                                text={<span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{campaign.status ?? 'pending'}</span>}
                                            />
                                        } />
                                        <InfoRow label="Approval Status" alt value={
                                            <span style={{
                                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                                color: approvalStyle.color, background: approvalStyle.bg,
                                                border: `1px solid ${approvalStyle.border}`,
                                                padding: '3px 10px', borderRadius: 20,
                                            }}>
                                                {campaign.approval_status ?? 'pending'}
                                            </span>
                                        } />
                                        {campaign.created_at && (
                                            <InfoRow label="Created At" value={
                                                new Date(campaign.created_at).toLocaleDateString('en-GB', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                })
                                            } />
                                        )}

                                    </tbody>
                                </table>
                            </div>

                            {/* ── Line Items ── */}
                            <div style={{
                                background: WHITE, borderRadius: 12,
                                border: `1px solid ${SLATE_300}`,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                overflow: 'hidden',
                            }}>
                                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${SLATE_300}` }}>
                                    <Text style={{ fontSize: 11, fontWeight: 700, color: SLATE_500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                        Line Items ({campaign.line_items?.length ?? 0})
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
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </>
    );
}