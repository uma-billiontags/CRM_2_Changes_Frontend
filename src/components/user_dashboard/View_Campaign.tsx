import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Tag, Badge, Button, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import Sidebar from '../shared/Sidebar';

const { Title, Text } = Typography;

const BASE_URL = 'http://127.0.0.1:8000';

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_MID = '#BFDBFE';
const SLATE = '#0F172A';
const SLATE_300 = '#CBD5E1';
const SLATE_500 = '#64748B';
const WHITE = '#FFFFFF';
const BG = '#F8FAFC';

const STATUS_COLOR: Record<string, string> = {
  live: 'green',
  active: 'blue',
  paused: 'orange',
  pending: 'gold',
  draft: 'default',
  completed: 'purple',
  cancelled: 'red',
};

// Add to LineItem interface in View_Campaign.tsx
interface CreativeDetail {
  type?: 'standard' | 'third_party';
  creative_name?: string;
  dimensions?: string;
  click_through_url?: string;
  appended_html_tag?: string;
  input_file_name?: string;
  backup_image_name?: string;
}

interface LineItem {
  line_item_id: string;
  line_item_name: string;
  start_date: string;
  end_date: string;
  ad_format: string | string[];
  status?: string;
  ethnicity?: string;
  image_creatives?: string[];
  video_creatives?: string[];
  total_creatives?: string | number;
  creatives?: CreativeDetail[];
  third_party_creatives?: { input_file_name?: string; backup_image_name?: string }[];
}

interface Campaign {
  campaign_id: string;
  client_campaign_ID?: string;
  purchase_order_ID?: string;
  campaign_name: string;
  client_name: string;
  advertiser?: string;
  website_url?: string;
  campaign_type?: string;
  buying_type?: string;
  objective?: string;
  notes?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  status?: string;
  brand_safety?: string;
  platforms?: string;
  age?: string;
  gender?: string;
  geo_targeting?: string;
  line_items?: LineItem[];
}

// Row component for the summary table
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td style={{
        padding: '10px 16px',
        fontSize: 13,
        fontWeight: 500,
        color: SLATE_500,
        background: '#F8FAFC',
        width: 200,
        borderBottom: `1px solid ${SLATE_300}`,
        whiteSpace: 'nowrap',
      }}>
        {label}
      </td>
      <td style={{
        padding: '10px 16px',
        fontSize: 13,
        color: SLATE,
        background: WHITE,
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
        padding: '8px 16px',
        background: '#F1F5F9',
        fontSize: 10,
        fontWeight: 700,
        color: SLATE_500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        borderBottom: `1px solid ${SLATE_300}`,
      }}>
        {title}
      </td>
    </tr>
  );
}

export default function View_Campaign() {
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
        if (!r.ok) throw new Error(`Failed to fetch campaign: ${r.status}`);
        return r.json();
      })
      .then(data => {
        // API may return the campaign directly or nested
        const c: Campaign = data?.campaign ?? data;
        setCampaign(c);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [campaign_id]);

  const fmt = (dateStr?: string) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div style={{ marginLeft: sideWidth, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.25s', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          background: WHITE,
          borderBottom: `1px solid ${SLATE_300}`,
          padding: '0 28px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
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
              <Title level={5} style={{ margin: 0, color: SLATE }}>Campaign Details</Title>
              <Text style={{ fontSize: 11, color: SLATE_500, letterSpacing: '0.04em' }}>
                {campaign_id}
              </Text>
            </div>
          </div>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/update_campaign/${campaign_id}`)}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 9,
              background: BLUE,
              color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.05em',
              fontFamily: 'inherit',
            }}              >
            Edit Campaign
          </Button>
        </header>

        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
              <Spin size="large" />
            </div>
          )}

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 12, padding: '20px 24px', color: '#DC2626',
              fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {!loading && !error && campaign && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Campaign Summary */}
              <div style={{
                background: WHITE, borderRadius: 12,
                border: `1px solid ${SLATE_300}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: `1px solid ${SLATE_300}`,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, color: SLATE_500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Campaign Summary
                  </Text>
                  {/* <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/update_campaign/${campaign_id}`)}
                    style={{ color: BLUE, fontWeight: 600, fontSize: 12 }}
                  >
                    Edit Details
                  </Button> */}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <SectionHeader title="Client & Identity" />
                    <InfoRow label="Client" value={campaign.client_name} />
                    <InfoRow label="Advertiser" value={campaign.advertiser} />
                    <InfoRow label="Website URL" value={campaign.website_url
                      ? <a href={campaign.website_url} target="_blank" rel="noreferrer" style={{ color: BLUE }}>{campaign.website_url}</a>
                      : null}
                    />
                    <InfoRow label="Campaign Name" value={
                      <Text strong style={{ color: SLATE }}>{campaign.campaign_name}</Text>
                    } />
                    <InfoRow label="Client Campaign ID" value={campaign.client_campaign_ID} />
                    <InfoRow label="Purchase Order ID" value={campaign.purchase_order_ID} />

                    <SectionHeader title="Campaign Configuration" />
                    <InfoRow label="Campaign Type" value={campaign.campaign_type
                      ? <Tag color="blue" style={{ fontSize: 11 }}>{campaign.campaign_type}</Tag>
                      : null}
                    />
                    <InfoRow label="Buying Type" value={campaign.buying_type} />
                    <InfoRow label="Objective" value={campaign.objective} />
                    <InfoRow label="Notes" value={campaign.notes} />

                    <SectionHeader title="Targeting" />
                    <InfoRow label="Age" value={campaign.age} />
                    <InfoRow label="Gender" value={campaign.gender} />
                    <InfoRow label="Geo Targeting" value={campaign.geo_targeting} />
                    <InfoRow label="Platforms" value={campaign.platforms} />
                    <InfoRow label="Brand Safety" value={campaign.brand_safety} />

                    <SectionHeader title="Schedule & Status" />
                    <InfoRow label="Start Date" value={fmt(campaign.start_date)} />
                    <InfoRow label="End Date" value={fmt(campaign.end_date)} />
                    <InfoRow label="Created At" value={fmt(campaign.created_at)} />
                    <InfoRow label="Status" value={
                      <Badge
                        color={STATUS_COLOR[campaign.status ?? 'pending'] ?? 'default'}
                        text={
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {campaign.status ?? 'pending'}
                          </span>
                        }
                      />
                    } />
                  </tbody>
                </table>
              </div>

              {/* Line Items */}
              <div style={{
                background: WHITE, borderRadius: 12,
                border: `1px solid ${SLATE_300}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 16px',
                  borderBottom: `1px solid ${SLATE_300}`,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, color: SLATE_500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Line Items ({campaign.line_items?.length ?? 0})
                  </Text>
                </div>

                {(!campaign.line_items || campaign.line_items.length === 0) ? (
                  <div style={{ padding: '24px 16px', color: SLATE_500, fontSize: 13 }}>
                    No line items for this campaign.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {campaign.line_items.map((li, idx) => {
                      const formats = Array.isArray(li.ad_format) ? li.ad_format : (li.ad_format ? [li.ad_format] : []);
                      const imageCreatives = li.image_creatives ?? [];
                      const videoCreatives = li.video_creatives ?? [];
                      const totalCreatives = li.total_creatives ?? (imageCreatives.length + videoCreatives.length);

                      return (
                        <div key={li.line_item_id} style={{ borderBottom: idx < (campaign.line_items!.length - 1) ? `2px solid ${SLATE_300}` : 'none' }}>
                          {/* Line Item Header */}
                          <div style={{
                            padding: '12px 16px',
                            background: '#F8FAFC',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            borderBottom: `1px solid ${SLATE_300}`,
                          }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: BLUE, color: WHITE,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700,
                            }}>
                              {idx + 1}
                            </div>
                            <Text strong style={{ fontSize: 13, color: SLATE }}>
                              {li.line_item_name || `Line Item ${idx + 1}`}
                            </Text>
                          </div>

                          {/* Line Item Details Table */}
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                              <InfoRow label="Line Item ID" value={
                                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>
                                  {li.line_item_id}
                                </span>
                              } />
                              {li.ethnicity && <InfoRow label="Ethnicity" value={li.ethnicity} />}
                              <InfoRow label="Start Date" value={li.start_date} />
                              <InfoRow label="End Date" value={li.end_date} />
                              <InfoRow label="Ad Format" value={
                                formats.length > 0
                                  ? formats.map(f => <Tag key={f} color="blue" style={{ fontSize: 11 }}>{f}</Tag>)
                                  : null
                              } />

                              {/* ── Image Creatives ── */}
                              <InfoRow label="Image Creatives" value={
                                (li.image_creatives?.length ?? 0) > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {li.image_creatives!.map((name, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 10, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>IMG</span>
                                        <span style={{ fontSize: 12, color: '#1e293b' }}>{name}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null
                              } />

                              {/* ── Video Creatives ── */}
                              <InfoRow label="Video Creatives" value={
                                (li.video_creatives?.length ?? 0) > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {li.video_creatives!.map((name, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 10, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>VID</span>
                                        <span style={{ fontSize: 12, color: '#1e293b' }}>{name}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null
                              } />

                              {/* ── Standard Creatives Detail (click URL, tag) ── */}
                              {(li.creatives?.filter(c => !c.type || c.type === 'standard') ?? []).length > 0 && (
                                <InfoRow label="Creative Details" value={
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {li.creatives!.filter(c => !c.type || c.type === 'standard').map((c, i) => (
                                      <div key={i} style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 7, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                                          {c.creative_name || `Creative ${i + 1}`}
                                          {c.dimensions && <span style={{ fontSize: 10, color: '#64748b', marginLeft: 8 }}>{c.dimensions}</span>}
                                        </div>
                                        {c.click_through_url && (
                                          <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                                            <span style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', minWidth: 26 }}>URL</span>
                                            <span style={{ fontSize: 11, color: '#2563eb', wordBreak: 'break-all' }}>{c.click_through_url}</span>
                                          </div>
                                        )}
                                        {c.appended_html_tag && (
                                          <div style={{ display: 'flex', gap: 6 }}>
                                            <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', minWidth: 26 }}>TAG</span>
                                            <span style={{ fontSize: 11, color: '#7c3aed', wordBreak: 'break-all' }}>{c.appended_html_tag}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                } />
                              )}

                              {/* ── Third Party Creatives ── */}
                              {(() => {
                                const tpFromCreatives = (li.creatives ?? []).filter(c => c.type === 'third_party');
                                const tpFromArray = li.third_party_creatives ?? [];
                                const allTp = tpFromCreatives.length > 0 ? tpFromCreatives : tpFromArray;
                                if (allTp.length === 0) return null;
                                return (
                                  <InfoRow label="Third Party Creatives" value={
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {allTp.map((tp, i) => (
                                        <div key={i} style={{ padding: '8px 10px', background: '#faf5ff', borderRadius: 7, border: '1px solid #ddd6fe' }}>
                                          <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>
                                            Third Party {i + 1}
                                          </div>
                                          {(tp.input_file_name) && (
                                            <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                                              <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', minWidth: 40 }}>FILE</span>
                                              <span style={{ fontSize: 11, color: '#1e293b' }}>{tp.input_file_name}</span>
                                            </div>
                                          )}
                                          {(tp.backup_image_name) && (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                              <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', minWidth: 40 }}>BACKUP</span>
                                              <span style={{ fontSize: 11, color: '#059669' }}>{tp.backup_image_name}</span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  } />
                                );
                              })()}

                              <InfoRow label="Total Creatives" value={
                                totalCreatives != null ? `${totalCreatives} file(s)` : null
                              } />
                              {li.status && (
                                <InfoRow label="Status" value={
                                  <Badge
                                    color={STATUS_COLOR[li.status ?? 'pending'] ?? 'default'}
                                    text={
                                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {li.status}
                                      </span>
                                    }
                                  />
                                } />
                              )}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer note */}
                <div style={{
                  padding: '12px 16px',
                  background: '#FFFBEB',
                  borderTop: `1px solid #FEF3C7`,
                  fontSize: 12,
                  color: '#92400E',
                }}>
                  Once created, you can manage line items, add creatives and launch the campaign from the campaigns page.
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}