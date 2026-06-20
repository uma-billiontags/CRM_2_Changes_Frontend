import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, DatePicker, Button, message as antMessage } from 'antd';
import {
  CheckOutlined, InfoCircleOutlined, CloseOutlined, PaperClipOutlined,
  FileImageOutlined, VideoCameraOutlined, FileOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Types ──────────────────────────────────────────────────────────────────
interface AttachedFile {
  id: string;
  file: File;
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const toOpts = (arr: string[]) => arr.map(s => ({ value: s, label: s }));

function getFileIcon(file: File) {
  if (file.type.startsWith('image/'))
    return <FileImageOutlined style={{ fontSize: 15, color: '#1d4ed8' }} />;
  if (file.type.startsWith('video/'))
    return <VideoCameraOutlined style={{ fontSize: 15, color: '#7c3aed' }} />;
  return <FileOutlined style={{ fontSize: 15, color: '#64748b' }} />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const BUYING_TYPE_OPTIONS = [
  'Programmatic (DV360)', 'Direct', 'Programmatic Guaranteed',
  'Preferred Deal', 'Open Auction',
];

const labelStyle: React.CSSProperties = { fontSize: 12.5, color: '#64748b', fontWeight: 500 };
const fieldRequired = <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>;

// ── Main Component ───────────────────────────────────────────────────────────
export default function Bulk_Campaign_Create() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const clientName = localStorage.getItem('client_name') ?? '';
  const clientId = localStorage.getItem('client_id') ?? '';

  // Campaign fields
  const [advertiser, setAdvertiser] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [clientCampaignId, setClientCampaignId] = useState('');
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [buyingType, setBuyingType] = useState<string[]>([]);
  const [objective, setObjective] = useState('');

  // ── Single line-item paragraph + attachments (no add/remove concept) ──
  const [lineMessage, setLineMessage] = useState('');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;
    const newAttachments: AttachedFile[] = incoming.map(f => ({ id: genId(), file: f }));
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (attachId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachId));
  };

  const imageCount = attachments.filter(a => a.file.type.startsWith('image/')).length;
  const videoCount = attachments.filter(a => a.file.type.startsWith('video/')).length;

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    if (!advertiser.trim()) { antMessage.error('Advertiser (Brand) is required.'); return false; }
    if (!campaignName.trim()) { antMessage.error('Campaign Name is required.'); return false; }
    if (!campaignType) { antMessage.error('Campaign Type is required.'); return false; }
    if (!startDate) { antMessage.error('Campaign Start Date is required.'); return false; }
    if (!endDate) { antMessage.error('Campaign End Date is required.'); return false; }
    if (!buyingType.length) { antMessage.error('Buying Type is required.'); return false; }
    if (!objective) { antMessage.error('Campaign Objective is required.'); return false; }
    if (!lineMessage.trim()) { antMessage.error('Please describe the line item details.'); return false; }
    return true;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);

    const fd = new FormData();
    fd.append('client', clientId);
    fd.append('client_name', clientName);
    fd.append('advertiser', advertiser);
    fd.append('campaign_name', campaignName);
    fd.append('campaign_type', campaignType);
    fd.append('buying_type', buyingType.join(', '));
    fd.append('objective', objective);
    fd.append('start_date', startDate);
    fd.append('end_date', endDate);
    if (websiteUrl) fd.append('website_url', websiteUrl);
    if (clientCampaignId) fd.append('client_campaign_id', clientCampaignId);
    if (purchaseOrderId) fd.append('purchase_order_id', purchaseOrderId);
    fd.append('message', lineMessage);
    fd.append('attachment_count', String(attachments.length));
    attachments.forEach((att, idx) => {
      fd.append(`attachment_${idx}`, att.file, att.file.name);
    });

    try {
      const res = await fetch(`${BASE_URL}/create_bulk_campaign/`, {
        method: 'POST',
        body: fd,
        headers: { 'ngrok-skip-browser-warning': '1' },
      });
      if (res.ok) {
        antMessage.success('Campaign request submitted successfully!');
        navigate('/campaign_choice');
      } else {
        const text = await res.text();
        antMessage.error(text || `Submission failed (status ${res.status})`);
      }
    } catch (err) {
      antMessage.error(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAttachments = attachments.length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 100 }}>

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
          Bulk Campaign Request
        </h1>
        <p style={{ fontSize: 11, color: '#64748B', marginTop: 4, letterSpacing: '0.04em', fontWeight: 500 }}>
          FILL IN CAMPAIGN DETAILS — ADMIN WILL SET UP THE FULL CAMPAIGN FROM YOUR REQUEST
        </p>
      </div>

      {/* How it works banner */}
      <div style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)',
        border: '1px solid #c7d2fe', borderRadius: 12,
        padding: '14px 18px', marginBottom: 24,
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: '#4f46e5',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <InfoCircleOutlined style={{ fontSize: 16, color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#312e81', marginBottom: 3 }}>
            How this works
          </div>
          <div style={{ fontSize: 12.5, color: '#4338ca', lineHeight: 1.65 }}>
            Fill in your campaign details above, then write one message describing all the line
            items you need (like an email to your campaign manager) and attach any creative files.
            Your admin will read your message and set up the full campaign.
          </div>
        </div>
      </div>

      {/* ── Campaign Details ── */}
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
        padding: '24px 28px', marginBottom: 20,
        boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
      }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: '#4f46e5',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          📋 Campaign Details
        </div>

        <Form layout="vertical">

          {/* Company name (read-only) */}
          <Form.Item label={<span style={labelStyle}>Company Name</span>} style={{ marginBottom: 16 }}>
            <Input
              value={clientName || 'Loading…'}
              disabled
              style={{ height: 38, fontWeight: 600, background: '#f8fafc' }}
            />
          </Form.Item>

          {/* Advertiser + Website */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label={<span style={labelStyle}>Advertiser (Brand){fieldRequired}</span>} style={{ marginBottom: 16 }}>
              <Input
                placeholder="Enter advertiser name…"
                value={advertiser}
                onChange={e => setAdvertiser(e.target.value)}
                style={{ height: 38 }}
              />
            </Form.Item>
            <Form.Item
              label={<span style={labelStyle}>Website URL <span style={{ fontSize: 11, color: '#94a3b8' }}>(optional)</span></span>}
              style={{ marginBottom: 16 }}
            >
              <Input
                placeholder="https://"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                style={{ height: 38 }}
              />
            </Form.Item>
          </div>

          {/* Client Campaign ID + PO ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              label={<span style={labelStyle}>Client Campaign ID <span style={{ fontSize: 11, color: '#94a3b8' }}>(optional)</span></span>}
              style={{ marginBottom: 16 }}
            >
              <Input
                placeholder="Enter client campaign ID…"
                value={clientCampaignId}
                onChange={e => setClientCampaignId(e.target.value)}
                style={{ height: 38 }}
              />
            </Form.Item>
            <Form.Item
              label={<span style={labelStyle}>Purchase Order ID <span style={{ fontSize: 11, color: '#94a3b8' }}>(optional)</span></span>}
              style={{ marginBottom: 16 }}
            >
              <Input
                placeholder="Enter purchase order ID…"
                value={purchaseOrderId}
                onChange={e => setPurchaseOrderId(e.target.value)}
                style={{ height: 38 }}
              />
            </Form.Item>
          </div>

          {/* Campaign Name + Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label={<span style={labelStyle}>Campaign Name{fieldRequired}</span>} style={{ marginBottom: 16 }}>
              <Input
                placeholder="e.g. Summer Awareness 2025"
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                style={{ height: 38 }}
              />
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>Campaign Type{fieldRequired}</span>} style={{ marginBottom: 16 }}>
              <Select
                value={campaignType || undefined}
                onChange={setCampaignType}
                placeholder="Select type…"
                style={{ width: '100%', height: 38 }}
                options={toOpts(['Brand Awareness', 'Performance', 'Retargeting', 'Prospecting', 'Lead Generation'])}
              />
            </Form.Item>
          </div>

          {/* Start + End Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label={<span style={labelStyle}>Campaign Start Date{fieldRequired}</span>} style={{ marginBottom: 16 }}>
              <DatePicker
                style={{ width: '100%', height: 38 }}
                value={startDate ? dayjs(startDate) : null}
                onChange={(_, ds) => setStartDate(typeof ds === 'string' ? ds : '')}
              />
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>Campaign End Date{fieldRequired}</span>} style={{ marginBottom: 16 }}>
              <DatePicker
                style={{ width: '100%', height: 38 }}
                value={endDate ? dayjs(endDate) : null}
                onChange={(_, ds) => setEndDate(typeof ds === 'string' ? ds : '')}
                disabledDate={current => startDate ? current.isBefore(dayjs(startDate), 'day') : false}
              />
            </Form.Item>
          </div>

          {/* Buying Type + Objective */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label={<span style={labelStyle}>Buying Type{fieldRequired}</span>} style={{ marginBottom: 0 }}>
              <Select
                mode="multiple"
                value={buyingType}
                onChange={(vals: string[]) => setBuyingType(vals)}
                placeholder="Select buying type…"
                style={{ width: '100%' }}
                maxTagCount="responsive"
                menuItemSelectedIcon={null}
                optionRender={(option) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox" readOnly
                      checked={buyingType.includes(option.value as string)}
                      style={{ accentColor: '#4f46e5', width: 14, height: 14, cursor: 'pointer' }}
                    />
                    <span>{option.label}</span>
                  </div>
                )}
                options={BUYING_TYPE_OPTIONS.map(o => ({ value: o, label: o }))}
              />
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>Campaign Objective{fieldRequired}</span>} style={{ marginBottom: 0 }}>
              <Select
                value={objective || undefined}
                onChange={setObjective}
                placeholder="Select objective…"
                style={{ width: '100%', height: 38 }}
                options={toOpts(['Increase Brand Awareness', 'Drive Website Traffic', 'Generate Leads', 'Boost Sales', 'App Installs'])}
              />
            </Form.Item>
          </div>

        </Form>
      </div>

      {/* ── Line Item Details (single paragraph — no add/remove) ── */}
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
        padding: '24px 28px', marginBottom: 20,
        boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
      }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: '#4f46e5',
          marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ✉️ Line Item Details
        </div>
        <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
          Describe all the line items you need in one message — just like an email. Include
          details like name, format, dates, targeting, impressions, etc. for each one.
          Then attach your creative files (images &amp; videos) below.
        </p>

        <Form layout="vertical">
          <Form.Item
            label={<span style={labelStyle}>Line Item Details {fieldRequired}</span>}
            style={{ marginBottom: 0 }}
          >
            <TextArea
              placeholder={`Describe all line items like you're writing an email to your campaign manager...\n\nExample:\nHi, please set up the following line items:\n\n1) Mumbai Display 18–34\n- Ad Format: Banner (Desktop + Mobile)\n- Dates: 1 Jul 2025 to 31 Jul 2025\n- Impressions: 5,00,000 | Units: CPM\n- Age: 18–34 | Gender: Male & Female\n- Geo: India > Maharashtra > Mumbai\n- Platform: Display, Mobile\n- Frequency Cap: 3/user | Brand Safety: Standard\n\n2) Delhi Video 25–44\n- Ad Format: Video (CTV)\n- ...\n\nCreatives attached below.`}
              value={lineMessage}
              onChange={e => setLineMessage(e.target.value)}
              rows={12}
              style={{
                fontSize: 13.5, lineHeight: 1.75,
                resize: 'vertical', fontFamily: 'inherit',
                borderRadius: 8, color: '#1e293b',
              }}
            />
          </Form.Item>
        </Form>

        {/* Attachments area */}
        <div style={{
          marginTop: 14, border: '1px solid #e2e8f0',
          borderRadius: 10, overflow: 'hidden',
        }}>
          {/* Attached files list */}
          {attachments.length > 0 && (
            <div style={{
              borderBottom: '1px solid #f1f5f9',
              padding: '10px 14px',
              display: 'flex', flexWrap: 'wrap', gap: 8,
            }}>
              {attachments.map(att => (
                <div key={att.id} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '5px 10px 5px 8px',
                  background: att.file.type.startsWith('image/') ? '#eff6ff'
                    : att.file.type.startsWith('video/') ? '#f5f3ff' : '#f8fafc',
                  border: `1px solid ${att.file.type.startsWith('image/') ? '#bfdbfe'
                    : att.file.type.startsWith('video/') ? '#ddd6fe' : '#e2e8f0'}`,
                  borderRadius: 7, maxWidth: 220,
                }}>
                  {/* Thumbnail for images */}
                  {att.file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(att.file)}
                      alt={att.file.name}
                      style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                    />
                  ) : getFileIcon(att.file)}
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 500,
                      color: att.file.type.startsWith('image/') ? '#1d4ed8'
                        : att.file.type.startsWith('video/') ? '#6d28d9' : '#374151',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{att.file.name}</div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{formatBytes(att.file.size)}</div>
                  </div>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94a3b8', padding: 2, flexShrink: 0,
                      display: 'flex', alignItems: 'center',
                    }}
                    title="Remove"
                  >
                    <CloseOutlined style={{ fontSize: 10 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Attach button row */}
          <div style={{
            padding: '10px 14px', background: '#f8fafc',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFiles}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 34, padding: '0 14px',
                border: '1px solid #cbd5e1', borderRadius: 7,
                background: '#fff', color: '#475569',
                fontWeight: 500, fontSize: 12.5, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#4f46e5';
                (e.currentTarget as HTMLButtonElement).style.color = '#4f46e5';
                (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#cbd5e1';
                (e.currentTarget as HTMLButtonElement).style.color = '#475569';
                (e.currentTarget as HTMLButtonElement).style.background = '#fff';
              }}
            >
              <PaperClipOutlined style={{ fontSize: 13 }} />
              Attach Files
            </button>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
              Images &amp; videos accepted · Multiple files allowed
            </span>
            {attachments.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>
                {imageCount > 0 && `${imageCount} image${imageCount > 1 ? 's' : ''}`}
                {imageCount > 0 && videoCount > 0 && ' · '}
                {videoCount > 0 && `${videoCount} video${videoCount > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* ── Bottom Action Bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid #e2e8f0',
        padding: '14px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 100, boxShadow: '0 -2px 12px rgba(15,23,42,0.07)',
      }}>
        <Button
          onClick={() => navigate('/campaign_choice')}
          style={{ height: 40, paddingLeft: 20, paddingRight: 20, borderRadius: 8 }}
        >
          ← Back
        </Button>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {totalAttachments > 0 && `${totalAttachments} file${totalAttachments > 1 ? 's' : ''} attached`}
          </span>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={submitting}
            onClick={handleSubmit}
            style={{
              height: 40, paddingLeft: 24, paddingRight: 24,
              borderRadius: 8, background: '#2563eb', borderColor: '#2563eb',
              fontWeight: 600, fontSize: 13,
            }}
          >
            {submitting ? 'Saving' : 'Save'}
          </Button>
        </div>
      </div>

    </div>
  );
}