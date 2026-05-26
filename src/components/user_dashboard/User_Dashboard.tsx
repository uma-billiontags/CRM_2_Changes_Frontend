import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronRight } from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import UserCampaignsTable, { type Campaign, isActiveCampaign } from '../shared/UserCampaignsTable';

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_MID = '#BFDBFE';
const GREEN = '#16A34A';
const GREEN_LIGHT = '#DCFCE7';
const AMBER = '#D97706';
const AMBER_LIGHT = '#FEF3C7';
const SLATE = '#0F172A';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748B';
const SLATE_300 = '#CBD5E1';
const SLATE_100 = '#F1F5F9';
const WHITE = '#FFFFFF';
const BG = '#F8FAFC';

const weekData = [
  { day: 'Mon', impressions: 120, clicks: 8200 },
  { day: 'Tue', impressions: 145, clicks: 12400 },
  { day: 'Wed', impressions: 132, clicks: 9100 },
  { day: 'Thu', impressions: 168, clicks: 14200 },
  { day: 'Fri', impressions: 155, clicks: 11800 },
  { day: 'Sat', impressions: 178, clicks: 16200 },
  { day: 'Sun', impressions: 210, clicks: 19800 },
];

function Topbar({ title, subtitle, actions, avatarInitials }: { title: string; subtitle?: string; actions?: React.ReactNode; avatarInitials?: string }) {
  return (
    <header style={{ background: WHITE, borderBottom: `1px solid ${SLATE_300}`, padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: SLATE, letterSpacing: '-0.4px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: SLATE_500, marginTop: 1, letterSpacing: '0.04em' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {actions}

        <button style={{
          position: "relative", width: 36, height: 36, borderRadius: 9,
          border: `1px solid ${SLATE_300}`, background: WHITE,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 15,
        }}>
          🔔
          <span style={{
            position: "absolute", top: 7, right: 7,
            width: 7, height: 7, borderRadius: "50%", background: BLUE,
          }} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
          {avatarInitials ?? 'U'}
        </div>
      </div>
    </header>
  );
}

function KpiCard({ label, value, icon, accentLight }: { label: string; value: string | number; icon: string; accent: string; accentLight: string }) {
  return (
    <div style={{ borderRadius: 14, padding: '20px 22px', background: WHITE, border: `1px solid ${SLATE_300}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: SLATE_500, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</span>
        <div style={{ width: 38, height: 38, borderRadius: 10, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: accentLight }}>{icon}</div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: SLATE, marginBottom: 6, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: WHITE, borderRadius: 14, border: `1px solid ${SLATE_300}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', ...style }}>
      {children}
    </div>
  );
}

export default function User_Dashboard() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? 64 : 240;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const clientName = localStorage.getItem('client_name') ?? '';
  const avatarInitials = clientName ? clientName.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    const clientId = localStorage.getItem('client_id');
    fetch(`https://city-animate-anagram.ngrok-free.dev/get_campaigns_by_client/${clientId}/`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        if (Array.isArray(data)) { setCampaigns(data); return; }
        if (Array.isArray((data as any).campaigns)) { setCampaigns((data as any).campaigns); return; }
        setCampaigns([]);
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoadingCampaigns(false));
  }, []);

  const activeCount = campaigns.filter(isActiveCampaign).length;
  const approvedCount = campaigns.filter(c => c.approval_status === 'approved').length;
  const pendingCount = campaigns.filter(c => c.approval_status === 'pending' || (!c.approval_status && !c.status)).length;

  const kpis = [
    { label: 'Active Campaigns', value: activeCount, icon: '📣', accent: BLUE, accentLight: BLUE_LIGHT },
    { label: 'Total Campaigns', value: campaigns.length, icon: '📊', accent: '#7C3AED', accentLight: '#EDE9FE' },
    { label: 'Total Clicks', value: '168K', icon: '🖱️', accent: GREEN, accentLight: GREEN_LIGHT },
    { label: 'Avg CTR', value: '2.1%', icon: '📈', accent: AMBER, accentLight: AMBER_LIGHT },
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
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${SLATE_300}; border-radius: 4px; }
      `}</style>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div style={{ marginLeft: sideWidth, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.25s cubic-bezier(.4,0,.2,1)', minWidth: 0 }}>
        <Topbar
          title="Dashboard"
          subtitle={`WELCOME BACK, ${clientName.toUpperCase()} `}
          avatarInitials={avatarInitials}
          actions={
            <button onClick={() => navigate('/campaign_create')} style={{ padding: '8px 16px', border: 'none', borderRadius: 9, background: BLUE, color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em', fontFamily: 'inherit' }}>
              + NEW CAMPAIGN
            </button>
          }
        />

        <main style={{ flex: 1, padding: 24, overflowY: 'auto', animation: 'fadeUp 0.35s ease both' }}>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
            {kpis.map(k => <KpiCard key={k.label} {...k} />)}
          </div>

          {/* Chart + Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
            <Card style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: SLATE, letterSpacing: '-0.3px' }}>Performance This Week</h3>
                  <p style={{ fontSize: 11, color: SLATE_500, marginTop: 3, letterSpacing: '0.06em', fontWeight: 600 }}>IMPRESSIONS &amp; CLICKS TREND</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: GREEN_LIGHT, border: '1px solid #BBF7D0', fontSize: 10, fontWeight: 700, color: GREEN, letterSpacing: '0.08em' }}>
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
                  <Tooltip contentStyle={{ background: WHITE, border: `1px solid ${SLATE_300}`, borderRadius: 10, fontSize: 12, color: SLATE, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="impressions" stroke={BLUE} fill="url(#impGrad)" strokeWidth={2} name="Impressions (K)" />
                  <Area type="monotone" dataKey="clicks" stroke={GREEN} fill="url(#clkGrad)" strokeWidth={2} name="Clicks" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ padding: 22 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: SLATE, marginBottom: 4, letterSpacing: '-0.3px' }}>Quick Actions</h3>
              <p style={{ fontSize: 11, color: SLATE_500, marginBottom: 16, letterSpacing: '0.06em', fontWeight: 600 }}>LAUNCH A WORKFLOW</p>
              {quickActions.map(a => (
                <div key={a.label} onClick={() => navigate(a.to)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 8, border: `1px solid ${SLATE_300}`, background: WHITE, transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = a.color + '66'; (e.currentTarget as HTMLDivElement).style.background = a.bg; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = SLATE_300; (e.currentTarget as HTMLDivElement).style.background = WHITE; }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: a.color }}>{a.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: SLATE_700 }}>{a.label}</span>
                  <ChevronRight size={14} style={{ marginLeft: 'auto', color: SLATE_300 }} />
                </div>
              ))}
            </Card>
          </div>

          {/* ── Campaigns Table (shared component) ── */}
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: `1px solid ${SLATE_300}` }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: SLATE, letterSpacing: '-0.3px' }}>My Campaigns</h3>
                <p style={{ fontSize: 11, color: SLATE_500, marginTop: 2, fontWeight: 500 }}>
                  {campaigns.length} Total · {activeCount} Active · {approvedCount} Approved · {pendingCount} Pending
                </p>
              </div>
              <button onClick={() => navigate('/user_campaigns')} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, color: BLUE, background: BLUE_LIGHT, border: `1px solid ${BLUE_MID}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                View All
              </button>
            </div>
            <UserCampaignsTable campaigns={campaigns} loading={loadingCampaigns} pageSize={5} />
          </Card>

        </main>
      </div>
    </div>
  );
}