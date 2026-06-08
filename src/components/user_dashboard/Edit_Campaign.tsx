import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Form, Input, Select, Button, DatePicker, InputNumber, message, Spin
} from 'antd';
import {
  ArrowRightOutlined, CheckOutlined,
  PlusOutlined, RightOutlined,
  CloseOutlined, InfoCircleOutlined,
  EnvironmentOutlined, DeleteOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import '../styles/Campaign_Create.css'; // reuse same styles
import Sidebar from '../shared/Sidebar';
import type { LineItem, GeoLocation } from '../types/campaign.form.types';

dayjs.extend(isBetween);

const { TextArea } = Input;

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ─── Constants (same as Campaign_Create) ──────────────────────────────────────

const ETHNICITY_OPTIONS = [
  'General', 'Asian', 'South Asian', 'African American',
  'Hispanic / Latino', 'Middle Eastern', 'Caucasian', 'Other',
];

const AD_FORMAT_OPTIONS = [
  { value: 'banner', label: 'Banner' },
  { value: 'video', label: 'Video' },
  { value: 'youtube', label: 'Youtube' },
  { value: 'intertitial', label: 'Intertitial' },
];

const UNITS_OPTIONS = ['CTR', 'CPC', 'CPM'];
const toOpts = (arr: string[]) => arr.map(s => ({ value: s, label: s }));

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_MID = '#BFDBFE';
const SLATE = '#0F172A';
const SLATE_300 = '#CBD5E1';
const SLATE_500 = '#64748B';
const WHITE = '#FFFFFF';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function parseGeo(val: any): GeoLocation[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Map API line item → form LineItem shape
function apiLineItemToForm(li: any): LineItem {
  return {
    id: li.line_item_id ?? li.id ?? '',
    lineItemName: li.line_item_name ?? '',
    ethnicity: li.ethnicity,
    startDate: li.start_date ?? '',
    endDate: li.end_date ?? '',
    adFormat: li.ad_format ? (Array.isArray(li.ad_format) ? li.ad_format[0] : li.ad_format) : '',  // ← string, not array
    impressions: li.impressions ? String(li.impressions) : '',
    units: li.units ? (Array.isArray(li.units) ? li.units[0] : li.units) : '',  // ← string, not array
    creatives: [],
    ctr: li.ctr ? String(li.ctr) : '',
    viewability: li.viewability ? String(li.viewability) : '',
    vcr: li.vcr ? String(li.vcr) : '',
    // ── missing fields ──
    ctrNotes: '',
    unitCost: '',
    adSubFormatOpen: false,
    adSubFormat: li.ad_sub_format ?? '',
    rate: li.rate ? String(li.rate) : '',
    

  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoBox({ variant = 'blue', children }: { variant?: 'blue' | 'amber'; children: React.ReactNode }) {
  return (
    <div className={`cc-info-box ${variant}`}>
      <InfoCircleOutlined style={{ color: variant === 'blue' ? BLUE : '#d97706', flexShrink: 0, marginTop: 1 }} />
      <p>{children}</p>
    </div>
  );
}

function GeoTargeting({ locations, onAdd, onRemove }: {
  locations: GeoLocation[];
  onAdd: (l: GeoLocation) => void;
  onRemove: (i: number) => void;
}) {
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [range, setRange] = useState('');

  const canAdd = !!(country || state || city || zipcode.trim());

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({ country, state, city, zipcode, range } as any);
    setCountry(''); setState(''); setCity(''); setZipcode(''); setRange('');
  };

  const fmt = (l: any) => [l.country, l.state, l.city, l.zipcode, l.range].filter(Boolean).join(' › ');

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: SLATE_500, marginBottom: 4 }}>Country</div>
          <Input placeholder="e.g. India" value={country} onChange={e => setCountry(e.target.value)} style={{ height: 36 }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: SLATE_500, marginBottom: 4 }}>State</div>
          <Input placeholder="e.g. Karnataka" value={state} onChange={e => setState(e.target.value)} style={{ height: 36 }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: SLATE_500, marginBottom: 4 }}>City</div>
          <Input placeholder="e.g. Bengaluru" value={city} onChange={e => setCity(e.target.value)} style={{ height: 36 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 12, color: SLATE_500, marginBottom: 4 }}>Zip Code</div>
          <Input placeholder="e.g. 560001" value={zipcode} onChange={e => setZipcode(e.target.value)} style={{ height: 36 }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: SLATE_500, marginBottom: 4 }}>Range</div>
          <Input placeholder="e.g. 10 km" value={range} onChange={e => setRange(e.target.value)} style={{ height: 36, width: 100 }} />
        </div>
        <Button type="primary" disabled={!canAdd} onClick={handleAdd} icon={<PlusOutlined />} style={{ height: 36 }}>Add</Button>
      </div>
      {locations.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {locations.map((loc: any, idx: number) => (
            <span key={idx} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: BLUE_LIGHT, border: `1px solid ${BLUE_MID}`,
              borderRadius: 20, padding: '3px 10px', fontSize: 12, color: BLUE,
            }}>
              <EnvironmentOutlined style={{ fontSize: 10 }} />
              {fmt(loc)}
              <button onClick={() => onRemove(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BLUE, padding: 0, display: 'flex' }}>
                <CloseOutlined style={{ fontSize: 10 }} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: SLATE_500, fontStyle: 'italic' }}>No geo targets added yet.</div>
      )}
    </div>
  );
}

// ─── Line Item Card ───────────────────────────────────────────────────────────

function LineItemCard({ item, index, campaignStart, campaignEnd, onChange, onRemove, canRemove }: {
  item: LineItem;
  index: number;
  campaignStart: string;
  campaignEnd: string;
  onChange: (id: string, field: keyof LineItem, value: any) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  const [dateError, setDateError] = useState('');

  function validateDates(start: string, end: string): string {
    if (!campaignStart || !campaignEnd) return '';
    const cStart = dayjs(campaignStart), cEnd = dayjs(campaignEnd);
    if (start && (dayjs(start).isBefore(cStart, 'day') || dayjs(start).isAfter(cEnd, 'day')))
      return `Start date must be within campaign range.`;
    if (end && (dayjs(end).isBefore(cStart, 'day') || dayjs(end).isAfter(cEnd, 'day')))
      return `End date must be within campaign range.`;
    if (start && end && dayjs(end).isBefore(dayjs(start), 'day'))
      return 'End date must be after start date.';
    return '';
  }

  function disabledDate(current: Dayjs) {
    if (!campaignStart || !campaignEnd) return false;
    return current.isBefore(dayjs(campaignStart), 'day') || current.isAfter(dayjs(campaignEnd), 'day');
  }

  return (
    <div style={{ border: '0.5px solid #e2e8f0', borderRadius: 12, background: WHITE, padding: '20px 24px', marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#4f46e5', color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
            {index + 1}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: SLATE }}>
            {item.lineItemName || `Line Item ${index + 1}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', background: '#EDE9FE', padding: '3px 8px', borderRadius: 6, fontFamily: 'monospace' }}>
            {item.id}
          </span>
          {canRemove && (
            <button onClick={() => onRemove(item.id)} style={{ background: 'none', border: '0.5px solid #fca5a5', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#ef4444', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <DeleteOutlined style={{ fontSize: 12 }} /> Remove
            </button>
          )}
        </div>
      </div>

      <Form layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: SLATE_500 }}>Line Item Name <span style={{ color: '#ef4444' }}>*</span></span>} style={{ marginBottom: 14 }}>
            <Input value={item.lineItemName} onChange={e => onChange(item.id, 'lineItemName', e.target.value)} style={{ height: 38 }} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: SLATE_500 }}>Ethnicity</span>} style={{ marginBottom: 14 }}>
            <Select
              value={item.ethnicity || undefined}                             // ← string, not array
              onChange={(val: string) => onChange(item.id, 'ethnicity', val)}
              placeholder="Select ethnicity…" style={{ width: '100%' }}
              maxTagCount="responsive" menuItemSelectedIcon={null}
              options={ETHNICITY_OPTIONS.map(e => ({ value: e, label: e }))}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item
            label={<span style={{ fontSize: 12.5, color: SLATE_500 }}>Start Date <span style={{ color: '#ef4444' }}>*</span></span>}
            validateStatus={dateError ? 'error' : ''} style={{ marginBottom: 14 }}
          >
            <DatePicker
              style={{ width: '100%', height: 38 }}
              value={item.startDate ? dayjs(item.startDate) : null}
              disabledDate={disabledDate}
              onChange={(_, ds) => {
                const val = typeof ds === 'string' ? ds : '';
                onChange(item.id, 'startDate', val);
                setDateError(validateDates(val, item.endDate));
              }}
            />
          </Form.Item>
          <Form.Item
            label={<span style={{ fontSize: 12.5, color: SLATE_500 }}>End Date <span style={{ color: '#ef4444' }}>*</span></span>}
            validateStatus={dateError ? 'error' : ''} style={{ marginBottom: 14 }}
          >
            <DatePicker
              style={{ width: '100%', height: 38 }}
              value={item.endDate ? dayjs(item.endDate) : null}
              disabledDate={disabledDate}
              onChange={(_, ds) => {
                const val = typeof ds === 'string' ? ds : '';
                onChange(item.id, 'endDate', val);
                setDateError(validateDates(item.startDate, val));
              }}
            />
          </Form.Item>
        </div>
        {dateError && (
          <div style={{ background: '#fef2f2', border: '0.5px solid #fca5a5', borderRadius: 6, padding: '7px 12px', marginBottom: 14, fontSize: 12.5, color: '#dc2626' }}>
            ⚠ {dateError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: SLATE_500 }}>Ad Format <span style={{ color: '#ef4444' }}>*</span></span>} style={{ marginBottom: 14 }}>
            <Select
              value={item.adFormat || undefined}                          // ← string, not array
              onChange={(val: string) => onChange(item.id, 'adFormat', val ?? '')}   // ← single value
              placeholder="Select format…" style={{ width: '100%', height: 38 }}
              options={AD_FORMAT_OPTIONS}
            />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: SLATE_500 }}>Impressions</span>} style={{ marginBottom: 14 }}>
            <Input
              value={item.impressions}
              onChange={e => onChange(item.id, 'impressions', e.target.value.replace(/[^0-9]/g, ''))}
              suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>impr.</span>}
              style={{ height: 38 }}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: SLATE_500 }}>CTR</span>} style={{ marginBottom: 14 }}>
            <Input value={item.ctr} onChange={e => onChange(item.id, 'ctr', e.target.value.replace(/[^0-9.]/g, ''))} suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>%</span>} style={{ height: 38 }} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: SLATE_500 }}>Viewability</span>} style={{ marginBottom: 14 }}>
            <Input value={item.viewability} onChange={e => onChange(item.id, 'viewability', e.target.value.replace(/[^0-9.]/g, ''))} suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>%</span>} style={{ height: 38 }} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: SLATE_500 }}>VCR</span>} style={{ marginBottom: 14 }}>
            <Input value={item.vcr} onChange={e => onChange(item.id, 'vcr', e.target.value.replace(/[^0-9.]/g, ''))} suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>%</span>} style={{ height: 38 }} />
          </Form.Item>
        </div>

        <Form.Item label={<span style={{ fontSize: 12.5, color: SLATE_500 }}>Units</span>} style={{ marginBottom: 0 }}>
          <Select
            value={item.units || undefined}                             // ← string, not array
            onChange={(val: string) => onChange(item.id, 'units', val ?? '')}      // ← single value
            placeholder="Select units…" style={{ width: '100%', height: 38 }}
            options={UNITS_OPTIONS.map(u => ({ value: u, label: u }))}
          />
        </Form.Item>
      </Form>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Edit_Campaign() {
  const { campaign_id } = useParams<{ campaign_id: string }>();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? 64 : 240;

  // Loading / error state
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeStep, setActiveStep] = useState(1);

  // ── Step 1 ──
  const [client, setClient] = useState('');
  const [clientId, setClientId] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // ── Step 2 ──
  const [campaignName, setCampaignName] = useState('');
  const [clientCampaignId, setClientCampaignId] = useState('');
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [buyingType, setBuyingType] = useState<string[]>([]);
  const [objective, setObjective] = useState('');
  const [notes, setNotes] = useState('');

  // ── Step 3 ──
  const [age, setAge] = useState<string[]>([]);
  const [gender, setGender] = useState<string[]>([]);
  const [geoLocations, setGeoLocations] = useState<GeoLocation[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [freqCap, setFreqCap] = useState('');
  const [brandSafety, setBrandSafety] = useState('');
  const [viewability, setViewability] = useState('');

  // ── Step 4 ──
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // ─── Fetch existing campaign and prefill ────────────────────────────────────
  useEffect(() => {
    if (!campaign_id) return;
    setFetching(true);
    fetch(`${BASE_URL}/get_campaign_by_id/${campaign_id}/`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
        return r.json();
      })
      .then(data => {
        const c = data?.campaign ?? data;

        // Step 1
        setClient(c.client_name ?? '');
        setClientId(String(c.client ?? ''));
        setAdvertiser(c.advertiser ?? '');
        setWebsiteUrl(c.website_url ?? '');

        // Step 2
        setCampaignName(c.campaign_name ?? '');
        setClientCampaignId(c.client_campaign_ID ?? '');
        setPurchaseOrderId(c.purchase_order_ID ?? '');
        setCampaignType(c.campaign_type ?? '');
        setStartDate(c.start_date ?? '');
        setEndDate(c.end_date ?? '');
        setBuyingType(parseArray(c.buying_type));
        setObjective(c.objective ?? '');
        setNotes(c.notes ?? '');

        // Step 3
        setAge(parseArray(c.age));
        setGender(parseArray(c.gender));
        setGeoLocations(parseGeo(c.geo_targeting));
        setPlatforms(parseArray(c.platforms));
        setFreqCap(c.frequency_cap ? String(c.frequency_cap) : '');
        setBrandSafety(c.brand_safety ?? '');
        setViewability(c.viewability_goal ? String(c.viewability_goal) : '');

        // Step 4 — line items
        const lis = Array.isArray(c.line_items) ? c.line_items.map(apiLineItemToForm) : [];
        setLineItems(lis.length > 0 ? lis : []);
      })
      .catch(err => setFetchError(err.message))
      .finally(() => setFetching(false));
  }, [campaign_id]);

  // ─── Step navigation ────────────────────────────────────────────────────────

  const STEPS = [
    { n: 1, label: 'Client & Advertiser', sub: 'Basic identity' },
    { n: 2, label: 'Campaign Details', sub: 'Core campaign info' },
    { n: 3, label: 'Targeting & Settings', sub: 'Audience & platforms' },
    { n: 4, label: 'Line Items', sub: 'Edit line items' },
    { n: 5, label: 'Review & Update', sub: 'Confirm changes' },
  ];

  const handleNextStep = () => {
    if (activeStep === 4) {
      const incomplete = lineItems.filter(li => !li.lineItemName.trim() || !li.startDate || !li.endDate || li.adFormat.length === 0);
      if (incomplete.length > 0) {
        message.error('Please fill all required fields (Name, Start Date, End Date, Ad Format) for all line items.');
        return;
      }
    }
    setActiveStep(s => s + 1);
  };

  // ─── Submit (PATCH to update_campaign) ──────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMsg('');

    const fd = new FormData();

    fd.append('client', clientId);
    fd.append('client_name', client);
    fd.append('advertiser', advertiser);
    fd.append('campaign_name', campaignName);
    fd.append('campaign_type', campaignType);
    fd.append('buying_type', buyingType.join(', '));
    fd.append('objective', objective);
    fd.append('age', age.join(', '));
    fd.append('gender', gender.join(', '));
    fd.append('geo_targeting', JSON.stringify(
      geoLocations.map((loc: any) => ({
        country: loc.country || '',
        state: loc.state || '',
        city: loc.city || '',
        zipcode: loc.zipcode || '',
        range: loc.range || '',
      }))
    ));
    fd.append('platforms', platforms.join(', '));
    fd.append('brand_safety', brandSafety);
    fd.append('start_date', startDate);
    fd.append('end_date', endDate);
    if (websiteUrl) fd.append('website_url', websiteUrl);
    if (clientCampaignId) fd.append('client_campaign_ID', clientCampaignId);
    if (purchaseOrderId) fd.append('purchase_order_ID', purchaseOrderId);
    if (notes) fd.append('notes', notes);
    if (freqCap) fd.append('frequency_cap', freqCap);
    if (viewability) fd.append('viewability_goal', viewability);

    fd.append('line_items', JSON.stringify(
      lineItems.map(li => ({
        line_item_id: li.id,
        lineItemName: li.lineItemName,
        ethnicity: li.ethnicity,
        startDate: li.startDate,
        endDate: li.endDate,
        adFormat: li.adFormat,
        impressions: li.impressions,
        units: li.units,
        ctr: li.ctr,
        viewability: li.viewability,
        vcr: li.vcr,
      }))
    ));

    const userId   = localStorage.getItem('user_id');
const userSource = localStorage.getItem('user_source'); // "team" or "user"

if (userSource === 'team') {
  // logged-in user is a team member → send team_id
  fd.append('team_id', userId ?? '');
} else {
  // logged-in user is a client/admin → send user_id
  fd.append('user_id', userId ?? '');
}

    try {
      const res = await fetch(`${BASE_URL}/update_campaign/${campaign_id}/`, {
        method: 'PUT',  // or 'PUT' — check what your backend expects
        body: fd,
        headers: { 'ngrok-skip-browser-warning': '1' },
      });

      if (res.ok) {
        setSubmitStatus('success');
        message.success('Campaign updated successfully!');
        setTimeout(() => navigate(`/campaign/${campaign_id}`), 1500);
      } else {
        const text = await res.text();
        setSubmitStatus('error');
        setErrorMsg(text || `Server error: ${res.status}`);
      }
    } catch (err: unknown) {
      setSubmitStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Line Item handlers ──────────────────────────────────────────────────────

  function handleLineItemChange(id: string, field: keyof LineItem, value: any) {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  function handleLineItemRemove(id: string) {
    setLineItems(prev => prev.filter(item => item.id !== id));
  }

  const durationDays = startDate && endDate ? dayjs(endDate).diff(dayjs(startDate), 'day') : 0;

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (fetching) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading campaign data…" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: 40, color: '#dc2626', fontSize: 14 }}>
        Failed to load campaign: {fetchError}
      </div>
    );
  }

  return (
    <div className="cc-root">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div className="cc-main" style={{ marginLeft: sideWidth }}>

        {/* Topbar */}
        <header className="cc-topbar">
          <div className="cc-topbar-breadcrumb">
            <Link to="/user_campaigns" style={{ color: SLATE_500, textDecoration: 'none' }}>Campaigns</Link>
            <RightOutlined style={{ fontSize: 13 }} />
            <span
              onClick={() => navigate(`/campaign/${campaign_id}`)}
              style={{ color: SLATE_500, cursor: 'pointer' }}
            >
              {campaign_id}
            </span>
            <RightOutlined style={{ fontSize: 13 }} />
            <span style={{ color: SLATE, fontWeight: 600 }}>Edit Campaign</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/campaign/${campaign_id}`)}
              style={{ border: `1px solid ${SLATE_300}`, color: SLATE_500 }}
            >
              Back to Campaign
            </Button>
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          <div className="cc-page-header">
            <h1 className="cc-page-title">Edit Campaign</h1>
            <p className="cc-page-sub">Update the campaign details below — <strong>{campaign_id}</strong></p>
          </div>

          {submitStatus === 'success' && (
            <div className="cc-banner cc-banner-success">✅ Campaign updated successfully! Redirecting…</div>
          )}
          {submitStatus === 'error' && (
            <div className="cc-banner cc-banner-error">❌ Update failed: {errorMsg}</div>
          )}

          {/* Stepper */}
          <div className="cc-stepper-wrap">
            <div className="cc-stepper">
              {STEPS.map((s, i) => {
                const isActive = s.n === activeStep;
                const isDone = s.n < activeStep;
                return (
                  <React.Fragment key={s.n}>
                    <div
                      className={`cc-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                      onClick={() => isDone && setActiveStep(s.n)}
                    >
                      <div className={`cc-step-circle ${isActive ? 'is-active' : isDone ? 'is-done' : 'inactive'}`}>
                        {isDone ? <CheckOutlined style={{ fontSize: 13 }} /> : s.n}
                      </div>
                      <div>
                        <div className={`cc-step-label ${isActive ? 'active' : isDone ? 'done' : ''}`}>{s.label}</div>
                        <div className={`cc-step-sub ${isActive ? 'active' : ''}`}>{s.sub}</div>
                      </div>
                    </div>
                    {i < STEPS.length - 1 && <div className={`cc-step-connector ${isDone ? 'done' : ''}`} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="cc-content-wrap">
            <div className="cc-card">
              <div className="cc-card-header">
                <div className="cc-card-step-badge">{activeStep}</div>
                <div>
                  <div className="cc-card-title">{STEPS[activeStep - 1].label}</div>
                  <div className="cc-card-sub">{STEPS[activeStep - 1].sub}</div>
                </div>
                <div className="cc-card-step-count">Step {activeStep} of {STEPS.length}</div>
              </div>

              <div className="cc-card-body">

                {/* ── STEP 1: Client & Advertiser ── */}
                {activeStep === 1 && (
                  <div className="cc-form-section-sm">
                    <Form layout="vertical" className="cc-form">
                      <Form.Item label="Company Name" required>
                        <Input value={client} disabled style={{ fontWeight: 600 }} />
                      </Form.Item>
                      <Form.Item label="Advertiser (Brand)" required>
                        <Input placeholder="Enter advertiser name…" value={advertiser} onChange={e => setAdvertiser(e.target.value)} style={{ width: '100%', height: 38 }} />
                      </Form.Item>
                      <InfoBox variant="blue">
                        Changing the advertiser will affect all reports mapped to this campaign.
                      </InfoBox>
                      <Form.Item label="Website URL">
                        <Input placeholder="https://" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} style={{ height: 38 }} />
                      </Form.Item>
                    </Form>
                  </div>
                )}

                {/* ── STEP 2: Campaign Details ── */}
                {activeStep === 2 && (
                  <div className="cc-form-section-sm">
                    <Form layout="vertical" className="cc-form">
                      <div style={{ marginBottom: 16 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: SLATE_500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Campaign ID: </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: BLUE, fontFamily: 'monospace' }}>{campaign_id}</span>
                      </div>
                      <div className="cc-row-grid">
                        <Form.Item label="Client Campaign ID">
                          <Input value={clientCampaignId} onChange={e => setClientCampaignId(e.target.value)} style={{ height: 38 }} />
                        </Form.Item>
                        <Form.Item label="Purchase Order ID">
                          <Input value={purchaseOrderId} onChange={e => setPurchaseOrderId(e.target.value)} style={{ height: 38 }} />
                        </Form.Item>
                        <Form.Item label="Campaign Name" required>
                          <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} style={{ height: 38 }} />
                        </Form.Item>
                        <Form.Item label="Campaign Type" required>
                          <Select
                            value={campaignType || undefined}
                            onChange={setCampaignType}
                            placeholder="Select type…"
                            options={toOpts(['Brand Awareness', 'Performance', 'Retargeting', 'Prospecting', 'Lead Generation'])}
                            style={{ width: '100%', height: 38 }}
                          />
                        </Form.Item>
                        <Form.Item label="Campaign Start Date" required>
                          <DatePicker
                            style={{ width: '100%', height: 38 }}
                            value={startDate ? dayjs(startDate) : null}
                            onChange={(_, ds) => setStartDate(typeof ds === 'string' ? ds : '')}
                          />
                        </Form.Item>
                        <Form.Item label="Campaign End Date" required>
                          <DatePicker
                            style={{ width: '100%', height: 38 }}
                            value={endDate ? dayjs(endDate) : null}
                            onChange={(_, ds) => setEndDate(typeof ds === 'string' ? ds : '')}
                          />
                        </Form.Item>
                        <Form.Item label="Buying Type" required>
                          <Select
                            mode="multiple" value={buyingType}
                            onChange={(vals: string[]) => setBuyingType(vals)}
                            placeholder="Select buying type…"
                            style={{ width: '100%' }} maxTagCount="responsive"
                            options={[
                              { value: 'Programmatic (DV360)', label: 'Programmatic (DV360)' },
                              { value: 'Direct', label: 'Direct' },
                              { value: 'Programmatic Guaranteed', label: 'Programmatic Guaranteed' },
                              { value: 'Preferred Deal', label: 'Preferred Deal' },
                              { value: 'Open Auction', label: 'Open Auction' },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item label="Campaign Objective" required>
                          <Select
                            value={objective || undefined}
                            onChange={setObjective}
                            placeholder="Select objective…"
                            options={toOpts(['Increase Brand Awareness', 'Drive Website Traffic', 'Generate Leads', 'Boost Sales', 'App Installs'])}
                            style={{ width: '100%', height: 38 }}
                          />
                        </Form.Item>
                      </div>
                      <Form.Item label="Notes">
                        <TextArea value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
                      </Form.Item>
                    </Form>
                  </div>
                )}

                {/* ── STEP 3: Targeting ── */}
                {activeStep === 3 && (
                  <div className="cc-form-section">
                    <Form layout="vertical" className="cc-form">
                      <div className="cc-row-grid">
                        <Form.Item label="Age" required>
                          <Select
                            mode="multiple" value={age}
                            onChange={(vals: string[]) => setAge(vals)}
                            placeholder="Select Age" style={{ width: '100%' }}
                            maxTagCount="responsive"
                            options={['18 to 24', '25 to 34', '35 to 44', '45 to 54', '55 to 64', 'Others'].map(v => ({ value: v, label: v }))}
                          />
                        </Form.Item>
                        <Form.Item label="Gender" required>
                          <Select
                            mode="multiple" value={gender}
                            onChange={(vals: string[]) => setGender(vals)}
                            placeholder="Select Gender" style={{ width: '100%' }}
                            maxTagCount="responsive"
                            options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]}
                          />
                        </Form.Item>
                      </div>

                      <Form.Item label="Geo Targeting">
                        <div className="cc-geo-wrap">
                          <GeoTargeting
                            locations={geoLocations}
                            onAdd={(loc: GeoLocation) => setGeoLocations(p => [...p, loc])}
                            onRemove={(idx: number) => setGeoLocations(p => p.filter((_, i) => i !== idx))}
                          />
                        </div>
                      </Form.Item>

                      <Form.Item label="Platform / Inventory" required>
                        <Select
                          mode="multiple" value={platforms}
                          onChange={(vals: string[]) => setPlatforms(vals)}
                          placeholder="Select Platforms" style={{ width: '100%' }}
                          maxTagCount="responsive"
                          options={['Display', 'Video', 'PMP', 'CTV', 'Audio', 'Native', 'DOOH', 'Mobile'].map(v => ({ value: v, label: v }))}
                        />
                      </Form.Item>

                      <div className="cc-row-grid">
                        <Form.Item label="Frequency Cap">
                          <div className="cc-unit-input">
                            <InputNumber
                              min={1} placeholder="e.g. 3"
                              value={freqCap ? Number(freqCap) : undefined}
                              onChange={v => setFreqCap(String(v ?? ''))}
                              style={{ width: 80, height: 38 }}
                            />
                            <span className="cc-unit-label">impressions / user</span>
                          </div>
                        </Form.Item>
                        <Form.Item label="Brand Safety Level" required>
                          <Select
                            value={brandSafety || undefined}
                            onChange={setBrandSafety}
                            placeholder="Select level…"
                            options={toOpts(['Standard', 'Strict', 'Custom'])}
                            style={{ width: '100%', height: 38 }}
                          />
                        </Form.Item>
                      </div>

                      <Form.Item label="Viewability Goal">
                        <div className="cc-unit-input">
                          <InputNumber
                            min={0} max={100} placeholder="e.g. 70"
                            value={viewability ? Number(viewability) : undefined}
                            onChange={v => setViewability(String(v ?? ''))}
                            style={{ width: 80, height: 38 }}
                          />
                          <span className="cc-unit-label">%</span>
                        </div>
                      </Form.Item>
                    </Form>
                  </div>
                )}

                {/* ── STEP 4: Line Items ── */}
                {activeStep === 4 && (
                  <div className="cc-form-section">
                    {lineItems.length === 0 && (
                      <div style={{ background: '#fffbeb', border: '0.5px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#92400e' }}>
                        No line items found for this campaign.
                      </div>
                    )}
                    {lineItems.map((item, idx) => (
                      <LineItemCard
                        key={item.id}
                        item={item}
                        index={idx}
                        campaignStart={startDate}
                        campaignEnd={endDate}
                        onChange={handleLineItemChange}
                        onRemove={handleLineItemRemove}
                        canRemove={lineItems.length > 1}
                      />
                    ))}
                    <InfoBox variant="amber">
                      Note: You can edit existing line item details here. To add new line items or manage creatives, use the campaign dashboard after saving.
                    </InfoBox>
                  </div>
                )}

                {/* ── STEP 5: Review ── */}
                {activeStep === 5 && (
                  <div className="cc-form-section">
                    <div className="cc-review-ready">
                      <div className="cc-review-ready-icon">
                        <CheckOutlined style={{ color: WHITE, fontSize: 18 }} />
                      </div>
                      <div>
                        <div className="cc-review-ready-title">Ready to update</div>
                        <div className="cc-review-ready-sub">Review the changes below before saving.</div>
                      </div>
                    </div>

                    <div className="cc-review-header">
                      <span className="cc-review-label">Campaign Summary</span>
                      <button className="cc-review-edit-btn" onClick={() => setActiveStep(1)}>← Edit Details</button>
                    </div>

                    <div className="cc-review-table">
                      {[
                        { label: 'Campaign ID', value: campaign_id },
                        { label: 'Client', value: client },
                        { label: 'Advertiser', value: advertiser },
                        { label: 'Website URL', value: websiteUrl },
                        { label: 'Campaign Name', value: campaignName },
                        { label: 'Client Campaign ID', value: clientCampaignId },
                        { label: 'Purchase Order ID', value: purchaseOrderId },
                        { label: 'Campaign Type', value: campaignType },
                        { label: 'Buying Type', value: buyingType.join(', ') },
                        { label: 'Objective', value: objective },
                        { label: 'Notes', value: notes },
                        { label: 'Age', value: age.join(', ') },
                        { label: 'Gender', value: gender.join(', ') },
                        { label: 'Platforms', value: platforms.join(', ') },
                        { label: 'Brand Safety', value: brandSafety },
                        { label: 'Viewability Goal', value: viewability ? `${viewability}%` : '—' },
                        { label: 'Campaign Duration', value: durationDays > 0 ? `${startDate} → ${endDate} (${durationDays} days)` : '—' },
                      ].map((row, i) => (
                        <div key={row.label} className="cc-review-row" style={{ background: i % 2 === 0 ? WHITE : 'var(--slate-100)' }}>
                          <span className="cc-review-row-key">{row.label}</span>
                          <span className="cc-review-row-val">{row.value || '—'}</span>
                        </div>
                      ))}
                    </div>

                    {lineItems.length > 0 && (
                      <>
                        <div className="cc-review-header" style={{ marginTop: 20 }}>
                          <span className="cc-review-label">Line Items ({lineItems.length})</span>
                        </div>
                        {lineItems.map((li, i) => (
                          <div key={li.id} style={{ border: '0.5px solid #e2e8f0', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: SLATE, borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#4f46e5', color: WHITE, fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                              {li.lineItemName}
                              <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'monospace', background: '#EDE9FE', color: '#7C3AED', padding: '2px 8px', borderRadius: 4 }}>{li.id}</span>
                            </div>
                            <div className="cc-review-table">
                              {[
                                { label: 'Start Date', value: li.startDate },
                                { label: 'End Date', value: li.endDate },
                                { label: 'Ad Format', value: li.adFormat || '—' },       // ← no .join()

                                { label: 'Impressions', value: li.impressions ? Number(li.impressions).toLocaleString('en-IN') : '—' },
                                { label: 'Ethnicity', value: li.ethnicity || '—' },
                              ].map((row, j) => (
                                <div key={row.label} className="cc-review-row" style={{ background: j % 2 === 0 ? WHITE : 'var(--slate-100)' }}>
                                  <span className="cc-review-row-key">{row.label}</span>
                                  <span className="cc-review-row-val">{row.value || '—'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="cc-bottom-bar">
            <Button className="cc-btn-cancel" onClick={() => navigate(`/campaign/${campaign_id}`)}>Cancel</Button>
            <div className="cc-bottom-bar-actions">
              {activeStep > 1 && (
                <Button className="cc-btn-back" onClick={() => setActiveStep(s => s - 1)}>← Back</Button>
              )}
              {activeStep < 5 ? (
                <Button
                  type="primary"
                  className="cc-btn-next"
                  onClick={handleNextStep}
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="primary"
                  className="cc-btn-submit"
                  loading={submitting}
                  onClick={handleSubmit}
                  icon={<CheckOutlined />}
                >
                  {submitting ? 'Saving…' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}