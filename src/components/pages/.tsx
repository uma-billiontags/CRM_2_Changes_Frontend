import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Form, Input, Select, Button, DatePicker, InputNumber,
} from 'antd';
import {
  ArrowRightOutlined, CheckOutlined,
  LayoutOutlined, NotificationOutlined, PlusOutlined,
  FileTextOutlined, SettingOutlined, LogoutOutlined,
  BellOutlined, RightOutlined, HistoryOutlined,
  WifiOutlined, EditOutlined, AppstoreOutlined,
  DownOutlined, CloseOutlined, InfoCircleOutlined,
  EnvironmentOutlined, CreditCardOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import '../styles/Campaign_Create.css';

const { TextArea } = Input;

const SUBMIT_URL = 'https://grinch-revocable-cornflake.ngrok-free.dev/create_campaign/';
const CLIENT_URL = 'https://grinch-revocable-cornflake.ngrok-free.dev/get_client/CLT-2026-00003/';

// ── Geo Data ─────────────────────────────────────────────────────────────────
const GEO_DATA: Record<string, Record<string, string[]>> = {
  India: {
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
    Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubli', 'Belagavi'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli'],
    Delhi: ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Lajpat Nagar'],
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  },
  USA: {
    California: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse'],
    Texas: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
    Florida: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
    Illinois: ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville'],
  },
  UK: {
    England: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool'],
    Scotland: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness'],
    Wales: ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry'],
    'Northern Ireland': ['Belfast', 'Derry', 'Lisburn', 'Newry', 'Armagh'],
    'East of England': ['Cambridge', 'Norwich', 'Ipswich', 'Peterborough', 'Luton'],
  },
};
const COUNTRIES = Object.keys(GEO_DATA);

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
interface GeoLocation { country: string; state: string; city: string; }

// ── GeoTargeting ─────────────────────────────────────────────────────────────
function GeoTargeting({ locations, onAdd, onRemove }: { locations: GeoLocation[]; onAdd: (l: GeoLocation) => void; onRemove: (i: number) => void }) {
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [isOthers, setIsOthers] = useState(false);
  const [customCountry, setCustomCountry] = useState('');
  const [customState, setCustomState] = useState('');
  const [customCity, setCustomCity] = useState('');

  const stateOpts = country ? Object.keys(GEO_DATA[country] || {}) : [];
  const cityOpts = country && state ? GEO_DATA[country][state] || [] : [];

  const handleAdd = () => {
    if (isOthers) {
      if (!customCountry.trim()) return;
      onAdd({ country: customCountry.trim(), state: customState.trim(), city: customCity.trim() });
      setCustomCountry(''); setCustomState(''); setCustomCity('');
    } else {
      if (!country) return;
      onAdd({ country, state, city });
      setCountry(''); setState(''); setCity('');
    }
  };

  const disabled = isOthers ? !customCountry.trim() : !country;
  const fmt = (l: GeoLocation) => [l.country, l.state, l.city].filter(Boolean).join(' › ');

  return (
    <div>
      <div className="cc-geo-mode-toggles">
        <button className={`cc-geo-mode-btn ${!isOthers ? 'active' : 'inactive'}`} onClick={() => { setIsOthers(false); }}>
          From List
        </button>
        <button className={`cc-geo-mode-btn ${isOthers ? 'active' : 'inactive'}`} onClick={() => { setIsOthers(true); setCountry(''); setState(''); setCity(''); }}>
          <EditOutlined style={{ fontSize: 11 }} /> Others (Custom)
        </button>
        <span style={{ fontSize: 11, color: 'var(--slate-400)', marginLeft: 4 }}>
          {isOthers ? 'Type any location not listed above' : 'Select from predefined locations'}
        </span>
      </div>

      {!isOthers && (
        <div className="cc-geo-grid">
          <div>
            <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)' }}>
              <EnvironmentOutlined style={{ color: 'var(--blue)' }} /> Country
            </div>
            <Select
              value={country || undefined}
              onChange={v => { setCountry(v); setState(''); setCity(''); }}
              placeholder="Select country…"
              options={toOpts(COUNTRIES)}
              style={{ width: '100%', height: 38 }}
            />
          </div>
          <div>
            <div className="cc-geo-sub-label" style={{ color: country ? 'var(--slate-500)' : 'var(--slate-300)' }}>
              <EnvironmentOutlined style={{ color: country ? 'var(--blue)' : 'var(--slate-300)' }} /> State / Region
            </div>
            <Select
              value={state || undefined}
              onChange={v => { setState(v); setCity(''); }}
              placeholder={country ? 'Select state…' : 'Select country first'}
              options={toOpts(stateOpts)}
              disabled={!country}
              style={{ width: '100%', height: 38 }}
            />
          </div>
          <div>
            <div className="cc-geo-sub-label" style={{ color: state ? 'var(--slate-500)' : 'var(--slate-300)' }}>
              <EnvironmentOutlined style={{ color: state ? 'var(--blue)' : 'var(--slate-300)' }} /> City
            </div>
            <Select
              value={city || undefined}
              onChange={setCity}
              placeholder={state ? 'Select city…' : 'Select state first'}
              options={toOpts(cityOpts)}
              disabled={!state}
              style={{ width: '100%', height: 38 }}
            />
          </div>
          <Button type="primary" disabled={disabled} onClick={handleAdd} icon={<PlusOutlined />} style={{ height: 38 }}>
            Add
          </Button>
        </div>
      )}

      {isOthers && (
        <div className="cc-geo-custom-box">
          <div className="cc-geo-custom-title">
            <InfoCircleOutlined /> Enter a custom location not available in the list above
          </div>
          <div className="cc-geo-grid">
            <div>
              <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)' }}>
                <EnvironmentOutlined style={{ color: 'var(--blue)' }} /> Country <span style={{ color: 'var(--red)' }}>*</span>
              </div>
              <Input placeholder="e.g. Japan" value={customCountry} onChange={e => setCustomCountry(e.target.value)} style={{ height: 38 }} />
            </div>
            <div>
              <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)' }}>
                <EnvironmentOutlined /> State / Region
              </div>
              <Input placeholder="e.g. Kanto" value={customState} onChange={e => setCustomState(e.target.value)} style={{ height: 38 }} />
            </div>
            <div>
              <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)' }}>
                <EnvironmentOutlined /> City
              </div>
              <Input placeholder="e.g. Tokyo" value={customCity} onChange={e => setCustomCity(e.target.value)} style={{ height: 38 }} />
            </div>
            <Button type="primary" disabled={disabled} onClick={handleAdd} icon={<PlusOutlined />} style={{ height: 38 }}>
              Add
            </Button>
          </div>
        </div>
      )}

      <div className="cc-geo-helper">
        <InfoCircleOutlined />
        {isOthers ? 'Country is required. State and City are optional.' : 'Select a country (required), then optionally narrow by state and city before adding.'}
      </div>

      {locations.length > 0 ? (
        <div className="cc-geo-tags">
          {locations.map((loc, idx) => (
            <span key={idx} className="cc-geo-tag">
              <EnvironmentOutlined style={{ fontSize: 10 }} />
              {fmt(loc)}
              <button className="cc-tag-remove" onClick={() => onRemove(idx)}><CloseOutlined style={{ fontSize: 10 }} /></button>
            </span>
          ))}
        </div>
      ) : (
        <div className="cc-geo-empty">No geo targets added yet. Select a country above to begin.</div>
      )}
    </div>
  );
}

// ── TagInput ──────────────────────────────────────────────────────────────────
function TagInput({ tags, onAdd, onRemove, options }: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const available = options.filter(o => !tags.includes(o));
  return (
    <div style={{ position: 'relative' }}>
      <div className="cc-tag-input" onClick={() => setOpen(p => !p)}>
        {tags.map(t => (
          <span key={t} className="cc-tag">
            {t}
            <button className="cc-tag-remove" onClick={e => { e.stopPropagation(); onRemove(t); }}>
              <CloseOutlined style={{ fontSize: 10 }} />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="cc-tag-placeholder">Select…</span>}
        <DownOutlined style={{ marginLeft: 'auto', color: 'var(--slate-400)', fontSize: 12, flexShrink: 0 }} />
      </div>
      {open && available.length > 0 && (
        <div className="cc-tag-dropdown">
          {available.map(o => (
            <div key={o} className="cc-tag-option" onClick={() => { onAdd(o); setOpen(false); }}>{o}</div>
          ))}
        </div>
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
function Step1({ client, setClient, advertiser, setAdvertiser, websiteUrl, setWebsiteUrl }: any) {
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
      })
      .catch(() => setClientName('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="cc-form-section-sm">
      <Form layout="vertical" className="cc-form">
        <Form.Item label="Company Name" required>
          <Input
            className="cc-company-name-input"
            value={loading ? 'Loading…' : clientName}
            disabled
            style={{ fontWeight: 600 }}
          />
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

        <Form.Item label="Website URL" >
          <Input
            placeholder="https://"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            style={{ height: 38 }}
          />
        </Form.Item>
      </Form>
    </div>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
function Step2({
  campaignId,
  campaignName, setCampaignName,
  clientCampaignId, setClientCampaignId,
  purchaseOrderId, setPurchaseOrderId,
  campaignType, setCampaignType,
  buyingType, setBuyingType,
  objective, setObjective,
  notes, setNotes,
}: any) {
  return (
    <div className="cc-form-section-sm">
      <Form layout="vertical" className="cc-form">
        <div className="cc-row-grid">
          <Form.Item label="Campaign ID">
            <div style={{
              display: 'flex',
              alignItems: 'center',
            }}>
              {campaignId ? (
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--slate-800)',
                }}>
                  {campaignId}
                </span>
              ) : (
                <span style={{
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: 'var(--slate-400)',
                  fontWeight: 400
                }}>
                  Auto-generated after save
                </span>
              )}
            </div>
          </Form.Item>

          <Form.Item label="Campaign Name" required>
            <Input
              placeholder="e.g. Summer Awareness 2024"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              style={{ height: 38 }}
            />
          </Form.Item>
        </div>

        <div className="cc-row-grid">
          <Form.Item label="Client Campaign ID" >
            <Input
              placeholder="Enter Client Campaign ID"
              value={clientCampaignId}
              onChange={e => setClientCampaignId(e.target.value)}
              style={{ height: 38 }}
            />
          </Form.Item>
          <Form.Item label="Purchase Order ID" >
            <Input
              placeholder="Enter Purchase Order ID"
              value={purchaseOrderId}
              onChange={e => setPurchaseOrderId(e.target.value)}
              style={{ height: 38 }}
            />
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
         
          <Form.Item label="Buying Type" required>
            <Select
              mode="multiple"
              value={buyingType}
              onChange={(vals) => setBuyingType(vals)}
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
        </div>

        <div className="cc-row-grid">
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
          <TextArea
            placeholder="Add any notes for internal reference"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
          />
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
              mode='multiple'
              value={age}
              onChange={(vals) => setAge(vals)}
              placeholder="Select Age"
              style={{ width: '100%' }}
              options={[
                { value: '18 to 24', label: '18 to 24' },
                { value: '25 to 34', label: '25 to 34' },
                { value: '35 to 44', label: '35 to 44' },
                { value: '45 to 54', label: '45 to 54' },
                { value: '55 to 64', label: '55 to 64' },
                {value: 'Others', label:'Others'}
              ]}
              maxTagCount="responsive"
            />
          </Form.Item>
          <Form.Item label="Gender" required>
            <Select
              value={gender || undefined}
              onChange={setGender}
              placeholder="Select Gender"
              style={{ width: '100%'}}
               options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
              ]}
              maxTagCount="responsive"
            />
          </Form.Item>
        </div>

        <Form.Item label="Geo Targeting" required >
          <div className="cc-geo-wrap">
            <div className="cc-geo-header">
              <div className="cc-geo-icon-wrap">
                <EnvironmentOutlined style={{ color: 'var(--blue)', fontSize: 13 }} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--slate-700)' }}>Location Targeting</div>
                <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>Country → State → City (cascading)</div>
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
          <TagInput
            tags={platforms}
            onAdd={t => setPlatforms((p: string[]) => [...p, t])}
            onRemove={t => setPlatforms((p: string[]) => p.filter((x: string) => x !== t))}
            options={['Display', 'Video', 'PMP', 'CTV', 'Audio', 'Native', 'DOOH', 'Mobile']}
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

// ── Step 4 ────────────────────────────────────────────────────────────────────
function Step4({ budgetType, setBudgetType, totalBudget, setTotalBudget, startDate, setStartDate, endDate, setEndDate, pacing, setPacing, dayParting, setDayParting, timezone, setTimezone, durationDays, dailyBudget }: any) {
  return (
    <div className="cc-form-section-sm">
      <Form layout="vertical" className="cc-form">
        <Form.Item label={<span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--slate-700)' }}>Budget Type <span style={{ color: 'var(--red)' }}>*</span></span>}>
          <div className="cc-budget-cards">
            {(['total', 'daily'] as const).map(t => (
              <div key={t} className={`cc-budget-card ${budgetType === t ? 'selected' : ''}`} onClick={() => setBudgetType(t)}>
                <div className={`cc-budget-card-radio ${budgetType === t ? 'selected' : ''}`}>
                  {budgetType === t && <div className="cc-budget-card-radio-dot" />}
                </div>
                <div>
                  <div className={`cc-budget-card-label ${budgetType === t ? 'selected' : ''}`}>
                    {t === 'total' ? 'Total Budget' : 'Daily Budget'}
                  </div>
                  <div className="cc-budget-card-hint">
                    {t === 'total' ? 'Fixed total spend cap' : 'Spend limit per day'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Form.Item>

        <Form.Item label="Total Budget (INR)" required>
          <div className="cc-budget-input-wrap">
            <div className="cc-budget-prefix">₹</div>
            <Input
              placeholder="e.g. 500000"
              value={totalBudget}
              onChange={e => setTotalBudget(e.target.value)}
              style={{ border: 'none', borderRadius: 0, height: 38 }}
            />
          </div>
        </Form.Item>

        <div className="cc-row-grid">
          <Form.Item label="Flight Start Date" required>
            <DatePicker
              style={{ width: '100%', height: 38 }}
              value={startDate ? dayjs(startDate) : null}
              onChange={(_, ds) => setStartDate(typeof ds === 'string' ? ds : '')}
            />
          </Form.Item>
          <Form.Item label="Flight End Date" required>
            <DatePicker
              style={{ width: '100%', height: 38 }}
              value={endDate ? dayjs(endDate) : null}
              onChange={(_, ds) => setEndDate(typeof ds === 'string' ? ds : '')}
            />
          </Form.Item>
        </div>

        <div className="cc-row-grid">
          <Form.Item label="Pacing" required>
            <Select
              value={pacing || undefined}
              onChange={setPacing}
              placeholder="Select pacing…"
              options={toOpts(['Even', 'Front-Loaded', 'Back-Loaded', 'ASAP'])}
              style={{ width: '100%', height: 38 }}
            />
          </Form.Item>
          <Form.Item label="Day Parting">
            <Select
              value={dayParting || undefined}
              onChange={setDayParting}
              placeholder="Select day parting…"
              options={toOpts(['All Day', 'Business Hours (9am–6pm)', 'Prime Time (6pm–11pm)', 'Custom'])}
              style={{ width: '100%', height: 38 }}
            />
          </Form.Item>
        </div>

        <Form.Item label="Time Zone">
          <Select
            value={timezone || undefined}
            onChange={setTimezone}
            placeholder="Select timezone…"
            options={toOpts(['Asia/Kolkata (IST)', 'UTC', 'America/New_York (EST)', 'Europe/London (GMT)'])}
            style={{ width: '100%', height: 38 }}
          />
        </Form.Item>

        <div className="cc-duration-box">
          <div className="cc-duration-row">
            <span className="cc-duration-label">Campaign Duration</span>
            <span className="cc-duration-value-blue">{durationDays > 0 ? `${durationDays} days` : '—'}</span>
          </div>
          <div className="cc-duration-row">
            <span className="cc-duration-label">Estimated Daily Budget</span>
            <span className="cc-duration-value-green">{dailyBudget}</span>
          </div>
        </div>
      </Form>
    </div>
  );
}

// ── Step 5 ────────────────────────────────────────────────────────────────────
function Step5({
  client, advertiser, websiteUrl,
  campaignName, clientCampaignId, purchaseOrderId,
  campaignType, buyingType, objective, notes,
  age, gender, geoLocations, platforms,
  freqCap, brandSafety, viewability,
  budgetType, totalBudget, startDate, endDate, durationDays,
  pacing, dayParting, timezone,
  onEdit,
}: any) {
  const geoString = geoLocations.length > 0
    ? geoLocations.map((l: GeoLocation) => [l.country, l.state, l.city].filter(Boolean).join(' › ')).join(', ')
    : '—';

  const rows = [
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
    { label: 'Primary Objective', value: age || '—' },
    { label: 'Target Audience', value: gender || '—' },
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

      <div className="cc-review-header">
        <span className="cc-review-label">Summary</span>
        <button className="cc-review-edit-btn" onClick={onEdit}>← Edit Details</button>
      </div>

      <div className="cc-review-table">
        {rows.map((row, i) => (
          <div key={row.label} className="cc-review-row" style={{ background: i % 2 === 0 ? '#fff' : 'var(--slate-100)' }}>
            <span className="cc-review-row-key">{row.label}</span>
            <span className="cc-review-row-val">{row.value}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <InfoBox variant="amber">
          Once created, you can add line items, creatives and launch the campaign from the campaigns dashboard.
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
  const [advertiser, setAdvertiser] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Step 2
  const [campaignName, setCampaignName] = useState('');
  const [clientCampaignId, setClientCampaignId] = useState('');
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [campaignType, setCampaignType] = useState('');
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

  // Step 4
  const [budgetType, setBudgetType] = useState<'total' | 'daily'>('total');
  const [totalBudget, setTotalBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pacing, setPacing] = useState('');
  const [dayParting, setDayParting] = useState('');
  const [timezone, setTimezone] = useState('');

  const durationDays = (() => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.round(diff / 86400000) + 1;
  })();

  const dailyBudget = (() => {
    const raw = parseFloat(totalBudget.replace(/,/g, ''));
    if (!raw || !durationDays) return '—';
    return '₹ ' + Math.round(raw / durationDays).toLocaleString('en-IN');
  })();

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMsg('');
    const geoString = geoLocations.map(loc => [loc.country, loc.state, loc.city].filter(Boolean).join(' > ')).join('; ');
    const fd = new FormData();
    fd.append('client', client);
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
    fd.append('budget_type', budgetType);
    fd.append('total_budget', totalBudget.replace(/,/g, ''));
    fd.append('start_date', startDate);
    fd.append('end_date', endDate);
    fd.append('pacing', pacing);
    fd.append('timezone', timezone || 'Asia/Kolkata (IST)');
    if (websiteUrl) fd.append('website_url', websiteUrl);
    if (clientCampaignId) fd.append('client_campaign_id', clientCampaignId);
    if (purchaseOrderId) fd.append('purchase_order_id', purchaseOrderId);
    if (notes) fd.append('notes', notes);
    if (freqCap) fd.append('frequency_cap', freqCap);
    if (viewability) fd.append('viewability_goal', viewability);
    if (dayParting) fd.append('day_parting', dayParting);
    try {
      const res = await fetch(SUBMIT_URL, { method: 'POST', body: fd });
      if (res.ok) {
        setSubmitStatus('success');
        setTimeout(() => navigate('/user_campaigns'), 1500);
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
    { n: 4, label: 'Budget & Schedule', sub: 'Set budget and timeline' },
    { n: 5, label: 'Review & Confirm', sub: 'Review and create campaign' },
  ];

  const stepTitles: Record<number, { title: string; sub: string }> = {
    1: { title: 'Select Client & Advertiser', sub: 'Choose the client and advertiser for this campaign' },
    2: { title: 'Campaign Details', sub: 'Provide basic information about the campaign' },
    3: { title: 'Objectives & Settings', sub: 'Define target audience and platform settings' },
    4: { title: 'Budget & Schedule', sub: 'Set budget, flight dates and pacing' },
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
                  <Step4
                    budgetType={budgetType} setBudgetType={setBudgetType}
                    totalBudget={totalBudget} setTotalBudget={setTotalBudget}
                    startDate={startDate} setStartDate={setStartDate}
                    endDate={endDate} setEndDate={setEndDate}
                    pacing={pacing} setPacing={setPacing}
                    dayParting={dayParting} setDayParting={setDayParting}
                    timezone={timezone} setTimezone={setTimezone}
                    durationDays={durationDays} dailyBudget={dailyBudget}
                  />
                )}
                {activeStep === 5 && (
                  <Step5
                    client={client} advertiser={advertiser} websiteUrl={websiteUrl}
                    campaignName={campaignName}
                    clientCampaignId={clientCampaignId} purchaseOrderId={purchaseOrderId}
                    campaignType={campaignType} buyingType={buyingType}
                    age={age} gender={gender}
                    geoLocations={geoLocations} platforms={platforms}
                    freqCap={freqCap} brandSafety={brandSafety} viewability={viewability}
                    budgetType={budgetType} totalBudget={totalBudget}
                    startDate={startDate} endDate={endDate} durationDays={durationDays}
                    pacing={pacing} dayParting={dayParting} timezone={timezone}
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