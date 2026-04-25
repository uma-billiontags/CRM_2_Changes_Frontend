import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Megaphone, Building2, Wallet,
  FileText, Settings, LogOut, Bell, Plus, ChevronRight,
  History, Radio, FileEdit, Layers, ChevronDown, X,
  Info, ArrowRight, Check,
} from 'lucide-react';

// ── Theme ─────────────────────────────────────────────────────────────────────
const BLUE         = '#2563EB';
const BLUE_LIGHT   = '#EFF6FF';
const BLUE_MID     = '#BFDBFE';
const SLATE        = '#0F172A';
const SLATE_700    = '#334155';
const SLATE_500    = '#64748B';
const SLATE_400    = '#94A3B8';
const SLATE_300    = '#CBD5E1';
const SLATE_200    = '#E2E8F0';
const SLATE_100    = '#F1F5F9';
const WHITE        = '#FFFFFF';
const BG           = '#F8FAFC';
const GREEN        = '#16A34A';
const GREEN_LIGHT  = '#DCFCE7';
const AMBER        = '#D97706';
const AMBER_LIGHT  = '#FEF3C7';
const PURPLE       = '#7C3AED';
const RED          = '#DC2626';

const SUBMIT_URL = 'https://crm-backend-5-0vq0.onrender.com/add_campaign/';

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV = [
  {
    g: 'WORKSPACE',
    items: [
      { label: 'Dashboard',        icon: LayoutDashboard, to: '/user_dashboard'  },
      { label: 'My Campaigns',     icon: Megaphone,       to: '/user_campaigns'  },
      { label: 'Create Campaign',  icon: Plus,            to: '/campaign_create' },
      { label: 'Brief Capture',    icon: FileEdit,        to: '/user_brief'      },
      { label: 'My Drafts',        icon: Layers,          to: '/user_drafts'     },
    ],
  },
  {
    g: 'AD OPS',
    items: [
      { label: 'Insertion Orders', icon: FileText,  to: '/user_io'        },
      { label: 'Line Items',       icon: Layers,    to: '/user_lineitems' },
      { label: 'Creatives',        icon: Building2, to: '/user_creatives' },
      { label: 'Setup Tasks',      icon: Settings,  to: '/user_tasks'     },
    ],
  },
  {
    g: 'MONITOR',
    items: [
      { label: 'Live Status',    icon: Radio,    to: '/user_live'      },
      { label: 'Change History', icon: History,  to: '/user_history'   },
      { label: 'Approvals',      icon: FileText, to: '/user_approvals' },
    ],
  },
  {
    g: 'INSIGHTS',
    items: [
      { label: 'Reports', icon: FileText, to: '/user_reports' },
      { label: 'Billing', icon: Wallet,   to: '/user_billing' },
    ],
  },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();
  return (
    <aside style={{
      width: collapsed ? 64 : 240, minHeight: '100vh',
      background: SLATE, display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      transition: 'width 0.25s cubic-bezier(.4,0,.2,1)', overflow: 'hidden',
    }}>
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0 14px' : '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
      }}>
        {!collapsed && (
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: WHITE }}>N</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: WHITE, letterSpacing: '-0.3px' }}>Billion <span style={{ color: '#60A5FA' }}>Tags</span></div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.1em' }}>CAMPAIGN PLATFORM</div>
            </div>
          </Link>
        )}
        {collapsed && (
          <div style={{ width: 34, height: 34, borderRadius: 9, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: WHITE }}>N</div>
        )}
        {!collapsed ? (
          <button onClick={onToggle} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>‹</button>
        ) : (
          <button onClick={onToggle} style={{ position: 'absolute', right: 8, top: 20, width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>›</button>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {NAV.map(({ g, items }) => (
          <div key={g} style={{ marginBottom: 2 }}>
            {!collapsed && <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', padding: '10px 10px 4px', textTransform: 'uppercase' }}>{g}</div>}
            {items.map(({ label, icon: Icon, to }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, marginBottom: 1, color: active ? WHITE : 'rgba(255,255,255,0.45)', background: active ? 'rgba(37,99,235,0.85)' : 'transparent', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                    <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }} />
                    {!collapsed && <span>{label}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: collapsed ? '10px 8px' : '10px', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>AS</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>Aarav Shah</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>CAMPAIGN MANAGER</div>
            </div>
          </div>
        )}
        <Link to="/portal_settings" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '9px' : '7px 10px', borderRadius: 8, color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 500, cursor: 'pointer', marginBottom: 3, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Settings size={14} />{!collapsed && 'Settings'}
          </div>
        </Link>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '9px' : '7px 10px', borderRadius: 8, color: 'rgba(248,113,113,0.85)', fontSize: 12, fontWeight: 600, cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <LogOut size={14} />{!collapsed && 'Sign Out'}
          </div>
        </Link>
      </div>
    </aside>
  );
}

// ── Shared form primitives ────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', height: 38, padding: '0 12px',
  border: `1.5px solid ${SLATE_300}`, borderRadius: 8,
  fontSize: 13, color: SLATE, background: WHITE,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 12.5, fontWeight: 600, color: SLATE_700, marginBottom: 6 }}>
      {children}{required && <span style={{ color: RED, marginLeft: 2 }}>*</span>}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Label required={required}>{label}</Label>
      {children}
      {hint && <div style={{ fontSize: 11, color: SLATE_400, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function SelectWrap({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: 'pointer', color: value === '' ? SLATE_400 : SLATE } as React.CSSProperties}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: SLATE_400, pointerEvents: 'none' }} />
    </div>
  );
}

function TagInput({ tags, onAdd, onRemove, options }: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const available = options.filter(o => !tags.includes(o));
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(p => !p)} style={{ minHeight: 38, padding: '5px 10px', border: `1.5px solid ${SLATE_300}`, borderRadius: 8, background: WHITE, display: 'flex', flexWrap: 'wrap', gap: 5, cursor: 'pointer', alignItems: 'center' }}>
        {tags.map(t => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: BLUE_LIGHT, color: BLUE, fontSize: 12, fontWeight: 500, border: `1px solid ${BLUE_MID}` }}>
            {t}
            <button onClick={e => { e.stopPropagation(); onRemove(t); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: BLUE }}><X size={10} /></button>
          </span>
        ))}
        {tags.length === 0 && <span style={{ fontSize: 13, color: SLATE_400 }}>Select…</span>}
        <ChevronDown size={12} style={{ marginLeft: 'auto', color: SLATE_400, flexShrink: 0 }} />
      </div>
      {open && available.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, border: `1.5px solid ${SLATE_300}`, borderRadius: 8, marginTop: 4, background: WHITE, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
          {available.map(o => (
            <div key={o} onClick={() => { onAdd(o); setOpen(false); }} style={{ padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: SLATE_700 }}
              onMouseEnter={e => (e.currentTarget.style.background = SLATE_100)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoBox({ color = BLUE, bg = BLUE_LIGHT, border = BLUE_MID, children }: { color?: string; bg?: string; border?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '11px 14px', background: bg, borderRadius: 8, border: `1px solid ${border}`, display: 'flex', gap: 9, marginBottom: 18 }}>
      <Info size={14} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 12, color: SLATE_700, margin: 0, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

function RowGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>{children}</div>;
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
function Step1({ client, setClient, advertiser, setAdvertiser, businessUnit, setBusinessUnit }: any) {
  return (
    <div style={{ maxWidth: 600 }}>
      <Field label="Client" required>
        <SelectWrap value={client} onChange={setClient} placeholder="Select a client…"
          options={['GroupM India (Agency)', 'Dentsu India', 'Publicis Groupe', 'Havas Media India', 'WPP India']} />
      </Field>

      <Field label="Advertiser (Brand)" required>
        <SelectWrap value={advertiser} onChange={setAdvertiser} placeholder="Select an advertiser…"
          options={['Unilever India', 'Tata Digital', 'HDFC Bank', 'Myntra', 'Reliance Retail', 'Mahindra Group', 'Airtel India']} />
      </Field>

      <InfoBox>
        All campaigns, line items, creatives and reports will be mapped under the selected client and advertiser. This cannot be changed after creation.
      </InfoBox>

      <Field label="Business Unit / Product" hint="Optional — helps in better reporting and organisation">
        <input style={inputStyle} placeholder="e.g. Surf Excel, Dove, Lux" value={businessUnit} onChange={e => setBusinessUnit(e.target.value)} />
      </Field>
    </div>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
function Step2({ campaignName, setCampaignName, campaignCode, setCampaignCode, campaignType, setCampaignType, buyingType, setBuyingType, objective, setObjective, kpis, setKpis, notes, setNotes }: any) {
  return (
    <div style={{ maxWidth: 600 }}>
      <Field label="Campaign Name" required>
        <input style={inputStyle} value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. Summer Awareness 2024" />
      </Field>
      <RowGrid>
        <Field label="Campaign Code" hint="Optional">
          <input style={inputStyle} value={campaignCode} onChange={e => setCampaignCode(e.target.value)} placeholder="Auto-generated or enter manually" />
        </Field>
        <Field label="Campaign Type" required>
          <SelectWrap value={campaignType} onChange={setCampaignType} placeholder="Select type…"
            options={['Brand Awareness', 'Performance', 'Retargeting', 'Prospecting', 'Lead Generation']} />
        </Field>
      </RowGrid>
      <RowGrid>
        <Field label="Buying Type" required>
          <SelectWrap value={buyingType} onChange={setBuyingType} placeholder="Select buying type…"
            options={['Programmatic (DV360)', 'Direct', 'Programmatic Guaranteed', 'Preferred Deal', 'Open Auction']} />
        </Field>
        <Field label="Campaign Objective" required>
          <SelectWrap value={objective} onChange={setObjective} placeholder="Select objective…"
            options={['Increase Brand Awareness', 'Drive Website Traffic', 'Generate Leads', 'Boost Sales', 'App Installs']} />
        </Field>
      </RowGrid>
      <Field label="KPI" hint="Optional">
        <TagInput tags={kpis} onAdd={t => setKpis((p: string[]) => [...p, t])} onRemove={t => setKpis((p: string[]) => p.filter((x: string) => x !== t))}
          options={['Reach', 'Impressions', 'Clicks', 'CTR', 'CPC', 'CPM', 'ROAS', 'Conversions']} />
      </Field>
      <Field label="Notes" hint="Optional">
        <textarea style={{ ...inputStyle, height: 90, paddingTop: 10, resize: 'vertical', lineHeight: 1.6 } as React.CSSProperties}
          placeholder="Add any notes for internal reference" value={notes} onChange={e => setNotes(e.target.value)} />
      </Field>
    </div>
  );
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
function Step3({ primaryObj, setPrimaryObj, targetAudience, setTargetAudience, geoTags, setGeoTags, platforms, setPlatforms, freqCap, setFreqCap, brandSafety, setBrandSafety, viewability, setViewability }: any) {
  return (
    <div style={{ maxWidth: 600 }}>
      <RowGrid>
        <Field label="Primary Objective" required>
          <SelectWrap value={primaryObj} onChange={setPrimaryObj} placeholder="Select objective…"
            options={['Reach', 'Brand Awareness', 'Traffic', 'Engagement', 'Video Views', 'Conversions']} />
        </Field>
        <Field label="Target Audience" required>
          <SelectWrap value={targetAudience} onChange={setTargetAudience} placeholder="Select audience…"
            options={['General Market', 'Adults 18–35', 'Women 25–45', 'Urban Youth', 'Custom Segment']} />
        </Field>
      </RowGrid>
      <Field label="Geo Targeting" required>
        <TagInput tags={geoTags} onAdd={t => setGeoTags((p: string[]) => [...p, t])} onRemove={t => setGeoTags((p: string[]) => p.filter((x: string) => x !== t))}
          options={['India', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'West Bengal']} />
      </Field>
      <Field label="Platform / Inventory" required>
        <TagInput tags={platforms} onAdd={t => setPlatforms((p: string[]) => [...p, t])} onRemove={t => setPlatforms((p: string[]) => p.filter((x: string) => x !== t))}
          options={['Display', 'Video', 'PMP', 'CTV', 'Audio', 'Native', 'DOOH', 'Mobile']} />
      </Field>
      <RowGrid>
        <Field label="Frequency Cap" hint="Optional">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input style={{ ...inputStyle, width: 80, flexShrink: 0 }} type="number" value={freqCap} onChange={e => setFreqCap(e.target.value)} placeholder="e.g. 3" min={1} />
            <span style={{ fontSize: 12.5, color: SLATE_500 }}>impressions / user</span>
          </div>
        </Field>
        <Field label="Brand Safety Level" required>
          <SelectWrap value={brandSafety} onChange={setBrandSafety} placeholder="Select level…"
            options={['Standard', 'Strict', 'Custom']} />
        </Field>
      </RowGrid>
      <Field label="Viewability Goal" hint="Optional — enter a percentage between 0–100">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input style={{ ...inputStyle, width: 80, flexShrink: 0 }} type="number" value={viewability} onChange={e => setViewability(e.target.value)} placeholder="e.g. 70" min={0} max={100} />
          <span style={{ fontSize: 12.5, color: SLATE_500 }}>%</span>
        </div>
      </Field>
    </div>
  );
}

// ── Step 4 ────────────────────────────────────────────────────────────────────
function Step4({ budgetType, setBudgetType, totalBudget, setTotalBudget, startDate, setStartDate, endDate, setEndDate, pacing, setPacing, dayParting, setDayParting, timezone, setTimezone, durationDays, dailyBudget }: any) {
  return (
    <div style={{ maxWidth: 600 }}>
      <Field label="Budget Type" required>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['total', 'daily'] as const).map(t => (
            <div key={t} onClick={() => setBudgetType(t)} style={{ flex: 1, padding: '12px 16px', border: `1.5px solid ${budgetType === t ? BLUE : SLATE_300}`, borderRadius: 8, cursor: 'pointer', background: budgetType === t ? BLUE_LIGHT : WHITE, display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: `2px solid ${budgetType === t ? BLUE : SLATE_300}`, background: budgetType === t ? BLUE : WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {budgetType === t && <div style={{ width: 5, height: 5, borderRadius: '50%', background: WHITE }} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: budgetType === t ? BLUE : SLATE_700 }}>{t === 'total' ? 'Total Budget' : 'Daily Budget'}</div>
                <div style={{ fontSize: 11, color: SLATE_400, marginTop: 1 }}>{t === 'total' ? 'Fixed total spend cap' : 'Spend limit per day'}</div>
              </div>
            </div>
          ))}
        </div>
      </Field>
      <Field label="Total Budget (INR)" required>
        <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${SLATE_300}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '0 12px', background: SLATE_100, height: 38, display: 'flex', alignItems: 'center', fontSize: 13, color: SLATE_500, fontWeight: 700, borderRight: `1.5px solid ${SLATE_300}`, flexShrink: 0 }}>₹</div>
          <input style={{ ...inputStyle, border: 'none', borderRadius: 0 }} value={totalBudget} onChange={e => setTotalBudget(e.target.value)} placeholder="e.g. 500000" />
        </div>
      </Field>
      <RowGrid>
        <Field label="Flight Start Date" required>
          <input type="date" style={inputStyle} value={startDate} onChange={e => setStartDate(e.target.value)} />
        </Field>
        <Field label="Flight End Date" required>
          <input type="date" style={inputStyle} value={endDate} onChange={e => setEndDate(e.target.value)} />
        </Field>
      </RowGrid>
      <RowGrid>
        <Field label="Pacing" required>
          <SelectWrap value={pacing} onChange={setPacing} placeholder="Select pacing…"
            options={['Even', 'Front-Loaded', 'Back-Loaded', 'ASAP']} />
        </Field>
        <Field label="Day Parting" hint="Optional">
          <SelectWrap value={dayParting} onChange={setDayParting} placeholder="Select day parting…"
            options={['All Day', 'Business Hours (9am–6pm)', 'Prime Time (6pm–11pm)', 'Custom']} />
        </Field>
      </RowGrid>
      <Field label="Time Zone" hint="Optional">
        <SelectWrap value={timezone} onChange={setTimezone} placeholder="Select timezone…"
          options={['Asia/Kolkata (IST)', 'UTC', 'America/New_York (EST)', 'Europe/London (GMT)']} />
      </Field>
      <div style={{ borderRadius: 10, border: `1.5px solid ${SLATE_200}`, overflow: 'hidden', marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: `1px solid ${SLATE_200}`, background: SLATE_100 }}>
          <span style={{ fontSize: 12.5, color: SLATE_500, fontWeight: 500 }}>Campaign Duration</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: BLUE }}>{durationDays > 0 ? `${durationDays} days` : '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: WHITE }}>
          <span style={{ fontSize: 12.5, color: SLATE_500, fontWeight: 500 }}>Estimated Daily Budget</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>{dailyBudget}</span>
        </div>
      </div>
    </div>
  );
}

// ── Step 5 ────────────────────────────────────────────────────────────────────
function Step5({ client, advertiser, businessUnit, campaignName, campaignCode, campaignType, buyingType, objective, kpis, notes, primaryObj, targetAudience, geoTags, platforms, freqCap, brandSafety, viewability, budgetType, totalBudget, startDate, endDate, durationDays, pacing, dayParting, timezone, onEdit }: any) {
  const rows = [
    { label: 'Client',            value: client || '—' },
    { label: 'Advertiser',        value: advertiser || '—' },
    { label: 'Business Unit',     value: businessUnit || '—' },
    { label: 'Campaign Name',     value: campaignName || '—' },
    { label: 'Campaign Code',     value: campaignCode || '—' },
    { label: 'Campaign Type',     value: campaignType || '—' },
    { label: 'Buying Type',       value: buyingType || '—' },
    { label: 'Objective',         value: objective || '—' },
    { label: 'KPI',               value: kpis.join(', ') || '—' },
    { label: 'Notes',             value: notes || '—' },
    { label: 'Primary Objective', value: primaryObj || '—' },
    { label: 'Target Audience',   value: targetAudience || '—' },
    { label: 'Geo Targeting',     value: geoTags.join(', ') || '—' },
    { label: 'Platforms',         value: platforms.join(', ') || '—' },
    { label: 'Frequency Cap',     value: freqCap ? `${freqCap} impressions/user` : '—' },
    { label: 'Brand Safety',      value: brandSafety || '—' },
    { label: 'Viewability Goal',  value: viewability ? `${viewability}%` : '—' },
    { label: 'Budget',            value: totalBudget ? `₹ ${totalBudget} (${budgetType === 'total' ? 'Total' : 'Daily'})` : '—' },
    { label: 'Flight Duration',   value: durationDays > 0 ? `${startDate} → ${endDate} (${durationDays} days)` : '—' },
    { label: 'Pacing',            value: pacing || '—' },
    { label: 'Day Parting',       value: dayParting || '—' },
    { label: 'Time Zone',         value: timezone || '—' },
  ];

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: GREEN_LIGHT, borderRadius: 10, border: '1.5px solid #86EFAC', marginBottom: 22 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={18} color={WHITE} strokeWidth={3} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#15803D' }}>All steps complete — ready to launch</div>
          <div style={{ fontSize: 12, color: '#16A34A', marginTop: 2 }}>Review the details below before creating the campaign.</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: SLATE_400, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Summary</div>
        <button onClick={onEdit} style={{ fontSize: 12, color: BLUE, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Edit Details</button>
      </div>

      <div style={{ border: `1.5px solid ${SLATE_200}`, borderRadius: 10, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 16px', background: i % 2 === 0 ? WHITE : SLATE_100, borderBottom: i < rows.length - 1 ? `1px solid ${SLATE_200}` : 'none' }}>
            <span style={{ fontSize: 12, color: SLATE_500, fontWeight: 500, width: 140, flexShrink: 0, paddingTop: 1 }}>{row.label}</span>
            <span style={{ fontSize: 13, color: SLATE, fontWeight: 600, wordBreak: 'break-word', flex: 1 }}>{row.value}</span>
          </div>
        ))}
      </div>

      <InfoBox color={AMBER} bg={AMBER_LIGHT} border="#FDE68A">
        Once created, you can add line items, creatives and launch the campaign from the campaigns dashboard.
      </InfoBox>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Campaign_Create() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? 64 : 240;
  const [activeStep, setActiveStep] = useState(1);

  // Submit state
  const [submitting, setSubmitting]     = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg]         = useState('');

  // Step 1
  const [client, setClient]           = useState('');
  const [advertiser, setAdvertiser]   = useState('');
  const [businessUnit, setBusinessUnit] = useState('');
  // Step 2
  const [campaignName, setCampaignName]   = useState('');
  const [campaignCode, setCampaignCode]   = useState('');
  const [campaignType, setCampaignType]   = useState('');
  const [buyingType, setBuyingType]       = useState('');
  const [objective, setObjective]         = useState('');
  const [kpis, setKpis]                   = useState<string[]>([]);
  const [notes, setNotes]                 = useState('');
  // Step 3
  const [primaryObj, setPrimaryObj]           = useState('');
  const [targetAudience, setTargetAudience]   = useState('');
  const [geoTags, setGeoTags]                 = useState<string[]>([]);
  const [platforms, setPlatforms]             = useState<string[]>([]);
  const [freqCap, setFreqCap]                 = useState('');
  const [brandSafety, setBrandSafety]         = useState('');
  const [viewability, setViewability]         = useState('');
  // Step 4
  const [budgetType, setBudgetType]   = useState<'total' | 'daily'>('total');
  const [totalBudget, setTotalBudget] = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [pacing, setPacing]           = useState('');
  const [dayParting, setDayParting]   = useState('');
  const [timezone, setTimezone]       = useState('');

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

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMsg('');

    const fd = new FormData();
    // Required fields
    fd.append('client',             client);
    fd.append('advertiser',         advertiser);
    fd.append('campaign_name',      campaignName);
    fd.append('campaign_type',      campaignType);
    fd.append('buying_type',        buyingType);
    fd.append('objective',          objective);
    fd.append('primary_objective',  primaryObj);
    fd.append('target_audience',    targetAudience);
    fd.append('geo_targeting',      geoTags.join(', '));
    fd.append('platforms',          platforms.join(', '));
    fd.append('brand_safety',       brandSafety);
    fd.append('budget_type',        budgetType);
    fd.append('total_budget',       totalBudget.replace(/,/g, ''));
    fd.append('start_date',         startDate);
    fd.append('end_date',           endDate);
    fd.append('pacing',             pacing);
    // Optional fields
    if (businessUnit)  fd.append('business_unit',  businessUnit);
    if (campaignCode)  fd.append('campaign_code',  campaignCode);
    if (kpis.length)   fd.append('kpis',           kpis.join(', '));
    if (notes)         fd.append('notes',          notes);
    if (freqCap)       fd.append('frequency_cap',  freqCap);
    if (viewability)   fd.append('viewability_goal', viewability);
    if (dayParting)    fd.append('day_parting',    dayParting);
    if (timezone)      fd.append('timezone',       timezone);

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
    { n: 2, label: 'Campaign Details',            sub: 'Basic campaign information'   },
    { n: 3, label: 'Objectives & Settings',       sub: 'Define goals and settings'    },
    { n: 4, label: 'Budget & Schedule',           sub: 'Set budget and timeline'      },
    { n: 5, label: 'Review & Confirm',            sub: 'Review and create campaign'   },
  ];

  const stepTitles: Record<number, { title: string; sub: string }> = {
    1: { title: 'Select Client & Advertiser', sub: 'Choose the client and advertiser for this campaign' },
    2: { title: 'Campaign Details',           sub: 'Provide basic information about the campaign'       },
    3: { title: 'Objectives & Settings',      sub: 'Define target audience and platform settings'       },
    4: { title: 'Budget & Schedule',          sub: 'Set budget, flight dates and pacing'                },
    5: { title: 'Review & Confirm',           sub: 'Review all details before creating the campaign'    },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes stepIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        input:focus, select:focus, textarea:focus { outline:none !important; border-color:${BLUE} !important; box-shadow:0 0 0 3px ${BLUE_LIGHT} !important; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${SLATE_300}; border-radius:4px; }
      `}</style>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div style={{ marginLeft: sideWidth, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.25s cubic-bezier(.4,0,.2,1)', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ background: WHITE, borderBottom: `1px solid ${SLATE_200}`, padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: SLATE_500 }}>
            <Link to="/user_campaigns" style={{ color: SLATE_500, textDecoration: 'none' }}>Campaigns</Link>
            <ChevronRight size={13} />
            <span style={{ color: SLATE, fontWeight: 600 }}>Create Campaign</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ position: 'relative', width: 34, height: 34, borderRadius: 8, border: `1px solid ${SLATE_300}`, background: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Bell size={15} color={SLATE_500} />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: RED }} />
            </button>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>AK</div>
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          <div style={{ padding: '24px 28px 0' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: SLATE, letterSpacing: '-0.5px', margin: 0 }}>Create New Campaign</h1>
            <p style={{ fontSize: 13, color: SLATE_500, marginTop: 4 }}>Follow the steps below to create a new campaign</p>
          </div>

          {/* Status banners */}
          {submitStatus === 'success' && (
            <div style={{ margin: '16px 28px 0', padding: '12px 16px', borderRadius: 8, background: GREEN_LIGHT, border: '1px solid #86EFAC', fontSize: 13, color: '#15803D', fontWeight: 500 }}>
              ✅ Campaign created successfully! Redirecting…
            </div>
          )}
          {submitStatus === 'error' && (
            <div style={{ margin: '16px 28px 0', padding: '12px 16px', borderRadius: 8, background: '#FEE2E2', border: '1px solid #FCA5A5', fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>
              ❌ Submission failed: {errorMsg}
            </div>
          )}

          {/* Stepper */}
          <div style={{ padding: '20px 28px 0' }}>
            <div style={{ background: WHITE, border: `1px solid ${SLATE_200}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              {STEPS.map((s, i) => {
                const isActive = s.n === activeStep;
                const isDone   = s.n < activeStep;
                return (
                  <React.Fragment key={s.n}>
                    <div onClick={() => isDone && setActiveStep(s.n)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: isDone ? 'pointer' : 'default', padding: '6px 10px', borderRadius: 8, background: isActive ? BLUE_LIGHT : 'transparent', transition: 'background 0.15s', flexShrink: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: isActive ? BLUE : isDone ? GREEN : SLATE_200, color: isActive || isDone ? WHITE : SLATE_400, border: isActive ? `2px solid ${BLUE}` : isDone ? `2px solid ${GREEN}` : `2px solid ${SLATE_300}`, transition: 'all 0.25s' }}>
                        {isDone ? <Check size={13} strokeWidth={3} /> : s.n}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? BLUE : isDone ? SLATE_700 : SLATE_400, whiteSpace: 'nowrap' }}>{s.label}</div>
                        <div style={{ fontSize: 10, color: isActive ? '#60A5FA' : SLATE_400, whiteSpace: 'nowrap', marginTop: 1 }}>{s.sub}</div>
                      </div>
                    </div>
                    {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, borderRadius: 2, background: isDone ? GREEN : SLATE_200, minWidth: 12, transition: 'background 0.35s' }} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step content */}
          <div style={{ flex: 1, padding: '24px 28px 0', animation: 'stepIn 0.28s ease both' }} key={activeStep}>
            <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${SLATE_200}`, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 28px 18px', borderBottom: `1px solid ${SLATE_200}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: BLUE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: BLUE, flexShrink: 0 }}>{activeStep}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: SLATE, letterSpacing: '-0.2px' }}>{stepTitles[activeStep].title}</div>
                  <div style={{ fontSize: 12.5, color: SLATE_500, marginTop: 2 }}>{stepTitles[activeStep].sub}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11.5, color: SLATE_400, fontWeight: 500 }}>Step {activeStep} of {STEPS.length}</div>
              </div>

              <div style={{ padding: '24px 28px' }}>
                {activeStep === 1 && <Step1 client={client} setClient={setClient} advertiser={advertiser} setAdvertiser={setAdvertiser} businessUnit={businessUnit} setBusinessUnit={setBusinessUnit} />}
                {activeStep === 2 && <Step2 campaignName={campaignName} setCampaignName={setCampaignName} campaignCode={campaignCode} setCampaignCode={setCampaignCode} campaignType={campaignType} setCampaignType={setCampaignType} buyingType={buyingType} setBuyingType={setBuyingType} objective={objective} setObjective={setObjective} kpis={kpis} setKpis={setKpis} notes={notes} setNotes={setNotes} />}
                {activeStep === 3 && <Step3 primaryObj={primaryObj} setPrimaryObj={setPrimaryObj} targetAudience={targetAudience} setTargetAudience={setTargetAudience} geoTags={geoTags} setGeoTags={setGeoTags} platforms={platforms} setPlatforms={setPlatforms} freqCap={freqCap} setFreqCap={setFreqCap} brandSafety={brandSafety} setBrandSafety={setBrandSafety} viewability={viewability} setViewability={setViewability} />}
                {activeStep === 4 && <Step4 budgetType={budgetType} setBudgetType={setBudgetType} totalBudget={totalBudget} setTotalBudget={setTotalBudget} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} pacing={pacing} setPacing={setPacing} dayParting={dayParting} setDayParting={setDayParting} timezone={timezone} setTimezone={setTimezone} durationDays={durationDays} dailyBudget={dailyBudget} />}
                {activeStep === 5 && <Step5 client={client} advertiser={advertiser} businessUnit={businessUnit} campaignName={campaignName} campaignCode={campaignCode} campaignType={campaignType} buyingType={buyingType} objective={objective} kpis={kpis} notes={notes} primaryObj={primaryObj} targetAudience={targetAudience} geoTags={geoTags} platforms={platforms} freqCap={freqCap} brandSafety={brandSafety} viewability={viewability} budgetType={budgetType} totalBudget={totalBudget} startDate={startDate} endDate={endDate} durationDays={durationDays} pacing={pacing} dayParting={dayParting} timezone={timezone} onEdit={() => setActiveStep(1)} />}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ background: WHITE, borderTop: `1px solid ${SLATE_200}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', bottom: 0, zIndex: 40, marginTop: 24 }}>
            <button onClick={() => navigate('/user_campaigns')} style={{ height: 38, padding: '0 20px', borderRadius: 8, border: `1px solid ${SLATE_300}`, background: WHITE, fontSize: 13, fontWeight: 600, color: SLATE_700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <div style={{ display: 'flex', gap: 10 }}>
              {activeStep > 1 && (
                <button onClick={() => setActiveStep(s => s - 1)} style={{ height: 38, padding: '0 20px', borderRadius: 8, border: `1px solid ${SLATE_300}`, background: WHITE, fontSize: 13, fontWeight: 600, color: SLATE_700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
              )}
              {activeStep < 5 ? (
                <button onClick={() => setActiveStep(s => s + 1)} style={{ height: 38, padding: '0 24px', borderRadius: 8, border: 'none', background: BLUE, fontSize: 13, fontWeight: 700, color: WHITE, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Next Step <ArrowRight size={14} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} style={{ height: 38, padding: '0 24px', borderRadius: 8, border: 'none', background: submitting ? SLATE_400 : `linear-gradient(135deg, ${BLUE}, ${PURPLE})`, fontSize: 13, fontWeight: 700, color: WHITE, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, boxShadow: submitting ? 'none' : '0 4px 14px rgba(37,99,235,0.35)' }}>
                  <Check size={15} strokeWidth={3} /> {submitting ? 'Creating…' : 'Create Campaign'}
                </button>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}