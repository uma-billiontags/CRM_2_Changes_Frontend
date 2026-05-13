import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Form, Input, Select, Button, DatePicker, InputNumber, Divider, message
} from 'antd';
import {
  ArrowRightOutlined, CheckOutlined,
  PlusOutlined, BellOutlined, RightOutlined,
  CloseOutlined, InfoCircleOutlined,
  EnvironmentOutlined, DeleteOutlined, FileImageOutlined, VideoCameraOutlined,
  SaveOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import '../styles/Campaign_Create.css';
import Sidebar from '../shared/Sidebar';
import type { LineItem, GeoLocation, LineItemCardProps, CreativeData } from '../types/campaign.form.types';

dayjs.extend(isBetween);

const { TextArea } = Input;

const SUBMIT_URL = 'https://grinch-revocable-cornflake.ngrok-free.dev/create_campaign/';
const CLIENT_URL = 'https://grinch-revocable-cornflake.ngrok-free.dev/get_client/CLT-2026-00003/';
const GET_CAMPAIGNS_URL = 'https://grinch-revocable-cornflake.ngrok-free.dev/get_campaigns/';

const DRAFT_KEY = 'campaign_create_draft';
const NAV_FLAG_KEY = 'campaign_create_nav_to_creative';

// DRAFTS STORAGE KEY
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

// Country → currency symbol map (extend as needed)
const COUNTRY_CURRENCY: Record<string, string> = {
  'India': '₹',
  'United States': '$',
  'United Kingdom': '£',
  'Germany': '€',
  'France': '€',
  'Japan': '¥',
  'Canada': 'CA$',
  'Australia': 'A$',
  'Singapore': 'S$',
  'UAE': 'AED',
  'Saudi Arabia': 'SAR',
};

function getCurrencySymbol(geoLocations: GeoLocation[]): string {
  for (const loc of geoLocations) {
    if (loc.country && COUNTRY_CURRENCY[loc.country]) {
      return COUNTRY_CURRENCY[loc.country];
    }
  }
  return '$'; // default
}

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
  age: string[];
  gender: string[];
  geoLocations: GeoLocation[];
  platforms: string[];
  freqCap: string;
  brandSafety: string;
  viewability: string;
  lineItemOffset: number;
  confirmedLineItemIds: string[];
  lineItems: LineItem[];
}

// Draft list helpers 
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
  const newDraft: SavedDraft = {
    ...data,
    draftId,
    savedAt: new Date().toISOString(),
  };
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

// Types
type LineItemCreativesMap = Record<string, CreativeData[]>;

// Line Item ID generator
function generateLineItemId(index: number, offset: number = 1): string {
  const userPrefix = 'USER';
  const paddedIndex = String(offset + index - 1).padStart(3, '0');
  return `LI${userPrefix}${paddedIndex}`;
}

// Generate an empty line item with a unique ID based on the index and offset
function emptyLineItem(index: number, offset: number = 1): LineItem {
  return {
    id: generateLineItemId(index, offset),
    lineItemName: '',
    ethnicity: [],
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
    unitCost: '',   // ← add this
    adSubFormatOpen: false,  // ← add
    adSubFormat: ''
  };
}

// Draft management using sessionStorage
function saveDraft(data: object) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

// Returns the draft data or null if not found or on error
function loadDraft(): Record<string, any> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Clears the saved draft from sessionStorage
function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch { /* ignore */ }
}

function setNavFlag() {
  try { sessionStorage.setItem(NAV_FLAG_KEY, '1'); } catch { /* ignore */ }
}

function consumeNavFlag(): boolean {
  try {
    const val = sessionStorage.getItem(NAV_FLAG_KEY);
    sessionStorage.removeItem(NAV_FLAG_KEY);
    return val === '1';
  } catch {
    return false;
  }
}

// Line Item helpers 
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

const IMAGE_FORMATS = ['banner', 'Interstitial'];
const VIDEO_FORMATS = ['video', 'youtube'];

const toOpts = (arr: string[]) => arr.map(s => ({ value: s, label: s }));

// Validation helper to check if a line item has all required fields filled
function isLineItemComplete(item: LineItem): boolean {
  return !!(
    item.lineItemName.trim() &&
    item.startDate &&
    item.endDate &&
    item.adFormat.length > 0
  );
}

// Fetches all campaigns and their line items to determine the next available line item offset for unique ID generation
async function fetchLastLineItemOffset(): Promise<number> {
  try {
    const res = await fetch(GET_CAMPAIGNS_URL, {
      headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': '1' },
    });
    if (!res.ok) return 1;
    const data = await res.json();

    const allIds: string[] = [];
    (data || []).forEach((campaign: any) => {
      (campaign.line_items || []).forEach((li: any) => {
        if (li.line_item_id && li.line_item_id.startsWith('LIUSER')) {
          allIds.push(li.line_item_id);
        }
      });
    });

    if (allIds.length === 0) return 1;
    const nums = allIds
      .map(id => parseInt(id.replace('LIUSER', ''), 10))
      .filter(n => !isNaN(n));
    if (nums.length === 0) return 1;
    return Math.max(...nums) + 1;
  } catch {
    return 1;
  }
}

// GeoTargeting component for managing location-based targeting with dynamic country/state/city selection and addition
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
      .then(data => {
        const names = (data.data || []).map((c: any) => c.name).sort();
        setCountryOpts(names);
      })
      .catch(() => console.warn('Failed to load countries'))
      .finally(() => setLoadingCountries(false));
  }, []);

  useEffect(() => {
    setLoadingStates(true);
    fetch('https://countriesnow.space/api/v0.1/countries/states')
      .then(r => r.json())
      .then(data => {
        const allStates = (data.data || [])
          .flatMap((c: any) => (c.states || []).map((s: any) => s.name))
          .filter(Boolean)
          .sort();
        const unique = [...new Set<string>(allStates)];
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
        const allCities = (data.data || [])
          .flatMap((c: any) => c.cities || [])
          .sort();
        const unique = [...new Set<string>(allCities)];
        allCitiesRef.current = unique;
        setCityOpts(unique);
      })
      .catch(() => console.warn('Failed to load cities'))
      .finally(() => setLoadingCities(false));
  }, []);

  const fetchCitiesForCountry = (countryName: string): Promise<string[]> => {
    return fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName }),
    })
      .then(r => r.json())
      .then(data => (data.data || []).sort())
      .catch(() => []);
  };

  const fetchCitiesForState = async (countryName: string, stateName: string): Promise<string[]> => {
    try {
      const res = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName, state: stateName }),
      });
      const data = await res.json();
      const cities = (data.data || []).sort();
      if (cities.length > 0) return cities;
    } catch { }
    if (countryName) {
      const countryCities = await fetchCitiesForCountry(countryName);
      if (countryCities.length > 0) return countryCities;
    }
    return allCitiesRef.current;
  };

  const handleCountryChange = (v: string) => {
    setCountry(v); setState(''); setCity('');
    if (!v) {
      setStateOpts(allStatesRef.current);
      setCityOpts(allCitiesRef.current);
      return;
    }
    setLoadingStates(true);
    fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: v }),
    })
      .then(r => r.json())
      .then(data => {
        const states = (data.data?.states || []).map((s: any) => s.name).sort();
        setStateOpts(states.length > 0 ? states : allStatesRef.current);
      })
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
      } else {
        setCityOpts(allCitiesRef.current);
      }
      return;
    }
    setLoadingCities(true);
    fetchCitiesForState(country, v)
      .then(cities => setCityOpts(cities))
      .finally(() => setLoadingCities(false));
  };

  const commitNew = (
    val: string,
    opts: string[],
    setOpts: (o: string[]) => void,
    setValue: (v: string) => void,
    setAdding: (b: boolean) => void,
    setNew: (s: string) => void,
    extra?: () => void,
  ) => {
    const trimmed = val.trim();
    if (trimmed && !opts.includes(trimmed)) setOpts([...opts, trimmed].sort());
    if (trimmed) setValue(trimmed);
    extra?.();
    setNew('');
    setAdding(false);
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
      <div
        onMouseDown={e => e.preventDefault()}
        onClick={() => setAdding(true)}
        style={{ padding: '8px 12px', cursor: 'pointer', color: '#4f46e5', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <PlusOutlined /> Add new
      </div>
    </>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {/* Country */}
        <div>
          <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: 'var(--blue)', marginRight: 4 }} />Country
          </div>
          {addingCountry ? (
            <Input
              autoFocus
              placeholder="Type and press Enter to save"
              value={newCountry}
              suffix={<span style={{ fontSize: 11, color: '#aaa' }}>↵ Enter</span>}
              style={{ height: 38 }}
              onChange={e => setNewCountry(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitNew(newCountry, countryOpts, setCountryOpts, setCountry, setAddingCountry, setNewCountry, () => { setState(''); setCity(''); });
                if (e.key === 'Escape') { setNewCountry(''); setAddingCountry(false); }
              }}
              onBlur={() => { setNewCountry(''); setAddingCountry(false); }}
            />
          ) : (
            <Select
              showSearch allowClear
              placeholder={loadingCountries ? 'Loading…' : 'Select country…'}
              loading={loadingCountries}
              style={{ width: '100%', height: 38 }}
              value={country || undefined}
              onChange={v => handleCountryChange(v ?? '')}
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              dropdownRender={menu => dropdownFooter(setAddingCountry, menu)}
              options={countryOpts.map(c => ({ value: c, label: c }))}
            />
          )}
        </div>

        {/* State */}
        <div>
          <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: 'var(--blue)', marginRight: 4 }} />State
          </div>
          {addingState ? (
            <Input
              autoFocus
              placeholder="Type and press Enter to save"
              value={newState}
              suffix={<span style={{ fontSize: 11, color: '#aaa' }}>↵ Enter</span>}
              style={{ height: 38 }}
              onChange={e => setNewState(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitNew(newState, stateOpts, setStateOpts, setState, setAddingState, setNewState, () => setCity(''));
                if (e.key === 'Escape') { setNewState(''); setAddingState(false); }
              }}
              onBlur={() => { setNewState(''); setAddingState(false); }}
            />
          ) : (
            <Select
              showSearch allowClear
              placeholder={loadingStates ? 'Loading…' : 'Select state…'}
              loading={loadingStates}
              style={{ width: '100%', height: 38 }}
              value={state || undefined}
              onChange={v => handleStateChange(v ?? '')}
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              dropdownRender={menu => dropdownFooter(setAddingState, menu)}
              options={stateOpts.map(s => ({ value: s, label: s }))}
            />
          )}
        </div>

        {/* City */}
        <div>
          <div className="cc-geo-sub-label" style={{ color: 'var(--slate-500)', marginBottom: 4, fontSize: 12 }}>
            <EnvironmentOutlined style={{ color: 'var(--blue)', marginRight: 4 }} />City
          </div>
          {addingCity ? (
            <Input
              autoFocus
              placeholder="Type and press Enter to save"
              value={newCity}
              suffix={<span style={{ fontSize: 11, color: '#aaa' }}>↵ Enter</span>}
              style={{ height: 38 }}
              onChange={e => setNewCity(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitNew(newCity, cityOpts, setCityOpts, setCity, setAddingCity, setNewCity);
                if (e.key === 'Escape') { setNewCity(''); setAddingCity(false); }
              }}
              onBlur={() => { setNewCity(''); setAddingCity(false); }}
            />
          ) : (
            <Select
              showSearch allowClear
              placeholder={loadingCities ? 'Loading…' : 'Select city…'}
              loading={loadingCities}
              style={{ width: '100%', height: 38 }}
              value={city || undefined}
              onChange={v => setCity(v ?? '')}
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              dropdownRender={menu => dropdownFooter(setAddingCity, menu)}
              options={cityOpts.map(c => ({ value: c, label: c }))}
            />
          )}
        </div>
      </div>

      {/* Row 2: Address, Zip, Range, Add */}
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
          <Input
            placeholder="e.g. 10 km"
            value={range}
            disabled={!rangeEnabled}
            onChange={e => setRange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && rangeEnabled) handleAdd(); }}
            style={{ width: 100, height: 38, backgroundColor: rangeEnabled ? '#fff' : '#f5f5f5', cursor: rangeEnabled ? 'text' : 'not-allowed' }}
          />
        </div>
        <Button type="primary" disabled={!canAdd} onClick={handleAdd} icon={<PlusOutlined />} style={{ height: 38 }}>
          Add
        </Button>
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

// InfoBox component for displaying informational messages with variant styling (blue or amber)
function InfoBox({ variant = 'blue', children }: { variant?: 'blue' | 'amber'; children: React.ReactNode }) {
  return (
    <div className={`cc-info-box ${variant}`}>
      <InfoCircleOutlined style={{ color: variant === 'blue' ? 'var(--blue)' : 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
      <p>{children}</p>
    </div>
  );
}

// Step 1 
function Step1({ setClient, setClientId, advertiser, setAdvertiser, websiteUrl, setWebsiteUrl }: any) {
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
          <Input
            value={advertiser}
            onChange={(e) => setAdvertiser(e.target.value)}
            placeholder="Enter advertiser name…"
            style={{ width: '100%', height: 38 }}
          />
        </Form.Item>
        <InfoBox variant="blue">
          All campaigns, line items, creatives and reports will be mapped under the selected client and advertiser. This cannot be changed after creation.
        </InfoBox>

        <Form.Item
          label="Website URL"
          name="websiteUrl"
          validateTrigger="onChange"
          rules={[
            {
              pattern: /^(https?:\/\/)(localhost|\d{1,3}(\.\d{1,3}){3}|[\w\-]+(\.[\w\-]+)+)(:\d+)?(\/[^\s]*)?$/,
              message: "Enter a valid URL starting with http:// or https://",
            },
          ]}
        >
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

// Step 2
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
              maxTagCount="responsive"
              menuItemSelectedIcon={null}
              optionRender={(option) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    readOnly
                    checked={buyingType.includes(option.value as string)}
                    style={{ accentColor: '#4f46e5', width: 14, height: 14, cursor: 'pointer' }}
                  />
                  <span>{option.label}</span>
                </div>
              )}
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
          <TextArea placeholder="Add any notes for internal reference" value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
        </Form.Item>
      </Form>
    </div>
  );
}

// Step 3 
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
              maxTagCount="responsive"
              menuItemSelectedIcon={null}
              optionRender={(option) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    readOnly
                    checked={age.includes(option.value as string)}
                    style={{ accentColor: '#4f46e5', width: 14, height: 14, cursor: 'pointer' }}
                  />
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
              ]}
            />
          </Form.Item>
          <Form.Item label="Gender" required>
            <Select
              mode='multiple'
              value={gender}
              onChange={(vals: string[]) => setGender(vals)}
              placeholder="Select Gender"
              style={{ width: '100%' }}
              maxTagCount="responsive"
              menuItemSelectedIcon={null}
              optionRender={(option) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    readOnly
                    checked={gender.includes(option.value as string)}
                    style={{ accentColor: '#4f46e5', width: 14, height: 14, cursor: 'pointer' }}
                  />
                  <span>{option.label}</span>
                </div>
              )}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
              ]}
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
            maxTagCount="responsive"
            menuItemSelectedIcon={null}
            optionRender={(option) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  readOnly
                  checked={platforms.includes(option.value as string)}
                  style={{ accentColor: '#4f46e5', width: 14, height: 14, cursor: 'pointer' }}
                />
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
            ]}
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

// LineItemCard 
interface ExtendedLineItemCardProps extends LineItemCardProps {
  lineItemCreatives: LineItemCreativesMap;
  allLineItemCreatives: LineItemCreativesMap;
  idConfirmed: boolean;
  geoLocations: GeoLocation[];
}

function LineItemCard({
  item, index, campaignStart, campaignEnd, onChange, onRemove, canRemove,
  lineItemCreatives, allLineItemCreatives, idConfirmed, geoLocations
}: ExtendedLineItemCardProps) {
  const [dateError, setDateError] = useState('');
  const navigate = useNavigate();

  const hasImageFormat = IMAGE_FORMATS.includes(item.adFormat);
  const hasVideoFormat = VIDEO_FORMATS.includes(item.adFormat);

  const showCTR = hasImageFormat || hasVideoFormat;
  const showViewability = hasImageFormat || hasVideoFormat;
  const showVCR = hasVideoFormat;

  // Separate creative lists by type 
  const uploadedImageCreatives = lineItemCreatives[item.id + '_image'] || [];
  const uploadedVideoCreatives = lineItemCreatives[item.id + '_video'] || [];

  const [expandedFormat, setExpandedFormat] = useState<string | null>(null);

  // ── Unit Cost Calculation ──
  const currencySymbol = getCurrencySymbol(geoLocations);

  const calculatedUnitCost = useMemo(() => {
    const impressions = parseFloat(item.impressions);
    const unit = item.units;
    const adFormat = item.adFormat;

    if (!impressions || !unit || !adFormat) return null;

    if (unit === 'CPM') {
      const rate = CPM_RATES[adFormat] ?? 1;
      const budget = (impressions * rate) / 1000;
      return { budget, rate, formula: `(${impressions.toLocaleString('en-IN')} × ${rate}) / 1000` };
    }

    if (unit === 'CPC') {
      const rate = CPC_RATES[adFormat] ?? 1;
      const budget = impressions * rate;
      return { budget, rate, formula: `${impressions.toLocaleString('en-IN')} × ${rate}` };
    }

    return null;
  }, [item.impressions, item.units, item.adFormat, item.ctr, geoLocations]);

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
    onChange(item.id, 'adSubFormat', '');
    onChange(item.id, 'adSubFormatOpen', false);
    setExpandedFormat(null);   // ← add
    if (!val) {
      onChange(item.id, 'ctr', '0.4');
      onChange(item.id, 'viewability', '70');
      onChange(item.id, 'vcr', '70');
    }
    if (!VIDEO_FORMATS.includes(val)) onChange(item.id, 'vcr', '70');
  }

  // Navigate to image upload page 
  const handleUploadCreatives = () => {
    setNavFlag();
    navigate('/creative_upload', {
      state: {
        lineItemId: item.id + '_image',
        returnTo: '/campaign_create',
        existingCreatives: uploadedImageCreatives,
        allLineItemCreatives,
      }
    });
  };

  // Navigate to video upload page 
  const handleUploadVideoCreatives = () => {
    setNavFlag();
    navigate('/creative_video_upload', {
      state: {
        lineItemId: item.id + '_video',
        returnTo: '/campaign_create',
        existingCreatives: uploadedVideoCreatives,
        allLineItemCreatives,
      }
    });
  };

  return (
    <div style={{ border: '0.5px solid var(--color-border-secondary, #e2e8f0)', borderRadius: 12, background: '#fff', padding: '20px 24px', marginBottom: 16 }}>
      {/* ── Card Header ── */}
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
          <button
            onClick={() => onRemove(item.id)}
            style={{ background: 'none', border: '0.5px solid #fca5a5', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#ef4444', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <DeleteOutlined style={{ fontSize: 12 }} /> Remove
          </button>
        )}
      </div>

      {/* ── Line Item ID Badge ── */}
      {idConfirmed && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '4px 10px' }}>
            <div>
              <span style={{ fontSize: 10.5, color: '#15803d', fontWeight: 500, letterSpacing: '0.05em', marginRight: 8 }}>Line Item ID:</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#14532d', fontFamily: 'monospace', letterSpacing: '0.03em' }}>{item.id}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Incomplete hint ── */}
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
        {/* Row: Line Item Name + Ethnicity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Line Item Name <span style={{ color: '#ef4444' }}>*</span></span>} style={{ marginBottom: 14 }}>
            <Input placeholder="e.g. Mumbai Display — 18-34" value={item.lineItemName} onChange={e => onChange(item.id, 'lineItemName', e.target.value)} style={{ height: 38 }} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Ethnicity</span>} style={{ marginBottom: 14 }}>
            <Select
              mode="multiple"
              value={item.ethnicity}
              onChange={(vals: string[]) => onChange(item.id, 'ethnicity', vals)}
              placeholder="Select ethnicity…"
              style={{ width: '100%' }}
              maxTagCount="responsive"
              menuItemSelectedIcon={null}
              optionRender={(option) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    readOnly
                    checked={item.ethnicity.includes(option.value as string)}
                    style={{ accentColor: '#4f46e5', width: 14, height: 14, cursor: 'pointer' }}
                  />
                  <span>{option.label}</span>
                </div>
              )}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Impressions</span>} style={{ marginBottom: 14 }}>
            <Input
              placeholder="e.g. 1000000"
              value={item.impressions}
              onChange={e => onChange(item.id, 'impressions', e.target.value.replace(/[^0-9]/g, ''))}
              suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>impr.</span>}
              style={{ height: 38 }}
            />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Units</span>} style={{ marginBottom: 14 }}>
            <Select
              value={item.units || undefined}
              onChange={(val: string) => onChange(item.id, 'units', val ?? '')}
              placeholder="Select unit…"
              style={{ width: '100%', height: 38 }}
              options={UNITS_OPTIONS.map(u => ({ value: u, label: u }))}
            />
          </Form.Item>
          <Form.Item
            label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Ad Format <span style={{ color: '#ef4444' }}>*</span></span>}
            style={{ marginBottom: 14 }}
          >
            {(() => {
              const [expandedFormat, setExpandedFormat] = React.useState<string | null>(null);

              const displayValue = item.adFormat
                ? item.adSubFormat
                  ? `${AD_FORMAT_OPTIONS.find(f => f.value === item.adFormat)?.label} › ${AD_FORMAT_SUB_OPTIONS[item.adFormat]?.find(s => s.value === item.adSubFormat)?.label}`
                  : AD_FORMAT_OPTIONS.find(f => f.value === item.adFormat)?.label
                : undefined;

              return (
                <Select
                  value={displayValue}
                  placeholder="Select format…"
                  style={{ width: '100%', height: 38 }}
                  open={undefined}
                  dropdownRender={() => (
                    <div style={{ padding: '4px 0' }}>
                      {AD_FORMAT_OPTIONS.map(fmt => {
                        const isExpanded = expandedFormat === fmt.value;
                        const isSelected = item.adFormat === fmt.value;
                        const subOpts = AD_FORMAT_SUB_OPTIONS[fmt.value] || [];

                        return (
                          <div key={fmt.value}>
                            {/* Parent row */}
                            <div
                              style={{
                                display: 'flex', alignItems: 'center',
                                padding: '7px 12px',
                                cursor: 'pointer',
                                background: isSelected ? '#eef2ff' : 'transparent',
                                gap: 8,
                                userSelect: 'none',
                              }}
                              onMouseEnter={e => {
                                if (!isSelected)
                                  (e.currentTarget as HTMLDivElement).style.background = '#f8fafc';
                              }}
                              onMouseLeave={e => {
                                if (!isSelected)
                                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                if (subOpts.length > 0) {
                                  setExpandedFormat(isExpanded ? null : fmt.value);
                                } else {
                                  handleAdFormatChange(fmt.value);
                                }
                              }}
                            >
                              {/* +/- expand icon */}
                              {subOpts.length > 0 ? (
                                <div style={{
                                  width: 16, height: 16,
                                  border: '1px solid #94a3b8',
                                  borderRadius: 3,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 13, color: '#64748b',
                                  background: '#fff', flexShrink: 0,
                                  lineHeight: 1,
                                  fontWeight: 400,
                                }}>
                                  {isExpanded ? '−' : '+'}
                                </div>
                              ) : (
                                <div style={{ width: 16, flexShrink: 0 }} />
                              )}

                              <span style={{
                                fontSize: 13,
                                color: isSelected ? '#4f46e5' : '#1e293b',
                                fontWeight: isSelected ? 600 : 400,
                              }}>
                                {fmt.label}
                              </span>

                              {/* checkmark if selected with no sub */}
                              {isSelected && !item.adSubFormat && (
                                <CheckOutlined style={{ marginLeft: 'auto', fontSize: 11, color: '#4f46e5' }} />
                              )}
                            </div>

                            {/* Sub-options — shown when expanded */}
                            {isExpanded && subOpts.length > 0 && (
                              <div style={{ background: '#fafbff' }}>
                                {subOpts.map(sub => {
                                  const isSubSelected = item.adFormat === fmt.value && item.adSubFormat === sub.value;
                                  return (
                                    <div
                                      key={sub.value}
                                      style={{
                                        display: 'flex', alignItems: 'center',
                                        padding: '6px 12px 6px 36px',
                                        cursor: 'pointer',
                                        background: isSubSelected ? '#eef2ff' : 'transparent',
                                        gap: 8,
                                      }}
                                      onMouseEnter={e => {
                                        if (!isSubSelected)
                                          (e.currentTarget as HTMLDivElement).style.background = '#f1f5f9';
                                      }}
                                      onMouseLeave={e => {
                                        if (!isSubSelected)
                                          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                                      }}
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleAdFormatChange(fmt.value);
                                        onChange(item.id, 'adSubFormat', sub.value);
                                        setExpandedFormat(null);
                                      }}
                                    >
                                      {/* dot indicator */}
                                      <div style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: isSubSelected ? '#6366f1' : '#cbd5e1',
                                        flexShrink: 0,
                                      }} />
                                      <span style={{
                                        fontSize: 12.5,
                                        color: isSubSelected ? '#4f46e5' : '#374151',
                                        fontWeight: isSubSelected ? 600 : 400,
                                      }}>
                                        {sub.label}
                                      </span>
                                      {isSubSelected && (
                                        <CheckOutlined style={{ marginLeft: 'auto', fontSize: 11, color: '#4f46e5' }} />
                                      )}
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
                  allowClear
                  onClear={() => {
                    handleAdFormatChange('');
                    setExpandedFormat(null);
                  }}
                />
              );
            })()}
          </Form.Item>
          {/* Unit Cost Display */}
          <Form.Item
            label={
              <span style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                Unit Cost (Budget)
                {calculatedUnitCost && (
                  <span style={{ fontSize: 10.5, color: '#6366f1', fontWeight: 500, background: '#eef2ff', padding: '1px 6px', borderRadius: 4 }}>
                    Auto-calculated
                  </span>
                )}
              </span>
            }
            style={{ marginBottom: 0 }}
          >
            {calculatedUnitCost ? (
              <div style={{
                height: 38, padding: '0 12px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1.5px solid #86efac',
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>
                    {currencySymbol}{calculatedUnitCost.budget.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span style={{ fontSize: 10.5, color: '#4ade80', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                  = {calculatedUnitCost.formula}
                </span>
              </div>
            ) : (
              <div style={{
                height: 38, padding: '0 12px',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: 6,
                display: 'flex', alignItems: 'center',
                color: '#94a3b8', fontSize: 12.5, gap: 6,
              }}>
                <InfoCircleOutlined style={{ fontSize: 11 }} />
                Enter impressions, ad format &amp; unit to calculate
              </div>
            )}
          </Form.Item>

        </div>

        {/* Creatives Upload */}
        <Form.Item
          label={<span style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>Creatives</span>}
          style={{ marginBottom: 14 }}
        >
          {item.adFormat.length === 0 && (
            <div style={{ border: '1px dashed #d1d5db', borderRadius: 8, padding: '14px 16px', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: 10 }}>
              <PlusOutlined style={{ fontSize: 16, color: '#d1d5db' }} />
              <div style={{ fontSize: 13, color: '#9ca3af' }}>Select an Ad Format above to enable upload</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* ── BANNER / IMAGE ZONE ── */}
            {item.adFormat === 'banner' && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1d4ed8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileImageOutlined /> Images
                </div>
                <button
                  type="button"
                  onClick={handleUploadCreatives}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    height: 38, padding: '0 16px',
                    border: '1px solid #93c5fd', borderRadius: 6,
                    background: '#eff6ff', color: '#1d4ed8',
                    fontWeight: 500, fontSize: 13, cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#dbeafe';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#93c5fd';
                  }}
                >
                  <FileImageOutlined style={{ fontSize: 14 }} />
                  Upload Image Creatives
                  {uploadedImageCreatives.length > 0 && (
                    <span style={{ marginLeft: 6, background: '#16a34a', color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>
                      {uploadedImageCreatives.length} added
                    </span>
                  )}
                </button>

                {uploadedImageCreatives.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {uploadedImageCreatives.map((creative: CreativeData, idx: number) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '5px 10px', background: '#f0fdf4',
                        borderRadius: 6, border: '0.5px solid #86efac',
                        maxWidth: 260,
                      }}>
                        {creative.main_asset && creative.main_asset.type?.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(creative.main_asset)}
                            alt={creative.creative_name}
                            style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0, border: '1px solid #d1fae5' }}
                          />
                        ) : (
                          <FileImageOutlined style={{ color: '#16a34a', fontSize: 16, flexShrink: 0 }} />
                        )}
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: 12, color: '#14532d', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {creative.creative_name || `Creative ${idx + 1}`}
                          </div>
                          {creative.dimensions && (
                            <div style={{ fontSize: 10.5, color: '#4ade80' }}>{creative.dimensions}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── VIDEO ZONE ── */}
            {item.adFormat === 'video' && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1d4ed8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <VideoCameraOutlined /> Videos
                </div>
                <button
                  type="button"
                  onClick={handleUploadVideoCreatives}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    height: 38, padding: '0 16px',
                    border: '1px solid #ddd6fe', borderRadius: 6,
                    background: '#eff6ff', color: '#1d4ed8',
                    fontWeight: 500, fontSize: 13, cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#ede9fe';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#7c3aed';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#f5f3ff';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#ddd6fe';
                  }}
                >
                  <VideoCameraOutlined style={{ fontSize: 14 }} />
                  Upload Video Creatives
                  {uploadedVideoCreatives.length > 0 && (
                    <span style={{ marginLeft: 6, background: '#16a34a', color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>
                      {uploadedVideoCreatives.length} added
                    </span>
                  )}
                </button>

                {uploadedVideoCreatives.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {uploadedVideoCreatives.map((creative: CreativeData, idx: number) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '5px 10px', background: '#f0fdf4',
                        borderRadius: 6, border: '0.5px solid #86efac',
                        maxWidth: 260,
                      }}>
                        <VideoCameraOutlined style={{ color: '#16a34a', fontSize: 16, flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: 12, color: '#14532d', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {creative.creative_name || `Video ${idx + 1}`}
                          </div>
                          {creative.dimensions && (
                            <div style={{ fontSize: 10.5, color: '#4ade80' }}>{creative.dimensions}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </Form.Item>-

        {(showCTR || showVCR) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {showCTR && (
                <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>CTR</span>} style={{ marginBottom: 0 }}>
                  <Input
                    placeholder="e.g. 0.4"
                    value={item.ctr}
                    onChange={e => {
                      onChange(item.id, 'ctr', e.target.value.replace(/[^0-9.]/g, ''));
                      if (!item.ctrNotes) onChange(item.id, 'ctrNotes', '');
                    }}
                    suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>%</span>}
                    style={{ height: 38 }}
                  />
                </Form.Item>
              )}
              {showViewability && (
                <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>Viewability</span>} style={{ marginBottom: 0 }}>
                  <Input
                    placeholder="e.g. 70"
                    value={item.viewability}
                    onChange={e => {
                      onChange(item.id, 'viewability', e.target.value.replace(/[^0-9.]/g, ''));
                    }}
                    suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>%</span>}
                    style={{ height: 38 }}
                  />
                </Form.Item>
              )}
              {showVCR && (
                <Form.Item label={<span style={{ fontSize: 12.5, color: '#64748b' }}>VCR</span>} style={{ marginBottom: 0 }}>
                  <Input
                    placeholder="e.g. 60"
                    value={item.vcr}
                    onChange={e => {
                      onChange(item.id, 'vcr', e.target.value.replace(/[^0-9.]/g, ''));
                    }}
                    suffix={<span style={{ fontSize: 11, color: '#94a3b8' }}>%</span>}
                    style={{ height: 38 }}
                  />
                </Form.Item>
              )}
            </div>

            {/* Notes — shown only if any value differs from default */}
            {(
              (showCTR && item.ctr !== '0.4') ||
              (showViewability && item.viewability !== '70') ||
              (showVCR && item.vcr !== '70')
            ) && (
                <div style={{
                  background: '#fffbeb', border: '1px dashed #fcd34d',
                  borderRadius: 8, padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <InfoCircleOutlined style={{ fontSize: 12, color: '#d97706' }} />
                    You've changed one or more default values — add a note if needed
                  </div>
                  <Input.TextArea
                    placeholder="e.g. CTR adjusted based on client brief, VCR target revised for mobile inventory…"
                    value={item.ctrNotes}
                    onChange={e => onChange(item.id, 'ctrNotes', e.target.value)}
                    rows={2}
                    style={{ fontSize: 12.5 }}
                  />
                </div>
              )}
          </div>
        )}
      </Form>
    </div>
  );
}

// Step 4 — Line Item Details 
interface Step4Props {
  campaignStartDate: string;
  campaignEndDate: string;
  lineItems: LineItem[];
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  lineItemCreatives: LineItemCreativesMap;
  lineItemOffset: number;
  confirmedLineItemIds: Set<string>;
  geoLocations: GeoLocation[];   // ← add
}

function Step4LineItems({
  campaignStartDate, campaignEndDate, lineItems, setLineItems,
  lineItemCreatives, lineItemOffset, confirmedLineItemIds, geoLocations
}: Step4Props) {

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
          lineItemCreatives={lineItemCreatives}
          allLineItemCreatives={lineItemCreatives}
          idConfirmed={confirmedLineItemIds.has(item.id)}
          geoLocations={geoLocations}
        />
      ))}

      <button
        onClick={handleAdd}
        style={{ width: '100%', padding: '12px', border: '1px dashed #4f46e5', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#4f46e5', fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <PlusOutlined /> Add Another Line Item
      </button>
    </div>
  );
}

// Step 5 — Review & Confirm 
function Step5Review({
  client, advertiser, websiteUrl,
  campaignName, clientCampaignId, purchaseOrderId,
  campaignType, buyingType, objective, notes,
  age, gender, geoLocations, platforms,
  freqCap, brandSafety, viewability, startDate, endDate, durationDays,
  lineItems,
  lineItemCreatives,
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
    { label: 'Gender', value: Array.isArray(gender) && gender.length > 0 ? gender.join(', ') : '—' },
    { label: 'Geo Targeting', value: geoString },
    { label: 'Platforms', value: platforms.join(', ') || '—' },
    { label: 'Frequency Cap', value: freqCap ? `${freqCap} impressions/user` : '—' },
    { label: 'Brand Safety', value: brandSafety || '—' },
    { label: 'Viewability Goal', value: viewability ? `${viewability}%` : '—' },
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
            return (
              <div key={li.id} style={{ border: '0.5px solid #e2e8f0', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: '#1e293b', borderBottom: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#4f46e5', color: '#fff', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  {li.lineItemName || `Line Item ${i + 1}`}
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, fontFamily: 'monospace', background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: 4, border: '1px solid #86efac' }}>
                    {li.id}
                  </span>
                </div>
                <div className="cc-review-table">
                  {[
                    { label: 'Line Item ID', value: li.id },
                    { label: 'Ethnicity', value: li.ethnicity.length > 0 ? li.ethnicity.join(', ') : '—' },
                    { label: 'Start Date', value: li.startDate || '—' },
                    { label: 'End Date', value: li.endDate || '—' },
                    {
                      label: 'Ad Format',
                      value: li.adFormat
                        ? (() => {
                          const formatLabel = AD_FORMAT_OPTIONS.find(f => f.value === li.adFormat)?.label ?? li.adFormat;
                          const subLabel = li.adSubFormat
                            ? AD_FORMAT_SUB_OPTIONS[li.adFormat]?.find(s => s.value === li.adSubFormat)?.label
                            : null;
                          return subLabel ? `${formatLabel} › ${subLabel}` : formatLabel;
                        })()
                        : '—'
                    },
                    { label: 'Impressions', value: li.impressions ? Number(li.impressions).toLocaleString('en-IN') : '—' },
                    {
                      label: 'Image Creatives',
                      value: imgCreatives.length > 0
                        ? `${imgCreatives.length} file(s): ${imgCreatives.map((c: CreativeData) => c.creative_name).join(', ')}`
                        : '—'
                    },
                    {
                      label: 'Video Creatives',
                      value: vidCreatives.length > 0
                        ? `${vidCreatives.length} file(s): ${vidCreatives.map((c: CreativeData) => c.creative_name).join(', ')}`
                        : '—'
                    },
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

// ─── Save Draft Modal ─────────────────────────────────────────────────────────
function SaveDraftModal({ visible, onConfirm, onCancel, defaultName }: {
  visible: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  defaultName: string;
}) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (visible) setName(defaultName);
  }, [visible, defaultName]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '28px 32px',
        width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        border: '1px solid #e2e8f0',
      }}>
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
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
            Draft Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Summer Campaign Draft"
            style={{ height: 40 }}
            onPressEnter={() => name.trim() && onConfirm(name.trim())}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} style={{ height: 38 }}>Cancel</Button>
          <Button
            type="primary"
            disabled={!name.trim()}
            onClick={() => onConfirm(name.trim())}
            icon={<SaveOutlined />}
            style={{ height: 38, background: '#2563eb', borderColor: '#2563eb' }}
          >
            Save Draft
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main
export default function Campaign_Create() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? 64 : 240;

  const isBackNav = consumeNavFlag();
  const locationState = location.state as any;
  const isReturnFromCreative = !!(locationState?.fromCreativeUpload);
  const shouldRestoreDraft = isBackNav || isReturnFromCreative;
  const initialDraft = shouldRestoreDraft ? loadDraft() : null;

  // Check if we're editing an existing draft
  const editingDraftId = locationState?.editDraftId as string | undefined;

  if (!shouldRestoreDraft) {
    clearDraft();
  }

  // Load from localStorage draft if editing
  const storedDraft = editingDraftId
    ? getAllDrafts().find(d => d.draftId === editingDraftId)
    : null;

  const restoredData = storedDraft || initialDraft;

  const [activeStep, setActiveStep] = useState<number>(restoredData?.activeStep ?? 1);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Draft state
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(editingDraftId);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);

  const [lineItemOffset, setLineItemOffset] = useState<number>(restoredData?.lineItemOffset ?? 1);
  const [confirmedLineItemIds, setConfirmedLineItemIds] = useState<Set<string>>(
    () => new Set<string>(restoredData?.confirmedLineItemIds ?? [])
  );

  // Step 1
  const [client, setClient] = useState<string>(restoredData?.client ?? '');
  const [clientId, setClientId] = useState<string>(restoredData?.clientId ?? '');
  const [advertiser, setAdvertiser] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState<string>(restoredData?.websiteUrl ?? '');

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

  // Step 3
  const [age, setAge] = useState<string[]>(restoredData?.age ?? []);
  const [gender, setGender] = useState<string[]>(restoredData?.gender ?? []);
  const [geoLocations, setGeoLocations] = useState<GeoLocation[]>(restoredData?.geoLocations ?? []);
  const [platforms, setPlatforms] = useState<string[]>(restoredData?.platforms ?? []);
  const [freqCap, setFreqCap] = useState<string>(restoredData?.freqCap ?? '');
  const [brandSafety, setBrandSafety] = useState<string>(restoredData?.brandSafety ?? '');
  const [viewability, setViewability] = useState<string>(restoredData?.viewability ?? '');

  // Step 4
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (restoredData?.lineItems?.length) {
      return restoredData.lineItems.map((li: any) => ({ ...li, creatives: [] }));
    }
    return [emptyLineItem(1, 1)];
  });


  const [lineItemCreatives, setLineItemCreatives] = useState<LineItemCreativesMap>(() => {
    if (isReturnFromCreative && locationState?.allLineItemCreatives) {
      return locationState.allLineItemCreatives as LineItemCreativesMap;
    }
    return {};
  });

  // ✅ Add it here, before the return
  const durationDays = startDate && endDate
    ? dayjs(endDate).diff(dayjs(startDate), 'day')
    : 0;


  // Fetch backend offset on fresh load 
  useEffect(() => {
    if (!shouldRestoreDraft && !editingDraftId) {
      fetchLastLineItemOffset().then(offset => {
        setLineItemOffset(offset);
        setLineItems([emptyLineItem(1, offset)]);
      });
    }
  }, []);

  // On return from Creative_Upload or Creative_Video_Upload 
  useEffect(() => {
    if (locationState?.uploadedCreatives && locationState?.lineItemId) {
      const lid = locationState.lineItemId as string;
      const returnedAll = (locationState.allLineItemCreatives ?? {}) as LineItemCreativesMap;

      setLineItemCreatives(() => ({
        ...returnedAll,
        [lid]: locationState.uploadedCreatives,
      }));

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
      age, gender, geoLocations, platforms,
      freqCap, brandSafety, viewability,
      lineItemOffset,
      confirmedLineItemIds: [...confirmedLineItemIds],
      lineItems: lineItems.map(li => ({ ...li, creatives: [] })),
    });
  }, [activeStep, client, clientId, advertiser, websiteUrl, campaignName, clientCampaignId, purchaseOrderId, campaignType, startDate, endDate, buyingType, objective, notes, age, gender, geoLocations, platforms, freqCap, brandSafety, viewability, lineItemOffset, confirmedLineItemIds, lineItems]);

  // ─── Save Draft handler ───────────────────────────────────────────────────
  const getDraftPayload = (name: string): Omit<SavedDraft, 'draftId' | 'savedAt'> => ({
    draftName: name,
    activeStep,
    client, clientId, advertiser, websiteUrl,
    campaignName, clientCampaignId, purchaseOrderId,
    campaignType, startDate, endDate, buyingType, objective, notes,
    age, gender, geoLocations, platforms,
    freqCap, brandSafety, viewability,
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

  // "Next Step" handler
  const handleNextStep = () => {
    if (activeStep === 4) {
      const incomplete = lineItems.filter(li => !isLineItemComplete(li));
      if (incomplete.length > 0) {
        const names = incomplete.map((li) =>
          li.lineItemName.trim() ? `"${li.lineItemName}"` : `Line Item ${lineItems.indexOf(li) + 1}`
        ).join(', ');
        message.error(`Please fill all required fields for: ${names}`);
        return;
      }
      setConfirmedLineItemIds(new Set(lineItems.map(li => li.id)));
    }
    setActiveStep(s => s + 1);
  };

  // Submit 
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
      geoLocations.map(loc => ({
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

    // Merge image + video creatives per line item 
    fd.append('line_items', JSON.stringify(
      lineItems.map((li) => {
        const imageCreatives = lineItemCreatives[li.id + '_image'] || [];
        const videoCreatives = lineItemCreatives[li.id + '_video'] || [];
        const allCreatives = [...imageCreatives, ...videoCreatives];

        // ── Calculate unit cost inline ──
        const impressions = parseFloat(li.impressions);
        const rawAdFormat = li.adFormat;  // raw value: 'banner', 'video' etc.
        const unit = li.units;
        let unitCostBudget: number | string = '';
        if (impressions && unit && rawAdFormat) {
          if (unit === 'CPM') {
            const rate = CPM_RATES[rawAdFormat] ?? 1;
            unitCostBudget = (impressions * rate) / 1000;
          } else if (unit === 'CPC') {
            const rate = CPC_RATES[rawAdFormat] ?? 1;
            unitCostBudget = impressions * rate;
          }
        }

        // Build display adFormat string separately
        const adFormatDisplay = li.adFormat
          ? li.adSubFormat
            ? `${AD_FORMAT_OPTIONS.find(f => f.value === li.adFormat)?.label ?? li.adFormat} › ${AD_FORMAT_SUB_OPTIONS[li.adFormat]?.find(s => s.value === li.adSubFormat)?.label ?? li.adSubFormat}`
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
          vcr: li.vcr,
          kpi_notes: li.ctrNotes || '',       // single combined KPI notes field
          adFormat: adFormatDisplay,   // combined label for display/storage
          unit_cost: unitCostBudget,   // now correctly calculated


          // ✅ Standard creatives only
          creatives: allCreatives
            .filter(c => c.type !== 'third_party')
            .map(creative => ({
              creative_name: creative.creative_name,
              dimensions: creative.dimensions,
              aspect_ratio: creative.aspect_ratio,
              file_size: creative.file_size,
              click_through_url: creative.click_through_url || '',
              appended_html_tag: creative.appended_html_tag || '',
              integration_code: creative.integration_code || '',
              notes: creative.notes || '',
            })),

          // ✅ Third-party creatives separately
          third_party_creatives: allCreatives
            .filter(c => c.type === 'third_party')
            .map(creative => ({
              input_file_name: creative.main_asset?.name ?? '',
              backup_image_name: creative.backup_image?.name ?? '',
            })),


        };
      })
    ));

    // Append actual files (image + video assets) 
    // ✅ Fix — use separate counters for standard and third-party
    lineItems.forEach((li, i) => {
      const imageCreatives = lineItemCreatives[li.id + '_image'] || [];
      const videoCreatives = lineItemCreatives[li.id + '_video'] || [];
      const allCreatives = [...imageCreatives, ...videoCreatives];

      let standardIndex = 0;
      let tpIndex = 0;

      allCreatives.forEach((creative: CreativeData) => {
        if (creative.type === 'third_party') {
          if (creative.main_asset) {
            fd.append(
              `line_item_${i}thirdparty_file${tpIndex}`,
              creative.main_asset,
              creative.main_asset.name
            );
          }
          if (creative.backup_image) {
            fd.append(
              `line_item_${i}thirdparty_backup${tpIndex}`,
              creative.backup_image,
              creative.backup_image.name
            );
          }
          tpIndex++;
        } else {
          if (creative.main_asset) {
            fd.append(
              `line_item_${i}main_asset${standardIndex}`,
              creative.main_asset,
              creative.main_asset.name
            );
          }
          standardIndex++;
        }
      });
    });

    try {
      const res = await fetch(SUBMIT_URL, {
        method: 'POST',
        body: fd,
        headers: { 'ngrok-skip-browser-warning': '1' },
      });
      if (res.ok) {
        clearDraft();
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

  const handleCancel = () => {
    clearDraft();
    navigate('/user_dashboard');
  };

  const defaultDraftName = campaignName.trim() || `Draft ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="cc-page-title">
                  {editingDraftId ? 'Edit Draft Campaign' : 'Create New Campaign'}
                </h1>
                <p className="cc-page-sub">Follow the steps below to create a new campaign</p>
              </div>
              {currentDraftId && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                  <SaveOutlined style={{ fontSize: 12 }} />
                  Draft saved
                </div>
              )}
            </div>
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
                    lineItemCreatives={lineItemCreatives}
                    lineItemOffset={lineItemOffset}
                    confirmedLineItemIds={confirmedLineItemIds}
                    geoLocations={geoLocations}
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
                    lineItemCreatives={lineItemCreatives}
                    onEdit={() => setActiveStep(1)}
                    durationDays={durationDays}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="cc-bottom-bar">
            <Button className="cc-btn-cancel" onClick={handleCancel}>Cancel</Button>

            <div className="cc-bottom-bar-actions">
              {/* Save Draft Button */}
              <Button
                onClick={() => setShowSaveDraftModal(true)}
                icon={<SaveOutlined />}
                style={{
                  height: 40,
                  paddingLeft: 18,
                  paddingRight: 18,
                  borderRadius: 8,
                  border: '1.5px solid #2563eb',
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: 13,
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {currentDraftId ? 'Update Draft' : 'Save Draft'}
              </Button>

              {activeStep > 1 && (
                <Button className="cc-btn-back" onClick={() => setActiveStep(s => s - 1)}>← Back</Button>
              )}

              {activeStep < 5 ? (
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

        </main>
      </div>
      {/* Save Draft Modal */}
      <SaveDraftModal
        visible={showSaveDraftModal}
        defaultName={defaultDraftName}
        onConfirm={handleSaveDraft}
        onCancel={() => setShowSaveDraftModal(false)}
      />
    </div>
  );
}