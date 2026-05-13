import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Input, Select, Typography, Space, Badge } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import Sidebar from '../shared/Sidebar';

const { Title, Text } = Typography;
const { Option } = Select;

const GET_CAMPAIGNS_URL = 'https://grinch-revocable-cornflake.ngrok-free.dev/get_campaigns_by_client/CLT-2026-00003/';

interface LineItem {
  line_item_id: string;
  line_item_name: string;
  start_date: string;
  end_date: string;
  ad_format: string[];
  impressions: string;
  status?: string;
}

interface Campaign {
  campaign_id: string;
  client_campaign_ID?: string;
  purchase_order_ID?: string;
  campaign_name: string;
  client_name: string;
  advertiser?: string;
  campaign_type?: string;
  buying_type?: string;
  objective?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  status?: string;
  brand_safety?: string;
  platforms?: string;
  age?: string;
  gender?: string;
  line_items?: LineItem[];
}

const STATUS_COLOR: Record<string, string> = {
  live: 'green',
  active: 'blue',
  paused: 'orange',
  pending: 'gold',
  draft: 'default',
  completed: 'purple',
  cancelled: 'red',
};

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_MID = '#BFDBFE';
const SLATE = '#0F172A';
const SLATE_300 = '#CBD5E1';
const SLATE_500 = '#64748B';
const WHITE = '#FFFFFF';
const BG = '#F8FAFC';

export default function User_Campaigns() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? 64 : 240;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filtered, setFiltered] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchCampaigns = () => {
    setLoading(true);
    fetch(GET_CAMPAIGNS_URL, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
        return r.json();
      })
      .then(data => {
        const list: Campaign[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.campaigns)
            ? data.campaigns
            : [];
        setCampaigns(list);
        setFiltered(list);
      })
      .catch(() => {
        setCampaigns([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = [...campaigns];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.campaign_name?.toLowerCase().includes(q) ||
        c.campaign_id?.toLowerCase().includes(q) ||
        c.client_campaign_ID?.toLowerCase().includes(q) ||
        c.client_name?.toLowerCase().includes(q) ||
        c.advertiser?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => (c.status ?? 'pending') === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter(c => c.campaign_type === typeFilter);
    }

    setFiltered(result);
  }, [search, statusFilter, typeFilter, campaigns]);

  const uniqueTypes = [...new Set(campaigns.map(c => c.campaign_type).filter(Boolean))];

  const columns: ColumnsType<Campaign> = [
    {
      title: 'Campaign ID',
      dataIndex: 'campaign_id',
      key: 'campaign_id',
      width: 160,
      fixed: 'left',
      render: (id: string) => (
        <span style={{
          fontSize: 12, fontWeight: 700, color: BLUE,
          background: BLUE_LIGHT, padding: '3px 8px',
          borderRadius: 6, fontFamily: 'monospace',
          letterSpacing: '0.02em', whiteSpace: 'nowrap',
        }}>
          {id}
        </span>
      ),
    },
    {
      title: 'Client Campaign ID',
      dataIndex: 'client_campaign_ID',
      key: 'client_campaign_ID',
      width: 160,
      render: (v: string) => <Text style={{ fontSize: 12, color: SLATE_500 }}>{v || '—'}</Text>,
    },
    {
      title: 'Purchase Order ID',
      dataIndex: 'purchase_order_ID',
      key: 'purchase_order_ID',
      width: 160,
      render: (v: string) => <Text style={{ fontSize: 12, color: SLATE_500 }}>{v || '—'}</Text>,
    },
    {
      title: 'Campaign Name',
      dataIndex: 'campaign_name',
      key: 'campaign_name',
      width: 200,
      render: (name: string) => (
        <Text strong style={{ fontSize: 13, color: SLATE }}>{name || '—'}</Text>
      ),
    },
    {
      title: 'Advertiser',
      dataIndex: 'advertiser',
      key: 'advertiser',
      width: 160,
      render: (v: string) => <Text style={{ fontSize: 12, color: SLATE_500 }}>{v || '—'}</Text>,
    },
    {
      title: 'Company',
      dataIndex: 'client_name',
      key: 'client_name',
      width: 160,
      render: (v: string) => <Text style={{ fontSize: 12, color: SLATE_500 }}>{v || '—'}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'campaign_type',
      key: 'campaign_type',
      width: 150,
      render: (v: string) => v
        ? <Tag color="blue" style={{ fontSize: 11 }}>{v}</Tag>
        : <Text style={{ color: SLATE_500 }}>—</Text>,
    },
    {
      title: 'Objective',
      dataIndex: 'objective',
      key: 'objective',
      width: 180,
      render: (v: string) => <Text style={{ fontSize: 12, color: SLATE_500 }}>{v || '—'}</Text>,
    },
    {
      title: 'Buying Type',
      dataIndex: 'buying_type',
      key: 'buying_type',
      width: 180,
      render: (v: string) => <Text style={{ fontSize: 12, color: SLATE_500 }}>{v || '—'}</Text>,
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 130,
      render: (v: string) => v
        ? <Text style={{ fontSize: 12, color: SLATE }}>{new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
        : <Text style={{ color: SLATE_500 }}>—</Text>,
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 130,
      render: (v: string) => v
        ? <Text style={{ fontSize: 12, color: SLATE }}>{new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
        : <Text style={{ color: SLATE_500 }}>—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      fixed: 'right',
      render: (status: string) => {
        const s = status ?? 'pending';
        return (
          <Badge
            color={STATUS_COLOR[s] ?? 'default'}
            text={
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {s}
              </span>
            }
          />
        );
      },
    },
    {
      title: 'Line Items',
      key: 'line_items',
      width: 100,
      render: (_: any, record: Campaign) => (
        <Tag color="purple" style={{ fontSize: 11 }}>
          {record.line_items?.length ?? 0} item{(record.line_items?.length ?? 0) !== 1 ? 's' : ''}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (v: string) => v
        ? <Text style={{ fontSize: 12, color: SLATE_500 }}>{new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
        : <Text style={{ color: SLATE_500 }}>—</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_: any, record: Campaign) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/campaign/${record.campaign_id}`)}
            style={{
              fontSize: 11, fontWeight: 600,
              color: BLUE, background: BLUE_LIGHT,
              border: `1px solid ${BLUE_MID}`, borderRadius: 6,
            }}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/update_campaign/${record.campaign_id}`)}
            style={{
              fontSize: 11, fontWeight: 600,
              color: SLATE, background: WHITE,
              border: `1px solid ${SLATE_300}`, borderRadius: 6,
            }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  // Summary counts
  const totalCount = campaigns.length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div style={{ marginLeft: sideWidth, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.25s', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          background: WHITE, borderBottom: `1px solid ${SLATE_300}`,
          padding: '0 28px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div>
            <Title level={5} style={{ margin: 0, color: SLATE }}>All Campaigns</Title>
            <Text style={{ fontSize: 11, color: SLATE_500, letterSpacing: '0.04em' }}>
              MANAGE & TRACK YOUR CAMPAIGNS
            </Text>
          </div>
          <Button
            type="primary"
            onClick={() => navigate('/campaign_create')}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 9,
              background: BLUE,
              color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.05em',
              fontFamily: 'inherit',
            }}          >
            + NEW CAMPAIGN
          </Button>
        </header>

        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

          {/* Filters */}
          <div style={{
            background: WHITE, borderRadius: 12, padding: '16px 20px',
            border: `1px solid ${SLATE_300}`, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <Input
              placeholder="Search by name, ID, advertiser…"
              prefix={<SearchOutlined style={{ color: SLATE_500 }} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 280, height: 36 }}
              allowClear
            />
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 180, height: 36 }}
            >
              <Option value="all">All Types</Option>
              {uniqueTypes.map(t => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchCampaigns}
              style={{ height: 36, color: SLATE_500, border: `1px solid ${SLATE_300}` }}
            >
              Refresh
            </Button>
            <Text style={{ marginLeft: 'auto', fontSize: 12, color: SLATE_500 }}>
              {filtered.length} of {totalCount} campaigns
            </Text>
          </div>

          {/* Table */}
          <div style={{
            background: WHITE, borderRadius: 12,
            border: `1px solid ${SLATE_300}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <Table
              columns={columns}
              dataSource={filtered}
              rowKey="campaign_id"
              loading={loading}
              scroll={{ x: 1800 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} campaigns`,
                style: { padding: '12px 16px' },
              }}
              expandable={{
                expandedRowRender: (record: Campaign) => {
                  if (!record.line_items || record.line_items.length === 0) {
                    return <Text style={{ color: SLATE_500, fontSize: 12 }}>No line items for this campaign.</Text>;
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
                        columns={[
                          {
                            title: 'Line Item ID',
                            dataIndex: 'line_item_id',
                            key: 'line_item_id',
                            render: (v: string) => (
                              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#7C3AED', background: '#EDE9FE', padding: '2px 6px', borderRadius: 4 }}>
                                {v}
                              </span>
                            ),
                          },
                          { title: 'Name', dataIndex: 'line_item_name', key: 'line_item_name', render: (v: string) => <Text style={{ fontSize: 12 }}>{v || '—'}</Text> },
                          { title: 'Start Date', dataIndex: 'start_date', key: 'start_date', render: (v: string) => <Text style={{ fontSize: 12 }}>{v || '—'}</Text> },
                          { title: 'End Date', dataIndex: 'end_date', key: 'end_date', render: (v: string) => <Text style={{ fontSize: 12 }}>{v || '—'}</Text> },
                          {
                            title: 'Ad Format',
                            dataIndex: 'ad_format',
                            key: 'ad_format',
                            render: (v: string | string[]) => {
                              const formats = Array.isArray(v) ? v : (v ? [v] : []);
                              return formats.map((f: string) => <Tag key={f} color="blue" style={{ fontSize: 10 }}>{f}</Tag>);
                            },
                          },
                          { title: 'Impressions', dataIndex: 'impressions', key: 'impressions', render: (v: string) => <Text style={{ fontSize: 12 }}>{v ? Number(v).toLocaleString('en-IN') : '—'}</Text> },
                          {
                            title: 'Status',
                            dataIndex: 'status',
                            key: 'status',
                            render: (v: string) => (
                              <Badge color={STATUS_COLOR[v ?? 'pending'] ?? 'default'} text={<span style={{ fontSize: 11, textTransform: 'uppercase' }}>{v ?? 'pending'}</span>} />
                            ),
                          },
                        ]}
                        style={{ background: '#F8FAFC', borderRadius: 8 }}
                      />
                    </div>
                  );
                },
                rowExpandable: () => true,
              }}
              rowClassName={() => 'campaign-row'}
              style={{ fontSize: 13 }}
            />
          </div>

        </main>
      </div>

      <style>{`
        .campaign-row:hover td { background: #F8FAFC !important; }
        .ant-table-thead > tr > th { background: #F1F5F9 !important; font-size: 11px !important; font-weight: 700 !important; color: #64748B !important; text-transform: uppercase; letter-spacing: 0.04em; }
        .ant-table-row-expand-icon-cell { background: #F1F5F9; }
      `}</style>
    </div>
  );
}