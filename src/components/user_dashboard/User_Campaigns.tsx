import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import Sidebar from '../shared/Sidebar';
import UserCampaignsTable, { type Campaign, isActiveCampaign, isClosedCampaign } from '../shared/UserCampaignsTable';

const { Title, Text } = Typography;
const { Option } = Select;

const BLUE = '#2563EB';
const GREEN = '#16A34A';
const GREEN_LIGHT = '#F0FDF4';
const RED = '#DC2626';
const RED_LIGHT = '#FEF2F2';
const BLUE_LIGHT = '#EFF6FF';
const SLATE = '#0F172A';
const SLATE_300 = '#CBD5E1';
const SLATE_500 = '#64748B';
const WHITE = '#FFFFFF';
const BG = '#F8FAFC';

function StatCard({ label, value, color, bg, icon, active, onClick }: {
  label: string; value: number; color: string; bg: string;
  icon: string; active: boolean; onClick: () => void;
}) {
  return (
    <div onClick={onClick} style={{
      background: WHITE, borderRadius: 14, padding: '20px',
      border: active ? `2px solid ${color}` : '1px solid #E2E8F0',
      boxShadow: active ? `0 0 0 3px ${color}22, 0 2px 8px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.06)',
      cursor: 'pointer', transition: 'all 0.18s', position: 'relative', overflow: 'hidden',
    }}>
      {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '14px 14px 0 0' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: active ? color : SLATE_500, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

export default function User_Campaigns() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? 64 : 240;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [cardFilter, setCardFilter] = useState<'all' | 'active' | 'closed'>('all');

  const fetchCampaigns = () => {
    const clientId = localStorage.getItem('client_id');
    setLoading(true);
    fetch(`https://city-animate-anagram.ngrok-free.dev/get_campaigns_by_client/${clientId}/`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        const list: Campaign[] = Array.isArray(data) ? data : Array.isArray(data?.campaigns) ? data.campaigns : [];
        setCampaigns(list);
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const totalCount = campaigns.length;
  const activeCount = campaigns.filter(isActiveCampaign).length;
  const closedCount = campaigns.filter(isClosedCampaign).length;

  const filtered = campaigns.filter(c => {
    if (cardFilter === 'active' && !isActiveCampaign(c)) return false;
    if (cardFilter === 'closed' && !isClosedCampaign(c)) return false;
    if (typeFilter !== 'all' && c.campaign_type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = [c.campaign_name, c.campaign_id, c.client_campaign_ID, c.client_name, c.advertiser]
        .some(f => f?.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const uniqueTypes = [...new Set(campaigns.map(c => c.campaign_type).filter(Boolean))] as string[];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div style={{ marginLeft: sideWidth, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.25s', minWidth: 0 }}>
        <header style={{ background: WHITE, borderBottom: `1px solid ${SLATE_300}`, padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div>
            <Title level={5} style={{ margin: 0, color: SLATE }}>All Campaigns</Title>
            <Text style={{ fontSize: 11, color: SLATE_500, letterSpacing: '0.04em' }}>MANAGE &amp; TRACK YOUR CAMPAIGNS</Text>
          </div>
          <Button type="primary" onClick={() => navigate('/campaign_create')} style={{ padding: '8px 16px', border: 'none', borderRadius: 9, background: BLUE, color: WHITE, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em' }}>
            + NEW CAMPAIGN
          </Button>
        </header>

        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            <StatCard label="Total Campaigns" value={totalCount} color={BLUE} bg={BLUE_LIGHT} icon="📊" active={cardFilter === 'all'} onClick={() => setCardFilter('all')} />
            <StatCard label="Active Campaigns" value={activeCount} color={GREEN} bg={GREEN_LIGHT} icon="🟢" active={cardFilter === 'active'} onClick={() => setCardFilter(cardFilter === 'active' ? 'all' : 'active')} />
            <StatCard label="Closed Campaigns" value={closedCount} color={RED} bg={RED_LIGHT} icon="🔴" active={cardFilter === 'closed'} onClick={() => setCardFilter(cardFilter === 'closed' ? 'all' : 'closed')} />
          </div>

          {/* Active filter pill */}
          {cardFilter !== 'all' && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: SLATE_500 }}>Filtered by:</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 20, background: cardFilter === 'active' ? GREEN_LIGHT : RED_LIGHT, border: `1px solid ${cardFilter === 'active' ? '#BBF7D0' : '#FECACA'}`, fontSize: 11, fontWeight: 700, color: cardFilter === 'active' ? GREEN : RED }}>
                {cardFilter === 'active' ? '🟢 Active Campaigns' : '🔴 Closed Campaigns'}
                <button onClick={() => setCardFilter('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: cardFilter === 'active' ? GREEN : RED, fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
              </span>
            </div>
          )}

          {/* Filters bar */}
          <div style={{ background: WHITE, borderRadius: 12, padding: '16px 20px', border: `1px solid ${SLATE_300}`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Input placeholder="Search by name, ID, advertiser…" prefix={<SearchOutlined style={{ color: SLATE_500 }} />} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 240, height: 36 }} allowClear />
            <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 180, height: 36 }}>
              <Option value="all">All Types</Option>
              {uniqueTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchCampaigns} style={{ height: 36, color: SLATE_500, border: `1px solid ${SLATE_300}` }}>Refresh</Button>
            <Text style={{ marginLeft: 'auto', fontSize: 12, color: SLATE_500 }}>{filtered.length} of {totalCount} campaigns</Text>
          </div>

          {/* ── Shared Table Component ── */}
          <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${SLATE_300}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <UserCampaignsTable campaigns={filtered} loading={loading} pageSize={10} />
          </div>
        </main>
      </div>
    </div>
  );
}