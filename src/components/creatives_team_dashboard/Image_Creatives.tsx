import { useState, useEffect } from 'react';
import { Table, Input, Button, Typography, Tooltip, Modal, message } from 'antd';
import {
  SearchOutlined, ReloadOutlined, FileImageOutlined,
  CopyOutlined, CheckOutlined, DownloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import CreativeSidebar from '../creatives_team_dashboard/CreativeSidebar'; // ← updated import

const { Text } = Typography;

const BASE_URL = import.meta.env.VITE_BASE_URL;

const PURPLE = '#7c3aed';
const PURPLE_LIGHT = '#f5f3ff';
const PURPLE_MID = '#ddd6fe';
const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const SLATE = '#0F172A';
const SLATE_100 = '#F1F5F9';
const SLATE_300 = '#CBD5E1';
const SLATE_500 = '#64748B';
const WHITE = '#FFFFFF';
const BG = '#F8FAFC';
const GREEN = '#059669';
const GREEN_LIGHT = '#f0fdf4';
const GREEN_BORDER = '#86efac';

interface Creative {
  creative_name: string;
  main_asset_url?: string;
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
  line_item_name: string;
  ad_format: string | string[];
  creatives?: Creative[];
}

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  advertiser?: string;
  line_items?: LineItem[];
}

interface ImageCreativeRow {
  key: string;
  creativeId?: number;   // ← add this
  campaignId: string;
  campaignName: string;
  advertiser: string;
  lineItemId: string;
  lineItemName: string;
  creativeName: string;
  mainAssetUrl?: string;
  mainAssetName?: string;
  dimensions?: string;
  aspectRatio?: string;
  fileSize?: string;
  clickThroughUrl?: string;
  appendedHtmlTag?: string;
  integrationCode?: string;
  notes?: string;
}

function isImageFormat(fmt: string | string[]): boolean {
  const raw = (Array.isArray(fmt) ? fmt[0] : fmt) ?? '';
  const lower = raw.toLowerCase();
  // ✅ Must NOT be video/youtube, must be banner/interstitial
  return (
    (lower.includes('banner') || lower.includes('interstitial')) &&
    !lower.includes('video') &&
    !lower.includes('youtube')
  );
}

function isValidClickUrl(url: string): boolean {
  return !!url && url.toLowerCase().includes('trackclk');
}
function isValidHtmlTag(tag: string): boolean {
  return !!tag && (tag.toLowerCase().includes('trackimpi') || tag.toLowerCase().includes('trackimp'));
}

// ── TruncCell ────────────────────────────────────────────────────────────────
function TruncCell({ value, maxW = 160, mono = false }: { value?: string; maxW?: number; mono?: boolean }) {
  if (!value) return <span style={{ color: SLATE_300, fontSize: 12 }}>—</span>;
  return (
    <Tooltip title={value} placement="topLeft">
      <span style={{
        fontSize: 12, color: SLATE,
        fontFamily: mono ? '"Fira Code", "Cascadia Code", monospace' : 'inherit',
        display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', maxWidth: maxW, cursor: 'default',
      }}>{value}</span>
    </Tooltip>
  );
}

// ── TrackerCell — with copy icon ─────────────────────────────────────────────
function TrackerCell({ value, type }: { value?: string; type: 'click' | 'html' }) {
  const [copied, setCopied] = useState(false);

  if (!value) return <span style={{ color: SLATE_300, fontSize: 12 }}>—</span>;

  const isValid = type === 'click' ? isValidClickUrl(value) : isValidHtmlTag(value);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      message.success({ content: 'Copied to clipboard!', duration: 1.5 });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      message.error('Failed to copy');
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 60 }}>
      {/* Validation dot */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: isValid ? '#16a34a' : '#ef4444',
      }} />

      {/* Truncated value */}
      <Tooltip title={value} placement="topLeft">
        <span style={{
          fontSize: 12, color: SLATE,
          fontFamily: '"Fira Code", monospace',
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', maxWidth: 110, cursor: 'default',
        }}>{value}</span>
      </Tooltip>

      {/* Copy button */}
      <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${copied ? '#86efac' : '#e2e8f0'}`,
            borderRadius: 4,
            cursor: 'pointer',
            padding: '2px 5px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            outline: 'none',
          }}
        >
          {copied
            ? <CheckOutlined style={{ fontSize: 10, color: '#16a34a' }} />
            : <CopyOutlined style={{ fontSize: 10, color: SLATE_500 }} />
          }
        </button>
      </Tooltip>
    </div>
  );
}

// ── Image Preview Modal ──────────────────────────────────────────────────────
function ImagePreviewModal({ visible, url, name, onClose }: {
  visible: boolean; url?: string; name?: string; onClose: () => void;
}) {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileImageOutlined style={{ color: BLUE }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{name || 'Preview'}</span>
        </div>
      }
      width={680}
      centered
    >
      {url ? (
        <img
          src={url}
          alt={name}
          style={{ width: '100%', borderRadius: 8, border: `1px solid ${SLATE_300}` }}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: SLATE_500 }}>
          <FileImageOutlined style={{ fontSize: 40, marginBottom: 12 }} />
          <div>No preview available</div>
        </div>
      )}
    </Modal>
  );
}

function colHead(): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 700, color: SLATE_500,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Image_Creatives() {
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? 64 : 240;

  const [rows, setRows] = useState<ImageCreativeRow[]>([]);
  const [filtered, setFiltered] = useState<ImageCreativeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewRow, setPreviewRow] = useState<ImageCreativeRow | null>(null);


  const fetchData = () => {
    setLoading(true);
    fetch(`${BASE_URL}/get_campaigns/`, { headers: { 'ngrok-skip-browser-warning': '1' } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        const campaigns: Campaign[] = Array.isArray(data) ? data : data?.campaigns ?? [];
        // ✅ Only approved campaigns
        const approved = campaigns.filter(c => (c as any).approval_status === 'approved');
        const flat: ImageCreativeRow[] = [];

        approved.forEach(campaign => {
          (campaign.line_items ?? []).forEach(li => {
            // ✅ Check all formats
            const formats = Array.isArray(li.ad_format)
              ? li.ad_format
              : [String(li.ad_format ?? '')];

            const hasImageFormat = formats.some(f => isImageFormat(f));

            // ✅ Only show in image if it's image format AND NOT video
            if (!hasImageFormat) return;
            (li.creatives ?? []).forEach((cr, idx) => {
              if (cr.type === 'third_party') return;
              flat.push({
                key: `${campaign.campaign_id}_${li.line_item_id}_${idx}`,
                creativeId: (cr as any).id,   // ← add this — id comes from serializer
                campaignId: campaign.campaign_id,
                campaignName: campaign.campaign_name,
                advertiser: campaign.advertiser ?? '',
                lineItemId: li.line_item_id,
                lineItemName: li.line_item_name,
                creativeName: cr.creative_name ?? `Creative ${idx + 1}`,
                mainAssetUrl: cr.main_asset_url ?? '',
                mainAssetName: cr.creative_name ?? '',
                dimensions: cr.dimensions ?? '',
                aspectRatio: cr.aspect_ratio ?? '',
                fileSize: cr.file_size ?? '',
                clickThroughUrl: cr.click_through_url ?? '',
                appendedHtmlTag: cr.appended_html_tag ?? '',
                integrationCode: cr.integration_code ?? '',
                notes: cr.notes ?? '',
              });
            });
          });
        });

        setRows(flat);
        setFiltered(flat);
      })
      .catch(() => { setRows([]); setFiltered([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(rows); return; }
    const q = search.toLowerCase();
    setFiltered(rows.filter(r =>
      r.creativeName?.toLowerCase().includes(q) ||
      r.campaignName?.toLowerCase().includes(q) ||
      r.campaignId?.toLowerCase().includes(q) ||
      r.lineItemId?.toLowerCase().includes(q) ||
      r.dimensions?.toLowerCase().includes(q)
    ));
  }, [search, rows]);

  // ── Download handler ─────────────────────────────────────────────────────
  const handleDownload = (e: React.MouseEvent, record: ImageCreativeRow) => {
    e.stopPropagation();

    if (!record.creativeId) {
      message.warning('No asset available to download');
      return;
    }

    // Direct browser download — no fetch needed
    const downloadUrl = `${BASE_URL}/download_creative/${record.creativeId}/`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.target = '_blank';   // opens in new tab if browser decides to preview instead
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const withAsset = rows.filter(r => r.mainAssetUrl || r.mainAssetName).length;
  const withClickUrl = rows.filter(r => r.clickThroughUrl && isValidClickUrl(r.clickThroughUrl)).length;
  const withHtmlTag = rows.filter(r => r.appendedHtmlTag && isValidHtmlTag(r.appendedHtmlTag)).length;

  const columns: ColumnsType<ImageCreativeRow> = [
    {
      title: <span style={colHead()}>#</span>,
      key: 'index', width: 52, fixed: 'left',
      render: (_: any, __: ImageCreativeRow, index: number) => (
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: SLATE_100, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 11, color: SLATE_500, fontWeight: 600,
        }}>{index + 1}</div>
      ),
    },
    {
      title: <span style={colHead()}>Campaign</span>,
      dataIndex: 'campaignId',
      key: 'campaignId',
      width: 160,
      fixed: 'left',
      render: (v: string, record: ImageCreativeRow) => (
        <div>
          <span style={{
            fontSize: 11, fontWeight: 700, color: PURPLE,
            background: PURPLE_LIGHT, padding: '2px 6px',
            borderRadius: 4, fontFamily: 'monospace',
            display: 'block', marginBottom: 2,
          }}>{v}</span>
          <Tooltip title={record.campaignName}>
            <span style={{
              fontSize: 10, color: SLATE_500,
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', display: 'block', maxWidth: 140,
            }}>{record.campaignName}</span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: <span style={colHead()}>Creative Name</span>,
      dataIndex: 'creativeName',
      key: 'creativeName',
      width: 240,
      fixed: 'left',
      render: (v: string, record: ImageCreativeRow) => (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          onClick={() => { setPreviewRow(record); setPreviewVisible(true); }}
        >
          {record.mainAssetUrl ? (
            <img
              src={record.mainAssetUrl}
              alt={v}
              style={{
                width: 32, height: 32, objectFit: 'cover',
                borderRadius: 6, border: `1px solid #bfdbfe`, flexShrink: 0,
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: 6, background: BLUE_LIGHT,
              border: `1px solid #bfdbfe`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <FileImageOutlined style={{ fontSize: 14, color: BLUE }} />
            </div>
          )}
          <div>
            <Tooltip title="Click to preview" placement="topLeft">
              <span style={{
                fontSize: 12, fontWeight: 600, color: BLUE,
                display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', maxWidth: 170,
                textDecoration: 'underline', textDecorationStyle: 'dotted',
                textUnderlineOffset: 3,
              }}>{v}</span>
            </Tooltip>
            <span style={{ fontSize: 10, color: SLATE_500 }}>{record.lineItemId}</span>
          </div>
        </div>
      ),
    },
    {
      title: <span style={colHead()}>Dimensions</span>,
      dataIndex: 'dimensions', key: 'dimensions', width: 120,
      render: (v: string) => v
        ? <span style={{ fontSize: 12, color: SLATE, fontFeatureSettings: '"tnum"' }}>{v}</span>
        : <span style={{ color: SLATE_300, fontSize: 12 }}>—</span>,
    },
    {
      title: <span style={colHead()}>Aspect Ratio</span>,
      dataIndex: 'aspectRatio', key: 'aspectRatio', width: 110,
      render: (v: string) => v
        ? <span style={{
          fontSize: 11, color: BLUE, background: BLUE_LIGHT,
          padding: '2px 8px', borderRadius: 4, fontWeight: 600,
          border: `1px solid #bfdbfe`,
        }}>{v}</span>
        : <span style={{ color: SLATE_300, fontSize: 12 }}>—</span>,
    },
    {
      title: <span style={colHead()}>File Size</span>,
      dataIndex: 'fileSize', key: 'fileSize', width: 100,
      render: (v: string) => v
        ? <span style={{ fontSize: 12, color: SLATE_500 }}>{v}</span>
        : <span style={{ color: SLATE_300, fontSize: 12 }}>—</span>,
    },
    {
      title: <span style={colHead()}>Click-through URL</span>,
      dataIndex: 'clickThroughUrl', key: 'clickThroughUrl', width: 220,
      render: (v: string) => <TrackerCell value={v} type="click" />,
    },
    {
      title: (
        <span style={colHead()}>
          Appended HTML Tag{' '}
          <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8', textTransform: 'none' }}>optional</span>
        </span>
      ),
      dataIndex: 'appendedHtmlTag', key: 'appendedHtmlTag', width: 220,
      render: (v: string) => <TrackerCell value={v} type="html" />,
    },
    {
      title: (
        <span style={colHead()}>
          Integration Code{' '}
          <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8', textTransform: 'none' }}>optional</span>
        </span>
      ),
      dataIndex: 'integrationCode', key: 'integrationCode', width: 180,
      render: (v: string) => <TruncCell value={v} mono />,
    },
    {
      title: (
        <span style={colHead()}>
          Notes{' '}
          <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8', textTransform: 'none' }}>optional</span>
        </span>
      ),
      dataIndex: 'notes', key: 'notes', width: 160,
      render: (v: string) => <TruncCell value={v} />,
    },
    // ── Actions column ──────────────────────────────────────────────────────
    {
      title: <span style={colHead()}>Actions</span>,
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_: any, record: ImageCreativeRow) => {
        const hasAsset = !!record.creativeId;  // ← use creativeId, not mainAssetUrl

        return (
          <Tooltip title={hasAsset ? 'Download image asset' : 'No asset available'}>
            <Button
              size="small"
              icon={<DownloadOutlined style={{ fontSize: 12 }} />}
              onClick={(e) => handleDownload(e, record)}
              disabled={!hasAsset}
              style={{
                height: 30,
                padding: '0 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: hasAsset ? BLUE : SLATE_300,
                background: hasAsset ? BLUE_LIGHT : '#f8fafc',
                border: `1px solid ${hasAsset ? '#bfdbfe' : SLATE_300}`,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: hasAsset ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              Download
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <CreativeSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div style={{ marginLeft: sideWidth, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.25s', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          background: WHITE, borderBottom: `1px solid ${SLATE_300}`,
          padding: '0 28px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: SLATE }}>Image Creatives</div>
            <div style={{ fontSize: 11, color: SLATE_500, letterSpacing: '0.04em' }}>ALL IMAGE CREATIVES ACROSS CAMPAIGNS</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: BLUE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: WHITE, fontSize: 13, fontWeight: 700,
          }}>CT</div>
        </header>

        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Total Image Creatives', value: rows.length, color: BLUE, bg: BLUE_LIGHT, border: '#bfdbfe' },
              { label: 'With Asset', value: withAsset, color: PURPLE, bg: PURPLE_LIGHT, border: PURPLE_MID },
              { label: 'Valid Click URLs', value: withClickUrl, color: GREEN, bg: GREEN_LIGHT, border: GREEN_BORDER },
              { label: 'Valid HTML Tags', value: withHtmlTag, color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
            ].map(s => (
              <div key={s.label} style={{
                background: WHITE, border: `1px solid ${SLATE_300}`,
                borderRadius: 12, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: s.bg, border: `1px solid ${s.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: s.color,
                }}>{s.value}</div>
                <div style={{ fontSize: 12.5, color: SLATE_500, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{
            background: WHITE, borderRadius: 12, padding: '14px 20px',
            border: `1px solid ${SLATE_300}`, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Input
              placeholder="Search by creative name, campaign, line item…"
              prefix={<SearchOutlined style={{ color: SLATE_500 }} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 320, height: 36 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData}
              style={{ height: 36, color: SLATE_500, border: `1px solid ${SLATE_300}` }}>
              Refresh
            </Button>
            <Text style={{ marginLeft: 'auto', fontSize: 12, color: SLATE_500 }}>
              {filtered.length} of {rows.length} creatives
            </Text>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, fontSize: 11.5, color: SLATE_500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
              Valid tracker detected
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
              Invalid / missing tracker
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CopyOutlined style={{ fontSize: 11, color: SLATE_500 }} />
              <span>Click copy icon to copy URL / tag</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
              <FileImageOutlined style={{ fontSize: 11, color: BLUE }} />
              <span>Click creative name to preview</span>
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: WHITE, borderRadius: 12,
            border: `1px solid ${SLATE_300}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
          }}>
            <Table
              columns={columns}
              dataSource={filtered}
              rowKey="key"
              loading={loading}
              scroll={{ x: 1900 }}
              pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}` }}
              locale={{
                emptyText: (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: SLATE_500 }}>
                    <FileImageOutlined style={{ fontSize: 36, marginBottom: 12, color: SLATE_300 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: SLATE }}>No image creatives found</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Upload image creatives from the Campaign → Line Item → Creatives section.
                    </div>
                  </div>
                ),
              }}
              style={{ fontSize: 13 }}
            />
          </div>
        </main>
      </div>

      <ImagePreviewModal
        visible={previewVisible}
        url={previewRow?.mainAssetUrl}
        name={previewRow?.creativeName}
        onClose={() => { setPreviewVisible(false); setPreviewRow(null); }}
      />

      <style>{`
        .ant-table-thead > tr > th {
          background: #F1F5F9 !important; font-size: 11px !important;
          font-weight: 700 !important; color: #64748B !important;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .ant-table-tbody > tr:hover > td { background: #fafbff !important; }
      `}</style>
    </div>
  );
}