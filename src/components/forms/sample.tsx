// Creative_Upload.tsx
import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Checkbox, Input, Table, Tooltip, message } from 'antd';
import {
  CloseOutlined,
  WarningFilled,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileImageOutlined,
  EditOutlined,
  CheckOutlined,
} from '@ant-design/icons';

const UPLOAD_URL = 'https://grinch-revocable-cornflake.ngrok-free.dev/upload_creatives/';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CreativeRow {
  key: string;
  creativeName: string;
  mainAsset: File | null;
  backupImage: File | null;
  dimensions: string;
  aspectRatio: string;
  fileSize: string;
  clickThroughUrl: string;
  appendedHtmlTag: string;
  integrationCode: string;
  notes: string;
  editing: Set<string>;
}

function makeRow(): CreativeRow {
  return {
    key: `row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    creativeName: '',
    mainAsset: null,
    backupImage: null,
    dimensions: '',
    aspectRatio: '',
    fileSize: '',
    clickThroughUrl: '',
    appendedHtmlTag: '',
    integrationCode: '',
    notes: '',
    editing: new Set(),
  };
}

function readImageMeta(file: File): Promise<{ dimensions: string; aspectRatio: string; fileSize: string }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const d = gcd(w, h);
      resolve({
        dimensions: `${w} × ${h}`,
        aspectRatio: `${w / d}:${h / d}`,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ dimensions: '—', aspectRatio: '—', fileSize: `${(file.size / 1024).toFixed(1)} KB` });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

// ── Inline Editable Cell ──────────────────────────────────────────────────────
function EditableTextCell({
  value, isEditing,
  onStartEdit, onCommit, onChange, placeholder,
}: {
  value: string;
  fieldKey: string;
  rowKey: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCommit: () => void;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<any>(null);

  React.useEffect(() => {
    if (isEditing) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isEditing]);

  if (isEditing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Input
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onPressEnter={onCommit}
          onBlur={onCommit}
          style={{ fontSize: 12, flex: 1, minWidth: 80}}
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); onCommit(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: 2 }}
        >
          <CheckOutlined style={{ fontSize: 11 }} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 60 }}>
      <span style={{ fontSize: 12, color: value ? '#374151' : '#d1d5db', flex: 1 }}>
        {value || '—'}
      </span>
      <button
        onClick={onStartEdit}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2, flexShrink: 0 }}
      >
        <EditOutlined style={{ fontSize: 11 }} />
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Creative_Upload() {
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo: string | number = (location.state as any)?.returnTo ?? -1;
  const lineItemId: string | undefined = (location.state as any)?.lineItemId;

  const [rows, setRows] = useState<CreativeRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const browseRef = useRef<HTMLInputElement>(null);
  const mainAssetRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const backupAssetRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Row helpers ──
  const updateRow = (key: string, patch: Partial<Omit<CreativeRow, 'editing'>>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const startEditing = (rowKey: string, field: string) =>
    setRows((prev) => prev.map((r) => {
      if (r.key !== rowKey) return r;
      const next = new Set(r.editing); next.add(field);
      return { ...r, editing: next };
    }));

  const stopEditing = (rowKey: string, field: string) =>
    setRows((prev) => prev.map((r) => {
      if (r.key !== rowKey) return r;
      const next = new Set(r.editing); next.delete(field);
      return { ...r, editing: next };
    }));

  const handleMainAsset = async (key: string, file: File) => {
    const meta = await readImageMeta(file);
    const name = file.name.replace(/\.[^.]+$/, '');
    updateRow(key, { mainAsset: file, creativeName: name, ...meta });
  };

  // Bulk browse (from drop zone Browse button) → create rows from files
  const handleBulkBrowse = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const newRows: CreativeRow[] = await Promise.all(
      arr.map(async (file) => {
        const meta = await readImageMeta(file);
        const name = file.name.replace(/\.[^.]+$/, '');
        return { ...makeRow(), creativeName: name, mainAsset: file, ...meta };
      })
    );
    setRows((prev) => {
      const isBlank = prev.length === 1 && !prev[0].mainAsset && !prev[0].creativeName;
      return isBlank ? newRows : [...prev, ...newRows];
    });
  };

  // "Add creative" → new empty row → auto-open its file picker
  const handleAddCreative = () => {
    const newRow = makeRow();
    setRows((prev) => [...prev, newRow]);
    setTimeout(() => {
      mainAssetRefs.current[newRow.key]?.click();
    }, 120);
  };

  const handleDeleteSelected = () => {
    setRows((prev) => prev.filter((r) => !selected.includes(r.key)));
    setSelected([]);
  };

  // ── Save to API ──
  const handleSave = async () => {
    const filled = rows.filter((r) => r.creativeName || r.mainAsset);
    if (filled.length === 0) {
      message.warning('Please add at least one creative.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('line_item_id', lineItemId ?? '');
      fd.append('creatives_meta', JSON.stringify(
        filled.map((r) => ({
          creative_name: r.creativeName,
          dimensions: r.dimensions,
          aspect_ratio: r.aspectRatio,
          file_size: r.fileSize,
          click_through_url: r.clickThroughUrl,
          appended_html_tag: r.appendedHtmlTag,
          ineg: r.integrationCode,
          notes: r.notes,
          main_asset_name: r.mainAsset?.name ?? '',
          backup_image_name: r.backupImage?.name ?? '',
        }))
      ));
      filled.forEach((r, i) => {
        if (r.mainAsset) fd.append(`main_asset_${i}`, r.mainAsset, r.mainAsset.name);
        if (r.backupImage) fd.append(`backup_image_${i}`, r.backupImage, r.backupImage.name);
      });

      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': '1' },
        body: fd,
      });

      if (res.ok) {
        message.success(`${filled.length} creative(s) saved successfully!`);
        setTimeout(() => {
          returnTo && returnTo !== -1 ? navigate(returnTo as string) : navigate(-1);
        }, 1000);
      } else {
        const txt = await res.text();
        message.error(`Save failed: ${txt || res.status}`);
      }
    } catch (err: any) {
      message.error(`Network error: ${err?.message ?? 'Unknown'}`);
    } finally {
      setSaving(false);
    }
  };

  const hasRows = rows.length > 0;

  // ── Table columns ──
  const columns = [
    {
      title: (
        <Checkbox
          checked={selected.length === rows.length && rows.length > 0}
          indeterminate={selected.length > 0 && selected.length < rows.length}
          onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.key) : [])}
        />
      ),
      key: 'check', width: 40,
      render: (_: any, record: CreativeRow) => (
        <Checkbox
          checked={selected.includes(record.key)}
          onChange={(e) =>
            setSelected((prev) =>
              e.target.checked ? [...prev, record.key] : prev.filter((k) => k !== record.key)
            )
          }
        />
      ),
    },
    {
      title: '#', key: 'index', width: 36,
      render: (_: any, __: CreativeRow, index: number) => (
        <span style={{ fontSize: 12, color: '#6b7280' }}>{index + 1}</span>
      ),
    },
    {
      title: 'Creative name', key: 'creativeName', width: 220,
      render: (_: any, record: CreativeRow) => (
        <EditableTextCell
          value={record.creativeName}
          fieldKey="creativeName" rowKey={record.key}
          isEditing={record.editing.has('creativeName')}
          onStartEdit={() => startEditing(record.key, 'creativeName')}
          onCommit={() => stopEditing(record.key, 'creativeName')}
          onChange={(v) => updateRow(record.key, { creativeName: v })}
          placeholder="e.g. Banner_300x250"
        />
      ),
    },
    {
      title: 'Main asset', key: 'mainAsset', width: 160,
      render: (_: any, record: CreativeRow) => (
        <>
          <input
            ref={(el) => { mainAssetRefs.current[record.key] = el; }}
            type="file" accept="image/*,text/html,.zip"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await handleMainAsset(record.key, f);
              if (mainAssetRefs.current[record.key]) mainAssetRefs.current[record.key]!.value = '';
            }}
          />
          {record.mainAsset ? (
            <Tooltip title={record.mainAsset.name}>
              <span
                onClick={() => mainAssetRefs.current[record.key]?.click()}
                style={{
                  fontSize: 12, color: '#1d4ed8', cursor: 'pointer',
                  maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4,
                }}
              >
                <FileImageOutlined /> {record.mainAsset.name}
              </span>
            </Tooltip>
          ) : (
            <Button
              size="small"
              onClick={() => mainAssetRefs.current[record.key]?.click()}
              style={{ fontSize: 11, height: 26, padding: '0 10px', color: '#1d4ed8', borderColor: '#93c5fd' }}
            >
              Browse
            </Button>
          )}
        </>
      ),
    },
    {
      title: (
        <span>
          Backup image{' '}
          <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 400 }}>(optional for HTML5 only)</span>
        </span>
      ),
      key: 'backupImage', width: 210,
      render: (_: any, record: CreativeRow) => (
        <>
          <input
            ref={(el) => { backupAssetRefs.current[record.key] = el; }}
            type="file" accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) updateRow(record.key, { backupImage: f });
              if (backupAssetRefs.current[record.key]) backupAssetRefs.current[record.key]!.value = '';
            }}
          />
          {record.backupImage ? (
            <Tooltip title={record.backupImage.name}>
              <span
                onClick={() => backupAssetRefs.current[record.key]?.click()}
                style={{
                  fontSize: 12, color: '#1d4ed8', cursor: 'pointer',
                  maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4,
                }}
              >
                <FileImageOutlined /> {record.backupImage.name}
              </span>
            </Tooltip>
          ) : (
            <Button
              size="small"
              onClick={() => backupAssetRefs.current[record.key]?.click()}
              style={{ fontSize: 11, height: 26, padding: '0 10px', color: '#6b7280', borderColor: '#d1d5db' }}
            >
              Browse
            </Button>
          )}
        </>
      ),
    },
    {
      title: 'Dimensions', key: 'dimensions', width: 110,
      render: (_: any, record: CreativeRow) => (
        <span style={{ fontSize: 12, color: record.dimensions ? '#374151' : '#d1d5db' }}>
          {record.dimensions || '—'}
        </span>
      ),
    },
    {
      title: 'Aspect ratio', key: 'aspectRatio', width: 100,
      render: (_: any, record: CreativeRow) => (
        <span style={{ fontSize: 12, color: record.aspectRatio ? '#374151' : '#d1d5db' }}>
          {record.aspectRatio || '—'}
        </span>
      ),
    },
    {
      title: 'File size', key: 'fileSize', width: 90,
      render: (_: any, record: CreativeRow) => (
        <span style={{ fontSize: 12, color: record.fileSize ? '#374151' : '#d1d5db' }}>
          {record.fileSize || '—'}
        </span>
      ),
    },
    {
      title: 'Click-through URL', key: 'clickThroughUrl', width: 200,
      render: (_: any, record: CreativeRow) => (
        <EditableTextCell
          value={record.clickThroughUrl}
          fieldKey="clickThroughUrl" rowKey={record.key}
          isEditing={record.editing.has('clickThroughUrl')}
          onStartEdit={() => startEditing(record.key, 'clickThroughUrl')}
          onCommit={() => stopEditing(record.key, 'clickThroughUrl')}
          onChange={(v) => updateRow(record.key, { clickThroughUrl: v })}
          placeholder="https://"
        />
      ),
    },
    {
      title: (
        <span>
          Appended HTML tag{' '}
          <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 400 }}>optional</span>
        </span>
      ),
      key: 'appendedHtmlTag', width: 210,
      render: (_: any, record: CreativeRow) => (
        <EditableTextCell
          value={record.appendedHtmlTag}
          fieldKey="appendedHtmlTag" rowKey={record.key}
          isEditing={record.editing.has('appendedHtmlTag')}
          onStartEdit={() => startEditing(record.key, 'appendedHtmlTag')}
          onCommit={() => stopEditing(record.key, 'appendedHtmlTag')}
          onChange={(v) => updateRow(record.key, { appendedHtmlTag: v })}
          placeholder='<IMG SRC="..."'
        />
      ),
    },
    {
      title: (
        <span>
          Integration code{' '}
          <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 400 }}>optional</span>
        </span>
      ),
      key: 'integrationCode', width: 180,
      render: (_: any, record: CreativeRow) => (
        <EditableTextCell
          value={record.integrationCode}
          fieldKey="integrationCode" rowKey={record.key}
          isEditing={record.editing.has('integrationCode')}
          onStartEdit={() => startEditing(record.key, 'integrationCode')}
          onCommit={() => stopEditing(record.key, 'integrationCode')}
          onChange={(v) => updateRow(record.key, { integrationCode: v })}
          placeholder="Code…"
        />
      ),
    },
    {
      title: (
        <span>
          Notes{' '}
          <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 400 }}>optional</span>
        </span>
      ),
      key: 'notes', width: 160,
      render: (_: any, record: CreativeRow) => (
        <EditableTextCell
          value={record.notes}
          fieldKey="notes" rowKey={record.key}
          isEditing={record.editing.has('notes')}
          onStartEdit={() => startEditing(record.key, 'notes')}
          onCommit={() => stopEditing(record.key, 'notes')}
          onChange={(v) => updateRow(record.key, { notes: v })}
          placeholder="Add note…"
        />
      ),
    },
    {
      title: '', key: 'actions', width: 44,
      render: (_: any, record: CreativeRow) => (
        <button
          onClick={() => {
            setRows((prev) => prev.filter((r) => r.key !== record.key));
            setSelected((prev) => prev.filter((k) => k !== record.key));
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex', alignItems: 'center' }}
        >
          <DeleteOutlined style={{ fontSize: 13 }} />
        </button>
      ),
    },
  ];

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleBulkBrowse(e.dataTransfer.files);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#f9fafb',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
        width: '100%', maxWidth: 1400, overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => (returnTo && returnTo !== -1 ? navigate(returnTo as string) : navigate(-1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', padding: 4 }}
            >
              <CloseOutlined style={{ fontSize: 16 }} />
            </button>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
              Bulk upload HTML5 or image creatives
            </h2>
          </div>
        </div>

        {/* ── Warning Banner ── */}
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          margin: '16px 24px', borderRadius: 6,
          padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <WarningFilled style={{ color: '#d97706', fontSize: 15, marginTop: 1, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
            You are responsible for ensuring that your collection and use of user information complies with your
            legal agreements and applicable laws and policies, including the{' '}
            <a href="#" style={{ color: '#1d4ed8' }}>EU User Consent Policy</a>. Carefully consider your
            responsibilities before using tracking code to collect information from ad impressions.
          </p>
        </div>

        {/* ── Toolbar ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 24px 12px',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              type="primary" icon={<PlusOutlined />}
              onClick={handleAddCreative}
              style={{ background: '#1a73e8', borderColor: '#1a73e8', fontSize: 13 }}
            >
              Add creative
            </Button>
            {selected.length > 0 && (
              <Button danger icon={<DeleteOutlined />} onClick={handleDeleteSelected} style={{ fontSize: 13 }}>
                Delete ({selected.length})
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Template last updated: September 21, 2020</span>
            <Button
              icon={<DownloadOutlined />} type="link"
              style={{ fontSize: 13, padding: 0, color: '#1d4ed8' }}
              onClick={() => message.info('Downloading template…')}
            >
              Download template
            </Button>
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ padding: '0 24px' }}>
          <Table
            columns={columns}
            dataSource={rows}
            rowKey="key"
            pagination={false}
            size="small"
            bordered
            scroll={{ x: 1700 }}
            style={{ fontSize: 13 }}
            locale={{ emptyText: '' }}
          />
        </div>

        {/* ── Drop / Browse zone — always visible below table ── */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            margin: hasRows ? '12px 24px' : '0 24px',
            border: '1px dashed #d1d5db',
            borderTop: hasRows ? '1px dashed #d1d5db' : 'none',
            borderRadius: hasRows ? 6 : '0 0 6px 6px',
            padding: '32px 24px',
            textAlign: 'center',
            background: '#fafafa',
          }}
        >
          <input
            ref={browseRef}
            type="file" multiple accept="image/*,text/html,.zip"
            style={{ display: 'none' }}
            onChange={(e) => handleBulkBrowse(e.target.files)}
          />
          <Button
            type="primary"
            style={{ background: '#1a73e8', borderColor: '#1a73e8', fontSize: 13, marginBottom: 10 }}
            onClick={() => browseRef.current?.click()}
          >
            Browse
          </Button>
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
            Or drag your assets and optional spreadsheet here. To learn more, see{' '}
            <a href="#" style={{ color: '#1d4ed8' }}>Bulk upload HTML5 or image creatives</a>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
            Before you upload, make sure you have the latest template
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb',
        }}>
          <Button
            type="primary" loading={saving} onClick={handleSave}
            style={{ background: '#1a73e8', borderColor: '#1a73e8', fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}
          >
            SAVE
          </Button>
          <Button
            onClick={() => (returnTo && returnTo !== -1 ? navigate(returnTo as string) : navigate(-1))}
            style={{ fontSize: 13 }}
          >
            Cancel
          </Button>
        </div>

      </div>
    </div>
  );
}