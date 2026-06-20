import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Input, Typography, Space, Tag, Modal, message,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined,
  FileTextOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAllDrafts, type SavedDraft } from '../user_dashboard/Campaign_Create';

const { Text } = Typography;
const { confirm } = Modal;

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_DRAFTS_KEY = 'campaign_all_drafts';

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_MID = '#BFDBFE';
const SLATE = '#0F172A';
const SLATE_300 = '#CBD5E1';
const SLATE_500 = '#64748B';
const WHITE = '#FFFFFF';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function deleteDraft(draftId: string): void {
  const drafts = getAllDrafts().filter(d => d.draftId !== draftId);
  localStorage.setItem(ALL_DRAFTS_KEY, JSON.stringify(drafts));
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function getStepLabel(step: number): string {
  const labels: Record<number, string> = {
    1: 'Client & Advertiser',
    2: 'Campaign Details',
    3: 'Objectives & Settings',
    4: 'Line Item Details',
    5: 'Review & Confirm',
  };
  return labels[step] ?? `Step ${step}`;
}

function getStepColor(step: number): string {
  const colors: Record<number, string> = {
    1: 'default',
    2: 'blue',
    3: 'purple',
    4: 'orange',
    5: 'green',
  };
  return colors[step] ?? 'default';
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function User_Drafts() {
  const navigate = useNavigate();

  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [filtered, setFiltered] = useState<SavedDraft[]>([]);
  const [search, setSearch] = useState('');

  const loadDrafts = () => {
    const all = getAllDrafts();
    // Sort newest first
    const sorted = [...all].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    setDrafts(sorted);
    setFiltered(sorted);
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(drafts);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      drafts.filter(d =>
        d.draftName?.toLowerCase().includes(q) ||
        d.campaignName?.toLowerCase().includes(q) ||
        d.advertiser?.toLowerCase().includes(q) ||
        d.campaignType?.toLowerCase().includes(q) ||
        d.draftId?.toLowerCase().includes(q)
      )
    );
  }, [search, drafts]);

  const handleEdit = (draft: SavedDraft) => {
    navigate('/campaign_create', {
      state: { editDraftId: draft.draftId },
    });
  };

  const handleDelete = (draft: SavedDraft) => {
    confirm({
      title: 'Delete this draft?',
      icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
      content: (
        <div>
          <p style={{ margin: 0, color: '#374151', fontSize: 14 }}>
            You're about to delete <strong>"{draft.draftName}"</strong>. This action cannot be undone.
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      okButtonProps: {
        style: { background: '#ef4444', borderColor: '#ef4444', fontWeight: 600 },
      },
      onOk() {
        deleteDraft(draft.draftId);
        message.success('Draft deleted.');
        loadDrafts();
      },
    });
  };

  const columns: ColumnsType<SavedDraft> = [
    {
      title: 'Draft ID',
      dataIndex: 'draftId',
      key: 'draftId',
      width: 180,
      fixed: 'left',
      render: (id: string) => (
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#7c3aed',
          background: '#ede9fe', padding: '3px 8px',
          borderRadius: 6, fontFamily: 'monospace',
          letterSpacing: '0.01em', whiteSpace: 'nowrap',
        }}>
          {id}
        </span>
      ),
    },
    {
      title: 'Draft Name',
      dataIndex: 'draftName',
      key: 'draftName',
      width: 200,
      fixed: 'left',
      render: (name: string) => (
        <Text strong style={{ fontSize: 13, color: SLATE }}>{name || '—'}</Text>
      ),
    },
    {
      title: 'Campaign Name',
      dataIndex: 'campaignName',
      key: 'campaignName',
      width: 200,
      render: (v: string) => (
        <Text style={{ fontSize: 12, color: SLATE_500 }}>{v || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Not set</span>}</Text>
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
      title: 'Campaign Type',
      dataIndex: 'campaignType',
      key: 'campaignType',
      width: 150,
      render: (v: string) => v
        ? <Tag color="blue" style={{ fontSize: 11 }}>{v}</Tag>
        : <Text style={{ color: '#94a3b8', fontSize: 12 }}>—</Text>,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (v: string) => v
        ? <Text style={{ fontSize: 12, color: SLATE }}>{v}</Text>
        : <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Not set</Text>,
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (v: string) => v
        ? <Text style={{ fontSize: 12, color: SLATE }}>{v}</Text>
        : <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Not set</Text>,
    },
    {
      title: 'Line Items',
      key: 'lineItems',
      width: 100,
      render: (_: any, record: SavedDraft) => (
        <Tag color="purple" style={{ fontSize: 11 }}>
          {record.lineItems?.length ?? 0} item{(record.lineItems?.length ?? 0) !== 1 ? 's' : ''}
        </Tag>
      ),
    },
    {
      title: 'Last Saved Step',
      dataIndex: 'activeStep',
      key: 'activeStep',
      width: 180,
      render: (step: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag color={getStepColor(step)} style={{ fontSize: 11, margin: 0 }}>
            Step {step}
          </Tag>
          <Text style={{ fontSize: 11, color: SLATE_500 }}>{getStepLabel(step)}</Text>
        </div>
      ),
    },
    {
      title: 'Saved At',
      dataIndex: 'savedAt',
      key: 'savedAt',
      width: 170,
      render: (v: string) => (
        <Text style={{ fontSize: 11.5, color: SLATE_500 }}>{formatDate(v)}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_: any, record: SavedDraft) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{
              fontSize: 11, fontWeight: 600,
              color: BLUE, background: BLUE_LIGHT,
              border: `1px solid ${BLUE_MID}`, borderRadius: 6,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            style={{
              fontSize: 11, fontWeight: 600,
              color: '#ef4444', background: '#fef2f2',
              border: '1px solid #fca5a5', borderRadius: 6,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          {/* Left Side */}
          <div>
            <h1
              style={{ fontSize: 18, fontWeight: 700, color: SLATE, }}>
              My Drafts
            </h1>
            <p
              style={{ fontSize: 11, color: SLATE_500, marginTop: 1, letterSpacing: "0.04em", fontWeight: 500, }}
            >
              SAVED CAMPAIGN DRAFTS
            </p>
          </div>

          {/* Right Side */}
          <Button
            type="primary"
            onClick={() => navigate('/campaign_choice')}
            style={{
              borderRadius: 9,
              background: BLUE,
              color: WHITE,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              height: 36,
              border: 'none',
            }}
          >
            + NEW CAMPAIGN
          </Button>
        </div>


        {/* ─── Filters ────────────────────────────────────────────────── */}
        <div style={{
          background: WHITE, borderRadius: 12, padding: '16px 20px',
          border: `1px solid ${SLATE_300}`, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <Input
            placeholder="Search by draft name, campaign, advertiser…"
            prefix={<SearchOutlined style={{ color: SLATE_500 }} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 240, height: 36 }}
            allowClear
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={loadDrafts}
            style={{
              height: 36, borderRadius: 8, border: `1px solid E2E8F0`,
              background: '#FFFFFF', color: '#64748B', fontSize: 12, fontWeight: 600,
            }}
          >
            Refresh
          </Button>
          <Text style={{ marginLeft: 'auto', fontSize: 12, color: SLATE_500 }}>
            {filtered.length} of {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
          </Text>
        </div>

        {/* ─── Table ──────────────────────────────────────────────────── */}
        {drafts.length === 0 ? (
          /* Empty state */
          <div style={{
            background: WHITE, borderRadius: 16,
            border: `1px solid ${SLATE_300}`,
            padding: '64px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 16,
          }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileTextOutlined style={{ fontSize: 32, color: SLATE_500 }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: SLATE, marginBottom: 6 }}>No drafts saved yet</div>
              <div style={{ fontSize: 13, color: SLATE_500, maxWidth: 320 }}>
                When you click "Save Draft" while creating a campaign, it will appear here.
              </div>
            </div>
            <Button
              type="primary"
              onClick={() => navigate('/campaign_create')}
              style={{ background: BLUE, borderColor: BLUE, borderRadius: 8, fontWeight: 600 }}
            >
              Create New Campaign
            </Button>
          </div>
        ) : (
          <div style={{
            background: WHITE, borderRadius: 12,
            border: `1px solid ${SLATE_300}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <Table
              columns={columns}
              dataSource={filtered}
              rowKey="draftId"
              scroll={{ x: 1600 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} drafts`,
                style: { padding: '12px 16px' },
              }}
              expandable={{
                expandedRowRender: (record: SavedDraft) => {
                  const lineItems = record.lineItems || [];
                  if (lineItems.length === 0) {
                    return <Text style={{ color: SLATE_500, fontSize: 12 }}>No line items in this draft.</Text>;
                  }
                  return (
                    <div style={{ padding: '8px 0' }}>
                      <Text strong style={{ fontSize: 12, color: SLATE, marginBottom: 8, display: 'block' }}>
                        Line Items ({lineItems.length})
                      </Text>
                      <Table
                        size="small"
                        dataSource={lineItems}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          {
                            title: 'Line Item ID',
                            dataIndex: 'id',
                            key: 'id',
                            render: (v: string) => (
                              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#7C3AED', background: '#EDE9FE', padding: '2px 6px', borderRadius: 4 }}>{v}</span>
                            ),
                          },
                          {
                            title: 'Name',
                            dataIndex: 'lineItemName',
                            key: 'lineItemName',
                            render: (v: string) => <Text style={{ fontSize: 12 }}>{v || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unnamed</span>}</Text>,
                          },
                          {
                            title: 'Start Date',
                            dataIndex: 'startDate',
                            key: 'startDate',
                            render: (v: string) => <Text style={{ fontSize: 12 }}>{v || '—'}</Text>,
                          },
                          {
                            title: 'End Date',
                            dataIndex: 'endDate',
                            key: 'endDate',
                            render: (v: string) => <Text style={{ fontSize: 12 }}>{v || '—'}</Text>,
                          },
                          {
                            title: 'Ad Format',
                            dataIndex: 'adFormat',
                            key: 'adFormat',
                            render: (v: string) => v
                              ? <Tag color="blue" style={{ fontSize: 10 }}>{v}</Tag>
                              : <Text style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }}>Not set</Text>,
                          },
                          {
                            title: 'Impressions',
                            dataIndex: 'impressions',
                            key: 'impressions',
                            render: (v: string) => <Text style={{ fontSize: 12 }}>{v ? Number(v).toLocaleString('en-IN') : '—'}</Text>,
                          },
                        ]}
                        style={{ background: '#F8FAFC', borderRadius: 8 }}
                      />
                    </div>
                  );
                },
                rowExpandable: (record) => (record.lineItems?.length ?? 0) > 0,
              }}
              rowClassName={() => 'draft-row'}
              style={{ fontSize: 13 }}
            />
          </div>
        )}

      </div>

      <style>{`
        .draft-row:hover td { background: #F8FAFC !important; }
        .ant-table-thead > tr > th {
          background: #F1F5F9 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #64748B !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      `}</style>
    </>
  );
}