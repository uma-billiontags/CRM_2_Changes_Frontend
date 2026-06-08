import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, LogOut,
} from 'lucide-react';

const BLUE = '#2563EB';
const WHITE  = '#FFFFFF';

const CAMPAIGN_NAV = [
  {
    g: 'WORKSPACE',
    items: [
      { label: 'Dashboard',              icon: LayoutDashboard, to: '/campaign_dashboard'      },
    ],
  },
  
];

interface CampaignSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function CampaignSidebar({ collapsed, onToggle }: CampaignSidebarProps) {
  const location  = useLocation();
  const clientName = localStorage.getItem('client_name') ?? '';

  const avatarInitials = clientName ? clientName.charAt(0).toUpperCase() : 'C';
  const displayName    = clientName || 'Campaign Team';

  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      minHeight: '100vh',
      background: '#0F172A',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0 14px' : '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
      }}>
        {!collapsed && (
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
           <div style={{
              width: 32, height: 32, borderRadius: '50%', background: BLUE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: WHITE, fontSize: 12, fontWeight: 800, flexShrink: 0,
            }}>{avatarInitials}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: WHITE, letterSpacing: '-0.3px' }}>
                {displayName} 
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
          }}>{avatarInitials}</div>
        )}

        <button
          onClick={onToggle}
          style={{
            position: collapsed ? 'absolute' : 'relative',
            right: collapsed ? 8 : 'auto', top: collapsed ? 20 : 'auto',
            width: 26, height: 26, borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'rgba(255,255,255,0.4)', flexShrink: 0,
          }}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {CAMPAIGN_NAV.map(({ g, items }) => (
          <div key={g} style={{ marginBottom: 2 }}>
            {!collapsed && (
              <div style={{
                fontSize: 9, fontWeight: 700,
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.12em',
                padding: '10px 10px 4px',
                textTransform: 'uppercase',
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
                    background: active ? BLUE  : 'transparent',
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

      {/* ── Footer ── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: collapsed ? '10px 8px' : '10px',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', marginBottom: 6,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: BLUE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: WHITE, fontSize: 12, fontWeight: 800, flexShrink: 0,
            }}>{avatarInitials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>{displayName}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>CAMPAIGN TEAM</div>
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