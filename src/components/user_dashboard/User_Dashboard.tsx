import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Bell, ChevronRight } from 'lucide-react';
import Sidebar from '../shared/Sidebar';

// ── Light theme palette ───────────────────────────────────────────────────────
const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_MID = '#BFDBFE';
const GREEN = '#16A34A';
const GREEN_LIGHT = '#DCFCE7';
const RED = '#DC2626';
const AMBER = '#D97706';
const AMBER_LIGHT = '#FEF3C7';
const SLATE = '#0F172A';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748B';
const SLATE_300 = '#CBD5E1';
const SLATE_100 = '#F1F5F9';
const WHITE = '#FFFFFF';
const BG = '#F8FAFC';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
  total: number; live: number; active: number; paused: number; draft: number;
}

// 1. Add this interface near the top of your file
interface Campaign {
  campaign_id: string;
  client_campaign_ID: string;
  campaign_name: string;
  client_name: string;
  created_at: string;
  // Add more fields as your backend returns them
  status?: string;
  buying_type?: string;
  objective?: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const weekData = [
  { day: 'Mon', impressions: 120, clicks: 8200 },
  { day: 'Tue', impressions: 145, clicks: 12400 },
  { day: 'Wed', impressions: 132, clicks: 9100 },
  { day: 'Thu', impressions: 168, clicks: 14200 },
  { day: 'Fri', impressions: 155, clicks: 11800 },
  { day: 'Sat', impressions: 178, clicks: 16200 },
  { day: 'Sun', impressions: 210, clicks: 19800 },
];

// ── Status config (light) ─────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { color: string; bg: string; border: string; dot: string; label: string }> = {
  live: { color: GREEN, bg: GREEN_LIGHT, border: '#BBF7D0', dot: GREEN, label: 'LIVE' },
  pending: { color: AMBER, bg: AMBER_LIGHT, border: '#FDE68A', dot: AMBER, label: 'PENDING' },
  paused: { color: SLATE_500, bg: SLATE_100, border: SLATE_300, dot: SLATE_500, label: 'PAUSED' },
};

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle, actions, avatarInitials }: { title: string; subtitle?: string; actions?: React.ReactNode, avatarInitials?: string; }) {
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
        }}>{avatarInitials ?? 'U'} </div>
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

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const clientName = localStorage.getItem('client_name') ?? '';
  const avatarInitials = clientName ? clientName.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    const clientId = localStorage.getItem('client_id');
    fetch(`http://127.0.0.1:8000/get_campaigns_by_client/${clientId}/`, {
      headers: { 'ngrok-skip-browser-warning': '1' }
    })
      .then(r => {
        if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCampaigns(data);
          return;
        }
        if (Array.isArray((data as any).campaigns)) {
          setCampaigns((data as any).campaigns);
          return;
        }
        console.warn('Unexpected campaigns response:', data);
        setCampaigns([]);
      })
      .catch((err) => {
        console.warn('Failed to fetch campaigns', err);
        setCampaigns([]);
      })
      .finally(() => setLoadingCampaigns(false));
  }, []);

  // 3. Replace liveCount and pendingCount:
  const liveCount = Array.isArray(campaigns) ? campaigns.filter(c => c.status === 'live').length : 0;
  const pendingCount = Array.isArray(campaigns) ? campaigns.filter(c => !c.status || c.status === 'pending').length : 0;

  const kpis = [
    { label: 'Active Campaigns', value: stats.active, delta: '+3%', icon: '📣', accent: BLUE, accentLight: BLUE_LIGHT },
    { label: 'Total Campaigns', value: campaigns.length, delta: '+12%', icon: '📊', accent: '#7C3AED', accentLight: '#EDE9FE' },
    { label: 'Total Clicks', value: '168K', delta: '+8%', icon: '🖱️', accent: GREEN, accentLight: GREEN_LIGHT },
    { label: 'Avg CTR', value: '2.1%', delta: '+0.3%', icon: '📈', accent: AMBER, accentLight: AMBER_LIGHT },
  ];

  const quickActions = [
    { label: 'New Campaign', icon: '✦', to: '/campaign_create', color: BLUE, bg: BLUE_LIGHT },
    { label: 'Brief Capture', icon: '◉', to: '/user_brief', color: '#7C3AED', bg: '#EDE9FE' },
    { label: 'Live Status', icon: '◈', to: '/user_live', color: GREEN, bg: GREEN_LIGHT },
    { label: 'Change History', icon: '◷', to: '/user_history', color: AMBER, bg: AMBER_LIGHT },
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
          subtitle={`WELCOME BACK, ${clientName.toUpperCase()} ✦`}
          avatarInitials={avatarInitials}   // ← add this
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
                      <stop offset="0%" stopColor={BLUE} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="clkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GREEN} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
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
                  <Area type="monotone" dataKey="impressions" stroke={BLUE} fill="url(#impGrad)" strokeWidth={2} name="Impressions (K)" />
                  <Area type="monotone" dataKey="clicks" stroke={GREEN} fill="url(#clkGrad)" strokeWidth={2} name="Clicks" />
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
                    (e.currentTarget as HTMLDivElement).style.background = a.bg;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = SLATE_300;
                    (e.currentTarget as HTMLDivElement).style.background = WHITE;
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
                  {campaigns.length} Total · {liveCount} Live · {pendingCount} Pending
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

            {loadingCampaigns ? (
              <div style={{ padding: 32, textAlign: 'center', color: SLATE_500, fontSize: 13 }}>
                Loading campaigns…
              </div>
            ) : campaigns.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: SLATE_500, fontSize: 13 }}>
                No campaigns found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${SLATE_100}`, background: SLATE_100 }}>
                      {[
                        'Campaign ID',
                        'Client Campaign ID',
                        'Campaign Name',
                        'Company Name',
                        'Campaign Start Date',
                        'Campaign End Date',
                        'Status',
                        'Buying Type',
                        'Objective',
                        'Actions',
                      ].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', textAlign: 'left',
                          fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                          color: SLATE_500, textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr
                        key={c.campaign_id}
                        className="row-hover"
                        style={{ borderBottom: `1px solid ${SLATE_100}`, transition: 'background 0.12s' }}
                      >
                        {/* Campaign ID — from backend */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color: BLUE,
                            background: BLUE_LIGHT, padding: '3px 8px',
                            borderRadius: 6, letterSpacing: '0.02em',
                          }}>
                            {c.campaign_id}
                          </span>
                        </td>

                        {/* Client Campaign ID */}
                        <td style={{ padding: '12px 14px', fontSize: 12, color: SLATE_500 }}>
                          {c.client_campaign_ID || '—'}
                        </td>

                        {/* Campaign Name */}
                        <td style={{
                          padding: '12px 14px', fontSize: 13, fontWeight: 600,
                          color: SLATE, maxWidth: 200, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.campaign_name}
                        </td>

                        {/* Company Name */}
                        <td style={{ padding: '12px 14px', fontSize: 12, color: SLATE_500 }}>
                          {c.client_name || '—'}
                        </td>

                        {/* Start Date — from created_at or your date field */}
                        <td style={{ padding: '12px 14px', fontSize: 12, color: SLATE_700, whiteSpace: 'nowrap' }}>
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>

                        {/* End Date — placeholder until backend adds it */}
                        <td style={{ padding: '12px 14px', fontSize: 12, color: SLATE_700, whiteSpace: 'nowrap' }}>
                          —
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px 14px' }}>
                          <StatusBadge status={c.status ?? 'pending'} />
                        </td>

                        {/* Buying Type */}
                        <td style={{ padding: '12px 14px', fontSize: 12, color: SLATE_500 }}>
                          {c.buying_type || '—'}
                        </td>

                        {/* Objective */}
                        <td style={{ padding: '12px 14px', fontSize: 12, color: SLATE_500 }}>
                          {c.objective || '—'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {/* View button */}
                            <button
                              onClick={() => navigate(`/campaign/${c.campaign_id}`)}
                              style={{
                                padding: '4px 10px', fontSize: 11, fontWeight: 600,
                                color: BLUE, background: BLUE_LIGHT,
                                border: `1px solid ${BLUE_MID}`, borderRadius: 6,
                                cursor: 'pointer', fontFamily: 'inherit',
                                letterSpacing: '0.02em',
                              }}
                            >View</button>

                            {/* Edit button */}
                            <button
                              onClick={() => navigate(`/campaign/${c.campaign_id}/edit`)}
                              style={{
                                padding: '4px 10px', fontSize: 11, fontWeight: 600,
                                color: SLATE_700, background: WHITE,
                                border: `1px solid ${SLATE_300}`, borderRadius: 6,
                                cursor: 'pointer', fontFamily: 'inherit',
                                letterSpacing: '0.02em',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = SLATE_100)}
                              onMouseLeave={e => (e.currentTarget.style.background = WHITE)}
                            >Edit</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </main>
      </div>
    </div>
  );
}