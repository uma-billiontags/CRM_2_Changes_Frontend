import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Form, Input, Select, Button, DatePicker, Divider, message
} from 'antd';
import {
  ArrowRightOutlined, CheckOutlined,
  PlusOutlined,
  CloseOutlined, InfoCircleOutlined,
  EnvironmentOutlined, DeleteOutlined, FileImageOutlined, VideoCameraOutlined,
  SaveOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import '../styles/Campaign_Create.css';
import type { LineItem, GeoLocation, LineItemCardProps, CreativeData } from '../types/campaign.form.types';

dayjs.extend(isBetween);

const { TextArea } = Input;

const BASE_URL = import.meta.env.VITE_BASE_URL;

const DRAFT_KEY = 'campaign_create_draft';
const NAV_FLAG_KEY = 'campaign_create_nav_to_creative';
const ALL_DRAFTS_KEY = 'campaign_all_drafts';

const CPM_RATES: Record<string, number> = {
  banner: 1,
  Interstitial: 1,
  video: 1.25,
  youtube: 1.25,
};

const CPC_RATES: Record<string, number> = {
  banner: 1,
  Interstitial: 1,
  video: 1.25,
  youtube: 1.25,
};

export interface SavedDraft {
  draftId: string;
  draftName: string;
  savedAt: string;
  activeStep: number;
  client: string;
  clientId: string;
  advertiser: string;
  websiteUrl: string;
  campaignName: string;
  clientCampaignId: string;
  purchaseOrderId: string;
  campaignType: string;
  startDate: string;
  endDate: string;
  buyingType: string[];
  objective: string;
  notes: string;
  lineItemOffset: number;
  confirmedLineItemIds: string[];
  lineItems: LineItem[];
}

export function getAllDrafts(): SavedDraft[] {
  try {
    const raw = localStorage.getItem(ALL_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNewDraft(data: Omit<SavedDraft, 'draftId' | 'savedAt'>): string {
  const drafts = getAllDrafts();
  const draftId = `DRAFT-${Date.now()}`;
  const newDraft: SavedDraft = { ...data, draftId, savedAt: new Date().toISOString() };
  drafts.push(newDraft);
  localStorage.setItem(ALL_DRAFTS_KEY, JSON.stringify(drafts));
  return draftId;
}

function updateExistingDraft(draftId: string, data: Omit<SavedDraft, 'draftId' | 'savedAt'>): void {
  const drafts = getAllDrafts();
  const idx = drafts.findIndex(d => d.draftId === draftId);
  if (idx >= 0) {
    drafts[idx] = { ...drafts[idx], ...data, savedAt: new Date().toISOString() };
    localStorage.setItem(ALL_DRAFTS_KEY, JSON.stringify(drafts));
  }
}

type LineItemCreativesMap = Record<string, CreativeData[]>;

function generateLineItemId(index: number, offset: number = 1): string {
  const clientName = localStorage.getItem('client_name') ?? '';
  const prefix = clientName
    ? clientName.replace(/\s+/g, '').substring(0, 4).toUpperCase()
    : 'USER';
  const paddedIndex = String(offset + index - 1).padStart(3, '0');
  return `LI${prefix}${paddedIndex}`;
}

// ── emptyLineItem now includes all targeting fields ──
function emptyLineItem(index: number, offset: number = 1): LineItem {
  return {
    id: generateLineItemId(index, offset),
    lineItemName: '',
    ethnicity: '',
    startDate: '',
    endDate: '',
    adFormat: '',
    impressions: '',
    units: '',
    creatives: [],
    ctr: '0.4',
    viewability: '70',
    vcr: '70',
    ctrNotes: '',
    unitCost: '',
    adSubFormatOpen: false,
    adSubFormat: [],
    rate: '',
    // ── Targeting fields (moved from old Step 3) ──
    age: [],
    gender: [],
    geoLocations: [],
    platforms: [],
    freqCap: '',
    brandSafety: '',
  };
}

function saveDraft(data: object) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function loadDraft(): Record<string, any> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

function setNavFlag() {
  try { sessionStorage.setItem(NAV_FLAG_KEY, '1'); } catch { /* ignore */ }
}

function consumeNavFlag(): boolean {
  try {
    const val = sessionStorage.getItem(NAV_FLAG_KEY);
    sessionStorage.removeItem(NAV_FLAG_KEY);
    return val === '1';
  } catch { return false; }
}

const ETHNICITY_OPTIONS = [
  'General', 'Asian', 'South Asian', 'African American',
  'Hispanic / Latino', 'Middle Eastern', 'Caucasian', 'Other',
];

const UNITS_OPTIONS = ['CPM', 'CPC'];

const AD_FORMAT_OPTIONS = [
  { value: 'banner', label: 'Banner' },
  { value: 'video', label: 'Video' },
  { value: 'youtube', label: 'Youtube' },
  { value: 'Interstitial', label: 'Interstitial' },
];

const AD_FORMAT_SUB_OPTIONS: Record<string, { value: string; label: string }[]> = {
  banner: [
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
  ],
  video: [
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'ctv', label: 'CTV' },
  ],
  youtube: [
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
  ],
  Interstitial: [
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
  ],
};

const AD_FORMAT_DEFAULT_SUBS: Record<string, string[]> = {
  banner: ['desktop', 'mobile'],
  video: ['desktop', 'mobile'],
  youtube: ['desktop', 'mobile'],
  Interstitial: ['desktop', 'mobile'],
};

const IMAGE_FORMATS = ['banner', 'Interstitial'];
const VIDEO_FORMATS = ['video', 'youtube'];

const toOpts = (arr: string[]) => arr.map(s => ({ value: s, label: s }));

function isLineItemComplete(item: LineItem): boolean {
  return !!(
    item.lineItemName.trim() &&
    item.startDate &&
    item.endDate &&
    item.adFormat.length > 0
  );
}

async function fetchLastLineItemOffset(): Promise<number> {
  try {
    const clientName = localStorage.getItem('client_name') ?? '';
    const prefix = clientName
      ? `LI${clientName.replace(/\s+/g, '').substring(0, 4).toUpperCase()}`
      : 'LIUSER';
    const res = await fetch(`${BASE_URL}/get_campaigns/`, {
      headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': '1' },
    });
    if (!res.ok) return 1;
    const data = await res.json();
    const allIds: string[] = [];
    (data || []).forEach((campaign: any) => {
      (campaign.line_items || []).forEach((li: any) => {
        if (li.line_item_id && li.line_item_id.startsWith(prefix)) allIds.push(li.line_item_id);
      });
    });
    if (allIds.length === 0) return 1;
    const nums = allIds.map(id => parseInt(id.replace(prefix, ''), 10)).filter(n => !isNaN(n));
    if (nums.length === 0) return 1;
    return Math.max(...nums) + 1;
  } catch { return 1; }
}

// ── GeoTargeting component (unchanged) ──
function GeoTargeting({ locations, onAdd, onRemove }: {
  locations: GeoLocation[];
  onAdd: (l: GeoLocation & { zipcode: string; range: string }) => void;
  onRemove: (i: number) => void;
}) {
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [address, setAddress] = useState('');
  const [range, setRange] = useState('');
  const [countryOpts, setCountryOpts] = useState<string[]>([]);
  const [stateOpts, setStateOpts] = useState<string[]>([]);
  const [cityOpts, setCityOpts] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [addingCountry, setAddingCountry] = useState(false);
  const [addingState, setAddingState] = useState(false);
  const [addingCity, setAddingCity] = useState(false);
  const [newCountry, setNewCountry] = useState('');
  const [newState, setNewState] = useState('');
  const [newCity, setNewCity] = useState('');
  const allStatesRef = useRef<string[]>([]);
  const allCitiesRef = useRef<string[]>([]);
  const rangeEnabled = !!city || !!address;
  const canAdd = !!(country || state || city || zipcode.trim() || address.trim());

  useEffect(() => {
    setLoadingCountries(true);
    fetch('https://countriesnow.space/api/v0.1/countries/positions')
      .then(r => r.json())
      .then(data => setCountryOpts((data.data || []).map((c: any) => c.name).sort()))
      .catch(() => console.warn('Failed to load countries'))
      .finally(() => setLoadingCountries(false));
  }, []);

  useEffect(() => {
    setLoadingStates(true);
    fetch('https://countriesnow.space/api/v0.1/countries/states')
      .then(r => r.json())
      .then(data => {
        const all = (data.data || []).flatMap((c: any) => (c.states || []).map((s: any) => s.name)).filter(Boolean).sort();
        const unique = [...new Set<string>(all)];
        allStatesRef.current = unique;
        setStateOpts(unique);
      })
      .catch(() => console.warn('Failed to load states'))
      .finally(() => setLoadingStates(false));
  }, []);

  useEffect(() => {
    setLoadingCities(true);
    fetch('https://countriesnow.space/api/v0.1/countries')
      .then(r => r.json())
      .then(data => {
        const all = (data.data || []).flatMap((c: any) => c.cities || []).sort();
        const unique = [...new Set<string>(all)];
        allCitiesRef.current = unique;
        setCityOpts(unique);
      })
      .catch(() => console.warn('Failed to load cities'))
      .finally(() => setLoadingCities(false));
  }, []);

  const fetchCitiesForCountry = (countryName: string): Promise<string[]> =>
    fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName }),
    }).then(r => r.json()).then(data => (data.data || []).sort()).catch(() => []);

  const fetchCitiesForState = async (countryName: string, stateName: string): Promise<string[]> => {
    try {
      const res = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName, state: stateName }),
      });
      const data = await res.json();
      const cities = (data.data || []).sort();
      if (cities.length > 0) return cities;
    } catch { }
    if (countryName) {
      const fallback = await fetchCitiesForCountry(countryName);
      if (fallback.length > 0) return fallback;
    }
    return allCitiesRef.current;
  };

  const handleCountryChange = (v: string) => {
    setCountry(v); setState(''); setCity('');
    if (!v) { setStateOpts(allStatesRef.current); setCityOpts(allCitiesRef.current); return; }
    setLoadingStates(true);
    fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: v }),
    }).then(r => r.json())
      .then(data => setStateOpts((data.data?.states || []).map((s: any) => s.name).sort().length > 0
        ? (data.data?.states || []).map((s: any) => s.name).sort()
        : allStatesRef.current))
      .catch(() => setStateOpts(allStatesRef.current))
      .finally(() => setLoadingStates(false));
    setLoadingCities(true);
    fetchCitiesForCountry(v)
      .then(cities => setCityOpts(cities.length > 0 ? cities : allCitiesRef.current))
      .finally(() => setLoadingCities(false));
  };

  const handleStateChange = (v: string) => {
    setState(v); setCity('');
    if (!v) {
      if (country) {
        setLoadingCities(true);
        fetchCitiesForCountry(country)
          .then(cities => setCityOpts(cities.length > 0 ? cities : allCitiesRef.current))
          .finally(() => setLoadingCities(false));
      } else { setCityOpts(allCitiesRef.current); }
      return;
    }
    setLoadingCities(true);
    fetchCitiesForState(country, v).then(cities => setCityOpts(cities)).finally(() => setLoadingCities(false));
  };

  const commitNew = (val: string, opts: string[], setOpts: (o: string[]) => void,
    setValue: (v: string) => void, setAdding: (b: boolean) => void,
    setNew: (s: string) => void, extra?: () => void) => {
    const trimmed = val.trim();
    if (trimmed && !opts.includes(trimmed)) setOpts([...opts, trimmed].sort());
    if (trimmed) setValue(trimmed);
    extra?.(); setNew(''); setAdding(false);
  };

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({ country, state, city, address, zipcode: zipcode.trim(), range: range.trim() });
    setCountry(''); setState(''); setCity(''); setAddress(''); setZipcode(''); setRange('');
  };

  const fmt = (l: any) => [l.country, l.state, l.city, l.address, l.zipcode, l.range].filter(Boolean).join(' › ');

  const dropdownFooter = (setAdding: (b: boolean) => void, menu: React.ReactNode) => (
    <>
      {menu}
      <Divider style={{ margin: '4px 0' }} />
      <div onMouseDown={e => e.preventDefault()} onClick={() => setAdding(true)}
        style={{ padding: '8px 12px', cursor: 'pointer', color: '#4f46e5', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        <PlusOutlined /> Add new
      </div>
    </>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: 'var(--blue)', marginRight: 4 }} />Country
          </div>
          {addingCountry ? (
            <Input autoFocus placeholder="Type and press Enter to save" value={newCountry}
              suffix={<span style={{ fontSize: 11, color: '#aaa' }}>↵ Enter</span>} style={{ height: 38 }}
              onChange={e => setNewCountry(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitNew(newCountry, countryOpts, setCountryOpts, setCountry, setAddingCountry, setNewCountry, () => { setState(''); setCity(''); });
                if (e.key === 'Escape') { setNewCountry(''); setAddingCountry(false); }
              }}
              onBlur={() => { setNewCountry(''); setAddingCountry(false); }} />
          ) : (
            <Select showSearch allowClear placeholder={loadingCountries ? 'Loading…' : 'Select country…'}
              loading={loadingCountries} style={{ width: '100%', height: 38 }} value={country || undefined}
              onChange={v => handleCountryChange(v ?? '')}
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              dropdownRender={menu => dropdownFooter(setAddingCountry, menu)}
              options={countryOpts.map(c => ({ value: c, label: c }))} />
          )}
        </div>
        <div>
          <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: 'var(--blue)', marginRight: 4 }} />State
          </div>
          {addingState ? (
            <Input autoFocus placeholder="Type and press Enter to save" value={newState}
              suffix={<span style={{ fontSize: 11, color: '#aaa' }}>↵ Enter</span>} style={{ height: 38 }}
              onChange={e => setNewState(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitNew(newState, stateOpts, setStateOpts, setState, setAddingState, setNewState, () => setCity(''));
                if (e.key === 'Escape') { setNewState(''); setAddingState(false); }
              }}
              onBlur={() => { setNewState(''); setAddingState(false); }} />
          ) : (
            <Select showSearch allowClear placeholder={loadingStates ? 'Loading…' : 'Select state…'}
              loading={loadingStates} style={{ width: '100%', height: 38 }} value={state || undefined}
              onChange={v => handleStateChange(v ?? '')}
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              dropdownRender={menu => dropdownFooter(setAddingState, menu)}
              options={stateOpts.map(s => ({ value: s, label: s }))} />
          )}
        </div>
        <div>
          <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: 'var(--blue)', marginRight: 4 }} />City
          </div>
          {addingCity ? (
            <Input autoFocus placeholder="Type and press Enter to save" value={newCity}
              suffix={<span style={{ fontSize: 11, color: '#aaa' }}>↵ Enter</span>} style={{ height: 38 }}
              onChange={e => setNewCity(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitNew(newCity, cityOpts, setCityOpts, setCity, setAddingCity, setNewCity);
                if (e.key === 'Escape') { setNewCity(''); setAddingCity(false); }
              }}
              onBlur={() => { setNewCity(''); setAddingCity(false); }} />
          ) : (
            <Select showSearch allowClear placeholder={loadingCities ? 'Loading…' : 'Select city…'}
              loading={loadingCities} style={{ width: '100%', height: 38 }} value={city || undefined}
              onChange={v => setCity(v ?? '')}
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              dropdownRender={menu => dropdownFooter(setAddingCity, menu)}
              options={cityOpts.map(c => ({ value: c, label: c }))} />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
        <div>
          <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: 'var(--blue)', marginRight: 4 }} />Address
          </div>
          <Input placeholder="e.g. 123 Main St" value={address} onChange={e => setAddress(e.target.value)} style={{ height: 38, width: 300 }} />
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
          <Input placeholder="e.g. 10 km" value={range} disabled={!rangeEnabled} onChange={e => setRange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && rangeEnabled) handleAdd(); }}
            style={{ width: 100, height: 38, backgroundColor: rangeEnabled ? '#fff' : '#f5f5f5', cursor: rangeEnabled ? 'text' : 'not-allowed' }} />
        </div>
        <Button type="primary" disabled={!canAdd} onClick={handleAdd} icon={<PlusOutlined />} style={{ height: 38 }}>Add</Button>
      </div>

      <div className="cc-geo-helper" style={{ marginBottom: 8 }}>
        <InfoCircleOutlined style={{ marginRight: 4 }} />
        Select at least one field or enter a Zip Code. Range enables after city or address is entered.
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
        <div className="cc-geo-empty">No geo targets added yet.</div>
      )}
    </div>
  );
}

function InfoBox({ variant = 'blue', children }: { variant?: 'blue' | 'amber'; children: React.ReactNode }) {
  return (
    <div className={`cc-info-box ${variant}`}>
      <InfoCircleOutlined style={{ color: variant === 'blue' ? 'var(--blue)' : 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
      <p>{children}</p>
    </div>
  );
}

// ── Step 1 ──
function Step1({ setClient, setClientId, advertiser, setAdvertiser, websiteUrl, setWebsiteUrl, setClientCountry, setClientCurrencySymbol, superadminMode }: any) {
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);

  // ── Admin mode: fetch all clients for dropdown ──
  const [allClients, setAllClients] = useState<{ client_id: string; name: string; country?: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  useEffect(() => {
    if (superadminMode) {
      // Fetch all approved clients for dropdown
      fetch(`${BASE_URL}/get_all_clients/`, {
        headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': '1' },
      })
        .then(res => res.json())
        .then((data: any[]) => {
          const approved = data.filter(c => c.status === 'approved');
          setAllClients(approved.map(c => ({ client_id: c.client_id, name: c.name, country: c.country })));
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    } else {
      // Normal client mode — use localStorage
      const clientId = localStorage.getItem('client_id');
      if (!clientId) { setClientName('No client linked'); setLoading(false); return; }
      fetch(`${BASE_URL}/get_client/${clientId}/`, {
        headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': '1' },
      })
        .then(res => res.json())
        .then(async (data) => {
          setClientName(data.name || '');
          setClient(data.name || '');
          setClientId(data.client_id || '');
          localStorage.setItem('client_name', data.name || '');
          const country = data.country || '';
          setClientCountry(country);
          if (country) {
            try {
              const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fields=currencies`);
              if (!r.ok) throw new Error('Failed to fetch');
              const countryData = await r.json();
              const currencies = countryData?.[0]?.currencies ?? {};
              const firstCurrency = Object.values(currencies)[0] as { name: string; symbol: string } | undefined;
              setClientCurrencySymbol(firstCurrency?.symbol ?? '$');
            } catch { setClientCurrencySymbol('$'); }
          }
        })
        .catch(() => setClientName('Failed to load'))
        .finally(() => setLoading(false));
    }
  }, [superadminMode]);

  // When admin selects a client from dropdown
  const handleAdminClientSelect = async (clientId: string) => {
    setSelectedClientId(clientId);
    const found = allClients.find(c => c.client_id === clientId);
    if (!found) return;
    setClient(found.name);
    setClientId(found.client_id);
    setClientCountry(found.country || '');
    if (found.country) {
      try {
        const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(found.country)}?fields=currencies`);
        const countryData = await r.json();
        const currencies = countryData?.[0]?.currencies ?? {};
        const firstCurrency = Object.values(currencies)[0] as { name: string; symbol: string } | undefined;
        setClientCurrencySymbol(firstCurrency?.symbol ?? '$');
      } catch { setClientCurrencySymbol('$'); }
    }
  };

  return (
    <div className="cc-form-section-sm">
      <Form layout="vertical" className="cc-form">

        {superadminMode ? (
          // ── Admin: show client dropdown ──
          <Form.Item label="Select Client" required>
            {loading ? (
              <Input disabled value="Loading clients…" />
            ) : (
              <Select
                showSearch
                placeholder="Select a client…"
                style={{ width: '100%', height: 38 }}
                value={selectedClientId || undefined}
                onChange={handleAdminClientSelect}
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={allClients.map(c => ({
                  value: c.client_id,
                  label: `${c.name} (${c.client_id})`,
                }))}
              />
            )}
            {selectedClientId && (
              <div style={{
                marginTop: 8, padding: '6px 12px', background: '#f0fdf4',
                border: '1px solid #86efac', borderRadius: 8,
                fontSize: 12, color: '#15803d', fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                ✓ Selected: {allClients.find(c => c.client_id === selectedClientId)?.name} — {selectedClientId}
              </div>
            )}
          </Form.Item>
        ) : (
          // ── Client mode: show fixed company name ──
          <Form.Item label="Company Name" required>
            <Input
              className="cc-company-name-input"
              value={loading ? 'Loading…' : clientName}
              disabled
              style={{ fontWeight: 600 }}
            />
          </Form.Item>
        )}

        <Form.Item label="Advertiser (Brand)" required>
          <Input value={advertiser} onChange={(e) => setAdvertiser(e.target.value)} placeholder="Enter advertiser name…" style={{ width: '100%', height: 38 }} />
        </Form.Item>
        <InfoBox variant="blue">
          All campaigns, line items, creatives and reports will be mapped under the selected client and advertiser. This cannot be changed after creation.
        </InfoBox>
        <Form.Item label="Website URL" name="websiteUrl" validateTrigger="onChange"
          rules={[{ pattern: /^(https?:\/\/)(localhost|\d{1,3}(\.\d{1,3}){3}|[\w\-]+(\.[\w\-]+)+)(:\d+)?(\/[^\s]*)?$/, message: "Enter a valid URL starting with http:// or https://" }]}>
          <Input placeholder="https://" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} style={{ height: 38 }} />
        </Form.Item>
      </Form>
    </div>
  );
}

// ── Step 2 ──
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
              {campaignId
                ? <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-800)' }}>{campaignId}</span>
                : <span style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--slate-400)', fontWeight: 400 }}>Auto-generated after save</span>}
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
            <Select value={campaignType || undefined} onChange={setCampaignType} placeholder="Select type…"
              options={toOpts(['Brand Awareness', 'Performance', 'Retargeting', 'Prospecting', 'Lead Generation'])}
              style={{ width: '100%', height: 38 }} />
          </Form.Item>
          <Form.Item label="Campaign Start Date" required>
            <DatePicker style={{ width: '100%', height: 38 }} value={startDate ? dayjs(startDate) : null}
              onChange={(_, ds) => setStartDate(typeof ds === 'string' ? ds : '')} />
          </Form.Item>
          <Form.Item label="Campaign End Date" required>
            <DatePicker style={{ width: '100%', height: 38 }} value={endDate ? dayjs(endDate) : null}
              onChange={(_, ds) => setEndDate(typeof ds === 'string' ? ds : '')} />
          </Form.Item>
          <Form.Item label="Buying Type" required>
            <Select mode="multiple" value={buyingType} onChange={(vals: string[]) => setBuyingType(vals)}
              placeholder="Select buying type…" style={{ width: '100%' }} maxTagCount="responsive" menuItemSelectedIcon={null}
              optionRender={(option) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" readOnly checked={buyingType.includes(option.value as string)}
                    style={{ accentColor: '#4f46e5', width: 14, height: 14, cursor: 'pointer' }} />
                  <span>{option.label}</span>
                </div>
              )}
              options={[
                { value: 'Programmatic (DV360)', label: 'Programmatic (DV360)' },
                { value: 'Direct', label: 'Direct' },
                { value: 'Programmatic Guaranteed', label: 'Programmatic Guaranteed' },
                { value: 'Preferred Deal', label: 'Preferred Deal' },
                { value: 'Open Auction', label: 'Open Auction' },
              ]} />
          </Form.Item>
          <Form.Item label="Campaign Objective" required>
            <Select value={objective || undefined} onChange={setObjective} placeholder="Select objective…"
              options={toOpts(['Increase Brand Awareness', 'Drive Website Traffic', 'Generate Leads', 'Boost Sales', 'App Installs'])}
              style={{ width: '100%', height: 38 }} />
          </Form.Item>
        </div>
        <Form.Item label="Notes">
          <TextArea placeholder="Add any notes for internal reference" value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
        </Form.Item>
      </Form>
    </div>
  );
}

// ── LineItemCard (Step 3 targeting fields now live here) ──
interface ExtendedLineItemCardProps extends LineItemCardProps {
  lineItemCreatives: LineItemCreativesMap;
  allLineItemCreatives: LineItemCreativesMap;
  idConfirmed: boolean;
  clientCurrencySymbol: string;
}

function LineItemCard({
  item, index, campaignStart, campaignEnd, onChange, onRemove, canRemove,
  lineItemCreatives, allLineItemCreatives, idConfirmed, clientCurrencySymbol,
}: ExtendedLineItemCardProps) {
  const [dateError, setDateError] = useState('');
  const navigate = useNavigate();

  const hasImageFormat = IMAGE_FORMATS.includes(item.adFormat);
  const hasVideoFormat = VIDEO_FORMATS.includes(item.adFormat);
  const showCTR = hasImageFormat || hasVideoFormat;
  const showViewability = hasImageFormat || hasVideoFormat;
  const showVCR = hasVideoFormat;

  const uploadedImageCreatives = lineItemCreatives[item.id + '_image'] || [];
  const uploadedVideoCreatives = lineItemCreatives[item.id + '_video'] || [];

  const currencySymbol = clientCurrencySymbol || '$';

  const calculatedUnitCost = useMemo(() => {
    const impressions = parseFloat(item.impressions);
    const unit = item.units;
    const adFormat = item.adFormat;
    const rate = parseFloat(item.rate) || (unit === 'CPM' ? (CPM_RATES[adFormat] ?? 1) : (CPC_RATES[adFormat] ?? 1));
    if (!impressions || !unit || !adFormat) return null;
    if (unit === 'CPM') {
      const budget = (impressions * rate) / 1000;
      return { budget, rate, formula: `(${impressions.toLocaleString('en-IN')} × ${rate}) / 1000` };
    }
    if (unit === 'CPC') {
      const budget = impressions * rate;
      return { budget, rate, formula: `${impressions.toLocaleString('en-IN')} × ${rate}` };
    }
    return null;
  }, [item.impressions, item.units, item.adFormat, item.rate]);

  function validateDates(start: string, end: string): string {
    if (!campaignStart || !campaignEnd) return '';
    const cStart = dayjs(campaignStart);
    const cEnd = dayjs(campaignEnd);
    if (start) {
      const s = dayjs(start);
      if (s.isBefore(cStart, 'day') || s.isAfter(cEnd, 'day'))
        return `Start date must be between ${cStart.format('DD MMM YYYY')} and ${cEnd.format('DD MMM YYYY')}.`;
    }
    if (end) {
      const e = dayjs(end);
      if (e.isBefore(cStart, 'day') || e.isAfter(cEnd, 'day'))
        return `End date must be between ${cStart.format('DD MMM YYYY')} and ${cEnd.format('DD MMM YYYY')}.`;
    }
    if (start && end && dayjs(end).isBefore(dayjs(start), 'day')) return 'End date must be after start date.';
    return '';
  }

  function handleStartDate(_: Dayjs | null, ds: string | null) {
    const val = typeof ds === 'string' ? ds : '';
    onChange(item.id, 'startDate', val);
    setDateError(validateDates(val, item.endDate));
  }

  function handleEndDate(_: Dayjs | null, ds: string | null) {
    const val = typeof ds === 'string' ? ds : '';
    onChange(item.id, 'endDate', val);
    setDateError(validateDates(item.startDate, val));
  }

  function disabledDate(current: Dayjs): boolean {
    if (!campaignStart || !campaignEnd) return false;
    return current.isBefore(dayjs(campaignStart), 'day') || current.isAfter(dayjs(campaignEnd), 'day');
  }

  function handleAdFormatChange(val: string) {
    onChange(item.id, 'adFormat', val ?? '');
    onChange(item.id, 'adSubFormat', val ? (AD_FORMAT_DEFAULT_SUBS[val] ?? []) : []);
    onChange(item.id, 'adSubFormatOpen', false);
    if (val && item.units) {
      onChange(item.id, 'rate', String(item.units === 'CPM' ? (CPM_RATES[val] ?? 1) : (CPC_RATES[val] ?? 1)));
    } else { onChange(item.id, 'rate', ''); }
    if (!val) { onChange(item.id, 'ctr', '0.4'); onChange(item.id, 'viewability', '70'); onChange(item.id, 'vcr', '70'); }
    if (!VIDEO_FORMATS.includes(val)) onChange(item.id, 'vcr', '70');
  }

  function handleUnitsChange(val: string) {
    onChange(item.id, 'units', val ?? '');
    if (val && item.adFormat) {
      onChange(item.id, 'rate', String(val === 'CPM' ? (CPM_RATES[item.adFormat] ?? 1) : (CPC_RATES[item.adFormat] ?? 1)));
    } else { onChange(item.id, 'rate', ''); }
  }

  const handleUploadCreatives = () => {
    setNavFlag();
    navigate('/creative_image_upload', {
      state: { lineItemId: item.id + '_image', returnTo: '/campaign_create', existingCreatives: uploadedImageCreatives, allLineItemCreatives }
    });
  };

  const handleUploadVideoCreatives = () => {
    setNavFlag();
    navigate('/creative_video_upload', {
      state: { lineItemId: item.id + '_video', returnTo: '/campaign_create', existingCreatives: uploadedVideoCreatives, allLineItemCreatives }
    });
  };

  // ── Safe arrays for item targeting fields ──
  const itemAge: string[] = Array.isArray(item.age) ? item.age : [];
  const itemGender: string[] = Array.isArray(item.gender) ? item.gender : [];
  const itemGeoLocations: GeoLocation[] = Array.isArray(item.geoLocations) ? item.geoLocations : [];
  const itemPlatforms: string[] = Array.isArray(item.platforms) ? item.platforms : [];

  return (
    <div style={{ border: '0.5px solid var(--color-border-secondary, #e2e8f0)', borderRadius: 12, background: '#fff', padding: '20px 24px', marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
            {index + 1}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-800, #1e293b)' }}>
            {item.lineItemName || `Line Item ${index + 1}`}
          </span>
        </div>
        {canRemove && (
          <button onClick={() => onRemove(item.id)}
            style={{ background: 'none', border: '0.5px solid #fca5a5', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#ef4444', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <DeleteOutlined style={{ fontSize: 12 }} /> Remove
          </button>
        )}
      </div>

      {idConfirmed && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '4px 10px' }}>
            <span style={{ fontSize: 10.5, color: '#15803d', fontWeight: 500, letterSpacing: '0.05em', marginRight: 8 }}>Line Item ID:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#14532d', fontFamily: 'monospace', letterSpacing: '0.03em' }}>{item.id}</span>
          </div>
        </div>
      )}

      {!idConfirmed && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fffbeb', border: '1px dashed #fcd34d', borderRadius: 8, padding: '4px 10px' }}>
            <InfoCircleOutlined style={{ fontSize: 11, color: '#d97706' }} />
            <span style={{ fontSize: 11.5, color: '#92400e' }}>
              Fill all required fields and click <strong>Next Step</strong> to generate Line Item ID
            </span>
          </div>
        </div>
      )}

      <Form layout="vertical">
        {/* Line Item Name + Ethnicity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Line Item Name <span style={{ color: '#ef4444' }}>*</span></span>} style={{ marginBottom: 14 }}>
            <Input placeholder="e.g. Mumbai Display — 18-34" value={item.lineItemName} onChange={e => onChange(item.id, 'lineItemName', e.target.value)} style={{ height: 38 }} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Ethnicity</span>} style={{ marginBottom: 14 }}>
            <Select value={item.ethnicity || undefined} onChange={(val: string) => onChange(item.id, 'ethnicity', val || '')}
              placeholder="Select ethnicity…" style={{ width: '100%' }}
              options={ETHNICITY_OPTIONS.map(e => ({ value: e, label: e }))} />
          </Form.Item>
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Start Date <span style={{ color: '#ef4444' }}>*</span></span>}
            style={{ marginBottom: dateError ? 4 : 14 }} validateStatus={dateError ? 'error' : ''}>
            <DatePicker style={{ width: '100%', height: 38 }} value={item.startDate ? dayjs(item.startDate) : null}
              onChange={handleStartDate} disabledDate={disabledDate}
              placeholder={campaignStart ? `From ${dayjs(campaignStart).format('DD MMM YYYY')}` : 'Select date'} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>End Date <span style={{ color: '#ef4444' }}>*</span></span>}
            style={{ marginBottom: dateError ? 4 : 14 }} validateStatus={dateError ? 'error' : ''}>
            <DatePicker style={{ width: '100%', height: 38 }} value={item.endDate ? dayjs(item.endDate) : null}
              onChange={handleEndDate} disabledDate={disabledDate}
              placeholder={campaignEnd ? `Until ${dayjs(campaignEnd).format('DD MMM YYYY')}` : 'Select date'} />
          </Form.Item>
        </div>

        {dateError && (
          <div style={{ background: '#fef2f2', border: '0.5px solid #fca5a5', borderRadius: 6, padding: '7px 12px', marginBottom: 14, fontSize: 12.5, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚠ {dateError}
          </div>
        )}

        {campaignStart && campaignEnd && (
          <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 14, background: '#f8fafc', borderRadius: 6, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4, border: '0.5px solid #e2e8f0' }}>
            Line Item Date: {dayjs(campaignStart).format('DD MMM YYYY')} → {dayjs(campaignEnd).format('DD MMM YYYY')}
          </div>
        )}

        {/* Ad Format */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Ad Format <span style={{ color: '#ef4444' }}>*</span></span>} style={{ marginBottom: 14 }}>
            {(() => {
              const [expandedFormat, setExpandedFormat] = React.useState<string | null>(null);
              const displayValue = item.adFormat
                ? item.adSubFormat.length > 0
                  ? `${AD_FORMAT_OPTIONS.find(f => f.value === item.adFormat)?.label} › ${(item.adSubFormat as string[]).map(s => AD_FORMAT_SUB_OPTIONS[item.adFormat]?.find(o => o.value === s)?.label).filter(Boolean).join(', ')}`
                  : AD_FORMAT_OPTIONS.find(f => f.value === item.adFormat)?.label
                : undefined;
              return (
                <Select value={displayValue} placeholder="Select format…" style={{ width: '100%', height: 38 }}
                  dropdownRender={() => (
                    <div style={{ padding: '4px 0' }}>
                      {AD_FORMAT_OPTIONS.map(fmt => {
                        const isExpanded = expandedFormat === fmt.value;
                        const isSelected = item.adFormat === fmt.value;
                        const subOpts = AD_FORMAT_SUB_OPTIONS[fmt.value] || [];
                        const selectedSubs: string[] = Array.isArray(item.adSubFormat) ? item.adSubFormat : [];
                        return (
                          <div key={fmt.value}>
                            <div style={{ display: 'flex', alignItems: 'center', padding: '7px 12px', cursor: 'pointer', background: isSelected ? '#eef2ff' : 'transparent', gap: 8, userSelect: 'none' }}
                              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'; }}
                              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                              onClick={e => {
                                e.stopPropagation();
                                if (subOpts.length > 0) { setExpandedFormat(isExpanded ? null : fmt.value); }
                                else { handleAdFormatChange(fmt.value); }
                              }}>
                              {subOpts.length > 0
                                ? <div style={{ width: 16, height: 16, border: '1px solid #94a3b8', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#64748b', background: '#fff', flexShrink: 0, lineHeight: 1, fontWeight: 400 }}>{isExpanded ? '−' : '+'}</div>
                                : <div style={{ width: 16, flexShrink: 0 }} />}
                              <span style={{ fontSize: 13, color: isSelected ? '#4f46e5' : '#1e293b', fontWeight: isSelected ? 600 : 400, flex: 1 }}>{fmt.label}</span>
                              {isSelected && selectedSubs.length > 0 && (
                                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                  {selectedSubs.map(s => {
                                    const subLabel = AD_FORMAT_SUB_OPTIONS[fmt.value]?.find(o => o.value === s)?.label;
                                    return <span key={s} style={{ fontSize: 9, fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '1px 5px', borderRadius: 3, border: '1px solid #c7d2fe' }}>{subLabel}</span>;
                                  })}
                                </div>
                              )}
                              {isSelected && subOpts.length === 0 && <CheckOutlined style={{ fontSize: 11, color: '#4f46e5' }} />}
                            </div>
                            {isExpanded && subOpts.length > 0 && (
                              <div style={{ background: '#fafbff' }}>
                                {subOpts.map(sub => {
                                  const isSubSelected = isSelected ? selectedSubs.includes(sub.value) : true;
                                  const handleSubToggle = (e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    if (!isSelected) { handleAdFormatChange(fmt.value); return; }
                                    const newSubs = isSubSelected ? selectedSubs.filter(s => s !== sub.value) : [...selectedSubs, sub.value];
                                    onChange(item.id, 'adSubFormat', newSubs);
                                  };
                                  return (
                                    <div key={sub.value} onClick={handleSubToggle}
                                      style={{ display: 'flex', alignItems: 'center', padding: '7px 12px 7px 36px', cursor: 'pointer', background: isSubSelected ? '#eef2ff' : 'transparent', gap: 8 }}
                                      onMouseEnter={e => { if (!isSubSelected) (e.currentTarget as HTMLDivElement).style.background = '#f1f5f9'; }}
                                      onMouseLeave={e => { if (!isSubSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                                      <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, border: `2px solid ${isSubSelected ? '#4f46e5' : '#94a3b8'}`, background: isSubSelected ? '#4f46e5' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                                        {isSubSelected && <CheckOutlined style={{ fontSize: 8, color: '#fff' }} />}
                                      </div>
                                      <span style={{ fontSize: 12.5, color: isSubSelected ? '#4f46e5' : '#374151', fontWeight: isSubSelected ? 600 : 400 }}>{sub.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  allowClear onClear={() => { handleAdFormatChange(''); setExpandedFormat(null); }} />
              );
            })()}
          </Form.Item>
        </div>

        {/* Creatives Upload */}
        <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>Creatives</span>} style={{ marginBottom: 14 }}>
          {item.adFormat.length === 0 && (
            <div style={{ border: '1px dashed #d1d5db', borderRadius: 8, padding: '14px 16px', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: 10 }}>
              <PlusOutlined style={{ fontSize: 16, color: '#d1d5db' }} />
              <div style={{ fontSize: 13, color: '#9ca3af' }}>Select an Ad Format above to enable upload</div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {item.adFormat === 'banner' && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1d4ed8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><FileImageOutlined /> Images</div>
                <button type="button" onClick={handleUploadCreatives}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', border: '1px solid #93c5fd', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', fontWeight: 500, fontSize: 13, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#dbeafe'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#93c5fd'; }}>
                  <FileImageOutlined style={{ fontSize: 14 }} /> Upload Image Creatives
                  {uploadedImageCreatives.length > 0 && <span style={{ marginLeft: 6, background: '#16a34a', color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>{uploadedImageCreatives.length} added</span>}
                </button>
                {uploadedImageCreatives.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {uploadedImageCreatives.map((creative: CreativeData, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: '#f0fdf4', borderRadius: 6, border: '0.5px solid #86efac', maxWidth: 260 }}>
                        {creative.main_asset && creative.main_asset.type?.startsWith('image/')
                          ? <img src={URL.createObjectURL(creative.main_asset)} alt={creative.creative_name} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0, border: '1px solid #d1fae5' }} />
                          : <FileImageOutlined style={{ color: '#16a34a', fontSize: 16, flexShrink: 0 }} />}
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: 12, color: '#14532d', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{creative.creative_name || `Creative ${idx + 1}`}</div>
                          {creative.dimensions && <div style={{ fontSize: 10.5, color: '#4ade80' }}>{creative.dimensions}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {item.adFormat === 'video' && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1d4ed8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><VideoCameraOutlined /> Videos</div>
                <button type="button" onClick={handleUploadVideoCreatives}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', border: '1px solid #ddd6fe', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', fontWeight: 500, fontSize: 13, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ede9fe'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#7c3aed'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f3ff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#ddd6fe'; }}>
                  <VideoCameraOutlined style={{ fontSize: 14 }} /> Upload Video Creatives
                  {uploadedVideoCreatives.length > 0 && <span style={{ marginLeft: 6, background: '#16a34a', color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>{uploadedVideoCreatives.length} added</span>}
                </button>
                {uploadedVideoCreatives.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {uploadedVideoCreatives.map((creative: CreativeData, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: '#f0fdf4', borderRadius: 6, border: '0.5px solid #86efac', maxWidth: 260 }}>
                        <VideoCameraOutlined style={{ color: '#16a34a', fontSize: 16, flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: 12, color: '#14532d', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{creative.creative_name || `Video ${idx + 1}`}</div>
                          {creative.dimensions && <div style={{ fontSize: 10.5, color: '#4ade80' }}>{creative.dimensions}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Form.Item>

        {/* Impressions + Units + Rate */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Impressions</span>} style={{ marginBottom: 14 }}>
            <Input placeholder="e.g. 1000000" value={item.impressions}
              onChange={e => onChange(item.id, 'impressions', e.target.value.replace(/[^0-9]/g, ''))}
              suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>impr.</span>} style={{ height: 38 }} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Units</span>} style={{ marginBottom: 14 }}>
            <Select value={item.units || undefined} onChange={handleUnitsChange} placeholder="Select unit…"
              style={{ width: '100%', height: 38 }} options={UNITS_OPTIONS.map(u => ({ value: u, label: u }))} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>Rate ({item.units})<span style={{ fontSize: 10.5, color: '#6366f1', fontWeight: 500, background: '#eef2ff', padding: '1px 6px', borderRadius: 4 }}>Editable</span></span>} style={{ marginBottom: 14 }}>
            <Input placeholder={item.units === 'CPM' ? 'e.g. 1.25' : 'e.g. 1.00'} value={item.rate}
              onChange={e => onChange(item.id, 'rate', e.target.value.replace(/[^0-9.]/g, ''))}
              prefix={<span style={{ fontSize: 11, color: '#94a3b8' }}>{currencySymbol}</span>}
              suffix={<span style={{ fontSize: 10, color: '#94a3b8' }}>{item.units === 'CPM' ? 'per 1000 impr.' : 'per click'}</span>}
              style={{ height: 38 }} />
          </Form.Item>
        </div>

        {/* Unit Cost */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>Unit Cost (Budget){calculatedUnitCost && <span style={{ fontSize: 10.5, color: '#6366f1', fontWeight: 500, background: '#eef2ff', padding: '1px 6px', borderRadius: 4 }}>Auto-calculated</span>}</span>} style={{ marginBottom: 0 }}>
            {calculatedUnitCost ? (
              <div style={{ height: 38, padding: '0 12px', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', border: '1.5px solid #86efac', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>{currencySymbol}{calculatedUnitCost.budget.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span style={{ fontSize: 10.5, color: '#4ade80', fontStyle: 'italic', whiteSpace: 'nowrap' }}>= {calculatedUnitCost.formula}</span>
              </div>
            ) : (
              <div style={{ height: 38, padding: '0 12px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: 12.5, gap: 6 }}>
                <InfoCircleOutlined style={{ fontSize: 11 }} /> Enter impressions, ad format &amp; unit to calculate
              </div>
            )}
          </Form.Item>
        </div>

        {/* CTR / Viewability / VCR */}
        {(showCTR || showVCR) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {showCTR && (
                <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>CTR</span>} style={{ marginBottom: 0 }}>
                  <Input placeholder="e.g. 0.4" value={item.ctr}
                    onChange={e => { onChange(item.id, 'ctr', e.target.value.replace(/[^0-9.]/g, '')); if (!item.ctrNotes) onChange(item.id, 'ctrNotes', ''); }}
                    suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>%</span>} style={{ height: 38 }} />
                </Form.Item>
              )}
              {showViewability && (
                <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Viewability</span>} style={{ marginBottom: 0 }}>
                  <Input placeholder="e.g. 70" value={item.viewability}
                    onChange={e => onChange(item.id, 'viewability', e.target.value.replace(/[^0-9.]/g, ''))}
                    suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>%</span>} style={{ height: 38 }} />
                </Form.Item>
              )}
              {showVCR && (
                <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>VCR</span>} style={{ marginBottom: 0 }}>
                  <Input placeholder="e.g. 60" value={item.vcr}
                    onChange={e => onChange(item.id, 'vcr', e.target.value.replace(/[^0-9.]/g, ''))}
                    suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>%</span>} style={{ height: 38 }} />
                </Form.Item>
              )}
            </div>
            {((showCTR && item.ctr !== '0.4') || (showViewability && item.viewability !== '70') || (showVCR && item.vcr !== '70')) && (
              <div style={{ background: '#fffbeb', border: '1px dashed #fcd34d', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <InfoCircleOutlined style={{ fontSize: 12, color: '#d97706' }} /> You've changed one or more default values — add a note if needed
                </div>
                <Input.TextArea placeholder="e.g. CTR adjusted based on client brief…" value={item.ctrNotes}
                  onChange={e => onChange(item.id, 'ctrNotes', e.target.value)} rows={2} style={{ fontSize: 12.5 }} />
              </div>
            )}
          </div>
        )}

        {/* ── Targeting & Settings (moved from old Step 3) ── */}
        <Divider style={{ margin: '16px 0' }} />
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#4f46e5', marginBottom: 12 }}>🎯 Targeting & Settings</div>

        {/* Age + Gender */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Age</span>} style={{ marginBottom: 14 }}>
            <Select mode="multiple" value={itemAge}
              onChange={(vals: string[]) => onChange(item.id, 'age', vals)}
              placeholder="Select Age" style={{ width: '100%' }} maxTagCount="responsive" menuItemSelectedIcon={null}
              optionRender={(option) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* ✅ Fix: use itemAge (local var) not undefined 'age' */}
                  <input type="checkbox" readOnly checked={itemAge.includes(option.value as string)}
                    style={{ accentColor: '#4f46e5', width: 14, height: 14, cursor: 'pointer' }} />
                  <span>{option.label}</span>
                </div>
              )}
              options={[
                { value: '18 to 24', label: '18 to 24' },
                { value: '25 to 34', label: '25 to 34' },
                { value: '35 to 44', label: '35 to 44' },
                { value: '45 to 54', label: '45 to 54' },
                { value: '55 to 64', label: '55 to 64' },
                { value: 'Others', label: 'Others' },
              ]} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Gender</span>} style={{ marginBottom: 14 }}>
            <Select mode="multiple" value={itemGender}
              onChange={(vals: string[]) => onChange(item.id, 'gender', vals)}
              placeholder="Select Gender" style={{ width: '100%' }} maxTagCount="responsive" menuItemSelectedIcon={null}
              optionRender={(option) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* ✅ Fix: use itemGender (local var) not undefined 'gender' */}
                  <input type="checkbox" readOnly checked={itemGender.includes(option.value as string)}
                    style={{ accentColor: '#4f46e5', width: 14, height: 14, cursor: 'pointer' }} />
                  <span>{option.label}</span>
                </div>
              )}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
              ]} />
          </Form.Item>
        </div>

        {/* Geo Targeting — uses item.geoLocations, NOT campaign-level state */}
        <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Geo Targeting</span>} style={{ marginBottom: 14 }}>
          <div className="cc-geo-wrap">
            <div className="cc-geo-header">
              <div className="cc-geo-icon-wrap">
                <EnvironmentOutlined style={{ color: 'var(--blue)', fontSize: 13 }} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--slate-700)' }}>Location Targeting</div>
                <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>Country → State → City</div>
              </div>
              {itemGeoLocations.length > 0 && (
                <div className="cc-geo-count-badge">{itemGeoLocations.length} location{itemGeoLocations.length > 1 ? 's' : ''} added</div>
              )}
            </div>
            {/* ✅ Fix: onAdd/onRemove update item.geoLocations via onChange, NOT campaign state */}
            <GeoTargeting
              locations={itemGeoLocations}
              onAdd={(loc: GeoLocation) => onChange(item.id, 'geoLocations', [...itemGeoLocations, loc])}
              onRemove={(idx: number) => onChange(item.id, 'geoLocations', itemGeoLocations.filter((_: GeoLocation, i: number) => i !== idx))}
            />
          </div>
        </Form.Item>

        {/* Platform */}
        <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Platform / Inventory</span>} style={{ marginBottom: 14 }}>
          <Select mode="multiple" value={itemPlatforms}
            onChange={(vals: string[]) => onChange(item.id, 'platforms', vals)}
            placeholder="Select Platforms" style={{ width: '100%' }} maxTagCount="responsive"
            optionRender={(option) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* ✅ Fix: use itemPlatforms (local var) not undefined 'platforms' */}
                <input type="checkbox" readOnly checked={itemPlatforms.includes(option.value as string)}
                  style={{ accentColor: '#4f46e5', width: 14, height: 14, cursor: 'pointer' }} />
                <span>{option.label}</span>
              </div>
            )}
            options={[
              { value: 'Display', label: 'Display' },
              { value: 'Video', label: 'Video' },
              { value: 'PMP', label: 'PMP' },
              { value: 'CTV', label: 'CTV' },
              { value: 'Audio', label: 'Audio' },
              { value: 'Native', label: 'Native' },
              { value: 'DOOH', label: 'DOOH' },
              { value: 'Mobile', label: 'Mobile' },
            ]} />
        </Form.Item>

        {/* Freq Cap + Brand Safety + Viewability Goal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Frequency Cap</span>} style={{ marginBottom: 14 }}>
            <Input placeholder="e.g. 3" value={item.freqCap}
              onChange={e => onChange(item.id, 'freqCap', e.target.value.replace(/[^0-9]/g, ''))}
              suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>impr/user</span>} style={{ height: 38 }} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Brand Safety Level</span>} style={{ marginBottom: 14 }}>
            <Select value={item.brandSafety || undefined}
              onChange={(v) => onChange(item.id, 'brandSafety', v ?? '')}
              placeholder="Select level…" style={{ width: '100%', height: 38 }}
              options={[
                { value: 'Standard', label: 'Standard' },
                { value: 'Strict', label: 'Strict' },
                { value: 'Custom', label: 'Custom' },
              ]} />
          </Form.Item>
        </div>

      </Form>
    </div>
  );
}

// ── Step 3 — Line Items (renamed from Step 4, Step 3 Objectives removed) ──
interface Step3LineItemsProps {
  campaignStartDate: string;
  campaignEndDate: string;
  lineItems: LineItem[];
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  lineItemCreatives: LineItemCreativesMap;
  lineItemOffset: number;
  confirmedLineItemIds: Set<string>;
  clientCurrencySymbol: string;
}

function Step3LineItems({
  campaignStartDate, campaignEndDate, lineItems, setLineItems,
  lineItemCreatives, lineItemOffset, confirmedLineItemIds, clientCurrencySymbol,
}: Step3LineItemsProps) {

  function handleChange(id: string, field: keyof LineItem, value: any) {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  function handleAdd() {
    const nextIndex = lineItems.length + 1;
    setLineItems(prev => [...prev, emptyLineItem(nextIndex, lineItemOffset)]);
  }

  function handleRemove(id: string) {
    setLineItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      return filtered.map((item, idx) => ({ ...item, id: generateLineItemId(idx + 1, lineItemOffset) }));
    });
  }

  return (
    <div className="cc-form-section">
      {(!campaignStartDate || !campaignEndDate) && (
        <div style={{ background: '#fffbeb', border: '0.5px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
          <InfoCircleOutlined style={{ color: '#d97706' }} />
          No campaign dates set. Go back to Step 2 to set them.
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
          lineItemCreatives={lineItemCreatives}
          allLineItemCreatives={lineItemCreatives}
          idConfirmed={confirmedLineItemIds.has(item.id)}
          clientCurrencySymbol={clientCurrencySymbol}
        />
      ))}
      <button onClick={handleAdd}
        style={{ width: '100%', padding: '12px', border: '1px dashed #4f46e5', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#4f46e5', fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <PlusOutlined /> Add Another Line Item
      </button>
    </div>
  );
}

// ── Step 4 — Review & Confirm (was Step 5) ──
function Step4Review({
  client, advertiser, websiteUrl,
  campaignName, clientCampaignId, purchaseOrderId,
  campaignType, buyingType, objective, notes,
  startDate, endDate, durationDays,
  lineItems, lineItemCreatives, onEdit,
}: any) {

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
    { label: 'Campaign Duration', value: durationDays > 0 ? `${startDate} → ${endDate} (${durationDays} days)` : '—' },
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

      {lineItems.length > 0 && (
        <>
          <div className="cc-review-header" style={{ marginTop: 20 }}>
            <span className="cc-review-label">Line Items ({lineItems.length})</span>
          </div>
          {lineItems.map((li: LineItem, i: number) => {
            const imgCreatives = lineItemCreatives?.[li.id + '_image'] || [];
            const vidCreatives = lineItemCreatives?.[li.id + '_video'] || [];
            const totalCreatives = imgCreatives.length + vidCreatives.length;
            const liGeo = Array.isArray(li.geoLocations) && li.geoLocations.length > 0
              ? li.geoLocations.map((l: GeoLocation) => [l.country, l.state, l.city].filter(Boolean).join(' › ')).join(', ')
              : '—';
            return (
              <div key={li.id} style={{ border: '0.5px solid #e2e8f0', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: '#1e293b', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#4f46e5', color: '#fff', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  {li.lineItemName || `Line Item ${i + 1}`}
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, fontFamily: 'monospace', background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: 4, border: '1px solid #86efac' }}>{li.id}</span>
                </div>
                <div className="cc-review-table">
                  {[
                    { label: 'Line Item ID', value: li.id },
                    { label: 'Ethnicity', value: li.ethnicity || '—' },
                    { label: 'Start Date', value: li.startDate || '—' },
                    { label: 'End Date', value: li.endDate || '—' },
                    {
                      label: 'Ad Format', value: li.adFormat
                        ? (() => {
                          const formatLabel = AD_FORMAT_OPTIONS.find(f => f.value === li.adFormat)?.label ?? li.adFormat;
                          const subLabel = li.adSubFormat?.length ? AD_FORMAT_SUB_OPTIONS[li.adFormat]?.filter(s => li.adSubFormat.includes(s.value)).map(s => s.label).join(', ') : null;
                          return subLabel ? `${formatLabel} › ${subLabel}` : formatLabel;
                        })() : '—'
                    },
                    { label: 'Impressions', value: li.impressions ? Number(li.impressions).toLocaleString('en-IN') : '—' },
                    { label: 'Age', value: Array.isArray(li.age) && li.age.length > 0 ? li.age.join(', ') : '—' },
                    { label: 'Gender', value: Array.isArray(li.gender) && li.gender.length > 0 ? li.gender.join(', ') : '—' },
                    { label: 'Geo Targeting', value: liGeo },
                    { label: 'Platforms', value: Array.isArray(li.platforms) && li.platforms.length > 0 ? li.platforms.join(', ') : '—' },
                    { label: 'Frequency Cap', value: li.freqCap ? `${li.freqCap} impr/user` : '—' },
                    { label: 'Brand Safety', value: li.brandSafety || '—' },
                    { label: 'Image Creatives', value: imgCreatives.length > 0 ? `${imgCreatives.length} file(s): ${imgCreatives.map((c: CreativeData) => c.creative_name).join(', ')}` : '—' },
                    { label: 'Video Creatives', value: vidCreatives.length > 0 ? `${vidCreatives.length} file(s): ${vidCreatives.map((c: CreativeData) => c.creative_name).join(', ')}` : '—' },
                    { label: 'Total Creatives', value: totalCreatives > 0 ? `${totalCreatives} file(s)` : '—' },
                  ].map((row, j) => (
                    <div key={row.label} className="cc-review-row" style={{ background: j % 2 === 0 ? '#fff' : 'var(--slate-100)' }}>
                      <span className="cc-review-row-key">{row.label}</span>
                      <span className="cc-review-row-val">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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

// ── Save Draft Modal ──
function SaveDraftModal({ visible, onConfirm, onCancel, defaultName }: {
  visible: boolean; onConfirm: (name: string) => void; onCancel: () => void; defaultName: string;
}) {
  const [name, setName] = useState(defaultName);
  useEffect(() => { if (visible) setName(defaultName); }, [visible, defaultName]);
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SaveOutlined style={{ fontSize: 18, color: '#2563eb' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Save as Draft</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>You can continue editing later from My Drafts</div>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Draft Name <span style={{ color: '#ef4444' }}>*</span></label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Campaign Draft"
            style={{ height: 40 }} onPressEnter={() => name.trim() && onConfirm(name.trim())} autoFocus />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} style={{ height: 38 }}>Cancel</Button>
          <Button type="primary" disabled={!name.trim()} onClick={() => onConfirm(name.trim())}
            icon={<SaveOutlined />} style={{ height: 38, background: '#2563eb', borderColor: '#2563eb' }}>
            Save Draft
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function Campaign_Create() {
  const navigate = useNavigate();
  const location = useLocation();

  const isBackNav = consumeNavFlag();
  const locationState = location.state as any;
  const isReturnFromCreative = !!(locationState?.fromCreativeUpload);
  const shouldRestoreDraft = isBackNav || isReturnFromCreative;
  const initialDraft = shouldRestoreDraft ? loadDraft() : null;

  const editingDraftId = locationState?.editDraftId as string | undefined;
  if (!shouldRestoreDraft) clearDraft();

  const storedDraft = editingDraftId ? getAllDrafts().find(d => d.draftId === editingDraftId) : null;
  const restoredData = storedDraft || initialDraft;

  const [activeStep, setActiveStep] = useState<number>(restoredData?.activeStep ?? 1);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(editingDraftId);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);

  const [lineItemOffset, setLineItemOffset] = useState<number>(restoredData?.lineItemOffset ?? 1);
  const [confirmedLineItemIds, setConfirmedLineItemIds] = useState<Set<string>>(
    () => new Set<string>(restoredData?.confirmedLineItemIds ?? [])
  );

  const superadminMode = !!(locationState?.superadminMode) || !!(locationState?.adminMode);

  // Persist sidebar mode when component mounts
  useEffect(() => {
    if (locationState?.superadminMode) {
      sessionStorage.setItem('sidebar_mode', 'superadmin');
    } else if (locationState?.adminMode) {
      sessionStorage.setItem('sidebar_mode', 'admin');
    } else {
      sessionStorage.setItem('sidebar_mode', 'user');
    }
}, [locationState?.superadminMode, locationState?.adminMode]);

  // Step 1
  const [client, setClient] = useState<string>(restoredData?.client ?? '');
  const [clientId, setClientId] = useState<string>(restoredData?.clientId ?? '');
  const [advertiser, setAdvertiser] = useState<string>(restoredData?.advertiser ?? '');
  const [websiteUrl, setWebsiteUrl] = useState<string>(restoredData?.websiteUrl ?? '');
  const [_clientCountry, setClientCountry] = useState<string>('');
  const [clientCurrencySymbol, setClientCurrencySymbol] = useState<string>('');

  // Step 2
  const [campaignName, setCampaignName] = useState<string>(restoredData?.campaignName ?? '');
  const [clientCampaignId, setClientCampaignId] = useState<string>(restoredData?.clientCampaignId ?? '');
  const [purchaseOrderId, setPurchaseOrderId] = useState<string>(restoredData?.purchaseOrderId ?? '');
  const [campaignType, setCampaignType] = useState<string>(restoredData?.campaignType ?? '');
  const [startDate, setStartDate] = useState<string>(restoredData?.startDate ?? '');
  const [endDate, setEndDate] = useState<string>(restoredData?.endDate ?? '');
  const [buyingType, setBuyingType] = useState<string[]>(restoredData?.buyingType ?? []);
  const [objective, setObjective] = useState<string>(restoredData?.objective ?? '');
  const [notes, setNotes] = useState<string>(restoredData?.notes ?? '');

  // Step 3 — Line Items (targeting fields now inside each line item)
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (restoredData?.lineItems?.length) {
      return restoredData.lineItems.map((li: any) => ({
        ...emptyLineItem(1),  // ensure new fields have defaults
        ...li,
        creatives: [],
      }));
    }
    return [emptyLineItem(1, 1)];
  });

  const [lineItemCreatives, setLineItemCreatives] = useState<LineItemCreativesMap>(() => {
    if (isReturnFromCreative && locationState?.allLineItemCreatives) {
      return locationState.allLineItemCreatives as LineItemCreativesMap;
    }
    return {};
  });

  const durationDays = startDate && endDate ? dayjs(endDate).diff(dayjs(startDate), 'day') : 0;

  useEffect(() => {
    if (!shouldRestoreDraft && !editingDraftId) {
      fetchLastLineItemOffset().then(offset => {
        setLineItemOffset(offset);
        setLineItems([emptyLineItem(1, offset)]);
      });
    }
  }, []);

  useEffect(() => {
    if (locationState?.uploadedCreatives && locationState?.lineItemId) {
      const lid = locationState.lineItemId as string;
      const returnedAll = (locationState.allLineItemCreatives ?? {}) as LineItemCreativesMap;
      setLineItemCreatives(() => ({ ...returnedAll, [lid]: locationState.uploadedCreatives }));
      window.history.replaceState({}, '');
    }
  }, [locationState]);

  // Persist draft
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    saveDraft({
      activeStep, client, clientId, advertiser, websiteUrl,
      campaignName, clientCampaignId, purchaseOrderId,
      campaignType, startDate, endDate, buyingType, objective, notes,
      lineItemOffset,
      confirmedLineItemIds: [...confirmedLineItemIds],
      lineItems: lineItems.map(li => ({ ...li, creatives: [] })),
    });
  }, [activeStep, client, clientId, advertiser, websiteUrl, campaignName, clientCampaignId,
    purchaseOrderId, campaignType, startDate, endDate, buyingType, objective, notes,
    lineItemOffset, confirmedLineItemIds, lineItems]);

  const getDraftPayload = (name: string): Omit<SavedDraft, 'draftId' | 'savedAt'> => ({
    draftName: name, activeStep, client, clientId, advertiser, websiteUrl,
    campaignName, clientCampaignId, purchaseOrderId, campaignType,
    startDate, endDate, buyingType, objective, notes,
    lineItemOffset,
    confirmedLineItemIds: [...confirmedLineItemIds],
    lineItems: lineItems.map(li => ({ ...li, creatives: [] })),
  });

  const handleSaveDraft = (name: string) => {
    if (currentDraftId) {
      updateExistingDraft(currentDraftId, getDraftPayload(name));
      message.success({ content: 'Draft updated successfully!', icon: <SaveOutlined style={{ color: '#2563eb' }} /> });
    } else {
      const newId = saveNewDraft(getDraftPayload(name));
      setCurrentDraftId(newId);
      message.success({ content: 'Draft saved! View it in My Drafts.', icon: <SaveOutlined style={{ color: '#2563eb' }} /> });
    }
    setShowSaveDraftModal(false);
  };

  // ✅ Fix: handleNextStep now checks activeStep === 3 (was 4) since Step 3 is now line items
  const handleNextStep = () => {
    if (activeStep === 3) {
      const incomplete = lineItems.filter(li => !isLineItemComplete(li));
      if (incomplete.length > 0) {
        const names = incomplete.map((li) => li.lineItemName.trim() ? `"${li.lineItemName}"` : `Line Item ${lineItems.indexOf(li) + 1}`).join(', ');
        message.error(`Please fill all required fields for: ${names}`);
        return;
      }
      setConfirmedLineItemIds(new Set(lineItems.map(li => li.id)));
    }
    setActiveStep(s => s + 1);
  };

  // ── Submit ──
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
    fd.append('start_date', startDate);
    fd.append('end_date', endDate);
    if (websiteUrl) fd.append('website_url', websiteUrl);
    if (clientCampaignId) fd.append('client_campaign_ID', clientCampaignId);
    if (purchaseOrderId) fd.append('purchase_order_ID', purchaseOrderId);
    if (notes) fd.append('notes', notes);

    // ✅ Fix: new fields are INSIDE the return {} object
    fd.append('line_items', JSON.stringify(
      lineItems.map((li) => {
        const imageCreatives = lineItemCreatives[li.id + '_image'] || [];
        const videoCreatives = lineItemCreatives[li.id + '_video'] || [];
        const allCreatives = [...imageCreatives, ...videoCreatives];

        const impressions = parseFloat(li.impressions);
        const rawAdFormat = li.adFormat;
        const unit = li.units;
        let unitCostBudget: number | string = '';
        if (impressions && unit && rawAdFormat) {
          if (unit === 'CPM') unitCostBudget = (impressions * (CPM_RATES[rawAdFormat] ?? 1)) / 1000;
          else if (unit === 'CPC') unitCostBudget = impressions * (CPC_RATES[rawAdFormat] ?? 1);
        }

        const adFormatDisplay = li.adFormat
          ? Array.isArray(li.adSubFormat) && li.adSubFormat.length > 0
            ? `${AD_FORMAT_OPTIONS.find(f => f.value === li.adFormat)?.label ?? li.adFormat} › ${li.adSubFormat.map((s: string) => AD_FORMAT_SUB_OPTIONS[li.adFormat]?.find(o => o.value === s)?.label ?? s).join(', ')}`
            : AD_FORMAT_OPTIONS.find(f => f.value === li.adFormat)?.label ?? li.adFormat
          : '';

        return {
          line_item_id: li.id,
          lineItemName: li.lineItemName,
          ethnicity: li.ethnicity,
          startDate: li.startDate,
          endDate: li.endDate,
          impressions: li.impressions,
          units: li.units,
          ctr: li.ctr,
          viewability: li.viewability,
          vcr: VIDEO_FORMATS.includes(li.adFormat) ? li.vcr : '',
          kpi_notes: li.ctrNotes || '',
          adFormat: adFormatDisplay,
          unit_cost: unitCostBudget !== '' ? `${clientCurrencySymbol}${unitCostBudget}` : '',
          unit_value: li.rate || '',
          // ✅ Fix: targeting fields correctly inside return object
          age: Array.isArray(li.age) ? li.age.join(', ') : '',
          gender: Array.isArray(li.gender) ? li.gender.join(', ') : '',
          geo_targeting: JSON.stringify(
            (Array.isArray(li.geoLocations) ? li.geoLocations : []).map((loc: GeoLocation) => ({
              country: loc.country || '', state: loc.state || '',
              city: loc.city || '', zipcode: loc.zipcode || '', range: loc.range || '',
            }))
          ),
          platforms: Array.isArray(li.platforms) ? li.platforms.join(', ') : '',
          frequency_cap: li.freqCap || '',
          brand_safety: li.brandSafety || '',
          creatives: allCreatives.filter(c => c.type !== 'third_party').map(creative => ({
            creative_name: creative.creative_name,
            dimensions: creative.dimensions,
            aspect_ratio: creative.aspect_ratio,
            file_size: creative.file_size,
            click_through_url: creative.click_through_url || '',
            appended_html_tag: creative.appended_html_tag || '',
            integration_code: creative.integration_code || '',
            notes: creative.notes || '',
          })),
          third_party_creatives: allCreatives.filter(c => c.type === 'third_party').map(creative => ({
            input_file_name: creative.main_asset?.name ?? '',
            backup_image_name: creative.backup_image?.name ?? '',
          })),
        };
      })
    ));

    // File appends
    lineItems.forEach((li, i) => {
      const imageCreatives = lineItemCreatives[li.id + '_image'] || [];
      const videoCreatives = lineItemCreatives[li.id + '_video'] || [];
      const allCreatives = [...imageCreatives, ...videoCreatives];
      let standardIndex = 0;
      let tpIndex = 0;
      allCreatives.forEach((creative: CreativeData) => {
        if (creative.type === 'third_party') {
          if (creative.main_asset) fd.append(`line_item_${i}thirdparty_file${tpIndex}`, creative.main_asset, creative.main_asset.name);
          if (creative.backup_image) fd.append(`line_item_${i}thirdparty_backup${tpIndex}`, creative.backup_image, creative.backup_image.name);
          tpIndex++;
        } else {
          if (creative.main_asset) fd.append(`line_item_${i}main_asset${standardIndex}`, creative.main_asset, creative.main_asset.name);
          standardIndex++;
        }
      });
    });

    try {
      const res = await fetch(`${BASE_URL}/create_campaign/`, {
        method: 'POST', body: fd, headers: { 'ngrok-skip-browser-warning': '1' },
      });
      if (res.ok) { clearDraft(); setSubmitStatus('success'); }
      else { const text = await res.text(); setSubmitStatus('error'); setErrorMsg(text || `Server error: ${res.status}`); }
    } catch (err: unknown) {
      setSubmitStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
    } finally { setSubmitting(false); }
  };

  // ✅ Fix: 4 steps now (Step 3 "Objectives & Settings" removed)
  const STEPS = [
    { n: 1, label: 'Select Client & Advertiser', sub: 'Choose client and advertiser' },
    { n: 2, label: 'Campaign Details', sub: 'Basic campaign information' },
    { n: 3, label: 'Line Item Details', sub: 'Add line items with targeting' },
    { n: 4, label: 'Review & Confirm', sub: 'Review and create campaign' },
  ];

  const stepTitles: Record<number, { title: string; sub: string }> = {
    1: { title: 'Select Client & Advertiser', sub: 'Choose the client and advertiser for this campaign' },
    2: { title: 'Campaign Details', sub: 'Provide basic information about the campaign' },
    3: { title: 'Line Item Details', sub: 'Add one or more line items with targeting settings' },
    4: { title: 'Review & Confirm', sub: 'Review all details before creating the campaign' },
  };

  const handleCancel = () => {
    clearDraft();
    if (locationState?.superadminMode) {
      navigate('/superadmin/campaigns');
    } else if (locationState?.adminMode) {
      navigate('/admin/campaigns');
    } else {
      navigate('/user_dashboard');
    }
};
  const defaultDraftName = campaignName.trim() || `Draft ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}>
        <div>
          <h1 style={{ fontSize: "18", fontWeight: 700, color: "#0F172A", }}>{editingDraftId ? 'Edit Draft Campaign' : 'Create New Campaign'}</h1>
          <p style={{
            fontSize: 11, color: "#64748B", marginTop: 1, letterSpacing: "0.04em", fontWeight: 500,
          }}>FOLLOW THE STEPS BELOW TO CREATE A NEW CAMPAIGN</p>
        </div>

        {currentDraftId && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#15803d', fontWeight: 600 }}>
            <SaveOutlined style={{ fontSize: 12 }} /> Draft saved
          </div>
        )}
      </div>


      {submitStatus === 'success' && <div className="cc-banner cc-banner-success">✅ Campaign created successfully!</div>}
      {submitStatus === 'error' && <div className="cc-banner cc-banner-error">❌ Submission failed: {errorMsg}</div>}

      {/* Stepper */}
      <div>
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
                client={client} setClient={setClient} setClientId={setClientId}
                setClientCountry={setClientCountry} setClientCurrencySymbol={setClientCurrencySymbol}
                advertiser={advertiser} setAdvertiser={setAdvertiser}
                websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
                superadminMode={superadminMode}  // ← ADD THIS
              />
            )}
            {activeStep === 2 && (
              <Step2
                campaignId="" campaignName={campaignName} setCampaignName={setCampaignName}
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
            {/* ✅ Step 3 is now Line Items (no separate objectives step) */}
            {activeStep === 3 && (
              <Step3LineItems
                campaignStartDate={startDate} campaignEndDate={endDate}
                lineItems={lineItems} setLineItems={setLineItems}
                lineItemCreatives={lineItemCreatives}
                lineItemOffset={lineItemOffset}
                confirmedLineItemIds={confirmedLineItemIds}
                clientCurrencySymbol={clientCurrencySymbol}
              />
            )}
            {/* ✅ Step 4 is now Review (was Step 5) */}
            {activeStep === 4 && (
              <Step4Review
                client={client} advertiser={advertiser} websiteUrl={websiteUrl}
                campaignName={campaignName} clientCampaignId={clientCampaignId}
                purchaseOrderId={purchaseOrderId} campaignType={campaignType}
                buyingType={buyingType} objective={objective} notes={notes}
                startDate={startDate} endDate={endDate} durationDays={durationDays}
                lineItems={lineItems} lineItemCreatives={lineItemCreatives}
                onEdit={() => setActiveStep(1)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="cc-bottom-bar">
        <Button className="cc-btn-cancel" onClick={handleCancel}>Cancel</Button>
        <div className="cc-bottom-bar-actions">
          <Button onClick={() => setShowSaveDraftModal(true)} icon={<SaveOutlined />}
            style={{ height: 40, paddingLeft: 18, paddingRight: 18, borderRadius: 8, border: '1.5px solid #2563eb', color: '#2563eb', fontWeight: 600, fontSize: 13, background: '#eff6ff', display: 'flex', alignItems: 'center', gap: 6 }}>
            {currentDraftId ? 'Update Draft' : 'Save Draft'}
          </Button>
          {activeStep > 1 && (
            <Button className="cc-btn-back" onClick={() => setActiveStep(s => s - 1)}>← Back</Button>
          )}
          {/* ✅ Fix: total steps is now 4 */}
          {activeStep < 4 ? (
            <Button type="primary" className="cc-btn-next" onClick={handleNextStep} icon={<ArrowRightOutlined />} iconPosition="end">
              Next Step
            </Button>
          ) : (
            <Button type="primary" className="cc-btn-submit" loading={submitting} onClick={handleSubmit} icon={<CheckOutlined />}>
              {submitting ? 'Creating…' : 'Create Campaign'}
            </Button>
          )}
        </div>
      </div>

      <SaveDraftModal visible={showSaveDraftModal} defaultName={defaultDraftName}
        onConfirm={handleSaveDraft} onCancel={() => setShowSaveDraftModal(false)} />
    </>
  );
}