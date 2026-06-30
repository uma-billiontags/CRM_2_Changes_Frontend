import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "antd";
import { useAuth } from "../hooks/useAuth";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const WS_BASE_URL = BASE_URL.replace(/^http/, "ws");

interface RoomSummary {
    room_id: number;
    client_id: string;
    client_name: string;
    last_message: string | null;
    last_time: string | null;
    unread_count: number;
}

interface TeamRoomSummary {
    room_id: number;
    user_id: number;
    member_name: string;
    member_role: string;
    last_message: string | null;
    last_time: string | null;
    unread_count: number;
}

interface Message {
    id: number;
    content: string;
    sender_type: "admin" | "client";
    timestamp: string;
    sender_id?: number | string;
    message_type?: "text" | "image" | "video" | "file";
    file_url?: string;
    file_name?: string;
    file_size?: string;
}

interface StagedFile {
    file: File;
    previewUrl: string;
    message_type: "image" | "video" | "file";
}

function getFileIcon(fileName?: string): string {
    if (!fileName) return "📎";
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📄";
    if (ext === "xls" || ext === "xlsx") return "📊";
    if (ext === "doc" || ext === "docx") return "📝";
    if (ext === "txt") return "📃";
    if (ext === "zip" || ext === "rar") return "🗜️";
    return "📎";
}

export default function Admin_Messages_Sidebar() {
    const { user } = useAuth();

    const [listTab, setListTab] = useState<"clients" | "team">("clients");
    const [rooms, setRooms] = useState<RoomSummary[]>([]);
    const [teamRooms, setTeamRooms] = useState<TeamRoomSummary[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [activeClientId, setActiveClientId] = useState<string | null>(null);
    const [activeUserId, setActiveUserId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [input, setInput] = useState("");
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [staged, setStaged] = useState<StagedFile | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeRoom = rooms.find(r => r.client_id === activeClientId);
    const activeTeamRoom = teamRooms.find(r => r.user_id === activeUserId);

    // ── Load client rooms ──
    const loadRooms = useCallback(async () => {
        setLoadingRooms(true);
        try {
            const res = await fetch(`${BASE_URL}/get_all_general_chat_rooms/`);
            const data = await res.json();
            setRooms(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load general chat rooms", err);
        } finally {
            setLoadingRooms(false);
        }
    }, []);

    // ── Load team rooms ──
    const loadTeamRooms = useCallback(async () => {
        setLoadingRooms(true);
        try {
            const res = await fetch(`${BASE_URL}/get_all_internal_chat_rooms/`);
            const data = await res.json();
            setTeamRooms(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load internal chat rooms", err);
        } finally {
            setLoadingRooms(false);
        }
    }, []);

    useEffect(() => {
        if (listTab === "clients") loadRooms();
        else loadTeamRooms();
    }, [listTab, loadRooms, loadTeamRooms]);

    const loadHistory = useCallback(async (clientId: string) => {
        setLoadingMsgs(true);
        try {
            const res = await fetch(`${BASE_URL}/get_general_chat_history/${clientId}/`);
            const data = await res.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load thread history", err);
        } finally {
            setLoadingMsgs(false);
        }
    }, []);

    const loadTeamHistory = useCallback(async (userId: number) => {
        setLoadingMsgs(true);
        try {
            const res = await fetch(`${BASE_URL}/get_internal_chat_history/${userId}/`);
            const data = await res.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load team thread history", err);
        } finally {
            setLoadingMsgs(false);
        }
    }, []);

    // ── Client WebSocket ──
    useEffect(() => {
        if (!activeClientId) return;
        loadHistory(activeClientId);
        const socket = new WebSocket(`${WS_BASE_URL}/ws/general-chat/${activeClientId}/`);
        socketRef.current = socket;
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.content !== undefined || data.file_url) {
                    const normalized = { ...data, id: data.id ?? data.message_id ?? Date.now() };
                    setMessages(prev => prev.some(m => m.id === normalized.id) ? prev : [...prev, normalized]);
                    loadRooms();
                }
            } catch (e) { console.error("Admin general chat WS error", e); }
        };
        fetch(`${BASE_URL}/mark_general_messages_read/${activeClientId}/`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reader_type: "admin" }),
        }).then(() => loadRooms());
        return () => { socket.close(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeClientId]);

    // ── Team WebSocket ──
    useEffect(() => {
        if (!activeUserId) return;
        loadTeamHistory(activeUserId);
        const socket = new WebSocket(`${WS_BASE_URL}/ws/internal-chat/${activeUserId}/`);
        socketRef.current = socket;
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.content !== undefined || data.file_url) {
                    const normalized = { ...data, id: data.id ?? data.message_id ?? Date.now() };
                    setMessages(prev => prev.some(m => m.id === normalized.id) ? prev : [...prev, normalized]);
                    loadTeamRooms();
                }
            } catch (e) { console.error("Admin internal chat WS error", e); }
        };
        fetch(`${BASE_URL}/mark_internal_messages_read/${activeUserId}/`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reader_type: "admin" }),
        }).then(() => loadTeamRooms());
        return () => { socket.close(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeUserId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, staged]);

    const clearStaged = () => {
        if (staged) URL.revokeObjectURL(staged.previewUrl);
        setStaged(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileSelect = (file: File) => {
        if (staged) URL.revokeObjectURL(staged.previewUrl);
        let message_type: "image" | "video" | "file" = "file";
        if (file.type.startsWith("image/")) message_type = "image";
        else if (file.type.startsWith("video/")) message_type = "video";
        setStaged({ file, previewUrl: URL.createObjectURL(file), message_type });
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const uploadStagedFile = async () => {
        const targetId = listTab === "clients" ? activeClientId : activeUserId;
        if (!staged || !targetId) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", staged.file);
        formData.append("sender_id", String(user.id));
        formData.append("sender_type", "admin");
        const endpoint = listTab === "clients"
            ? `${BASE_URL}/send_general_chat_file/${targetId}/`
            : `${BASE_URL}/send_internal_chat_file/${targetId}/`;
        try {
            const res = await fetch(endpoint, { method: "POST", body: formData });
            if (!res.ok) console.error("Admin file upload failed");
        } catch (err) {
            console.error("Admin file send error", err);
        } finally {
            setUploading(false);
            clearStaged();
        }
    };

    const handleSend = () => {
        if (staged) { uploadStagedFile(); return; }
        const text = input.trim();
        const targetId = listTab === "clients" ? activeClientId : activeUserId;
        if (!text || !socketRef.current || !targetId) return;
        socketRef.current.send(JSON.stringify({ content: text, sender_id: user.id, sender_type: "admin" }));
        setInput("");
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSend();
    };

    const renderMessageContent = (msg: Message) => {
        const isAdmin = msg.sender_type === "admin";
        if (msg.message_type === "image" && msg.file_url) {
            return (
                <div>
                    <img src={msg.file_url} alt={msg.file_name || "image"}
                        onClick={() => setImagePreview(msg.file_url!)}
                        style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, cursor: "pointer", display: "block", objectFit: "cover" }} />
                    {msg.file_size && <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>{msg.file_name} · {msg.file_size}</div>}
                </div>
            );
        }
        if (msg.message_type === "video" && msg.file_url) {
            return (
                <div>
                    <video src={msg.file_url} controls style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, display: "block", background: "#000" }} />
                    {msg.file_size && <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>{msg.file_name} · {msg.file_size}</div>}
                </div>
            );
        }
        if (msg.message_type === "file" && msg.file_url) {
            return (
                <a href={msg.file_url} target="_blank" rel="noreferrer" download={msg.file_name}
                    style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", padding: "4px 2px" }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                        background: isAdmin ? "rgba(255,255,255,0.2)" : "var(--bg-input)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                    }}>
                        {getFileIcon(msg.file_name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{msg.file_name}</div>
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{msg.file_size} · Click to download</div>
                    </div>
                </a>
            );
        }
        return <span>{msg.content}</span>;
    };

    const canSend = !!staged || !!input.trim();

    // ── Shared avatar color per tab ──
    const clientAvatarBg = "var(--accent)";
    const teamAvatarBg = "var(--accent)";

    return (
        <div style={{
            display: "flex", height: "calc(100vh - 90px)",
            background: "var(--bg-card)", borderRadius: 14,
            border: "1px solid var(--border)", overflow: "hidden",
        }}>

            {/* ── LEFT: conversation list ─────────────────────────────────── */}
            <div style={{
                width: 300, borderRight: "1px solid var(--border)",
                display: "flex", flexDirection: "column", flexShrink: 0,
                background: "var(--bg-card)",
            }}>
                {/* Header */}
                <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--border)" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Messages</h3>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, marginBottom: 12 }}>
                        {listTab === "clients" ? rooms.length : teamRooms.length} conversations
                    </p>

                    {/* Tab toggle */}
                    <div style={{ display: "flex", gap: 4, background: "var(--bg-input)", borderRadius: 8, padding: 3 }}>
                        {(["clients", "team"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setListTab(tab);
                                    setActiveClientId(null);
                                    setActiveUserId(null);
                                    setMessages([]);
                                }}
                                style={{
                                    flex: 1, padding: "6px 0", borderRadius: 6, border: "none",
                                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                                    background: listTab === tab ? "var(--bg-card)" : "transparent",
                                    color: listTab === tab ? "var(--accent)" : "var(--text-muted)",
                                    boxShadow: listTab === tab ? "var(--shadow-card)" : "none",
                                    transition: "all 0.15s",
                                }}
                            >
                                {tab === "clients" ? "Clients" : "Team"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                    {loadingRooms && (
                        <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>Loading…</div>
                    )}

                    {/* Clients */}
                    {listTab === "clients" && !loadingRooms && rooms.length === 0 && (
                        <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No conversations yet</div>
                    )}
                    {listTab === "clients" && rooms.map(room => {
                        const isActive = room.client_id === activeClientId;
                        const initials = room.client_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
                        return (
                            <div
                                key={room.room_id}
                                onClick={() => setActiveClientId(room.client_id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
                                    cursor: "pointer",
                                    background: isActive ? "var(--accent-light)" : "transparent",
                                    borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                                    borderBottom: "1px solid var(--border)",
                                    transition: "background 0.15s",
                                }}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: "50%",
                                    background: clientAvatarBg, color: "#fff",
                                    fontSize: 13, fontWeight: 700,
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    {initials}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {room.client_name}
                                        </span>
                                        {room.last_time && (
                                            <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0, marginLeft: 6 }}>
                                                {new Date(room.last_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                                        <span style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170 }}>
                                            {room.last_message || "No messages yet"}
                                        </span>
                                        {room.unread_count > 0 && (
                                            <span style={{
                                                minWidth: 18, height: 18, borderRadius: 9,
                                                background: "var(--accent)", color: "#fff",
                                                fontSize: 10, fontWeight: 700,
                                                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
                                            }}>
                                                {room.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Team */}
                    {listTab === "team" && !loadingRooms && teamRooms.length === 0 && (
                        <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No team conversations yet</div>
                    )}
                    {listTab === "team" && teamRooms.map(room => {
                        const isActive = room.user_id === activeUserId;
                        const initials = room.member_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
                        return (
                            <div
                                key={room.room_id}
                                onClick={() => setActiveUserId(room.user_id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
                                    cursor: "pointer",
                                    background: isActive ? "var(--accent-light)" : "transparent",
                                    borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                                    borderBottom: "1px solid var(--border)",
                                    transition: "background 0.15s",
                                }}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: "50%",
                                    background: teamAvatarBg, color: "#fff",
                                    fontSize: 13, fontWeight: 700,
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    {initials}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {room.member_name}
                                        </span>
                                        {room.last_time && (
                                            <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0, marginLeft: 6 }}>
                                                {new Date(room.last_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                                        <span style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                                            {room.last_message || "No messages yet"}
                                        </span>
                                        <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                                            {room.member_role}
                                        </span>
                                        {room.unread_count > 0 && (
                                            <span style={{
                                                minWidth: 18, height: 18, borderRadius: 9,
                                                background: "var(--color-purple)", color: "#fff",
                                                fontSize: 10, fontWeight: 700,
                                                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
                                            }}>
                                                {room.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── RIGHT: thread panel ─────────────────────────────────────── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-page)" }}>
                {!activeClientId && !activeUserId ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
                        Select a conversation to start chatting
                    </div>
                ) : (
                    <>
                        {/* Thread header */}
                        <div style={{
                            background: "var(--bg-card)", borderBottom: "1px solid var(--border)",
                            padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: "50%",
                                background: listTab === "clients" ? clientAvatarBg : teamAvatarBg,
                                color: "#fff", fontSize: 13, fontWeight: 700,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {listTab === "clients"
                                    ? activeRoom?.client_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
                                    : activeTeamRoom?.member_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                                    {listTab === "clients" ? activeRoom?.client_name : activeTeamRoom?.member_name}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                    {listTab === "clients" ? activeClientId : activeTeamRoom?.member_role}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 10 }}>
                            {loadingMsgs && (
                                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>Loading messages…</div>
                            )}
                            {messages.map(msg => {
                                const isAdmin = msg.sender_type === "admin";
                                const isFileMsg = msg.message_type && msg.message_type !== "text";
                                return (
                                    <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start", marginBottom: 8 }}>
                                        <div style={{
                                            maxWidth: isFileMsg ? "60%" : "55%",
                                            padding: (msg.message_type === "image" || msg.message_type === "video") ? "6px" : "10px 14px",
                                            borderRadius: isAdmin ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                            background: isAdmin ? "var(--accent)" : "var(--bg-card)",
                                            color: isAdmin ? "#fff" : "var(--text-primary)",
                                            fontSize: 13,
                                            boxShadow: isAdmin ? "0 2px 8px rgba(0,0,0,0.25)" : "var(--shadow-card)",
                                            border: isAdmin ? "none" : "1px solid var(--border)",
                                            overflow: "hidden",
                                        }}>
                                            {renderMessageContent(msg)}
                                        </div>
                                        <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                );
                            })}
                            {uploading && (
                                <div style={{
                                    alignSelf: "flex-end", padding: "10px 14px",
                                    borderRadius: "14px 14px 4px 14px",
                                    background: "var(--bg-input)", fontSize: 12, color: "var(--text-muted)",
                                }}>
                                    Uploading…
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input area */}
                        <div style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
                            {/* Staged file preview */}
                            {staged && (
                                <div style={{ padding: "10px 18px 0" }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        background: "var(--bg-input)", borderRadius: 10, padding: "8px 10px",
                                        border: "1px solid var(--border)",
                                    }}>
                                        {staged.message_type === "image" && (
                                            <img src={staged.previewUrl} alt="preview" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />
                                        )}
                                        {staged.message_type === "video" && (
                                            <video src={staged.previewUrl} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", background: "#000" }} />
                                        )}
                                        {staged.message_type === "file" && (
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 6,
                                                background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                                            }}>
                                                {getFileIcon(staged.file.name)}
                                            </div>
                                        )}
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>
                                                {staged.file.name}
                                            </div>
                                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Press Enter or Send ↑</div>
                                        </div>
                                        <button
                                            onClick={clearStaged}
                                            style={{
                                                width: 20, height: 20, borderRadius: "50%",
                                                background: "var(--border-strong)", border: "none",
                                                cursor: "pointer", fontSize: 10, color: "var(--text-primary)",
                                            }}
                                        >✕</button>
                                    </div>
                                </div>
                            )}

                            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                                <input
                                    ref={fileInputRef} type="file" style={{ display: "none" }}
                                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    style={{
                                        width: 36, height: 36, borderRadius: "50%",
                                        background: staged ? "var(--accent)" : "var(--bg-input)",
                                        border: staged ? "none" : "1px solid var(--border)",
                                        cursor: "pointer", fontSize: 16,
                                    }}
                                >📎</button>

                                {!staged ? (
                                    <input
                                        ref={inputRef} value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a reply…"
                                        style={{
                                            flex: 1, height: 38, padding: "0 14px", borderRadius: 20,
                                            border: "1px solid var(--border)",
                                            background: "var(--bg-input)",
                                            color: "var(--text-primary)",
                                            fontSize: 13, outline: "none",
                                        }}
                                    />
                                ) : <div style={{ flex: 1 }} />}

                                <Button
                                    onClick={handleSend}
                                    disabled={!canSend || uploading}
                                    style={{
                                        width: 38, height: 38, borderRadius: "50%", border: "none",
                                        background: canSend && !uploading ? "var(--accent)" : "var(--bg-input)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke={canSend && !uploading ? "#fff" : "var(--text-muted)"}
                                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Image lightbox */}
            {imagePreview && (
                <div
                    onClick={() => setImagePreview(null)}
                    style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
                        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    <img src={imagePreview} alt="preview" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12 }} />
                </div>
            )}
        </div>
    );
}