// UserLayout.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';
import { Button } from "antd";
import { C } from "../types/types"

// ── Firebase imports ────────────────────────────────────────────────────────
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import SuperAdminSidebar from '../super_admin/SuperAdminSidebar';
import AdminSidebar from '../admin/AdminSidebar';

// ── Firebase config ─────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyCm6A3ecdnRuM2BtqcU8hbViNVmtSYowNE",
    authDomain: "crm-notification-system-b1fbf.firebaseapp.com",
    projectId: "crm-notification-system-b1fbf",
    storageBucket: "crm-notification-system-b1fbf.firebasestorage.app",
    messagingSenderId: "822813005343",
    appId: "1:822813005343:web:9b60be7829ac4a5615e72a",
};

// ── VAPID key for FCM ───────────────────────────────────────────────────
const VAPID_KEY =
    "BOrsq40DwgRJYZ6MUfTq6evI-iBEF2rknTh-sgONupO8DJNDFiZF-nRY49GAOE8fwUwqa_I2R0nXYTmkUHmC1eU";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ── Init Firebase once ───────────────────────────────────────────────────────
const firebaseApp =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ── Colors ───────────────────────────────────────────────────────────────────
const BLUE = '#2563EB';
const SLATE = '#0F172A';
const SLATE_500 = '#64748B';
const SLATE_300 = '#CBD5E1';
const WHITE = '#FFFFFF';
const BG = '#F8FAFC';
const BORDER = '#E2E8F0';

// ── Types ────────────────────────────────────────────────────────────────────
interface UserNotification {
    id: number;
    message: string;
    time: string;
    read: boolean;
}

interface TopbarProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    avatarInitials?: string;
    notifications: UserNotification[];
    unreadCount: number;
    showDropdown: boolean;
    dropdownRef: React.RefObject<HTMLDivElement | null>;
    onBellClick: () => void;
    onClearAll: () => void;
    displayName?: string;
}

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({
    actions, avatarInitials,
    notifications, unreadCount, showDropdown,
    dropdownRef, onBellClick, onClearAll, displayName
}: TopbarProps) {
    return (

        <header style={{
            background: C.white,
            borderBottom: `1px solid ${C.border}`,
            padding: '0 28px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            flexShrink: 0,
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
                        / User Portal
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {actions}

                {/* Bell */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <Button
                        onClick={onBellClick}
                        style={{
                            position: 'relative',
                            width: 36, height: 36, borderRadius: 9,
                            border: `1px solid ${BORDER}`,
                            background: WHITE,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 15, padding: 0,
                        }}
                    >
                        🔔
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: -4, right: -4,
                                minWidth: 18, height: 18, borderRadius: 9,
                                background: '#EF4444', color: '#fff',
                                fontSize: 10, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0 4px', lineHeight: 1,
                                border: `2px solid ${WHITE}`,
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Button>

                    {showDropdown && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                            width: 320, background: WHITE,
                            border: `1px solid ${BORDER}`, borderRadius: 12,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                            zIndex: 999, animation: 'slideDown 0.2s ease both',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
                            }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: SLATE }}>Notifications</span>
                                {notifications.length > 0 && (
                                    <button onClick={onClearAll} style={{
                                        fontSize: 11, color: BLUE,
                                        background: 'none', border: 'none',
                                        cursor: 'pointer', fontWeight: 600, padding: 0,
                                    }}>
                                        Clear all
                                    </button>
                                )}
                            </div>

                            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <div style={{
                                        padding: '32px 16px', textAlign: 'center',
                                        color: SLATE_500, fontSize: 13,
                                    }}>
                                        <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
                                        No notifications yet
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div key={n.id} style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 10,
                                            padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
                                            background: n.read ? WHITE : '#EFF6FF',
                                            transition: 'background 0.2s',
                                        }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: '#DBEAFE', flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 14,
                                            }}>🎯</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    margin: 0, fontSize: 12, color: SLATE,
                                                    fontWeight: n.read ? 400 : 600, lineHeight: 1.4,
                                                }}>{n.message}</p>
                                                <p style={{ margin: '3px 0 0', fontSize: 11, color: SLATE_500 }}>{n.time}</p>
                                            </div>
                                            {!n.read && (
                                                <div style={{
                                                    width: 7, height: 7, borderRadius: '50%',
                                                    background: BLUE, flexShrink: 0, marginTop: 4,
                                                }} />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
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
    );
}

export interface UserOutletContext {
    // add shared state here if child pages need it
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function UserLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const sideWidth = collapsed ? 64 : 240;

    const location = useLocation(); // ← ADD THIS

    // ── Sidebar mode detection ──
    const isCampaignCreatePage = location.pathname === '/campaign_create';
const params = new URLSearchParams(location.search);
const adminModeFromQuery = params.get('adminMode') === 'true';
const superadminModeFromQuery = params.get('superadminMode') === 'true';

const sidebarMode = isCampaignCreatePage
    ? (superadminModeFromQuery ? 'superadmin'
        : adminModeFromQuery ? 'admin'
        : (sessionStorage.getItem('sidebar_mode') ?? 'user'))
    : 'user';

    const clientName = localStorage.getItem('client_name') ?? '';
    const avatarInitials = clientName ? clientName.charAt(0).toUpperCase() : 'U';
    const displayName = clientName || 'User';

    const [notifications, setNotifications] = useState<UserNotification[]>(() => {
        try {
            const saved = localStorage.getItem('user_notifications');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const hasRegistered = useRef(false);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('user_notifications', JSON.stringify(notifications));
    }, [notifications]);

    const addNotification = (message: string) => {
        const newNotif: UserNotification = {
            id: Date.now(),
            message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
        };
        setNotifications((prev) => [newNotif, ...prev]);
    };

    const showDesktopNotification = (message: string) => {
        if (!('Notification' in window)) return;
        const fire = () => new Notification('🎯 Campaign Update', {
            body: message, icon: '/icons.svg', tag: `user-crm-${Date.now()}`,
        });
        if (Notification.permission === 'granted') fire();
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((p) => { if (p === 'granted') fire(); });
        }
    };

    // Request permission
    useEffect(() => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') Notification.requestPermission();
    }, []);

    // Register SW + FCM token
    useEffect(() => {
        const registerAndSaveToken = async () => {
            if (hasRegistered.current) return;
            hasRegistered.current = true;
            try {
                if (!('serviceWorker' in navigator)) return;
                const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;
                const messaging = getMessaging(firebaseApp);
                const token = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: swRegistration,
                });
                if (!token) return;
                const client_id = localStorage.getItem('client_id') ?? '';
                await fetch(`${BASE_URL}/save_fcm_token/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, client_id }),
                });
            } catch (err) {
                console.error('FCM setup error:', err);
            }
        };
        registerAndSaveToken();
    }, []);

    // FCM foreground listener
    useEffect(() => {
        try {
            const messaging = getMessaging(firebaseApp);
            const unsubscribe = onMessage(messaging, (payload) => {
                const message = payload.notification?.body || payload.data?.message || 'New notification';
                addNotification(message);
                showDesktopNotification(message);
            });
            return () => unsubscribe();
        } catch (err) {
            console.error('FCM onMessage error:', err);
        }
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleBellClick = () => {
        setShowDropdown((prev) => !prev);
        if (!showDropdown) {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }
    };

    const handleClearAll = () => {
        setNotifications([]);
        localStorage.removeItem('user_notifications');
        setShowDropdown(false);
    };

    return (
        <div style={{
            display: 'flex', minHeight: '100vh',
            background: BG,
        }}>
            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: ${SLATE_300}; border-radius: 4px; }
            `}</style>

            {/* With this: */}
            {sidebarMode === 'superadmin' ? (
                <SuperAdminSidebar counts={{
                    total: 0, pending: 0, approved: 0,
                    rejected: 0, campaignTotal: 0
                }} />
            ) : sidebarMode === 'admin' ? (
                <AdminSidebar counts={{
                    total: 0, campaignTotal: 0, pending: 0, approved: 0, rejected: 0
                }} />
            ) : (
                <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
            )}

            <div style={{
                marginLeft: sideWidth, flex: 1,
                display: 'flex', flexDirection: 'column',
                transition: 'margin-left 0.25s cubic-bezier(.4,0,.2,1)',
                minWidth: 0,
            }}>
                <Topbar
                    title=""
                    avatarInitials={avatarInitials}
                    notifications={notifications}
                    unreadCount={unreadCount}
                    showDropdown={showDropdown}
                    dropdownRef={dropdownRef}
                    onBellClick={handleBellClick}
                    onClearAll={handleClearAll}
                    displayName={displayName}
                />

                <main style={{
                    flex: 1, padding: 24,
                    overflowY: 'auto',
                    animation: 'fadeUp 0.35s ease both',
                }}>
                    <Outlet context={{} as UserOutletContext} />
                </main>
            </div>
        </div>
    );
}