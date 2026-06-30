// CreativeLayout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CreativeSidebar from './CreativeSidebar';
import { C } from '../types/types'
import { Button } from "antd";

const SLATE_300 = '#CBD5E1';
const WHITE = '#FFFFFF';
const BLUE = '#2563EB';
const BG = '#F8FAFC';

export interface CreativeOutletContext {
    // add shared state here if child pages need it
}

export default function CreativeLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const sideWidth = collapsed ? 64 : 240;

    const clientName = localStorage.getItem('client_name') ?? '';
    const avatarInitials = clientName ? clientName.charAt(0).toUpperCase() : 'C';
    const displayName = clientName || 'User';

    return (
        <div style={{
            display: 'flex', minHeight: '100vh',
            background: BG,
        }}>
            <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${SLATE_300}; border-radius: 4px; }
        .ant-table-thead > tr > th {
          background: #F1F5F9 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #64748B !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      `}</style>
            <CreativeSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

            <div style={{
                marginLeft: sideWidth, flex: 1,
                display: 'flex', flexDirection: 'column',
                transition: 'margin-left 0.25s cubic-bezier(.4,0,.2,1)',
                minWidth: 0,
            }}>
                {/* Header */}
                <header style={{
                    background: WHITE,
                    borderBottom: `1px solid ${SLATE_300}`,
                    padding: '0 28px',
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                background: C.blue,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontWeight: 900,
                                color: C.white,
                                flexShrink: 0,
                            }}
                        >
                            {avatarInitials}
                        </div>
                        <div>
                            <span
                                style={{ fontSize: 14, fontWeight: 700, color: C.slate }}
                            >
                                {displayName}
                            </span>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: C.slate500,
                                    marginLeft: 8,
                                }}
                            >
                                / Creative Portal
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>


                        {/* Bell */}
                        <div style={{ position: 'relative' }}>
                            <Button
                                style={{
                                    position: 'relative',
                                    width: 36, height: 36, borderRadius: 9,
                                    border: `1px solid #E2E8F0`,
                                    background: WHITE,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', fontSize: 15, padding: 0,
                                }}
                            >
                                🔔

                            </Button>
                        </div>

                        {/* Avatar */}
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%', background: BLUE,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: WHITE, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        }}>
                            {avatarInitials ?? 'U'}
                        </div>
                    </div>
                </header>

                <main style={{
                    flex: 1, padding: 24,
                    overflowY: 'auto',
                    animation: 'fadeUp 0.35s ease both',
                }}>
                    <Outlet context={{} as CreativeOutletContext} />
                </main>
            </div>
        </div>
    );
}