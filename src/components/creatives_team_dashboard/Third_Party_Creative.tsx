import { useState, useEffect } from 'react';
import { Table, Input, Button, Typography, Tooltip, Modal, message } from 'antd';
import {
  SearchOutlined, ReloadOutlined, FileImageOutlined, FileOutlined,
  DownloadOutlined, CloseOutlined, CodeOutlined, EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import CreativeSidebar from '../creatives_team_dashboard/CreativeSidebar';

const { Text } = Typography;

const BASE_URL = import.meta.env.VITE_BASE_URL;

const AMBER = '#92400e';
const AMBER_LIGHT = '#fef3c7';
const AMBER_BORDER = '#fcd34d';
const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const GREEN = '#059669';
const GREEN_LIGHT = '#f0fdf4';
const GREEN_BORDER = '#86efac';
const SLATE = '#0F172A';
const SLATE_300 = '#CBD5E1';
const SLATE_500 = '#64748B';
const WHITE = '#FFFFFF';
const BG = '#F8FAFC';

// ── Types ──────────────────────────────────────────────────────────────────
interface ThirdPartyRow {
  key: string;
  rowIndex: number;
  campaignId: string;
  campaignName: string;
  lineItemId: string;
  lineItemName: string;
  inputFile: string | null;
  inputFileName: string;
  inputFileExt: string;
  inputFileUrl: string | null;      // ← resolved URL for direct download
  backupImage: string | null;
  backupImageName: string;
  backupImageUrl: string | null;    // ← resolved URL for preview + download
  uploadedAt: string;
  tpId: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function extractFileName(filePath: string | null | undefined): string {
  if (!filePath) return '';
  return filePath.split('/').pop() ?? filePath;
}

function extractExt(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : '';
}

function resolveUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

function isImage(url?: string | null) {
  if (!url) return false;
  const name = url.split('/').pop()?.split('?')[0] ?? '';
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext);
}

function getExt(url?: string | null): string {
  if (!url) return '';
  const name = url.split('/').pop()?.split('?')[0] ?? '';
  return name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
}

// Extension → colour mapping for the badge
function extColor(ext: string): { color: string; bg: string; border: string } {
  switch (ext) {
    case 'XLS':
    case 'XLSX':
      return { color: '#166534', bg: '#f0fdf4', border: '#86efac' };
    case 'DOC':
    case 'DOCX':
      return { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' };
    case 'TXT':
      return { color: SLATE_500, bg: '#f1f5f9', border: SLATE_300 };
    case 'ZIP':
      return { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' };
    default:
      return { color: AMBER, bg: AMBER_LIGHT, border: AMBER_BORDER };
  }
}

// ── File Badge ─────────────────────────────────────────────────────────────
function ExtBadge({ ext }: { ext: string }) {
  if (!ext) return null;
  const c = extColor(ext);
  return (
    <span style={{
      fontSize: 9, fontWeight: 700,
      color: c.color, background: c.bg,
      padding: '1px 5px', borderRadius: 3,
      border: `1px solid ${c.border}`,
      fontFamily: 'monospace', flexShrink: 0,
    }}>{ext}</span>
  );
}

// ── Generic download via direct URL (same pattern as Image_Creatives) ──────
async function downloadByUrl(resolvedUrl: string, fileName: string) {
  try {
    const response = await fetch(resolvedUrl, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    message.error(`Failed to download "${fileName}"`);
  }
}

// ── Preview Modal (mirrors Image_Creatives PreviewModal) ───────────────────
interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  name: string;
  ext: string;
}

function PreviewModal({ open, onClose, url, name, ext }: PreviewModalProps) {
  const resolved = resolveUrl(url);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={780}
      styles={{ body: { padding: 0, background: '#0f172a' } }}
      closeIcon={
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13,
        }}>
          <CloseOutlined />
        </div>
      }
    >
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, color: '#fff',
            background: 'rgba(255,255,255,0.15)',
            padding: '2px 7px', borderRadius: 4,
            fontFamily: 'monospace', letterSpacing: '0.05em',
          }}>{ext.toUpperCase()}</span>
          <span style={{
            fontSize: 13, fontWeight: 600, color: '#e2e8f0',
            maxWidth: 460, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </span>
        </div>
        <button
          onClick={() => downloadByUrl(resolved, name)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 600, color: '#93c5fd',
            background: 'rgba(37,99,235,0.15)',
            padding: '4px 10px', borderRadius: 6,
            border: '1px solid rgba(37,99,235,0.3)',
            cursor: 'pointer',
          }}
        >
          <DownloadOutlined style={{ fontSize: 12 }} /> Download
        </button>
      </div>

      {/* Content */}
      <div style={{
        minHeight: 320, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 24,
        background: '#0f172a',
      }}>
        {isImage(url) ? (
          <img
            src={resolved}
            alt={name}
            style={{
              maxWidth: '100%', maxHeight: 500,
              objectFit: 'contain', borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          />
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 16, padding: 40,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: '#94a3b8',
            }}>
              <FileOutlined />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Preview not available for .{ext} files
              </div>
            </div>
            <button
              onClick={() => downloadByUrl(resolved, name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 8,
                background: '#2563eb', color: '#fff',
                fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer',
              }}
            >
              <DownloadOutlined /> Download File
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Third_Party_Creative() {
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? 64 : 240;

  const [rows, setRows] = useState<ThirdPartyRow[]>([]);
  const [filtered, setFiltered] = useState<ThirdPartyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ── Preview state ──────────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [previewExt, setPreviewExt] = useState('');

  const clientName = localStorage.getItem('client_name') ?? '';
  const avatarInitials = clientName ? clientName.charAt(0).toUpperCase() : 'U';

  const openPreview = (url: string, name: string) => {
    setPreviewUrl(url);
    setPreviewName(name);
    setPreviewExt(getExt(url) || 'file');
    setPreviewOpen(true);
  };

  // ── Fetch & flatten ──────────────────────────────────────────────────────
  const fetchData = () => {
    setLoading(true);
    fetch(`${BASE_URL}/get_campaigns/`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data: any[]) => {
        const flat: ThirdPartyRow[] = [];
        let rowIndex = 1;

        const allCampaigns = Array.isArray(data) ? data : [];
        const approved = allCampaigns.filter(c => c.approval_status === 'approved');

        approved.forEach(campaign => {
          (campaign.line_items ?? []).forEach((li: any) => {
            (li.third_party_creatives ?? []).forEach((tp: any, tpIdx: number) => {
              const inputFile: string | null = tp.input_file ?? null;
              const backupImage: string | null = tp.backup_image ?? null;
              const inputFileName = extractFileName(inputFile);
              const inputFileExt = extractExt(inputFileName);

              // Resolve full URLs directly (same as resolveUrl in Image_Creatives)
              const inputFileUrl = inputFile ? resolveUrl(inputFile) : null;
              const backupImageUrl = backupImage ? resolveUrl(backupImage) : null;

              flat.push({
                key: `${campaign.campaign_id}-${li.line_item_id}-${tpIdx}`,
                rowIndex,
                campaignId: campaign.campaign_id,
                campaignName: campaign.campaign_name ?? '—',
                lineItemId: li.line_item_id,
                lineItemName: li.line_item_name ?? '—',
                inputFile,
                inputFileName: inputFileName || `Third Party ${tpIdx + 1}`,
                inputFileExt,
                inputFileUrl,
                backupImage,
                backupImageName: extractFileName(backupImage) || '—',
                backupImageUrl,
                uploadedAt: tp.uploaded_at ?? '',
                tpId: tp.id ?? tpIdx,
              });
              rowIndex++;
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

  // ── Search ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setFiltered(rows); return; }
    const q = search.toLowerCase();
    setFiltered(rows.filter(r =>
      r.campaignId.toLowerCase().includes(q) ||
      r.campaignName.toLowerCase().includes(q) ||
      r.lineItemId.toLowerCase().includes(q) ||
      r.inputFileName.toLowerCase().includes(q),
    ));
  }, [search, rows]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalFiles = rows.length;
  const withInputFile = rows.filter(r => r.inputFile).length;
  const withBackupImage = rows.filter(r => r.backupImage).length;

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: ColumnsType<ThirdPartyRow> = [
    {
      title: 'ID',
      dataIndex: 'rowIndex',
      key: 'rowIndex',
      width: 52,
      render: (v: number) => (
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: BLUE_LIGHT, border: `1px solid ${BLUE}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: BLUE,
        }}>{v}</div>
      ),
    },
    {
      title: 'Campaign',
      key: 'campaign',
      width: 200,
      render: (_: any, r: ThirdPartyRow) => (
        <div>
          <span style={{
            fontSize: 11, fontWeight: 700, color: BLUE,
            background: BLUE_LIGHT, padding: '2px 7px',
            borderRadius: 5, fontFamily: 'monospace',
            display: 'inline-block', marginBottom: 3,
          }}>{r.campaignId}</span>
          <div style={{
            fontSize: 11, color: SLATE_500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 180,
          }}>
            {r.campaignName}
          </div>
        </div>
      ),
    },
    {
      title: 'Line Item',
      key: 'lineItem',
      width: 180,
      render: (_: any, r: ThirdPartyRow) => (
        <div>
          <span style={{
            fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
            color: BLUE, background: BLUE_LIGHT,
            padding: '2px 6px', borderRadius: 4,
            display: 'inline-block', marginBottom: 3,
          }}>{r.lineItemId}</span>
          <div style={{
            fontSize: 11, color: SLATE_500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 160,
          }}>
            {r.lineItemName}
          </div>
        </div>
      ),
    },
    {
      title: 'Input File',
      key: 'inputFile',
      width: 280,
      render: (_: any, r: ThirdPartyRow) => {
        if (!r.inputFile) {
          return <Text style={{ color: SLATE_300, fontSize: 12 }}>—</Text>;
        }
        const canPreview = !!r.inputFileUrl;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ExtBadge ext={r.inputFileExt} />
            <Tooltip title={r.inputFileName} placement="topLeft">
              <span
                onClick={() => canPreview && openPreview(r.inputFileUrl!, r.inputFileName)}
                style={{
                  fontSize: 12, color: canPreview ? BLUE : SLATE, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: 160, cursor: canPreview ? 'pointer' : 'default',
                  textDecoration: canPreview ? 'underline' : 'none',
                  textDecorationStyle: 'dotted',
                  textUnderlineOffset: 3,
                }}
              >
                {r.inputFileName}
              </span>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: 'Backup Image',
      key: 'backupImage',
      width: 280,
      render: (_: any, r: ThirdPartyRow) => {
        if (!r.backupImage) {
          return <Text style={{ color: SLATE_300, fontSize: 12 }}>—</Text>;
        }
        const backupExt = extractExt(r.backupImageName).toUpperCase();
        const canPreview = !!r.backupImageUrl;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Thumbnail */}
            {r.backupImageUrl && isImage(r.backupImageUrl) && (
              <img
                src={r.backupImageUrl}
                alt={r.backupImageName}
                onClick={() => openPreview(r.backupImageUrl!, r.backupImageName)}
                style={{
                  width: 32, height: 32, objectFit: 'cover',
                  borderRadius: 5, border: `1px solid ${SLATE_300}`,
                  flexShrink: 0, cursor: 'pointer',
                }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
              {backupExt && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: '#166534',
                  background: '#f0fdf4', padding: '1px 5px',
                  borderRadius: 3, border: '1px solid #86efac',
                  fontFamily: 'monospace', flexShrink: 0,
                }}>{backupExt}</span>
              )}
              <Tooltip title={r.backupImageName} placement="topLeft">
                <span
                  onClick={() => canPreview && openPreview(r.backupImageUrl!, r.backupImageName)}
                  style={{
                    fontSize: 12, color: canPreview ? BLUE : SLATE, fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: 130, cursor: canPreview ? 'pointer' : 'default',
                    textDecoration: canPreview ? 'underline' : 'none',
                    textDecorationStyle: 'dotted',
                    textUnderlineOffset: 3,
                  }}
                >
                  {r.backupImageName}
                </span>
              </Tooltip>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Uploaded At',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 160,
      render: (v: string) => v
        ? (
          <div>
            <div style={{ fontSize: 12, color: SLATE }}>
              {new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div style={{ fontSize: 10, color: SLATE_500 }}>
              {new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )
        : <Text style={{ color: SLATE_300 }}>—</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_: any, r: ThirdPartyRow) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Download Input File — direct URL fetch (same as Image_Creatives) */}
          {r.inputFileUrl ? (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadByUrl(r.inputFileUrl!, r.inputFileName)}
              style={{
                fontSize: 11, fontWeight: 600,
                height: 28, paddingLeft: 10, paddingRight: 10,
                color: AMBER, background: AMBER_LIGHT,
                border: `1px solid ${AMBER_BORDER}`, borderRadius: 6,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              Input File
            </Button>
          ) : (
            <Button size="small" disabled style={{ fontSize: 11, height: 28 }}>
              No Input
            </Button>
          )}

          {/* Download Backup Image — direct URL fetch */}
          {r.backupImageUrl ? (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadByUrl(r.backupImageUrl!, r.backupImageName)}
              style={{
                fontSize: 11, fontWeight: 600,
                height: 28, paddingLeft: 10, paddingRight: 10,
                color: GREEN, background: GREEN_LIGHT,
                border: `1px solid ${GREEN_BORDER}`, borderRadius: 6,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              Backup
            </Button>
          ) : (
            <Button size="small" disabled style={{ fontSize: 11, height: 28 }}>
              No Backup
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: BG,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <CreativeSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div style={{
        marginLeft: sideWidth, flex: 1,
        display: 'flex', flexDirection: 'column',
        transition: 'margin-left 0.25s', minWidth: 0,
      }}>

        {/* Header */}
        <header style={{
          background: WHITE, borderBottom: `1px solid ${SLATE_300}`,
          padding: '0 28px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: SLATE }}>
              Third Party Creatives
            </div>
            <div style={{ fontSize: 11, color: SLATE_500, letterSpacing: '0.04em' }}>
              ALL THIRD PARTY FILES &amp; BACKUP IMAGES ACROSS CAMPAIGNS
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: BLUE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: WHITE, fontSize: 13, fontWeight: 700,
            }}>{avatarInitials}</div>
          </div>
        </header>

        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16, marginBottom: 20,
          }}>
            {[
              { label: 'Total Third Party Files', value: totalFiles, color: AMBER, bg: AMBER_LIGHT, border: AMBER_BORDER },
              { label: 'With Input File', value: withInputFile, color: BLUE, bg: BLUE_LIGHT, border: '#bfdbfe' },
              { label: 'With Backup Image', value: withBackupImage, color: GREEN, bg: GREEN_LIGHT, border: GREEN_BORDER },
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

          {/* Legend */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 18,
            marginBottom: 10, fontSize: 11.5, color: SLATE_500,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, color: BLUE, background: BLUE_LIGHT,
                padding: '1px 5px', borderRadius: 3, border: `1px solid ${BLUE_LIGHT}`,
              }}><CodeOutlined /></span>
              Third party input file
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, color: BLUE, background: BLUE_LIGHT,
                padding: '1px 5px', borderRadius: 3, border: '1px solid #bfdbfe',
              }}>IMG</span>
              Backup image
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <FileOutlined style={{ fontSize: 12 }} /> Extension badge = file type
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <EyeOutlined style={{ fontSize: 12 }} /> Click name or eye icon to preview
            </span>
          </div>

          {/* Filters */}
          <div style={{
            background: WHITE, borderRadius: 12, padding: '14px 20px',
            border: `1px solid ${SLATE_300}`, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Input
              placeholder="Search by campaign, line item, file name…"
              prefix={<SearchOutlined style={{ color: SLATE_500 }} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 240, height: 36 }}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              style={{ height: 36, color: SLATE_500, border: `1px solid ${SLATE_300}` }}
            >
              Refresh
            </Button>
            <Text style={{ marginLeft: 'auto', fontSize: 12, color: SLATE_500 }}>
              {filtered.length} of {totalFiles} files
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
              rowKey="key"
              loading={loading}
              scroll={{ x: 1400 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}`,
              }}
              style={{ fontSize: 13 }}
              locale={{
                emptyText: (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: SLATE_500 }}>
                    <FileImageOutlined style={{ fontSize: 36, color: SLATE_300, display: 'block', marginBottom: 12 }} />
                    No third party creatives found.
                  </div>
                ),
              }}
            />
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      {previewOpen && previewUrl && (
        <PreviewModal
          open={previewOpen}
          onClose={() => { setPreviewOpen(false); setPreviewUrl(''); }}
          url={previewUrl}
          name={previewName}
          ext={previewExt}
        />
      )}

      <style>{`
        .ant-table-thead > tr > th {
          background: #F1F5F9 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #64748B !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .ant-table-tbody > tr:hover > td {
          background: #fafbff !important;
        }
      `}</style>
    </div>
  );
}