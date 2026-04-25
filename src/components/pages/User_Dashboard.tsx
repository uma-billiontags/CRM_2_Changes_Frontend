import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard, Megaphone, Building2, Wallet,
   FileText, Settings, LogOut, Bell,
  Plus, ChevronRight,
  History, Radio, FileEdit, Layers,
} from 'lucide-react';

// ── Light theme palette ───────────────────────────────────────────────────────
const BLUE   = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_MID   = '#BFDBFE';
const GREEN  = '#16A34A';
const GREEN_LIGHT = '#DCFCE7';
const RED    = '#DC2626';
const AMBER  = '#D97706';
const AMBER_LIGHT = '#FEF3C7';
const SLATE  = '#0F172A';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748B';
const SLATE_300 = '#CBD5E1';
const SLATE_100 = '#F1F5F9';
const WHITE   = '#FFFFFF';
const BG      = '#F8FAFC';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
  total: number; live: number; active: number; paused: number; draft: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const weekData = [
  { day: 'Mon', impressions: 120, clicks: 8200  },
  { day: 'Tue', impressions: 145, clicks: 12400 },
  { day: 'Wed', impressions: 132, clicks: 9100  },
  { day: 'Thu', impressions: 168, clicks: 14200 },
  { day: 'Fri', impressions: 155, clicks: 11800 },
  { day: 'Sat', impressions: 178, clicks: 16200 },
  { day: 'Sun', impressions: 210, clicks: 19800 },
];

const campaigns = [
  { id: 1, name: 'Summer Sale 2026',    client: 'ABC Retail',  status: 'live',    budget: '₹8L',  spend: '₹5.2L', prog: 65,  ctr: '2.4%' },
  { id: 2, name: 'Brand Awareness Q2', client: 'Tata Digital', status: 'live',    budget: '₹22L', spend: '₹14L',  prog: 64,  ctr: '1.8%' },
  { id: 3, name: 'Product Launch',     client: 'Myntra',       status: 'pending', budget: '₹6L',  spend: '₹0',    prog: 0,   ctr: '—'    },
  { id: 4, name: 'Retargeting Flow',   client: 'HDFC Bank',    status: 'paused',  budget: '₹4L',  spend: '₹2.1L', prog: 52,  ctr: '3.1%' },
];

// ── Nav groups ────────────────────────────────────────────────────────────────
const NAV = [
  {
    g: 'WORKSPACE',
    items: [
      { label: 'Dashboard',       icon: LayoutDashboard, to: '/user_dashboard' },
      { label: 'My Campaigns',    icon: Megaphone,       to: '/user_campaigns' },
      { label: 'Create Campaign', icon: Plus,            to: '/campaign_create'    },
      { label: 'Brief Capture',   icon: FileEdit,        to: '/user_brief'     },
      { label: 'My Drafts',       icon: Layers,          to: '/user_drafts'    },
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

// ── Status config (light) ─────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { color: string; bg: string; border: string; dot: string; label: string }> = {
  live:    { color: GREEN,  bg: GREEN_LIGHT,  border: '#BBF7D0', dot: GREEN,  label: 'LIVE'    },
  pending: { color: AMBER,  bg: AMBER_LIGHT,  border: '#FDE68A', dot: AMBER,  label: 'PENDING' },
  paused:  { color: SLATE_500, bg: SLATE_100, border: SLATE_300, dot: SLATE_500, label: 'PAUSED' },
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();

  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      minHeight: '100vh',
      background: SLATE,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0 14px' : '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
      }}>
        {!collapsed && (
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: BLUE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: WHITE,
              letterSpacing: '-0.5px',
            }}>N</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: WHITE, letterSpacing: '-0.3px' }}>
                Billion <span style={{ color: '#60A5FA' }}>Tags</span>
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.1em' }}>
                CAMPAIGN PLATFORM
              </div>
            </div>
          </Link>
        )}
        {collapsed && (
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: BLUE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900, color: WHITE,
          }}>N</div>
        )}
        {!collapsed && (
          <button onClick={onToggle} style={{
            width: 26, height: 26, borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'rgba(255,255,255,0.4)', flexShrink: 0,
          }}>‹</button>
        )}
        {collapsed && (
          <button onClick={onToggle} style={{
            position: 'absolute', right: 8, top: 20,
            width: 26, height: 26, borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'rgba(255,255,255,0.4)',
          }}>›</button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {NAV.map(({ g, items }) => (
          <div key={g} style={{ marginBottom: 2 }}>
            {!collapsed && (
              <div style={{
                fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.12em', padding: '10px 10px 4px', textTransform: 'uppercase',
              }}>{g}</div>
            )}
            {items.map(({ label, icon: Icon, to }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px' : '8px 10px',
                    borderRadius: 8, cursor: 'pointer',
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    marginBottom: 1,
                    color: active ? WHITE : 'rgba(255,255,255,0.45)',
                    background: active ? 'rgba(37,99,235,0.85)' : 'transparent',
                    position: 'relative',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }} />
                    {!collapsed && <span>{label}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: collapsed ? '10px 8px' : '10px', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            marginBottom: 6,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: BLUE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: WHITE, fontSize: 12, fontWeight: 800, flexShrink: 0,
            }}>AS</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>Aarav Shah</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>CAMPAIGN MANAGER</div>
            </div>
          </div>
        )}
        <Link to="/portal_settings" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: collapsed ? '9px' : '7px 10px', borderRadius: 8,
            color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', marginBottom: 3,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <Settings size={14} />{!collapsed && 'Settings'}
          </div>
        </Link>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: collapsed ? '9px' : '7px 10px', borderRadius: 8,
            color: 'rgba(248,113,113,0.85)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <LogOut size={14} />{!collapsed && 'Sign Out'}
          </div>
        </Link>
      </div>
    </aside>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{
      background: WHITE,
      borderBottom: `1px solid ${SLATE_300}`,
      padding: '0 28px', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: SLATE, letterSpacing: '-0.4px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: SLATE_500, marginTop: 1, letterSpacing: '0.04em' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 12, color: SLATE_500, fontFamily: 'monospace' }}>
          {now.toLocaleTimeString()}
        </div>
        {actions}
        {/* Live indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 20,
          background: GREEN_LIGHT, border: `1px solid #BBF7D0`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: GREEN,
            animation: 'pulse 1.5s infinite',
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: GREEN, letterSpacing: '0.08em' }}>LIVE</span>
        </div>
        {/* Bell */}
        <button style={{
          position: 'relative', width: 36, height: 36, borderRadius: 9,
          border: `1px solid ${SLATE_300}`, background: WHITE,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Bell size={15} color={SLATE_500} />
          <span style={{
            position: 'absolute', top: 7, right: 7, width: 7, height: 7,
            borderRadius: '50%', background: BLUE,
          }} />
        </button>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: BLUE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: WHITE, fontSize: 12, fontWeight: 800,
          cursor: 'pointer',
        }}>AS</div>
      </div>
    </header>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, delta, icon, accentLight }: {
  label: string; value: string | number; delta: string;
  icon: string; accent: string; accentLight: string;
}) {
  const positive = !delta.startsWith('-');
  return (
    <div style={{
      borderRadius: 14, padding: '20px 22px',
      background: WHITE,
      border: `1px solid ${SLATE_300}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: SLATE_500, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</span>
        <div style={{
          width: 38, height: 38, borderRadius: 10, fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: accentLight,
        }}>{icon}</div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: SLATE, marginBottom: 6, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: positive ? GREEN : RED }}>
          {positive ? '↑' : '↓'} {delta.replace(/[+-]/g, '')}
        </span>
        <span style={{ color: SLATE_500 }}>vs last month</span>
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.paused;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: WHITE, borderRadius: 14,
      border: `1px solid ${SLATE_300}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function User_Dashboard() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [stats] = useState<Stats>({ total: 0, live: 2, active: 12, paused: 1, draft: 6 });
  const sideWidth = collapsed ? 64 : 240;

  const liveCount    = campaigns.filter(c => c.status === 'live').length;
  const pendingCount = campaigns.filter(c => c.status === 'pending').length;

  const kpis = [
    { label: 'Active Campaigns', value: stats.active,     delta: '+3%',   icon: '📣', accent: BLUE,  accentLight: BLUE_LIGHT  },
    { label: 'Total Campaigns',  value: campaigns.length, delta: '+12%',  icon: '📊', accent: '#7C3AED', accentLight: '#EDE9FE' },
    { label: 'Total Clicks',     value: '168K',           delta: '+8%',   icon: '🖱️', accent: GREEN, accentLight: GREEN_LIGHT },
    { label: 'Avg CTR',          value: '2.1%',           delta: '+0.3%', icon: '📈', accent: AMBER, accentLight: AMBER_LIGHT },
  ];

  const quickActions = [
    { label: 'New Campaign',   icon: '✦', to: '/campaign_create',  color: BLUE,     bg: BLUE_LIGHT  },
    { label: 'Brief Capture',  icon: '◉', to: '/user_brief',   color: '#7C3AED', bg: '#EDE9FE'  },
    { label: 'Live Status',    icon: '◈', to: '/user_live',    color: GREEN,    bg: GREEN_LIGHT  },
    { label: 'Change History', icon: '◷', to: '/user_history', color: AMBER,    bg: AMBER_LIGHT  },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .row-hover:hover { background: ${SLATE_100} !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${SLATE_300}; border-radius: 4px; }
      `}</style>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div style={{
        marginLeft: sideWidth, flex: 1, display: 'flex', flexDirection: 'column',
        transition: 'margin-left 0.25s cubic-bezier(.4,0,.2,1)', minWidth: 0,
      }}>
        <Topbar
          title="Dashboard"
          subtitle="WELCOME BACK, AARAV ✦"
          actions={
            <button
              onClick={() => navigate('/campaign_create')}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 9,
                background: BLUE,
                color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                letterSpacing: '0.05em',
                fontFamily: 'inherit',
              }}
            >+ NEW CAMPAIGN</button>
          }
        />

        <main style={{ flex: 1, padding: 24, overflowY: 'auto', animation: 'fadeUp 0.35s ease both' }}>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
            {kpis.map(k => <KpiCard key={k.label} {...k} />)}
          </div>

          {/* Chart + Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>

            {/* Chart */}
            <Card style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: SLATE, letterSpacing: '-0.3px' }}>Performance This Week</h3>
                  <p style={{ fontSize: 11, color: SLATE_500, marginTop: 3, letterSpacing: '0.06em', fontWeight: 600 }}>IMPRESSIONS &amp; CLICKS TREND</p>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 20,
                  background: GREEN_LIGHT, border: `1px solid #BBF7D0`,
                  fontSize: 10, fontWeight: 700, color: GREEN, letterSpacing: '0.08em',
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, animation: 'pulse 1.5s infinite' }} />
                  LIVE
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weekData} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={BLUE}  stopOpacity={0.18} />
                      <stop offset="100%" stopColor={BLUE}  stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="clkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={GREEN} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={GREEN} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={SLATE_100} vertical={false} />
                  <XAxis dataKey="day" stroke={SLATE_300} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: SLATE_500 }} />
                  <YAxis stroke={SLATE_300} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: SLATE_500 }} />
                  <Tooltip
                    contentStyle={{
                      background: WHITE, border: `1px solid ${SLATE_300}`,
                      borderRadius: 10, fontSize: 12, color: SLATE,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area type="monotone" dataKey="impressions" stroke={BLUE}  fill="url(#impGrad)" strokeWidth={2} name="Impressions (K)" />
                  <Area type="monotone" dataKey="clicks"      stroke={GREEN} fill="url(#clkGrad)" strokeWidth={2} name="Clicks" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Quick Actions */}
            <Card style={{ padding: 22 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: SLATE, marginBottom: 4, letterSpacing: '-0.3px' }}>Quick Actions</h3>
              <p style={{ fontSize: 11, color: SLATE_500, marginBottom: 16, letterSpacing: '0.06em', fontWeight: 600 }}>LAUNCH A WORKFLOW</p>
              {quickActions.map(a => (
                <div
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 8,
                    border: `1px solid ${SLATE_300}`,
                    background: WHITE,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = a.color + '66';
                    (e.currentTarget as HTMLDivElement).style.background  = a.bg;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = SLATE_300;
                    (e.currentTarget as HTMLDivElement).style.background  = WHITE;
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: a.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: a.color,
                  }}>{a.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: SLATE_700 }}>{a.label}</span>
                  <ChevronRight size={14} style={{ marginLeft: 'auto', color: SLATE_300 }} />
                </div>
              ))}
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card style={{ overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 22px', borderBottom: `1px solid ${SLATE_300}`,
            }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: SLATE, letterSpacing: '-0.3px' }}>My Campaigns</h3>
                <p style={{ fontSize: 11, color: SLATE_500, marginTop: 2, fontWeight: 500 }}>
                  {liveCount} Live · {pendingCount} Pending Approval
                </p>
              </div>
              <button
                onClick={() => navigate('/user_campaigns')}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 600,
                  color: BLUE, background: BLUE_LIGHT,
                  border: `1px solid ${BLUE_MID}`, borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>View All</button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${SLATE_100}`, background: SLATE_100 }}>
                  {['Campaign', 'Client', 'Status', 'Budget', 'Spend', 'Progress', 'CTR'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                      color: SLATE_500, textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="row-hover"
                    style={{ borderBottom: `1px solid ${SLATE_100}`, transition: 'background 0.12s' }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: SLATE }}>{c.name}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: SLATE_500, fontWeight: 400 }}>{c.client}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: SLATE_700, fontWeight: 500 }}>{c.budget}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: BLUE }}>{c.spend}</td>
                    <td style={{ padding: '14px 16px', minWidth: 130 }}>
                      <div style={{ height: 4, background: SLATE_100, borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{
                          height: '100%', width: c.prog + '%',
                          background: `linear-gradient(90deg,${BLUE},#60A5FA)`,
                          borderRadius: 4,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: SLATE_500, fontWeight: 600 }}>{c.prog}%</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: c.ctr === '—' ? SLATE_300 : GREEN }}>
                      {c.ctr}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

        </main>
      </div>
    </div>
  );
}