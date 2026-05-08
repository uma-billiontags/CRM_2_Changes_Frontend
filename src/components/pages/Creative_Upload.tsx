// Creative_Upload.tsx — All fields use modal editor; validation only on clickThroughUrl & appendedHtmlTag

import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Checkbox, Input, Table, Tooltip, message, Tag, Modal } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileImageOutlined,
  CheckOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  CloudUploadOutlined,
  EditOutlined,
} from '@ant-design/icons';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CreativeRow {
  key: string;
  creativeName: string;
  mainAsset: File | null;
  dimensions: string;
  aspectRatio: string;
  fileSize: string;
  clickThroughUrl: string;
  appendedHtmlTag: string;
  integrationCode: string;
  notes: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeRow(): CreativeRow {
  return {
    key: `row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    creativeName: '',
    mainAsset: null,
    dimensions: '',
    aspectRatio: '',
    fileSize: '',
    clickThroughUrl: '',
    appendedHtmlTag: '',
    integrationCode: '',
    notes: '',
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

function validateRows(sourceRows: CreativeRow[]): string[] {
  const errors: string[] = [];
  sourceRows.forEach((row, idx) => {
    const label = row.creativeName || `Creative ${idx + 1}`;
    if (row.appendedHtmlTag.trim()) {
      const tag = row.appendedHtmlTag.toLowerCase();
      if (!tag.includes('trackimpi') && !tag.includes('trackimp')) {
        errors.push(`"${label}": Appended HTML Tag must contain a valid impression tracker (trackimpi or trackimp).`);
      }
    }
    if (row.clickThroughUrl.trim()) {
      if (!row.clickThroughUrl.toLowerCase().includes('trackclk')) {
        errors.push(`"${label}": Click-through URL must contain a valid click tracker (trackclk).`);
      }
    }
  });
  return errors;
}

// ── Fields that have tracker validation ───────────────────────────────────────
const VALIDATED_FIELDS = ['clickThroughUrl', 'appendedHtmlTag'];

function getValidationInfo(fieldKey: string, value: string): {
  hasValidation: boolean;
  isValid: boolean;
  validText: string;
  invalidText: string;
  hintText: string;
} {
  if (fieldKey === 'clickThroughUrl') {
    const isValid = value.toLowerCase().includes('trackclk');
    return {
      hasValidation: true,
      isValid,
      validText: '✓ Valid click tracker detected (trackclk)',
      invalidText: '✗ Missing trackclk — this URL will fail validation on save',
      hintText: 'URL must contain trackclk to pass validation',
    };
  }
  if (fieldKey === 'appendedHtmlTag') {
    const isValid = value.toLowerCase().includes('trackimpi') || value.toLowerCase().includes('trackimp');
    return {
      hasValidation: true,
      isValid,
      validText: '✓ Valid impression tracker detected (trackimpi / trackimp)',
      invalidText: '✗ Missing trackimpi/trackimp — this tag will fail validation on save',
      hintText: 'Tag must contain trackimpi or trackimp to pass validation',
    };
  }
  return { hasValidation: false, isValid: true, validText: '', invalidText: '', hintText: '' };
}

// ── Modal Cell — used for ALL editable text fields ────────────────────────────
// MUST be defined OUTSIDE main component to prevent hook violations.
function ModalCell({
  value,
  fieldKey,
  label,
  placeholder,
  onChange,
}: {
  value: string;
  rowKey: string;
  fieldKey: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  onChange: (v: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalValue, setModalValue] = useState('');

  const hasValidation = VALIDATED_FIELDS.includes(fieldKey);
  const isMonospace = ['clickThroughUrl', 'appendedHtmlTag', 'integrationCode'].includes(fieldKey);

  const validation = getValidationInfo(fieldKey, modalValue);

  const openModal = () => {
    setModalValue(value);
    setModalOpen(true);
  };

  const handleOk = () => {
    onChange(modalValue);
    setModalOpen(false);
  };

  const handleCancel = () => {
    setModalValue(value);
    setModalOpen(false);
  };

  const borderColor = hasValidation && modalValue.trim()
    ? validation.isValid ? '#86efac' : '#fca5a5'
    : '#e2e8f0';

  const validationStyle = hasValidation && modalValue.trim()
    ? validation.isValid
      ? { background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d' }
      : { background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }
    : null;

  // Dot shown in table cell for validated fields only
  const dotColor = (() => {
    if (!hasValidation || !value.trim()) return null;
    return getValidationInfo(fieldKey, value).isValid ? '#16a34a' : '#ef4444';
  })();

  const modalRows =
    fieldKey === 'appendedHtmlTag' ? 7 :
      fieldKey === 'clickThroughUrl' ? 3 :
        fieldKey === 'integrationCode' ? 5 :
          fieldKey === 'notes' ? 3 : 2;

  const icon =
    fieldKey === 'clickThroughUrl' ? '🔗' :
      fieldKey === 'appendedHtmlTag' ? '🏷️' :
        fieldKey === 'integrationCode' ? '💻' :
          fieldKey === 'notes' ? '📝' : '✏️';

  const iconBg =
    fieldKey === 'clickThroughUrl' ? '#eff6ff' :
      fieldKey === 'appendedHtmlTag' ? '#f5f3ff' :
        '#f8fafc';

  const footerHint =
    fieldKey === 'clickThroughUrl' ? 'Paste the full DoubleClick click tracker URL' :
      fieldKey === 'appendedHtmlTag' ? 'Paste the full IFRAME impression tracker tag' :
        fieldKey === 'integrationCode' ? 'Paste your integration code' :
          '';

  return (
    <>
      {/* ── Modal Editor ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, flexShrink: 0,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                {label}
              </div>
              {hasValidation && (
                <div style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 400, marginTop: 2 }}>
                  {validation.hintText}
                </div>
              )}
            </div>
          </div>
        }
        open={modalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={680}
        okText="Apply"
        cancelText="Discard"
        okButtonProps={{
          style: { background: '#2563eb', borderColor: '#2563eb', fontWeight: 600, height: 36, borderRadius: 7 },
        }}
        cancelButtonProps={{ style: { height: 36, borderRadius: 7 } }}
        styles={{ body: { padding: '20px 24px 8px' } }}
      >
        <div>
          {/* Live validation banner — only for validated fields */}
          {hasValidation && modalValue.trim() && validationStyle && (
            <div style={{
              marginBottom: 12,
              padding: '8px 13px',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              ...validationStyle,
            }}>
              {validation.isValid ? validation.validText : validation.invalidText}
            </div>
          )}

          <Input.TextArea
            autoFocus
            value={modalValue}
            onChange={(e) => setModalValue(e.target.value)}
            placeholder={placeholder}
            rows={modalRows}
            style={{
              fontFamily: isMonospace
                ? '"Fira Code", "Cascadia Code", "Consolas", monospace'
                : 'inherit',
              fontSize: 12.5,
              lineHeight: 1.7,
              borderColor,
              borderRadius: 7,
              resize: 'vertical',
              transition: 'border-color 0.2s',
            }}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
            marginBottom: 4,
          }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{footerHint}</span>
            {modalValue && (
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{modalValue.length} chars</span>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Table Cell Display ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 60 }}>
        {/* Green / red validation dot — only for validated fields with a value */}
        {dotColor && (
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            flexShrink: 0, background: dotColor,
          }} />
        )}
        <span
          style={{
            fontSize: 12,
            color: value ? '#1e293b' : '#cbd5e1',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 150,
          }}
          title={value || undefined}
        >
          {value || '—'}
        </span>
        <Button
          size="small"
          type="text"
          icon={<EditOutlined style={{ fontSize: 11 }} />}
          onClick={openModal}
          title={`Edit ${label}`}
          style={{ color: '#94a3b8', padding: '0 4px', height: 22, flexShrink: 0 }}
        />
      </div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Creative_Upload() {
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo: string | number = (location.state as any)?.returnTo ?? -1;
  const lineItemId: string | undefined = (location.state as any)?.lineItemId;
  const displayLineItemId = lineItemId?.replace('_video', '').replace('_image', '') ?? '';
  const existingCreatives: any[] = (location.state as any)?.existingCreatives ?? [];
  const allLineItemCreatives: Record<string, any[]> =
    (location.state as any)?.allLineItemCreatives ?? {};

  const [rows, setRows] = useState<CreativeRow[]>(() => {
    if (existingCreatives.length > 0) {
      return existingCreatives.map((c: any) => ({
        key: `row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        creativeName: c.creative_name ?? '',
        mainAsset: c.main_asset ?? null,
        dimensions: c.dimensions ?? '',
        aspectRatio: c.aspect_ratio ?? '',
        fileSize: c.file_size ?? '',
        clickThroughUrl: c.click_through_url ?? '',
        appendedHtmlTag: c.appended_html_tag ?? '',
        integrationCode: c.integration_code ?? '',
        notes: c.notes ?? '',
      }));
    }
    return [];
  });

  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const browseRef = useRef<HTMLInputElement>(null);
  const mainAssetRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Row helpers ───────────────────────────────────────────────────────────
  const updateRow = (key: string, patch: Partial<CreativeRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function buildCreativesPayload(sourceRows: CreativeRow[]) {
    return sourceRows
      .filter(r => r.creativeName || r.mainAsset)
      .map(r => ({
        lineItemId,
        main_asset: r.mainAsset,
        creative_name: r.creativeName,
        dimensions: r.dimensions,
        aspect_ratio: r.aspectRatio,
        file_size: r.fileSize,
        click_through_url: r.clickThroughUrl,
        appended_html_tag: r.appendedHtmlTag,
        integration_code: r.integrationCode,
        notes: r.notes,
      }));
  }

  function navigateBack(sourceRows: CreativeRow[]) {
    if (returnTo && returnTo !== -1) {
      navigate(returnTo as string, {
        state: {
          uploadedCreatives: buildCreativesPayload(sourceRows),
          lineItemId,
          fromCreativeUpload: true,
          allLineItemCreatives,
        },
      });
    } else {
      navigate(-1);
    }
  }

  const handleMainAsset = async (key: string, file: File) => {
    const meta = await readImageMeta(file);
    const name = file.name.replace(/\.[^.]+$/, '');
    updateRow(key, { mainAsset: file, creativeName: name, ...meta });
    setSaved(false);
  };

  const handleBulkBrowse = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newRows: CreativeRow[] = await Promise.all(
      Array.from(files).map(async (file) => {
        const meta = await readImageMeta(file);
        const name = file.name.replace(/\.[^.]+$/, '');
        return { ...makeRow(), creativeName: name, mainAsset: file, ...meta };
      })
    );
    setRows((prev) => {
      const isBlank = prev.length === 1 && !prev[0].mainAsset && !prev[0].creativeName;
      return isBlank ? newRows : [...prev, ...newRows];
    });
    setSaved(false);
  };

  const handleAddCreative = () => {
    const newRow = makeRow();
    setRows((prev) => [...prev, newRow]);
    setSaved(false);
    setTimeout(() => { mainAssetRefs.current[newRow.key]?.click(); }, 120);
  };

  const handleDeleteSelected = () => {
    setRows((prev) => prev.filter((r) => !selected.includes(r.key)));
    setSelected([]);
    setSaved(false);
  };

  const handleBack = () => navigateBack(rows);

  const handleSave = () => {
    const filled = rows.filter((r) => r.creativeName || r.mainAsset);
    if (filled.length === 0) {
      message.warning('Please add at least one creative.');
      return;
    }
    const validationErrors = validateRows(filled);
    if (validationErrors.length > 0) {
      validationErrors.forEach((err, i) => {
        setTimeout(() => { message.error({ content: err, duration: 6 }); }, i * 200);
      });
      return;
    }
    setSaved(true);
    message.success(`${filled.length} creative(s) saved! Click Back to return to the campaign form.`);
  };

  const handleCancel = () => {
    if (returnTo && returnTo !== -1) {
      navigate(returnTo as string, {
        state: { uploadedCreatives: [], lineItemId, fromCreativeUpload: true, allLineItemCreatives },
      });
    } else {
      navigate(-1);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleBulkBrowse(e.dataTransfer.files);
  };

  const hasRows = rows.length > 0;
  const filledCount = rows.filter(r => r.creativeName || r.mainAsset).length;

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      title: (
        <Checkbox
          checked={selected.length === rows.length && rows.length > 0}
          indeterminate={selected.length > 0 && selected.length < rows.length}
          onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.key) : [])}
        />
      ),
      key: 'check', width: 44,
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
      title: <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>#</span>,
      key: 'index', width: 40,
      render: (_: any, __: CreativeRow, index: number) => (
        <div style={{
          width: 22, height: 22, borderRadius: '50%', background: '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: '#64748b', fontWeight: 600,
        }}>
          {index + 1}
        </div>
      ),
    },
    {
      title: <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Creative Name</span>,
      key: 'creativeName', width: 220,
      render: (_: any, record: CreativeRow) => (
        <ModalCell
          value={record.creativeName}
          fieldKey="creativeName"
          rowKey={record.key}
          label="Creative Name"
          placeholder="e.g. Banner_300x250_Homepage"
          onChange={(v) => { updateRow(record.key, { creativeName: v }); setSaved(false); }}
        />
      ),
    },
    {
      title: <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Main Asset</span>,
      key: 'mainAsset', width: 170,
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
              <Tag
                icon={<FileImageOutlined />}
                color="blue"
                style={{ cursor: 'pointer', maxWidth: 145, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                onClick={() => mainAssetRefs.current[record.key]?.click()}
              >
                {record.mainAsset.name}
              </Tag>
            </Tooltip>
          ) : (
            <Button
              size="small" icon={<CloudUploadOutlined />}
              onClick={() => mainAssetRefs.current[record.key]?.click()}
              style={{ fontSize: 12, height: 26, color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
            >
              Browse
            </Button>
          )}
        </>
      ),
    },
    {
      title: <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Dimensions</span>,
      key: 'dimensions', width: 115,
      render: (_: any, record: CreativeRow) => (
        <span style={{ fontSize: 12, color: record.dimensions ? '#1e293b' : '#cbd5e1', fontFeatureSettings: '"tnum"' }}>
          {record.dimensions || '—'}
        </span>
      ),
    },
    {
      title: <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Aspect Ratio</span>,
      key: 'aspectRatio', width: 105,
      render: (_: any, record: CreativeRow) => (
        record.aspectRatio ? (
          <span style={{ fontSize: 11, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 4, fontWeight: 600, border: '1px solid #bfdbfe' }}>
            {record.aspectRatio}
          </span>
        ) : <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
      ),
    },
    {
      title: <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>File Size</span>,
      key: 'fileSize', width: 90,
      render: (_: any, record: CreativeRow) => (
        <span style={{ fontSize: 12, color: record.fileSize ? '#475569' : '#cbd5e1' }}>
          {record.fileSize || '—'}
        </span>
      ),
    },
    {
      title: <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Click-through URL</span>,
      key: 'clickThroughUrl', width: 220,
      render: (_: any, record: CreativeRow) => (
        <ModalCell
          value={record.clickThroughUrl}
          fieldKey="clickThroughUrl"
          rowKey={record.key}
          label="Click-through URL"
          placeholder="https://ad.doubleclick.net/ddm/trackclk/N1234.xxx/B123456.456789325;dc_trk_aid=...;dc_trk_cid=..."
          multiline
          onChange={(v) => { updateRow(record.key, { clickThroughUrl: v }); setSaved(false); }}
        />
      ),
    },
    {
      title: (
        <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
          Appended HTML Tag{' '}
          <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 400, textTransform: 'none' as const }}>optional</span>
        </span>
      ),
      key: 'appendedHtmlTag', width: 220,
      render: (_: any, record: CreativeRow) => (
        <ModalCell
          value={record.appendedHtmlTag}
          fieldKey="appendedHtmlTag"
          rowKey={record.key}
          label="Appended HTML Tag"
          placeholder={'<IFRAME SRC="https://ad.doubleclick.net/ddm/trackimpi/N1234.xxx/B123456.456789325;dc_trk_aid=...;dc_trk_cid=...;ord=[timestamp]" WIDTH=1 HEIGHT=1 MARGINWIDTH=0 MARGINHEIGHT=0 HSPACE=0 VSPACE=0 FRAMEBORDER=0 SCROLLING=no></IFRAME>'}
          multiline
          onChange={(v) => { updateRow(record.key, { appendedHtmlTag: v }); setSaved(false); }}
        />
      ),
    },
    {
      title: (
        <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
          Integration Code{' '}
          <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 400, textTransform: 'none' as const }}>optional</span>
        </span>
      ),
      key: 'integrationCode', width: 190,
      render: (_: any, record: CreativeRow) => (
        <ModalCell
          value={record.integrationCode}
          fieldKey="integrationCode"
          rowKey={record.key}
          label="Integration Code"
          placeholder="Paste your integration code…"
          multiline
          onChange={(v) => { updateRow(record.key, { integrationCode: v }); setSaved(false); }}
        />
      ),
    },
    {
      title: (
        <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
          Notes{' '}
          <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 400, textTransform: 'none' as const }}>optional</span>
        </span>
      ),
      key: 'notes', width: 170,
      render: (_: any, record: CreativeRow) => (
        <ModalCell
          value={record.notes}
          fieldKey="notes"
          rowKey={record.key}
          label="Notes"
          placeholder="Add any notes about this creative…"
          multiline
          onChange={(v) => { updateRow(record.key, { notes: v }); setSaved(false); }}
        />
      ),
    },
    {
      title: '',
      key: 'actions', width: 44,
      render: (_: any, record: CreativeRow) => (
        <Button
          type="text" size="small" danger
          icon={<DeleteOutlined style={{ fontSize: 13 }} />}
          onClick={() => {
            setRows((prev) => prev.filter((r) => r.key !== record.key));
            setSelected((prev) => prev.filter((k) => k !== record.key));
            setSaved(false);
          }}
          style={{ padding: '0 6px', height: 26 }}
        />
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ── Header ── */}
      <header style={{
        height: 60, background: '#fff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button
            onClick={handleBack}
            style={{ height: 38, padding: '0 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, borderColor: '#e2e8f0', color: '#334155' }}
          >
            <ArrowLeftOutlined style={{ fontSize: 12 }} /> Back
          </Button>
          <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 36, height: 28, borderRadius: 7, background: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '-0.5px',
            }}>CRM</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.2px' }}>
              Billion <span style={{ color: '#4f46e5' }}>Tags</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
            <span>Creatives</span>
            <span style={{ fontSize: 10 }}>›</span>
            <span style={{ color: '#1e293b', fontWeight: 600 }}>Image Bulk Upload</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            onClick={handleCancel}
            style={{ height: 38, padding: '0 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, borderColor: '#e2e8f0', color: '#334155' }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            icon={saved ? <CheckOutlined /> : <CloudUploadOutlined />}
            onClick={handleSave}
            style={{
              height: 38, padding: '0 28px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: saved ? '#16a34a' : '#2563eb',
              borderColor: saved ? '#16a34a' : '#2563eb',
              boxShadow: saved ? '0 4px 14px rgba(22,163,74,0.3)' : '0 4px 14px rgba(37,99,235,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {saved ? `Saved (${filledCount})` : 'Save Creatives'}
          </Button>
        </div>
      </header>

      {/* ── Saved banner ── */}
      {saved && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac', padding: '10px 28px',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#15803d', fontWeight: 500,
        }}>
          <CheckOutlined style={{ color: '#16a34a' }} />
          {filledCount} creative{filledCount > 1 ? 's' : ''} saved successfully.
          Click <strong style={{ margin: '0 4px' }}>Back</strong> to return to the campaign form and submit.
        </div>
      )}

      {/* ── Page Content ── */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 28px 48px' }}>

        {/* ── Title row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                }}
              >
                <FileImageOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#0f172a',
                  letterSpacing: '-0.3px',
                }}
              >
                Bulk Upload Image Creatives
              </h1>
            </div>
            <p style={{ margin: '0 0 0 44px', fontSize: 13, color: '#64748b' }}>
              Upload image creatives for your line item
              {displayLineItemId && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    background: '#eef2ff',
                    color: '#4f46e5',
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid #c7d2fe',
                  }}
                >
                  {displayLineItemId}
                </span>
              )}
            </p>
          </div>

          {hasRows && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '8px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{rows.length}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
              </div>
              <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#4f46e5', lineHeight: 1 }}>
                  {rows.filter(r => r.mainAsset).length}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>With Asset</div>
              </div>
              <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b', lineHeight: 1 }}>
                  {rows.filter(r => !r.mainAsset).length}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Main Card ── */}
        <div style={{
          background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
        }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc',
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button
                type="primary" icon={<PlusOutlined />} onClick={handleAddCreative}
                style={{ background: '#2563eb', borderColor: '#2563eb' }}
              >
                Add Image Creative
              </Button>
              {selected.length > 0 && (
                <Button danger icon={<DeleteOutlined />} onClick={handleDeleteSelected}>
                  Delete ({selected.length})
                </Button>
              )}
            </div>
            {hasRows && (
              <span style={{ fontSize: 11.5, color: '#94a3b8', background: '#f1f5f9', padding: '3px 10px', borderRadius: 20 }}>
                {rows.length} creative{rows.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Table */}
          <div>
            <style>{`
              .creative-table .ant-table-thead > tr > th {
                background: #f8fafc !important;
                border-bottom: 1px solid #e2e8f0 !important;
                padding: 10px 12px !important;
              }
              .creative-table .ant-table-tbody > tr > td {
                padding: 10px 12px !important;
                border-bottom: 1px solid #f1f5f9 !important;
                vertical-align: middle;
              }
              .creative-table .ant-table-tbody > tr:hover > td { background: #fafbff !important; }
              .creative-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
              .creative-table .ant-table { border-radius: 0 !important; }
              .creative-table .ant-checkbox-checked .ant-checkbox-inner {
                background-color: #4f46e5 !important;
                border-color: #4f46e5 !important;
              }
            `}</style>
            <Table
              className="creative-table"
              columns={columns}
              dataSource={rows}
              rowKey="key"
              pagination={false}
              size="small"
              scroll={{ x: 1860 }}
              locale={{ emptyText: '' }}
            />
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            style={{
              margin: 20,
              border: `2px dashed ${isDragging ? '#4f46e5' : '#e2e8f0'}`,
              borderRadius: 10, padding: '36px 24px', textAlign: 'center',
              background: isDragging ? '#eef2ff' : '#fafbfc',
              transition: 'all 0.2s', cursor: 'pointer',
            }}
            onClick={() => browseRef.current?.click()}
          >
            <input
              ref={browseRef} type="file" multiple accept="image/*,text/html,.zip"
              style={{ display: 'none' }}
              onChange={(e) => handleBulkBrowse(e.target.files)}
            />
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: isDragging ? '#c7d2fe' : '#eef2ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', transition: 'all 0.2s',
            }}>
              <InboxOutlined style={{ fontSize: 22, color: isDragging ? '#4338ca' : '#4f46e5' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
              {isDragging ? 'Drop images files to upload' : 'Drag & drop your images here'}
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>or click to browse files</div>
            <Button
              type="primary" icon={<CloudUploadOutlined />} size="middle"
              onClick={(e) => { e.stopPropagation(); browseRef.current?.click(); }}
              style={{ background: '#2563eb', borderColor: '#2563eb', fontWeight: 600 }}
            >
              Browse
            </Button>
          </div>
        </div>

        {/* Footer tip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
          <InfoCircleOutlined style={{ fontSize: 12 }} />
          Click the <EditOutlined style={{ fontSize: 11 }} /> pencil icon on any cell to open the editor.
          A green/red dot on Click-through URL and Appended HTML Tag shows tracker validation status. Image metadata (dimensions, filesize) is auto-detected on upload.
        </div>
      </div>
    </div>
  );
}