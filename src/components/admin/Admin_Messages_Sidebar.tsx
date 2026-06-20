import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from 'antd';
import { useAuth } from '../hooks/useAuth';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws');

const C = { blue: "#2563EB" };

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

    // ── ADD: tab state ──
    const [listTab, setListTab] = useState<"clients" | "team">("clients");

    const [rooms, setRooms] = useState<RoomSummary[]>([]);
    const [teamRooms, setTeamRooms] = useState<TeamRoomSummary[]>([]);   // ← ADD
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [activeClientId, setActiveClientId] = useState<string | null>(null);
    const [activeUserId, setActiveUserId] = useState<number | null>(null);   // ← ADD

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
    const activeTeamRoom = teamRooms.find(r => r.user_id === activeUserId);   // ← ADD

    // Load the client list
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


    // ── Load the right list when tab switches ──
    useEffect(() => {
        if (listTab === "clients") loadRooms();
        else loadTeamRooms();
    }, [listTab, loadRooms, loadTeamRooms]);


    // Load thread history when a client is selected
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

    // ── ADD: team thread history loader ──
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

    // Connect WS for the active thread only
    // ── KEEP existing client WS effect, but clear activeUserId when switching ──
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

    // ── ADD: team member WS effect, mirrors the client one ──
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

    // ── UPDATE uploadStagedFile to branch by tab ──
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

    // ── UPDATE handleSend to branch by tab ──
    const handleSend = () => {
        if (staged) { uploadStagedFile(); return; }
        const text = input.trim();
        const targetId = listTab === "clients" ? activeClientId : activeUserId;
        if (!text || !socketRef.current || !targetId) return;
        socketRef.current.send(JSON.stringify({
            content: text,
            sender_id: user.id,
            sender_type: "admin" as const,
        }));
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
                    <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: isAdmin ? "rgba(255,255,255,0.2)" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
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

    return (
        <div style={{ display: "flex", height: "calc(100vh - 90px)", background: "#fff", borderRadius: 14, border: "1px solid #CBD5E1", overflow: "hidden" }}>

            {/* ── Client/Team list (left) ── */}
            <div style={{ width: 300, borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #E2E8F0" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Messages</h3>
                    <p style={{ fontSize: 11, color: "#64748B", marginTop: 2, marginBottom: 12 }}>
                        {listTab === "clients" ? rooms.length : teamRooms.length} conversations
                    </p>

                    {/* ── ADD: Tab toggle ── */}
                    <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 8, padding: 3 }}>
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
                                    background: listTab === tab ? "#fff" : "transparent",
                                    color: listTab === tab ? C.blue : "#64748B",
                                    boxShadow: listTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                                }}
                            >
                                {tab === "clients" ? "Clients" : "Team"}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                    {loadingRooms && <div style={{ padding: 20, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>Loading…</div>}

                    {/* ── Clients list (unchanged) ── */}
                    {listTab === "clients" && !loadingRooms && rooms.length === 0 && (
                        <div style={{ padding: 20, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>No conversations yet</div>
                    )}
                    {listTab === "clients" && rooms.map(room => {
                        const isActive = room.client_id === activeClientId;
                        const initials = room.client_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
                        return (
                            <div key={room.room_id} onClick={() => setActiveClientId(room.client_id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
                                    cursor: "pointer", background: isActive ? "#EFF6FF" : "transparent",
                                    borderLeft: isActive ? `3px solid ${C.blue}` : "3px solid transparent",
                                    borderBottom: "1px solid #F1F5F9",
                                }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.blue, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {initials}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.client_name}</span>
                                        {room.last_time && <span style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0, marginLeft: 6 }}>{new Date(room.last_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                                        <span style={{ fontSize: 11, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170 }}>
                                            {room.last_message || "No messages yet"}
                                        </span>
                                        {room.unread_count > 0 && (
                                            <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: C.blue, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                                                {room.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* ── ADD: Team list ── */}
                    {listTab === "team" && !loadingRooms && teamRooms.length === 0 && (
                        <div style={{ padding: 20, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>No team conversations yet</div>
                    )}
                    {listTab === "team" && teamRooms.map(room => {
                        const isActive = room.user_id === activeUserId;
                        const initials = room.member_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
                        return (
                            <div key={room.room_id} onClick={() => setActiveUserId(room.user_id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
                                    cursor: "pointer", background: isActive ? "#EFF6FF" : "transparent",
                                    borderLeft: isActive ? `3px solid ${C.blue}` : "3px solid transparent",
                                    borderBottom: "1px solid #F1F5F9",
                                }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#7C3AED", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {initials}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.member_name}</span>
                                        {room.last_time && <span style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0, marginLeft: 6 }}>{new Date(room.last_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                                        <span style={{ fontSize: 11, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                                            {room.last_message || "No messages yet"}
                                        </span>
                                        <span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>{room.member_role}</span>
                                        {room.unread_count > 0 && (
                                            <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: "#7C3AED", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
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

            {/* ── Thread panel (right) ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F8FAFC" }}>
                {!activeClientId && !activeUserId ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>
                        Select a conversation to start chatting
                    </div>
                ) : (
                    <>
                        {/* Thread header — branches by tab */}
                        <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: listTab === "clients" ? C.blue : "#7C3AED", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {listTab === "clients"
                                    ? activeRoom?.client_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
                                    : activeTeamRoom?.member_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                                    {listTab === "clients" ? activeRoom?.client_name : activeTeamRoom?.member_name}
                                </div>
                                <div style={{ fontSize: 11, color: "#64748B" }}>
                                    {listTab === "clients" ? activeClientId : activeTeamRoom?.member_role}
                                </div>
                            </div>
                        </div>

                        {/* Messages — unchanged, already generic by sender_type === "admin" */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 10 }}>
                            {loadingMsgs && <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 12 }}>Loading messages…</div>}
                            {messages.map(msg => {
                                const isAdmin = msg.sender_type === "admin";
                                const isFileMsg = msg.message_type && msg.message_type !== "text";
                                return (
                                    <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start", marginBottom: 8 }}>
                                        <div style={{
                                            maxWidth: isFileMsg ? "60%" : "55%",
                                            padding: (msg.message_type === "image" || msg.message_type === "video") ? "6px" : "10px 14px",
                                            borderRadius: isAdmin ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                            background: isAdmin ? C.blue : "#fff",
                                            color: isAdmin ? "#fff" : "#1E293B", fontSize: 13,
                                            boxShadow: isAdmin ? "0 2px 8px rgba(37,99,235,0.25)" : "0 1px 4px rgba(0,0,0,0.08)",
                                            border: isAdmin ? "none" : "1px solid #E2E8F0", overflow: "hidden",
                                        }}>
                                            {renderMessageContent(msg)}
                                        </div>
                                        <span style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                );
                            })}
                            {uploading && <div style={{ alignSelf: "flex-end", padding: "10px 14px", borderRadius: "14px 14px 4px 14px", background: "#E2E8F0", fontSize: 12, color: "#64748B" }}>Uploading…</div>}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input — unchanged, just uses the updated handleSend/uploadStagedFile above */}
                        <div style={{ background: "#fff", borderTop: "1px solid #E2E8F0", flexShrink: 0 }}>
                            {staged && (
                                <div style={{ padding: "10px 18px 0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F1F5F9", borderRadius: 10, padding: "8px 10px", border: "1px solid #E2E8F0" }}>
                                        {staged.message_type === "image" && <img src={staged.previewUrl} alt="preview" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />}
                                        {staged.message_type === "video" && <video src={staged.previewUrl} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", background: "#000" }} />}
                                        {staged.message_type === "file" && <div style={{ width: 44, height: 44, borderRadius: 6, background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{getFileIcon(staged.file.name)}</div>}
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{staged.file.name}</div>
                                            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>Press Enter or Send ↑</div>
                                        </div>
                                        <button onClick={clearStaged} style={{ width: 20, height: 20, borderRadius: "50%", background: "#CBD5E1", border: "none", cursor: "pointer", fontSize: 10 }}>✕</button>
                                    </div>
                                </div>
                            )}
                            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                                <input ref={fileInputRef} type="file" style={{ display: "none" }}
                                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); if (fileInputRef.current) fileInputRef.current.value = ""; }} />
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ width: 36, height: 36, borderRadius: "50%", background: staged ? C.blue : "#F1F5F9", border: staged ? "none" : "1px solid #E2E8F0", cursor: "pointer", fontSize: 16 }}>📎</button>
                                {!staged ? (
                                    <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                                        placeholder="Type a reply…"
                                        style={{ flex: 1, height: 38, padding: "0 14px", borderRadius: 20, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                                ) : <div style={{ flex: 1 }} />}
                                <Button onClick={handleSend} disabled={!canSend || uploading}
                                    style={{ width: 38, height: 38, borderRadius: "50%", background: canSend && !uploading ? C.blue : "#E2E8F0", border: "none" }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={canSend && !uploading ? "#fff" : "#94A3B8"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}