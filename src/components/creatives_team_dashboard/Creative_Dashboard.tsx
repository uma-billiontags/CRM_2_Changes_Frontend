import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Badge, Input, Button, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import CreativeSidebar from '../creatives_team_dashboard/CreativeSidebar'; // ← updated import

const { Text } = Typography;

const GET_CAMPAIGNS_URL = 'https://city-animate-anagram.ngrok-free.dev/get_campaigns/';

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

interface CreativeDetail {
  type?: 'standard' | 'third_party';
  creative_name?: string;
  dimensions?: string;
  click_through_url?: string;
  appended_html_tag?: string;
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
  impressions?: string;
  status?: string;
  creatives?: CreativeDetail[];
  image_creatives?: string[];
  video_creatives?: string[];
  third_party_creatives?: { input_file?: string; backup_image_name?: string }[];
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
  approval_status?: string;
}

const STATUS_COLOR: Record<string, string> = {
  live: 'green', active: 'blue', paused: 'orange',
  pending: 'gold', draft: 'default', completed: 'purple', cancelled: 'red',
};

function CreativesCell({ li }: { li: LineItem }) {
  const imageNames = li.image_creatives ?? [];
  const videoNames = li.video_creatives ?? [];

  const standardCreatives = (li.creatives ?? []).filter(c => !c.type || c.type === 'standard');
  const thirdPartyFromCreatives = (li.creatives ?? []).filter(c => c.type === 'third_party');
  const thirdPartyFromArray = li.third_party_creatives ?? [];
  const allThirdParty = thirdPartyFromCreatives.length > 0 ? thirdPartyFromCreatives : thirdPartyFromArray;

  const hasAny =
    imageNames.length > 0 || videoNames.length > 0 ||
    standardCreatives.length > 0 || allThirdParty.length > 0;

  if (!hasAny) return <Text style={{ color: SLATE_500, fontSize: 11 }}>—</Text>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {imageNames.map((name, i) => (
        <div key={`img-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: BLUE,
            background: BLUE_LIGHT, padding: '1px 5px',
            borderRadius: 3, border: '1px solid #bfdbfe', flexShrink: 0,
          }}>IMG</span>
          <span style={{ fontSize: 11, color: SLATE }}>{name}</span>
        </div>
      ))}

      {standardCreatives.map((c, i) => {
        const adFormats = Array.isArray(li.ad_format)
          ? li.ad_format.map(a => a.toLowerCase())
          : [li.ad_format?.toLowerCase()];
        const isVideo = adFormats.some(a => a?.includes('video'));
        return (
          <div key={`std-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: isVideo ? PURPLE : BLUE,
              background: isVideo ? PURPLE_LIGHT : BLUE_LIGHT,
              padding: '1px 5px', borderRadius: 3,
              border: isVideo ? `1px solid ${PURPLE_MID}` : '1px solid #bfdbfe',
              flexShrink: 0,
            }}>{isVideo ? 'VID' : 'IMG'}</span>
            <span style={{ fontSize: 11, color: SLATE }}>{c.creative_name || `Creative ${i + 1}`}</span>
          </div>
        );
      })}

      {videoNames.map((name, i) => (
        <div key={`vid-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: PURPLE,
            background: PURPLE_LIGHT, padding: '1px 5px',
            borderRadius: 3, border: `1px solid ${PURPLE_MID}`, flexShrink: 0,
          }}>VID</span>
          <span style={{ fontSize: 11, color: SLATE }}>{name}</span>
        </div>
      ))}

      {allThirdParty.map((tp, i) => {
        const fileName = (tp.input_file ? tp.input_file.split('/').pop() : undefined)
          || `Third Party ${i + 1}`;
        const ext = fileName.includes('.') ? fileName.split('.').pop()?.toUpperCase() : null;
        return (
          <div key={`tp-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {ext && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#92400e',
                background: '#fff7ed', padding: '1px 5px',
                borderRadius: 3, border: '1px solid #fed7aa',
                flexShrink: 0, fontFamily: 'monospace',
              }}>{ext}</span>
            )}
            <span style={{ fontSize: 11, color: SLATE }}>{fileName}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Creative_Dashboard() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? 64 : 240;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filtered, setFiltered] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCampaigns = () => {
    setLoading(true);
    fetch(GET_CAMPAIGNS_URL, { headers: { 'ngrok-skip-browser-warning': '1' } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const list: Campaign[] = Array.isArray(data) ? data : data?.campaigns ?? [];
        // ✅ Only show approved campaigns
        const approved = list.filter(c => c.approval_status === 'approved');
        setCampaigns(approved);
        setFiltered(approved);
      })
      .catch(() => { setCampaigns([]); setFiltered([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaigns(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(campaigns); return; }
    const q = search.toLowerCase();
    setFiltered(campaigns.filter(c =>
      c.campaign_name?.toLowerCase().includes(q) ||
      c.campaign_id?.toLowerCase().includes(q) ||
      c.advertiser?.toLowerCase().includes(q)
    ));
  }, [search, campaigns]);

  const totalCampaigns = campaigns.length;
  const totalLineItems = campaigns.reduce((acc, c) => acc + (c.line_items?.length ?? 0), 0);
  const totalCreatives = campaigns.reduce((acc, c) =>
    acc + (c.line_items?.reduce((a, li) =>
      a + (li.image_creatives?.length ?? 0) +
      (li.video_creatives?.length ?? 0) +
      (li.creatives?.length ?? 0) +
      (li.third_party_creatives?.length ?? 0), 0) ?? 0), 0);

  const columns: ColumnsType<Campaign> = [
    {
      title: 'Campaign ID', dataIndex: 'campaign_id', key: 'campaign_id',
      width: 160, fixed: 'left',
      render: (id: string) => (
        <span style={{
          fontSize: 12, fontWeight: 700, color: PURPLE,
          background: PURPLE_LIGHT, padding: '3px 8px',
          borderRadius: 6, fontFamily: 'monospace',
        }}>{id}</span>
      ),
    },
    {
      title: 'Campaign Name', dataIndex: 'campaign_name', key: 'campaign_name', width: 200,
      render: (v: string) => <Text strong style={{ fontSize: 13, color: SLATE }}>{v || '—'}</Text>,
    },
    {
      title: 'Advertiser', dataIndex: 'advertiser', key: 'advertiser', width: 160,
      render: (v: string) => <Text style={{ fontSize: 12, color: SLATE_500 }}>{v || '—'}</Text>,
    },
    {
      title: 'Start Date', dataIndex: 'start_date', key: 'start_date', width: 130,
      render: (v: string) => v
        ? <Text style={{ fontSize: 12 }}>{new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
        : <Text style={{ color: SLATE_500 }}>—</Text>,
    },
    {
      title: 'End Date', dataIndex: 'end_date', key: 'end_date', width: 130,
      render: (v: string) => v
        ? <Text style={{ fontSize: 12 }}>{new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
        : <Text style={{ color: SLATE_500 }}>—</Text>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 110,
      render: (s: string) => (
        <Badge
          color={STATUS_COLOR[s ?? 'pending'] ?? 'default'}
          text={<span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{s ?? 'pending'}</span>}
        />
      ),
    },
    {
      title: 'Line Items', key: 'line_items_count', width: 100,
      render: (_: any, r: Campaign) => (
        <Tag color="purple" style={{ fontSize: 11 }}>
          {r.line_items?.length ?? 0} item{(r.line_items?.length ?? 0) !== 1 ? 's' : ''}
        </Tag>
      ),
    },
    {
      title: 'Actions', key: 'actions', width: 100, fixed: 'right',
      render: (_: any, r: Campaign) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/creative/${r.campaign_id}`)}
          style={{ fontSize: 11, fontWeight: 600, color: PURPLE, background: PURPLE_LIGHT, border: `1px solid ${PURPLE_MID}`, borderRadius: 6 }}
        >
          View
        </Button>
      ),
    },
  ];

  const lineItemColumns: ColumnsType<LineItem> = [
    {
      title: 'Line Item ID', dataIndex: 'line_item_id', width: 140,
      render: (v: string) => (
        <span style={{
          fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
          color: PURPLE, background: PURPLE_LIGHT, padding: '2px 6px', borderRadius: 4,
        }}>{v}</span>
      ),
    },
    {
      title: 'Line Item Name', dataIndex: 'line_item_name', width: 180,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v || '—'}</Text>,
    },
    {
      title: 'Start Date', dataIndex: 'start_date', width: 110,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v || '—'}</Text>,
    },
    {
      title: 'End Date', dataIndex: 'end_date', width: 110,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v || '—'}</Text>,
    },
    {
      title: 'Ad Format', dataIndex: 'ad_format', width: 140,
      render: (v: string | string[], r: LineItem) => {
        const fmt = Array.isArray(v) ? v[0] : v;
        const sub = r.ad_sub_format;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {fmt && <Tag color="blue" style={{ fontSize: 10, width: 'fit-content' }}>{fmt}</Tag>}
            {sub && <Tag color="purple" style={{ fontSize: 10, width: 'fit-content' }}>{sub}</Tag>}
            {!fmt && <Text style={{ color: SLATE_500 }}>—</Text>}
          </div>
        );
      },
    },
    {
      title: 'Ethnicity', dataIndex: 'ethnicity', width: 140,
      render: (v: string | string[]) => {
        const arr = Array.isArray(v) ? v : (v ? [v] : []);
        return arr.length > 0
          ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {arr.map((e: string) => <Tag key={e} style={{ fontSize: 10 }}>{e}</Tag>)}
          </div>
          : <Text style={{ color: SLATE_500, fontSize: 12 }}>—</Text>;
      },
    },
    {
      title: 'Creatives', key: 'creatives', width: 220,
      render: (_: any, r: LineItem) => <CreativesCell li={r} />,
    },
    {
      title: 'Status', dataIndex: 'status', width: 100,
      render: (v: string) => (
        <Badge
          color={STATUS_COLOR[v ?? 'pending'] ?? 'default'}
          text={<span style={{ fontSize: 11, textTransform: 'uppercase' }}>{v ?? 'pending'}</span>}
        />
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ← CreativeSidebar replaces the old shared Sidebar */}
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
            <div style={{ fontSize: 16, fontWeight: 700, color: SLATE }}>Creative Dashboard</div>
            <div style={{ fontSize: 11, color: SLATE_500, letterSpacing: '0.04em' }}>VIEW &amp; MANAGE CREATIVES ACROSS CAMPAIGNS</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: PURPLE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: WHITE, fontSize: 13, fontWeight: 700,
            }}>CT</div>
          </div>
        </header>

        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Total Campaigns', value: totalCampaigns, color: PURPLE, bg: PURPLE_LIGHT, border: PURPLE_MID },
              { label: 'Total Line Items', value: totalLineItems, color: BLUE, bg: BLUE_LIGHT, border: '#bfdbfe' },
              { label: 'Total Creatives', value: totalCreatives, color: '#059669', bg: '#f0fdf4', border: '#86efac' },
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
                <div style={{ fontSize: 13, color: SLATE_500, fontWeight: 500 }}>{s.label}</div>
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
              placeholder="Search by campaign name, ID…"
              prefix={<SearchOutlined style={{ color: SLATE_500 }} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 280, height: 36 }}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchCampaigns}
              style={{ height: 36, color: SLATE_500, border: `1px solid ${SLATE_300}` }}
            >
              Refresh
            </Button>
            <Text style={{ marginLeft: 'auto', fontSize: 12, color: SLATE_500 }}>
              {filtered.length} of {totalCampaigns} campaigns
            </Text>
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
              rowKey="campaign_id"
              loading={loading}
              scroll={{ x: 1100 }}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}` }}
              expandable={{
                expandedRowRender: (record: Campaign) => {
                  if (!record.line_items?.length) {
                    return <Text style={{ color: SLATE_500, fontSize: 12 }}>No line items.</Text>;
                  }
                  return (
                    <div style={{ padding: '8px 0' }}>
                      <Text strong style={{ fontSize: 12, color: SLATE, marginBottom: 8, display: 'block' }}>
                        Line Items ({record.line_items.length})
                      </Text>
                      <Table
                        size="small"
                        dataSource={record.line_items}
                        rowKey="line_item_id"
                        pagination={false}
                        columns={lineItemColumns}
                        scroll={{ x: 1100 }}
                        style={{ background: '#fafbff', borderRadius: 8 }}
                      />
                    </div>
                  );
                },
                rowExpandable: () => true,
              }}
              style={{ fontSize: 13 }}
            />
          </div>
        </main>
      </div>

      <style>{`
        .ant-table-thead > tr > th {
          background: #F1F5F9 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #64748B !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}