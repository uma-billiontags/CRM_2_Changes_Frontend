// Campaign form

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Form, Input, Select, Button, DatePicker, InputNumber, Divider, message
} from 'antd';
import {
  ArrowRightOutlined, CheckOutlined,
  LayoutOutlined, NotificationOutlined, PlusOutlined,
  FileTextOutlined, SettingOutlined, LogoutOutlined,
  BellOutlined, RightOutlined, HistoryOutlined,
  WifiOutlined, EditOutlined, AppstoreOutlined,
  CloseOutlined, InfoCircleOutlined,
  EnvironmentOutlined, CreditCardOutlined,
  DeleteOutlined, FileImageOutlined, VideoCameraOutlined, PaperClipOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import '../styles/Campaign_Create.css';

dayjs.extend(isBetween);

const { TextArea } = Input;

const SUBMIT_URL = 'https://grinch-revocable-cornflake.ngrok-free.dev/create_campaign/';
const CLIENT_URL = 'https://grinch-revocable-cornflake.ngrok-free.dev/get_client/CLT-2026-00001/';

// Static data for dropdowns
const GEO_COUNTRIES = ['India', 'USA', 'UK', 'UAE', 'Singapore', 'Australia'];
const GEO_STATES: Record<string, string[]> = {
  India: ['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi', 'Gujarat', 'Telangana', 'Rajasthan'],
  USA: ['California', 'New York', 'Texas', 'Florida', 'Illinois'],
  UK: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  UAE: ['Dubai', 'Abu Dhabi', 'Sharjah'],
  Singapore: ['Central', 'East', 'West', 'North'],
  Australia: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia'],
};
const GEO_CITIES: Record<string, string[]> = {
  Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubli'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
  Delhi: ['New Delhi', 'Dwarka', 'Rohini', 'Saket'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  California: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Yonkers'],
  England: ['London', 'Manchester', 'Birmingham', 'Leeds'],
  Dubai: ['Downtown Dubai', 'Deira', 'Jumeirah', 'Marina'],
};

// ── Line Item type ────────────────────────────────────────────────────────────
interface LineItem {
  id: string;
  lineItemName: string;
  ethnicity: string[];
  startDate: string;
  endDate: string;
  adFormat: string[];
  impressions: string;
  creatives: File[];
  landingPage: string;
}

function emptyLineItem(): LineItem {
  return {
    id: `li_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    lineItemName: '',
    ethnicity: [],
    startDate: '',
    endDate: '',
    adFormat: [],
    impressions: '',
    creatives: [],
    landingPage: '',
  };
}

// ── Line Item helpers ─────────────────────────────────────────────────────────
const ETHNICITY_OPTIONS = [
  'General', 'Asian', 'South Asian', 'African American',
  'Hispanic / Latino', 'Middle Eastern', 'Caucasian', 'Other',
];

const AD_FORMAT_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
];

function getAccept(adFormats: string[]): string {
  const hasImage = adFormats.includes('image');
  const hasVideo = adFormats.includes('video');
  if (hasImage && hasVideo) return 'image/*,video/*';
  if (hasImage) return 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';
  if (hasVideo) return 'video/mp4,video/webm,video/ogg,video/quicktime';
  return '*';
}

function getFormatLabel(adFormats: string[]): string {
  const hasImage = adFormats.includes('image');
  const hasVideo = adFormats.includes('video');
  if (hasImage && hasVideo) return 'images or videos';
  if (hasImage) return 'images (JPG, PNG, GIF, WebP)';
  if (hasVideo) return 'videos (MP4, WebM, MOV)';
  return 'files';
}

function isFileAllowed(file: File, adFormats: string[]): boolean {
  const hasImage = adFormats.includes('image');
  const hasVideo = adFormats.includes('video');
  if (hasImage && hasVideo) return file.type.startsWith('image/') || file.type.startsWith('video/');
  if (hasImage) return file.type.startsWith('image/');
  if (hasVideo) return file.type.startsWith('video/');
  return false;
}


// Reuse AddNewSelect from Onboarding — inline version for GeoTargeting
interface GeoAddNewSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  setOptions: (opts: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

function GeoAddNewSelect({ value, onChange, options, setOptions, placeholder, disabled }: GeoAddNewSelectProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    const trimmed = newValue.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions([...options, trimmed]);
      onChange(trimmed);
    } else if (trimmed) {
      onChange(trimmed);
    }
    setNewValue('');
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <Input
        autoFocus
        placeholder="Type and press Enter"
        value={newValue}
        suffix={<span style={{ fontSize: 11, color: '#aaa' }}>↵</span>}
        onChange={e => setNewValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') { setNewValue(''); setIsAdding(false); }
        }}
        onBlur={() => { setNewValue(''); setIsAdding(false); }}
        style={{ height: 38 }}
      />
    );
  }

  return (
    <Select
      placeholder={placeholder}
      allowClear
      disabled={disabled}
      style={{ width: '100%', height: 38 }}
      value={value || undefined}
      onChange={v => onChange(v ?? '')}
      dropdownRender={menu => (
        <>
          {menu}
          <Divider style={{ margin: '4px 0' }} />
          <div
            onMouseDown={e => e.preventDefault()}
            onClick={() => !disabled && setIsAdding(true)}
            style={{
              padding: '8px 12px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              color: disabled ? '#ccc' : '#4f46e5',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <PlusOutlined />
            Add new
          </div>
        </>
      )}
      options={options.map(s => ({ value: s, label: s }))}
    />
  );
}

const toOpts = (arr: string[]) => arr.map(s => ({ value: s, label: s }));

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV = [
  {
    g: 'WORKSPACE',
    items: [
      { label: 'Dashboard', icon: <LayoutOutlined />, to: '/user_dashboard' },
      { label: 'My Campaigns', icon: <NotificationOutlined />, to: '/user_campaigns' },
      { label: 'Create Campaign', icon: <PlusOutlined />, to: '/campaign_create' },
      { label: 'Brief Capture', icon: <EditOutlined />, to: '/user_brief' },
      { label: 'My Drafts', icon: <AppstoreOutlined />, to: '/user_drafts' },
    ],
  },
  {
    g: 'AD OPS',
    items: [
      { label: 'Insertion Orders', icon: <FileTextOutlined />, to: '/user_io' },
      { label: 'Line Items', icon: <AppstoreOutlined />, to: '/user_lineitems' },
      { label: 'Creatives', icon: <LayoutOutlined />, to: '/user_creatives' },
      { label: 'Setup Tasks', icon: <SettingOutlined />, to: '/user_tasks' },
    ],
  },
  {
    g: 'MONITOR',
    items: [
      { label: 'Live Status', icon: <WifiOutlined />, to: '/user_live' },
      { label: 'Change History', icon: <HistoryOutlined />, to: '/user_history' },
      { label: 'Approvals', icon: <FileTextOutlined />, to: '/user_approvals' },
    ],
  },
  {
    g: 'INSIGHTS',
    items: [
      { label: 'Reports', icon: <FileTextOutlined />, to: '/user_reports' },
      { label: 'Billing', icon: <CreditCardOutlined />, to: '/user_billing' },
    ],
  },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();
  return (
    <aside className="cc-sidebar" style={{ width: collapsed ? 64 : 240 }}>
      <div className="cc-sidebar-logo" style={{ padding: collapsed ? '0 14px' : '0 16px', justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && (
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div className="cc-sidebar-logo-icon">N</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                Billion <span style={{ color: '#60A5FA' }}>Tags</span>
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.1em' }}>
                CAMPAIGN PLATFORM
              </div>
            </div>
          </Link>
        )}
        {collapsed && <div className="cc-sidebar-logo-icon">N</div>}
        <button
          onClick={onToggle}
          className="cc-sidebar-toggle"
          style={collapsed ? { position: 'absolute', right: 8, top: 20 } : {}}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="cc-nav">
        {NAV.map(({ g, items }) => (
          <div key={g} style={{ marginBottom: 2 }}>
            {!collapsed && <div className="cc-nav-group-label">{g}</div>}
            {items.map(({ label, icon, to }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                  <div className={`cc-nav-item ${active ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}>
                    {icon}
                    {!collapsed && <span>{label}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="cc-sidebar-footer" style={{ padding: collapsed ? '10px 8px' : '10px' }}>
        {!collapsed && (
          <div className="cc-sidebar-user">
            <div className="cc-sidebar-avatar">AS</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Aarav Shah</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>CAMPAIGN MANAGER</div>
            </div>
          </div>
        )}
        <Link to="/portal_settings" style={{ textDecoration: 'none' }}>
          <div className={`cc-nav-item ${collapsed ? 'collapsed' : ''}`} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 3 }}>
            <SettingOutlined />{!collapsed && 'Settings'}
          </div>
        </Link>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <div className={`cc-nav-item ${collapsed ? 'collapsed' : ''}`} style={{ color: 'rgba(248,113,113,0.85)', fontSize: 12, fontWeight: 600 }}>
            <LogoutOutlined />{!collapsed && 'Sign Out'}
          </div>
        </Link>
      </div>
    </aside>
  );
}

// ── Geo Location ──────────────────────────────────────────────────────────────
interface GeoLocation {
  country: string;
  state: string;
  city: string;
  zipcode: string;
  range: string;
}

// ── GeoTargeting ─────────────────────────────────────────────────────────────
function GeoTargeting({ locations, onAdd, onRemove }: {
  locations: GeoLocation[];
  onAdd: (l: GeoLocation & { zipcode: string; range: string }) => void;
  onRemove: (i: number) => void;
}) {
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [range, setRange] = useState('');
  const [countryOpts, setCountryOpts] = useState<string[]>(GEO_COUNTRIES);
  const [stateOpts, setStateOpts] = useState<string[]>([]);
  const [cityOpts, setCityOpts] = useState<string[]>([]);

  const rangeEnabled = !!(country || state || city || zipcode.trim());

  const handleCountryChange = (v: string) => {
    setCountry(v); setState(''); setCity('');
    setStateOpts(GEO_STATES[v] || []); setCityOpts([]);
  };

  const handleStateChange = (v: string) => {
    setState(v); setCity('');
    setCityOpts(GEO_CITIES[v] || []);
  };

  const handleAdd = () => {
    if (!country && !state && !city && !zipcode.trim()) return;
    onAdd({ country, state, city, zipcode: zipcode.trim(), range: range.trim() });
    setCountry(''); setState(''); setCity(''); setZipcode(''); setRange('');
    setStateOpts([]); setCityOpts([]);
  };

  const canAdd = !!(country || state || city || zipcode.trim());

  const fmt = (l: any) => [l.country, l.state, l.city, l.zipcode, l.range].filter(Boolean).join(' › ');

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, alignItems: 'end', marginBottom: 8 }}>
        <div>
          <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: 'var(--blue)', marginRight: 4 }} />Country
          </div>
          <GeoAddNewSelect value={country} onChange={handleCountryChange} options={countryOpts} setOptions={setCountryOpts} placeholder="Select country…" />
        </div>
        <div>
          <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: 'var(--blue)', marginRight: 4 }} />State
          </div>
          <GeoAddNewSelect value={state} onChange={handleStateChange} options={stateOpts.length > 0 ? stateOpts : (GEO_STATES[country] || [])} setOptions={setStateOpts} placeholder="Select state…" />
        </div>
        <div>
          <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: 'var(--blue)', marginRight: 4 }} />City
          </div>
          <GeoAddNewSelect value={city} onChange={setCity} options={cityOpts.length > 0 ? cityOpts : (GEO_CITIES[state] || [])} setOptions={setCityOpts} placeholder="Select city…" />
        </div>
        <div>
          <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: 'var(--blue)', marginRight: 4 }} />Zip Code
          </div>
          <Input placeholder="e.g. 560001" value={zipcode} onChange={e => setZipcode(e.target.value)} style={{ height: 38 }} />
        </div>
        <div>
          <div className="cc-geo-sub-label" style={{ color: rangeEnabled ? 'var(--slate-500)' : 'var(--slate-300)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: rangeEnabled ? 'var(--blue)' : 'var(--slate-300)', marginRight: 4 }} />Range
          </div>
          <Input
            placeholder="e.g. 10 km" value={range} disabled={!rangeEnabled}
            onChange={e => setRange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && rangeEnabled) handleAdd(); }}
            style={{ height: 38, backgroundColor: rangeEnabled ? '#fff' : '#f5f5f5', cursor: rangeEnabled ? 'text' : 'not-allowed' }}
          />
        </div>
        <Button type="primary" disabled={!canAdd} onClick={handleAdd} icon={<PlusOutlined />} style={{ height: 38 }}>Add</Button>
      </div>
      <div className="cc-geo-helper" style={{ marginBottom: 8 }}>
        <InfoCircleOutlined style={{ marginRight: 4 }} />
        Select at least one of Country, State, City or enter a Zip Code. Range is enabled after any selection.
      </div>
      {locations.length > 0 ? (
        <div className="cc-geo-tags">
          {locations.map((loc: any, idx: number) => (
            <span key={idx} className="cc-geo-tag">
              <EnvironmentOutlined style={{ fontSize: 10 }} />
              {fmt(loc)}
              <button className="cc-tag-remove" onClick={() => onRemove(idx)}>
                <CloseOutlined style={{ fontSize: 10 }} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="cc-geo-empty">No geo targets added yet. Fill at least one field above to begin.</div>
      )}
    </div>
  );
}

// ── InfoBox ───────────────────────────────────────────────────────────────────
function InfoBox({ variant = 'blue', children }: { variant?: 'blue' | 'amber'; children: React.ReactNode }) {
  return (
    <div className={`cc-info-box ${variant}`}>
      <InfoCircleOutlined style={{ color: variant === 'blue' ? 'var(--blue)' : 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
      <p>{children}</p>
    </div>
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
function Step1({ client, setClient, setClientId, advertiser, setAdvertiser, websiteUrl, setWebsiteUrl }: any) {
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(CLIENT_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': '1' },
    })
      .then(res => res.json())
      .then(data => {
        setClientName(data.name || '');
        setClient(data.name || '');
        setClientId(data.client_id || '');
      })
      .catch(() => setClientName('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="cc-form-section-sm">
      <Form layout="vertical" className="cc-form">
        <Form.Item label="Company Name" required>
          <Input className="cc-company-name-input" value={loading ? 'Loading…' : clientName} disabled style={{ fontWeight: 600 }} />
        </Form.Item>
        <Form.Item label="Advertiser (Brand)" required>
          <Select
            value={advertiser || undefined}
            onChange={setAdvertiser}
            placeholder="Select an advertiser…"
            options={toOpts(['Unilever India', 'Tata Digital', 'HDFC Bank', 'Myntra', 'Reliance Retail', 'Mahindra Group', 'Airtel India'])}
            style={{ width: '100%', height: 38 }}
          />
        </Form.Item>
        <InfoBox variant="blue">
          All campaigns, line items, creatives and reports will be mapped under the selected client and advertiser. This cannot be changed after creation.
        </InfoBox>
        <Form.Item label="Website URL">
          <Input placeholder="https://" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} style={{ height: 38 }} />
        </Form.Item>
      </Form>
    </div>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
function Step2({
  campaignId, campaignName, setCampaignName,
  clientCampaignId, setClientCampaignId,
  purchaseOrderId, setPurchaseOrderId,
  campaignType, setCampaignType,
  buyingType, setBuyingType,
  objective, setObjective,
  notes, setNotes, startDate, setStartDate, endDate, setEndDate
}: any) {
  return (
    <div className="cc-form-section-sm">
      <Form layout="vertical" className="cc-form">
        <div className="cc-row-grid">
          <Form.Item label="Campaign ID">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {campaignId ? (
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-800)' }}>{campaignId}</span>
              ) : (
                <span style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--slate-400)', fontWeight: 400 }}>Auto-generated after save</span>
              )}
            </div>
          </Form.Item>
        </div>

        <div className="cc-row-grid">
          <Form.Item label="Client Campaign ID">
            <Input placeholder="Enter Client Campaign ID" value={clientCampaignId} onChange={e => setClientCampaignId(e.target.value)} style={{ height: 38 }} />
          </Form.Item>
          <Form.Item label="Purchase Order ID">
            <Input placeholder="Enter Purchase Order ID" value={purchaseOrderId} onChange={e => setPurchaseOrderId(e.target.value)} style={{ height: 38 }} />
          </Form.Item>
          <Form.Item label="Campaign Name" required>
            <Input placeholder="e.g. Summer Awareness 2024" value={campaignName} onChange={e => setCampaignName(e.target.value)} style={{ height: 38 }} />
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
              mode="multiple"
              value={buyingType}
              onChange={(vals: string[]) => setBuyingType(vals)}
              placeholder="Select buying type…"
              style={{ width: '100%' }}
              options={[
                { value: 'Programmatic (DV360)', label: 'Programmatic (DV360)' },
                { value: 'Direct', label: 'Direct' },
                { value: 'Programmatic Guaranteed', label: 'Programmatic Guaranteed' },
                { value: 'Preferred Deal', label: 'Preferred Deal' },
                { value: 'Open Auction', label: 'Open Auction' },
              ]}
              maxTagCount="responsive"
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
          <TextArea placeholder="Add any notes for internal reference" value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
        </Form.Item>
      </Form>
    </div>
  );
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
function Step3({ age, setAge, gender, setGender, geoLocations, setGeoLocations, platforms, setPlatforms, freqCap, setFreqCap, brandSafety, setBrandSafety, viewability, setViewability }: any) {
  return (
    <div className="cc-form-section">
      <Form layout="vertical" className="cc-form">
        <div className="cc-row-grid">
          <Form.Item label="Age" required>
            <Select
              mode="multiple"
              value={age}
              onChange={(vals: string[]) => setAge(vals)}
              placeholder="Select Age"
              style={{ width: '100%' }}
              options={[
                { value: '18 to 24', label: '18 to 24' },
                { value: '25 to 34', label: '25 to 34' },
                { value: '35 to 44', label: '35 to 44' },
                { value: '45 to 54', label: '45 to 54' },
                { value: '55 to 64', label: '55 to 64' },
                { value: 'Others', label: 'Others' },
              ]}
              maxTagCount="responsive"
            />
          </Form.Item>
          <Form.Item label="Gender" required>
            <Select
              value={gender || undefined}
              onChange={setGender}
              placeholder="Select Gender"
              style={{ width: '100%' }}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
              ]}
              maxTagCount="responsive"
            />
          </Form.Item>
        </div>

        <Form.Item label="Geo Targeting" required>
          <div className="cc-geo-wrap">
            <div className="cc-geo-header">
              <div className="cc-geo-icon-wrap">
                <EnvironmentOutlined style={{ color: 'var(--blue)', fontSize: 13 }} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--slate-700)' }}>Location Targeting</div>
                <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>Country → State → City</div>
              </div>
              {geoLocations.length > 0 && (
                <div className="cc-geo-count-badge">{geoLocations.length} location{geoLocations.length > 1 ? 's' : ''} added</div>
              )}
            </div>
            <GeoTargeting
              locations={geoLocations}
              onAdd={(loc: GeoLocation) => setGeoLocations((p: GeoLocation[]) => [...p, loc])}
              onRemove={(idx: number) => setGeoLocations((p: GeoLocation[]) => p.filter((_: GeoLocation, i: number) => i !== idx))}
            />
          </div>
        </Form.Item>

        <Form.Item label="Platform / Inventory" required>
          <Select
            mode="multiple"
            value={platforms}
            onChange={(vals: string[]) => setPlatforms(vals)}
            placeholder="Select Platforms"
            style={{ width: '100%' }}
            options={[
              { value: 'Display', label: 'Display' },
              { value: 'Video', label: 'Video' },
              { value: 'PMP', label: 'PMP' },
              { value: 'CTV', label: 'CTV' },
              { value: 'Audio', label: 'Audio' },
              { value: 'Native', label: 'Native' },
              { value: 'DOOH', label: 'DOOH' },
              { value: 'Mobile', label: 'Mobile' },
            ]}
            maxTagCount="responsive"
          />
        </Form.Item>

        <div className="cc-row-grid">
          <Form.Item label="Frequency Cap">
            <div className="cc-unit-input">
              <InputNumber
                min={1}
                placeholder="e.g. 3"
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
              min={0} max={100}
              placeholder="e.g. 70"
              value={viewability ? Number(viewability) : undefined}
              onChange={v => setViewability(String(v ?? ''))}
              style={{ width: 80, height: 38 }}
            />
            <span className="cc-unit-label">%</span>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
}

// ── Line Item Card ────────────────────────────────────────────────────────────
interface LineItemCardProps {
  item: LineItem;
  index: number;
  campaignStart: string;
  campaignEnd: string;
  onChange: (id: string, field: keyof LineItem, value: any) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function LineItemCard({ item, index, campaignStart, campaignEnd, onChange, onRemove, canRemove }: LineItemCardProps) {
  const [dateError, setDateError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateDates(start: string, end: string): string {
    if (!campaignStart || !campaignEnd) return '';
    const cStart = dayjs(campaignStart);
    const cEnd = dayjs(campaignEnd);

    if (start) {
      const s = dayjs(start);
      if (s.isBefore(cStart, 'day') || s.isAfter(cEnd, 'day')) {
        return `Start date must be between ${cStart.format('DD MMM YYYY')} and ${cEnd.format('DD MMM YYYY')}.`;
      }
    }
    if (end) {
      const e = dayjs(end);
      if (e.isBefore(cStart, 'day') || e.isAfter(cEnd, 'day')) {
        return `End date must be between ${cStart.format('DD MMM YYYY')} and ${cEnd.format('DD MMM YYYY')}.`;
      }
    }
    if (start && end && dayjs(end).isBefore(dayjs(start), 'day')) {
      return 'End date must be after start date.';
    }
    return '';
  }

  function handleStartDate(_: Dayjs | null, ds: string | null) {
    const val = ds ?? '';
    onChange(item.id, 'startDate', val);
    setDateError(validateDates(val, item.endDate));
  }

  function handleEndDate(_: Dayjs | null, ds: string | null) {
    const val = ds ?? '';
    onChange(item.id, 'endDate', val);
    setDateError(validateDates(item.startDate, val));
  }

  function disabledDate(current: Dayjs): boolean {
    if (!campaignStart || !campaignEnd) return false;
    return current.isBefore(dayjs(campaignStart), 'day') || current.isAfter(dayjs(campaignEnd), 'day');
  }

  function handleAdFormatChange(vals: string[]) {
    onChange(item.id, 'adFormat', vals);
    // Remove incompatible creatives
    const compatible = item.creatives.filter(f => {
      const hasImage = vals.includes('image');
      const hasVideo = vals.includes('video');
      if (hasImage && hasVideo) return true;
      if (hasImage) return f.type.startsWith('image/');
      if (hasVideo) return f.type.startsWith('video/');
      return false;
    });
    if (compatible.length !== item.creatives.length) {
      onChange(item.id, 'creatives', compatible);
      message.info('Some creatives were removed due to format change.');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (item.adFormat.length === 0) {
      message.warning('Please select an Ad Format before uploading creatives.');
      return;
    }
    const invalid = files.filter(f => !isFileAllowed(f, item.adFormat));
    const valid = files.filter(f => isFileAllowed(f, item.adFormat));
    if (invalid.length > 0) {
      message.error(`Invalid file(s): ${invalid.map(f => f.name).join(', ')}. Only ${getFormatLabel(item.adFormat)} allowed.`);
    }
    if (valid.length > 0) {
      onChange(item.id, 'creatives', [...item.creatives, ...valid]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeCreative(idx: number) {
    onChange(item.id, 'creatives', item.creatives.filter((_, i) => i !== idx));
  }

  function fileIcon(file: File) {
    if (file.type.startsWith('image/')) return <FileImageOutlined style={{ color: '#4f46e5', fontSize: 14 }} />;
    if (file.type.startsWith('video/')) return <VideoCameraOutlined style={{ color: '#0ea5e9', fontSize: 14 }} />;
    return <PaperClipOutlined style={{ fontSize: 14 }} />;
  }

  const accept = item.adFormat.length > 0 ? getAccept(item.adFormat) : '*';
  const formatLabel = item.adFormat.length > 0 ? getFormatLabel(item.adFormat) : 'files';

  // Badge colors per format
  const badgeBg = item.adFormat.includes('image') && item.adFormat.includes('video')
    ? '#ede9fe' : item.adFormat.includes('image') ? '#dbeafe' : '#e0f2fe';
  const badgeColor = item.adFormat.includes('image') && item.adFormat.includes('video')
    ? '#6d28d9' : item.adFormat.includes('image') ? '#1d4ed8' : '#0369a1';
  const badgeText = item.adFormat.includes('image') && item.adFormat.includes('video')
    ? 'Image + Video' : item.adFormat.includes('image') ? 'Images only' : 'Videos only';

  return (
    <div style={{
      border: '0.5px solid var(--color-border-secondary, #e2e8f0)',
      borderRadius: 12,
      background: '#fff',
      padding: '20px 24px',
      marginBottom: 16,
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#4f46e5',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>
            {index + 1}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-800, #1e293b)' }}>
            {item.lineItemName || `Line Item ${index + 1}`}
          </span>
        </div>
        {canRemove && (
          <button
            onClick={() => onRemove(item.id)}
            style={{
              background: 'none', border: '0.5px solid #fca5a5', borderRadius: 6,
              padding: '4px 10px', cursor: 'pointer', color: '#ef4444',
              fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <DeleteOutlined style={{ fontSize: 12 }} /> Remove
          </button>
        )}
      </div>

      <Form layout="vertical">
        {/* Row: Line Item Name + Ethnicity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item
            label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Line Item Name <span style={{ color: '#ef4444' }}>*</span></span>}
            style={{ marginBottom: 14 }}
          >
            <Input
              placeholder="e.g. Mumbai Display — 18-34"
              value={item.lineItemName}
              onChange={e => onChange(item.id, 'lineItemName', e.target.value)}
              style={{ height: 38 }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Ethnicity</span>}
            style={{ marginBottom: 14 }}
          >
            <Select
              mode="multiple"
              value={item.ethnicity}
              onChange={vals => onChange(item.id, 'ethnicity', vals)}
              placeholder="Select ethnicity…"
              maxTagCount="responsive"
              style={{ width: '100%' }}
              options={ETHNICITY_OPTIONS.map(e => ({ value: e, label: e }))}
            />
          </Form.Item>
        </div>

        {/* Row: Start Date + End Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item
            label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Start Date <span style={{ color: '#ef4444' }}>*</span></span>}
            style={{ marginBottom: dateError ? 4 : 14 }}
            validateStatus={dateError ? 'error' : ''}
          >
            <DatePicker
              style={{ width: '100%', height: 38 }}
              value={item.startDate ? dayjs(item.startDate) : null}
              onChange={handleStartDate}
              disabledDate={disabledDate}
              placeholder={campaignStart ? `From ${dayjs(campaignStart).format('DD MMM YYYY')}` : 'Select date'}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 12.5, color: '#64748b' }}>End Date <span style={{ color: '#ef4444' }}>*</span></span>}
            style={{ marginBottom: dateError ? 4 : 14 }}
            validateStatus={dateError ? 'error' : ''}
          >
            <DatePicker
              style={{ width: '100%', height: 38 }}
              value={item.endDate ? dayjs(item.endDate) : null}
              onChange={handleEndDate}
              disabledDate={disabledDate}
              placeholder={campaignEnd ? `Until ${dayjs(campaignEnd).format('DD MMM YYYY')}` : 'Select date'}
            />
          </Form.Item>
        </div>

        {/* Date error banner */}
        {dateError && (
          <div style={{
            background: '#fef2f2', border: '0.5px solid #fca5a5', borderRadius: 6,
            padding: '7px 12px', marginBottom: 14, fontSize: 12.5, color: '#dc2626',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ⚠ {dateError}
          </div>
        )}

        {/* Campaign flight reference pill */}
        {campaignStart && campaignEnd && (
          <div style={{
            fontSize: 11.5, color: '#64748b', marginBottom: 14,
            background: '#f8fafc', borderRadius: 6, padding: '4px 10px',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            border: '0.5px solid #e2e8f0',
          }}>
            Campaign flight: {dayjs(campaignStart).format('DD MMM YYYY')} → {dayjs(campaignEnd).format('DD MMM YYYY')}
          </div>
        )}

        {/* Row: Ad Format + Impressions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item
            label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Ad Format <span style={{ color: '#ef4444' }}>*</span></span>}
            style={{ marginBottom: 14 }}
          >
            <Select
              mode="multiple"
              value={item.adFormat}
              onChange={handleAdFormatChange}
              placeholder="Select format…"
              maxTagCount="responsive"
              style={{ width: '100%' }}
              options={AD_FORMAT_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Impressions</span>}
            style={{ marginBottom: 14 }}
          >
            <Input
              placeholder="e.g. 1000000"
              value={item.impressions}
              onChange={e => onChange(item.id, 'impressions', e.target.value.replace(/[^0-9]/g, ''))}
              suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>impr.</span>}
              style={{ height: 38 }}
            />
          </Form.Item>
        </div>

        {/* Creatives Upload */}
        <Form.Item
          label={
            <span style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              Creatives
              {item.adFormat.length > 0 && (
                <span style={{
                  background: badgeBg, color: badgeColor,
                  fontSize: 10.5, fontWeight: 500, padding: '1px 8px',
                  borderRadius: 10,
                }}>
                  {badgeText}
                </span>
              )}
            </span>
          }
          style={{ marginBottom: 14 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* Upload trigger */}
          <div
            onClick={() => {
              if (item.adFormat.length === 0) {
                message.warning('Please select an Ad Format first.');
                return;
              }
              fileInputRef.current?.click();
            }}
            style={{
              border: `1px dashed ${item.adFormat.length === 0 ? '#d1d5db' : '#4f46e5'}`,
              borderRadius: 8,
              padding: '14px 16px',
              cursor: item.adFormat.length === 0 ? 'not-allowed' : 'pointer',
              background: item.adFormat.length === 0 ? '#f9fafb' : '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <PlusOutlined style={{ fontSize: 16, color: item.adFormat.length === 0 ? '#d1d5db' : '#4f46e5' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: item.adFormat.length === 0 ? '#9ca3af' : '#1e293b' }}>
                {item.adFormat.length === 0 ? 'Select an Ad Format above to enable upload' : `Upload ${formatLabel}`}
              </div>
              {item.adFormat.length > 0 && (
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>Click to browse — multiple files supported</div>
              )}
            </div>
          </div>

          {/* File list */}
          {item.creatives.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {item.creatives.map((file, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', background: '#f8fafc',
                  borderRadius: 6, border: '0.5px solid #e2e8f0',
                }}>
                  {fileIcon(file)}
                  <span style={{ flex: 1, fontSize: 12.5, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => removeCreative(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#ef4444', display: 'flex', alignItems: 'center' }}
                  >
                    <CloseOutlined style={{ fontSize: 11 }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Form.Item>

        {/* Landing Page */}
        <Form.Item
          label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Landing Page</span>}
          style={{ marginBottom: 0 }}
        >
          <Input
            placeholder="https://example.com/landing"
            value={item.landingPage}
            onChange={e => onChange(item.id, 'landingPage', e.target.value)}
            style={{ height: 38 }}
          />
        </Form.Item>
      </Form>
    </div>
  );
}

// ── Step 5 — Line Item Details ────────────────────────────────────────────────
function Step4LineItems({ campaignStartDate, campaignEndDate, lineItems, setLineItems }: {
  campaignStartDate: string;
  campaignEndDate: string;
  lineItems: LineItem[];
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
}) {
  function handleChange(id: string, field: keyof LineItem, value: any) {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  function handleAdd() {
    setLineItems(prev => [...prev, emptyLineItem()]);
  }

  function handleRemove(id: string) {
    setLineItems(prev => prev.filter(item => item.id !== id));
  }

  return (
    <div className="cc-form-section">
      {/* Campaign flight hint */}
      {(!campaignStartDate || !campaignEndDate) && (
        <div style={{
          background: '#fffbeb', border: '0.5px solid #fcd34d', borderRadius: 8,
          padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#92400e',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <InfoCircleOutlined style={{ color: '#d97706' }} />
          No campaign dates set. Go back to Step 2 to set them — line item dates will be validated against those dates.
        </div>
      )}

      {lineItems.map((item, idx) => (
        <LineItemCard
          key={item.id}
          item={item}
          index={idx}
          campaignStart={campaignStartDate}
          campaignEnd={campaignEndDate}
          onChange={handleChange}
          onRemove={handleRemove}
          canRemove={lineItems.length > 1}
        />
      ))}

      <button
        onClick={handleAdd}
        style={{
          width: '100%', padding: '12px',
          border: '1px dashed #4f46e5', borderRadius: 8,
          background: 'none', cursor: 'pointer',
          color: '#4f46e5', fontWeight: 500, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <PlusOutlined /> Add Another Line Item
      </button>
    </div>
  );
}

// ── Step 6 — Review & Confirm ─────────────────────────────────────────────────
function Step5Review({
  client, advertiser, websiteUrl,
  campaignName, clientCampaignId, purchaseOrderId,
  campaignType, buyingType, objective, notes,
  age, gender, geoLocations, platforms,
  freqCap, brandSafety, viewability,
  budgetType, totalBudget, startDate, endDate, durationDays,
  pacing, dayParting, timezone,
  lineItems,
  onEdit,
}: any) {
  const geoString = geoLocations.length > 0
    ? geoLocations.map((l: GeoLocation) => [l.country, l.state, l.city, l.zipcode, l.range].filter(Boolean).join(' › ')).join(', ')
    : '—';

  const campaignRows = [
    { label: 'Client', value: client || '—' },
    { label: 'Advertiser', value: advertiser || '—' },
    { label: 'Website URL', value: websiteUrl || '—' },
    { label: 'Campaign Name', value: campaignName || '—' },
    { label: 'Client Campaign ID', value: clientCampaignId || '—' },
    { label: 'Purchase Order ID', value: purchaseOrderId || '—' },
    { label: 'Campaign Type', value: campaignType || '—' },
    { label: 'Buying Type', value: buyingType.length > 0 ? buyingType.join(', ') : '—' },
    { label: 'Objective', value: objective || '—' },
    { label: 'Notes', value: notes || '—' },
    { label: 'Age', value: Array.isArray(age) && age.length > 0 ? age.join(', ') : '—' },
    { label: 'Gender', value: gender || '—' },
    { label: 'Geo Targeting', value: geoString },
    { label: 'Platforms', value: platforms.join(', ') || '—' },
    { label: 'Frequency Cap', value: freqCap ? `${freqCap} impressions/user` : '—' },
    { label: 'Brand Safety', value: brandSafety || '—' },
    { label: 'Viewability Goal', value: viewability ? `${viewability}%` : '—' },
    { label: 'Budget', value: totalBudget ? `₹ ${totalBudget} (${budgetType === 'total' ? 'Total' : 'Daily'})` : '—' },
    { label: 'Flight Duration', value: durationDays > 0 ? `${startDate} → ${endDate} (${durationDays} days)` : '—' },
    { label: 'Pacing', value: pacing || '—' },
    { label: 'Day Parting', value: dayParting || '—' },
    { label: 'Time Zone', value: timezone || '—' },
  ];

  return (
    <div className="cc-form-section">
      <div className="cc-review-ready">
        <div className="cc-review-ready-icon">
          <CheckOutlined style={{ color: '#fff', fontSize: 18, fontWeight: 900 }} />
        </div>
        <div>
          <div className="cc-review-ready-title">All steps complete — ready to launch</div>
          <div className="cc-review-ready-sub">Review the details below before creating the campaign.</div>
        </div>
      </div>

      {/* Campaign Summary */}
      <div className="cc-review-header">
        <span className="cc-review-label">Campaign Summary</span>
        <button className="cc-review-edit-btn" onClick={onEdit}>← Edit Details</button>
      </div>
      <div className="cc-review-table">
        {campaignRows.map((row, i) => (
          <div key={row.label} className="cc-review-row" style={{ background: i % 2 === 0 ? '#fff' : 'var(--slate-100)' }}>
            <span className="cc-review-row-key">{row.label}</span>
            <span className="cc-review-row-val">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Line Items Summary */}
      {lineItems.length > 0 && (
        <>
          <div className="cc-review-header" style={{ marginTop: 20 }}>
            <span className="cc-review-label">Line Items ({lineItems.length})</span>
          </div>
          {lineItems.map((li: LineItem, i: number) => (
            <div key={li.id} style={{
              border: '0.5px solid #e2e8f0', borderRadius: 10,
              marginBottom: 12, overflow: 'hidden',
            }}>
              <div style={{
                background: '#f8fafc', padding: '8px 14px',
                fontSize: 12.5, fontWeight: 600, color: '#1e293b',
                borderBottom: '0.5px solid #e2e8f0',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#4f46e5',
                  color: '#fff', fontSize: 11, display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{i + 1}</span>
                {li.lineItemName || `Line Item ${i + 1}`}
              </div>
              <div className="cc-review-table">
                {[
                  { label: 'Ethnicity', value: li.ethnicity.length > 0 ? li.ethnicity.join(', ') : '—' },
                  { label: 'Start Date', value: li.startDate || '—' },
                  { label: 'End Date', value: li.endDate || '—' },
                  { label: 'Ad Format', value: li.adFormat.length > 0 ? li.adFormat.join(', ') : '—' },
                  { label: 'Impressions', value: li.impressions ? Number(li.impressions).toLocaleString('en-IN') : '—' },
                  { label: 'Creatives', value: li.creatives.length > 0 ? `${li.creatives.length} file(s): ${li.creatives.map(f => f.name).join(', ')}` : '—' },
                  { label: 'Landing Page', value: li.landingPage || '—' },
                ].map((row, j) => (
                  <div key={row.label} className="cc-review-row" style={{ background: j % 2 === 0 ? '#fff' : 'var(--slate-100)' }}>
                    <span className="cc-review-row-key">{row.label}</span>
                    <span className="cc-review-row-val">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ marginTop: 18 }}>
        <InfoBox variant="amber">
          Once created, you can manage line items, add creatives and launch the campaign from the campaigns dashboard.
        </InfoBox>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Campaign_Create() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? 64 : 240;
  const [activeStep, setActiveStep] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1
  const [client, setClient] = useState('');
  const [clientId, setClientId] = useState('');  // ✅ add this
  const [advertiser, setAdvertiser] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Step 2
  const [campaignName, setCampaignName] = useState('');
  const [clientCampaignId, setClientCampaignId] = useState('');
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [buyingType, setBuyingType] = useState<string[]>([]);
  const [objective, setObjective] = useState('');
  const [notes, setNotes] = useState('');

  // Step 3
  const [age, setAge] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [geoLocations, setGeoLocations] = useState<GeoLocation[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [freqCap, setFreqCap] = useState('');
  const [brandSafety, setBrandSafety] = useState('');
  const [viewability, setViewability] = useState('');

  // Step 4 — Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMsg('');

    // In handleSubmit — update geo string to include new fields
    const geoString = geoLocations.map(loc =>
      [loc.country, loc.state, loc.city, loc.zipcode, loc.range].filter(Boolean).join(' > ')
    ).join('; ');

    const fd = new FormData();
    fd.append('client', clientId);
    fd.append('client_name', client);
    fd.append('advertiser', advertiser);
    fd.append('campaign_name', campaignName);
    fd.append('campaign_type', campaignType);
    fd.append('buying_type', buyingType.join(', '));
    fd.append('objective', objective);
    fd.append('age', age.join(', '));
    fd.append('gender', gender);
    fd.append('geo_targeting', geoString);
    fd.append('platforms', platforms.join(', '));
    fd.append('brand_safety', brandSafety);
    fd.append('start_date', startDate);
    fd.append('end_date', endDate);
    if (websiteUrl) fd.append('website_url', websiteUrl);
    if (clientCampaignId) fd.append('client_campaign_id', clientCampaignId);
    if (purchaseOrderId) fd.append('purchase_order_id', purchaseOrderId);
    if (notes) fd.append('notes', notes);
    if (freqCap) fd.append('frequency_cap', freqCap);
    if (viewability) fd.append('viewability_goal', viewability);

    // Serialize line items (metadata as JSON, files appended separately)
    fd.append('line_items', JSON.stringify(
      lineItems.map(li => ({
        lineItemName: li.lineItemName,
        ethnicity: li.ethnicity,
        startDate: li.startDate,
        endDate: li.endDate,
        adFormat: li.adFormat,
        impressions: li.impressions,
        landingPage: li.landingPage,
        creatives: li.creatives.map(f => f.name),
      }))
    ));
    lineItems.forEach((li, i) => {
      li.creatives.forEach(file => {
        fd.append(`line_item_${i}_creative`, file, file.name);
      });
    });

    try {
      const res = await fetch(SUBMIT_URL, { method: 'POST', body: fd });
      if (res.ok) {
        setSubmitStatus('success');
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

  const STEPS = [
    { n: 1, label: 'Select Client & Advertiser', sub: 'Choose client and advertiser' },
    { n: 2, label: 'Campaign Details', sub: 'Basic campaign information' },
    { n: 3, label: 'Objectives & Settings', sub: 'Define goals and settings' },
    { n: 4, label: 'Line Item Details', sub: 'Add line items' },
    { n: 5, label: 'Review & Confirm', sub: 'Review and create campaign' },
  ];

  const stepTitles: Record<number, { title: string; sub: string }> = {
    1: { title: 'Select Client & Advertiser', sub: 'Choose the client and advertiser for this campaign' },
    2: { title: 'Campaign Details', sub: 'Provide basic information about the campaign' },
    3: { title: 'Objectives & Settings', sub: 'Define target audience and platform settings' },
    4: { title: 'Line Item Details', sub: 'Add one or more line items for this campaign' },
    5: { title: 'Review & Confirm', sub: 'Review all details before creating the campaign' },
  };

  return (
    <div className="cc-root">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div className="cc-main" style={{ marginLeft: sideWidth }}>

        {/* Topbar */}
        <header className="cc-topbar">
          <div className="cc-topbar-breadcrumb">
            <Link to="/user_campaigns" style={{ color: 'var(--slate-500)', textDecoration: 'none' }}>Campaigns</Link>
            <RightOutlined style={{ fontSize: 13 }} />
            <span style={{ color: 'var(--slate)', fontWeight: 600 }}>Create Campaign</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="cc-topbar-bell">
              <BellOutlined style={{ fontSize: 15, color: 'var(--slate-500)' }} />
              <span className="cc-topbar-bell-dot" />
            </div>
            <div className="cc-topbar-avatar">AK</div>
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          <div className="cc-page-header">
            <h1 className="cc-page-title">Create New Campaign</h1>
            <p className="cc-page-sub">Follow the steps below to create a new campaign</p>
          </div>

          {submitStatus === 'success' && (
            <div className="cc-banner cc-banner-success">✅ Campaign created successfully! Redirecting…</div>
          )}
          {submitStatus === 'error' && (
            <div className="cc-banner cc-banner-error">❌ Submission failed: {errorMsg}</div>
          )}

          {/* Stepper */}
          <div className="cc-stepper-wrap">
            <div className="cc-stepper">
              {STEPS.map((s, i) => {
                const isActive = s.n === activeStep;
                const isDone = s.n < activeStep;
                return (
                  <React.Fragment key={s.n}>
                    <div className={`cc-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`} onClick={() => isDone && setActiveStep(s.n)}>
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
          <div className="cc-content-wrap" key={activeStep}>
            <div className="cc-card">
              <div className="cc-card-header">
                <div className="cc-card-step-badge">{activeStep}</div>
                <div>
                  <div className="cc-card-title">{stepTitles[activeStep].title}</div>
                  <div className="cc-card-sub">{stepTitles[activeStep].sub}</div>
                </div>
                <div className="cc-card-step-count">Step {activeStep} of {STEPS.length}</div>
              </div>
              <div className="cc-card-body">
                {activeStep === 1 && (
                  <Step1
                    client={client} setClient={setClient}
                    setClientId={setClientId}
                    advertiser={advertiser} setAdvertiser={setAdvertiser}
                    websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
                  />
                )}
                {activeStep === 2 && (
                  <Step2
                    campaignId=""
                    campaignName={campaignName} setCampaignName={setCampaignName}
                    clientCampaignId={clientCampaignId} setClientCampaignId={setClientCampaignId}
                    purchaseOrderId={purchaseOrderId} setPurchaseOrderId={setPurchaseOrderId}
                    campaignType={campaignType} setCampaignType={setCampaignType}
                    buyingType={buyingType} setBuyingType={setBuyingType}
                    objective={objective} setObjective={setObjective}
                    notes={notes} setNotes={setNotes}
                    startDate={startDate} setStartDate={setStartDate}
                    endDate={endDate} setEndDate={setEndDate}
                  />
                )}
                {activeStep === 3 && (
                  <Step3
                    age={age} setAge={setAge}
                    gender={gender} setGender={setGender}
                    geoLocations={geoLocations} setGeoLocations={setGeoLocations}
                    platforms={platforms} setPlatforms={setPlatforms}
                    freqCap={freqCap} setFreqCap={setFreqCap}
                    brandSafety={brandSafety} setBrandSafety={setBrandSafety}
                    viewability={viewability} setViewability={setViewability}
                  />
                )}
                
                {activeStep === 4 && (
                  <Step4LineItems
                    campaignStartDate={startDate}
                    campaignEndDate={endDate}
                    lineItems={lineItems}
                    setLineItems={setLineItems}
                  />
                )}
                {activeStep === 5 && (
                  <Step5Review
                    client={client} advertiser={advertiser} websiteUrl={websiteUrl}
                    campaignName={campaignName}
                    clientCampaignId={clientCampaignId} purchaseOrderId={purchaseOrderId}
                    campaignType={campaignType} buyingType={buyingType}
                    objective={objective} notes={notes}
                    age={age} gender={gender}
                    geoLocations={geoLocations} platforms={platforms}
                    freqCap={freqCap} brandSafety={brandSafety} viewability={viewability}
                    startDate={startDate} endDate={endDate} 
                    lineItems={lineItems}
                    onEdit={() => setActiveStep(1)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="cc-bottom-bar">
            <Button className="cc-btn-cancel" onClick={() => navigate('/user_campaigns')}>Cancel</Button>
            <div className="cc-bottom-bar-actions">
              {activeStep > 1 && (
                <Button className="cc-btn-back" onClick={() => setActiveStep(s => s - 1)}>← Back</Button>
              )}
              {activeStep < 5 ? (
                <Button type="primary" className="cc-btn-next" onClick={() => setActiveStep(s => s + 1)} icon={<ArrowRightOutlined />} iconPosition="end">
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
                  {submitting ? 'Creating…' : 'Create Campaign'}
                </Button>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}