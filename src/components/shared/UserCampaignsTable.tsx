import { Table, Tag, Button, Typography, Badge } from 'antd';
import { EyeOutlined, EditOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import User_Campaign_Chat from '../user_dashboard/User_Campaign_Chat';

const { Text } = Typography;

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LineItem {
  line_item_id: string;
  line_item_name: string;
  start_date: string;
  end_date: string;
  ad_format: string | string[];
  impressions: string;
  status?: string;
}

export interface Campaign {
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
  approval_status?: string;
  brand_safety?: string;
  platforms?: string;
  age?: string;
  gender?: string;
  line_items?: LineItem[];
}

// ── Colors ────────────────────────────────────────────────────────────────────
const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_MID = '#BFDBFE';
const GREEN = '#16A34A';
const GREEN_LIGHT = '#F0FDF4';
const RED = '#DC2626';
const RED_LIGHT = '#FEF2F2';
const SLATE = '#0F172A';
const SLATE_300 = '#CBD5E1';
const SLATE_500 = '#64748B';
const WHITE = '#FFFFFF';
const AMBER_LIGHT = '#FFFBEB';
const AMBER = '#D97706';

const STATUS_COLOR: Record<string, string> = {
  live: 'green', active: 'blue', paused: 'orange',
  pending: 'gold', draft: 'default', completed: 'purple',
  cancelled: 'red', approved: 'blue',
};

// ── Date helpers ──────────────────────────────────────────────────────────────
export function isActiveCampaign(c: Campaign): boolean {
  if (!c.start_date || !c.end_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(c.start_date);
  const end = new Date(c.end_date);
  end.setHours(23, 59, 59, 999);
  return today >= start && today <= end;
}

export function isClosedCampaign(c: Campaign): boolean {
  if (!c.end_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(c.end_date);
  end.setHours(23, 59, 59, 999);
  return today > end;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function UserCampaignsTable({
  campaigns,
  loading,
  pageSize = 10,
}: {
  campaigns: Campaign[];
  loading?: boolean;
  pageSize?: number;
}) {
  const navigate = useNavigate();
  const [chatCampaign, setChatCampaign] = useState<Campaign | null>(null);


  const columns: ColumnsType<Campaign> = [
    {
      title: 'Campaign ID',
      dataIndex: 'campaign_id',
      key: 'campaign_id',
      width: 180,
      fixed: 'left',
      render: (id: string | null) =>
        id ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: BLUE, background: BLUE_LIGHT, padding: '3px 8px', borderRadius: 6, fontFamily: 'monospace' }}>
            {id}
          </span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, color: AMBER, background: AMBER_LIGHT, padding: '3px 8px', borderRadius: 6, border: '1px dashed #FDE68A' }}>
            Pending Approval
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
      render: (v: string) =>
        v ? <Tag color="blue" style={{ fontSize: 11 }}>{v}</Tag>
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
      render: (v: string) =>
        v ? <Text style={{ fontSize: 12, color: SLATE }}>{new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          : <Text style={{ color: SLATE_500 }}>—</Text>,
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 130,
      render: (v: string) =>
        v ? <Text style={{ fontSize: 12, color: SLATE }}>{new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          : <Text style={{ color: SLATE_500 }}>—</Text>,
    },
    {
      title: 'Campaign State',
      key: 'campaign_state',
      width: 140,
      render: (_: any, record: Campaign) => {
        if (isActiveCampaign(record)) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: GREEN_LIGHT, border: '1px solid #BBF7D0', fontSize: 10, fontWeight: 700, color: GREEN, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN }} />
              Active
            </span>
          );
        }
        if (isClosedCampaign(record)) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: RED_LIGHT, border: '1px solid #FECACA', fontSize: 10, fontWeight: 700, color: RED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: RED }} />
              Closed
            </span>
          );
        }
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 10, fontWeight: 700, color: '#D97706', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D97706' }} />
            Upcoming
          </span>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: any, record: Campaign) => {
        const s = record.approval_status ?? record.status ?? 'pending';
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
      render: (v: string) =>
        v ? <Text style={{ fontSize: 12, color: SLATE_500 }}>{new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          : <Text style={{ color: SLATE_500 }}>—</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_: any, record: Campaign) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/campaign/${record.campaign_id}`)}
            style={{ fontSize: 11, fontWeight: 600, color: BLUE, background: BLUE_LIGHT, border: `1px solid ${BLUE_MID}`, borderRadius: 6 }}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/update_campaign/${record.campaign_id}`)}
            style={{ fontSize: 11, fontWeight: 600, color: SLATE, background: WHITE, border: `1px solid ${SLATE_300}`, borderRadius: 6 }}
          >
            Edit
          </Button>
          {/* Chat Button - FIXED */}
          <Button
            size="small"
            icon={<MessageOutlined />}
            onClick={() =>
              setChatCampaign((prev) =>
                prev?.campaign_id === record.campaign_id ? null : record
              )
            }
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: chatCampaign?.campaign_id === record.campaign_id ? "#fff" : "#7C3AED",
              background: chatCampaign?.campaign_id === record.campaign_id ? "#7C3AED" : "#EDE9FE",
              border: "1px solid #C4B5FD",
              borderRadius: 6,
              transition: "all 0.2s",
            }}
          >
            Chat
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {chatCampaign && (
        <User_Campaign_Chat
          campaign={chatCampaign}
          onClose={() => setChatCampaign(null)}
        />
      )}

      <style>{`
        .campaign-row:hover td { background: #F8FAFC !important; }
        .campaign-row-closed td { opacity: 0.75; }
        .ant-table-thead > tr > th {
          background: #F1F5F9 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #64748B !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .ant-table-row-expand-icon-cell { background: #F1F5F9; }
      `}</style>
      <Table
        columns={columns}
        dataSource={campaigns}
        rowKey="campaign_id"
        loading={loading}
        scroll={{ x: 2000 }}
        pagination={{
          pageSize,
          showSizeChanger: pageSize === 10,
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
                      title: 'Line Item ID', dataIndex: 'line_item_id', key: 'line_item_id',
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
                      title: 'Ad Format', dataIndex: 'ad_format', key: 'ad_format',
                      render: (v: string | string[]) => {
                        const formats = Array.isArray(v) ? v : (v ? [v] : []);
                        return formats.map((f: string) => <Tag key={f} color="blue" style={{ fontSize: 10 }}>{f}</Tag>);
                      },
                    },
                    {
                      title: 'Impressions', dataIndex: 'impressions', key: 'impressions',
                      render: (v: string) => <Text style={{ fontSize: 12 }}>{v ? Number(v).toLocaleString('en-IN') : '—'}</Text>,
                    },
                  ]}
                  style={{ background: '#F8FAFC', borderRadius: 8 }}
                />
              </div>
            );
          },
          rowExpandable: () => true,
        }}
        rowClassName={(record) =>
          isClosedCampaign(record) ? 'campaign-row campaign-row-closed' : 'campaign-row'
        }
        style={{ fontSize: 13 }}
      />
    </>
  );
}