// User_Dashboard.tsx — NO Sidebar import, NO Firebase, NO notification state
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, ResponsiveContainer } from 'recharts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as AreaTooltip } from 'recharts';
import UserCampaignsTable, { type Campaign, isActiveCampaign } from '../shared/UserCampaignsTable';
import Client_General_Chat from './Client_General_Chat';

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Colors ───────────────────────────────────────────────────────────────────
const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const BLUE_MID = '#BFDBFE';
const GREEN = '#16A34A';
const GREEN_LIGHT = '#DCFCE7';
const AMBER = '#D97706';
const AMBER_LIGHT = '#FEF3C7';
const RED = '#DC2626';
const SLATE = '#0F172A';
// const SLATE_700 = '#334155';
const SLATE_500 = '#64748B';
const SLATE_300 = '#CBD5E1';
const SLATE_100 = '#F1F5F9';
const WHITE = '#FFFFFF';

// ── KpiCard ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, accentLight }: {
  label: string; value: string | number; icon: string; accent: string; accentLight: string;
}) {
  return (
    <div style={{
      borderRadius: 14, padding: '20px 22px', background: WHITE,
      border: `1px solid ${SLATE_300}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: SLATE_500, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</span>
        <div style={{ width: 38, height: 38, borderRadius: 10, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: accentLight }}>{icon}</div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: SLATE, marginBottom: 6, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: WHITE, borderRadius: 14,
      border: `1px solid ${SLATE_300}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', ...style,
    }}>
      {children}
    </div>
  );
}

// ── My Status Donut ──────────────────────────────────────────────────────────
function MyStatusDonut({ live, upcoming, paused, completed }: { live: number; upcoming: number; paused: number; completed: number }) {
  const data = [
    { name: 'Live', value: live, color: GREEN },
    { name: 'Upcoming', value: upcoming, color: AMBER },
    { name: 'Paused', value: paused, color: SLATE_500 },
    { name: 'Completed', value: completed, color: RED },
  ];
  const total = live + upcoming + paused + completed;

  return (
    <Card style={{ padding: 22, position: 'relative' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: SLATE, marginBottom: 4, letterSpacing: '-0.3px' }}>My Line Item Status</h3>
      <p style={{ fontSize: 11, color: SLATE_500, marginBottom: 16, letterSpacing: '0.06em', fontWeight: 600 }}>ACROSS ALL MY CAMPAIGNS</p>
      {total === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', fontSize: 12, color: SLATE_500 }}>No line items yet</div>
      ) : (
        <div style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={2}>
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <PieTooltip
                formatter={(value, name) => {
                  const num = typeof value === 'number' ? value : Number(value) || 0;
                  return [`${num} (${Math.round((num / total) * 100)}%)`, String(name)];
                }}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: `1px solid ${SLATE_300}` }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: SLATE }}>{total}</div>
            <div style={{ fontSize: 10, color: SLATE_500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── My Campaigns Over Time ───────────────────────────────────────────────────
function buildMyCampaignTimeSeries(campaigns: Campaign[]) {
  const counts: Record<string, number> = {};
  campaigns.forEach(c => {
    const d = new Date((c as any).created_at);
    const key = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    counts[key] = (counts[key] || 0) + 1;
  });
  const sorted = Object.entries(counts)
    .map(([label, count]) => ({ label, count, dateObj: new Date(label) }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  let cumulative = 0;
  return sorted.map(({ label, count }) => {
    cumulative += count;
    return { label, count, cumulative };
  });
}

function MyCampaignsOverTime({ campaigns }: { campaigns: Campaign[] }) {
  const data = buildMyCampaignTimeSeries(campaigns);
  return (
    <Card style={{ padding: 22 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: SLATE, marginBottom: 4, letterSpacing: '-0.3px' }}>My Campaigns Over Time</h3>
      <p style={{ fontSize: 11, color: SLATE_500, marginBottom: 16, letterSpacing: '0.06em', fontWeight: 600 }}>CUMULATIVE GROWTH</p>
      {data.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', fontSize: 12, color: SLATE_500 }}>No campaigns yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="myCampGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BLUE} stopOpacity={0.18} />
                <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={SLATE_100} vertical={false} />
            <XAxis dataKey="label" stroke={SLATE_300} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: SLATE_500 }} />
            <YAxis stroke={SLATE_300} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: SLATE_500 }} allowDecimals={false} />
            <AreaTooltip contentStyle={{ background: WHITE, border: `1px solid ${SLATE_300}`, borderRadius: 10, fontSize: 12, color: SLATE, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
            <Area type="monotone" dataKey="cumulative" stroke={BLUE} fill="url(#myCampGrad)" strokeWidth={2} name="Total campaigns" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

export default function User_Dashboard() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const clientName = localStorage.getItem('client_name') ?? '';

  useEffect(() => {
    const clientId = localStorage.getItem('client_id');
    fetch(`${BASE_URL}/get_campaigns_by_client/${clientId}/`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then(r => r.json())
      .then(data => setCampaigns(Array.isArray(data) ? data : data?.campaigns ?? []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoadingCampaigns(false));
  }, []);

  const activeCount = campaigns.filter(isActiveCampaign).length;
  const approvedCount = campaigns.filter(c => c.approval_status === 'approved').length;
  const pendingCount = campaigns.filter(c => c.approval_status === 'pending').length;

  // ── Derive line-item status counts across this client's campaigns ──
  const allLineItems: { status?: string }[] = [];
  campaigns.forEach((c: any) => {
    (c.line_items || []).forEach((li: any) => allLineItems.push(li));
  });
  const liveLI = allLineItems.filter(li => li.status === 'live').length;
  const upcomingLI = allLineItems.filter(li => li.status === 'upcoming').length;
  const pausedLI = allLineItems.filter(li => li.status === 'paused').length;
  const completedLI = allLineItems.filter(li => li.status === 'completed').length;

  const kpis = [
    { label: 'Total Campaigns', value: campaigns.length, icon: '📊', accent: '#7C3AED', accentLight: '#EDE9FE' },
    { label: 'Active Campaigns', value: activeCount, icon: '📣', accent: BLUE, accentLight: BLUE_LIGHT },
    { label: 'Approved', value: approvedCount, icon: '✓', accent: GREEN, accentLight: GREEN_LIGHT },
    { label: 'Pending', value: pendingCount, icon: '⏳', accent: AMBER, accentLight: AMBER_LIGHT },
  ];

  return (
    <>
      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: SLATE }}>Dashboard</h1>
        <p style={{ fontSize: 11, color: SLATE_500, marginTop: 1, letterSpacing: '0.04em', fontWeight: 500 }}>WELCOME BACK, {clientName.toUpperCase()}</p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Charts + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <MyStatusDonut live={liveLI} upcoming={upcomingLI} paused={pausedLI} completed={completedLI} />
        <MyCampaignsOverTime campaigns={campaigns} />
      </div>

      {/* Campaigns Table */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 22px', borderBottom: `1px solid ${SLATE_300}`,
        }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: SLATE, letterSpacing: '-0.3px' }}>My Campaigns</h3>
            <p style={{ fontSize: 11, color: SLATE_500, marginTop: 2, fontWeight: 500 }}>
              {campaigns.length} Total · {activeCount} Active · {approvedCount} Approved · {pendingCount} Pending
            </p>
          </div>
          <button
            onClick={() => navigate('/user_campaigns')}
            style={{
              padding: '6px 14px', fontSize: 12, fontWeight: 600,
              color: BLUE, background: BLUE_LIGHT,
              border: `1px solid ${BLUE_MID}`, borderRadius: 8,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            View All
          </button>
        </div>
        <UserCampaignsTable campaigns={campaigns} loading={loadingCampaigns} pageSize={5} />
      </Card>
      <Client_General_Chat />
    </>
  );
}