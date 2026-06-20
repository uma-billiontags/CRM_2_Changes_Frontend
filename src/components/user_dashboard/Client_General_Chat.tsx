import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";          // ← ADD THIS
import { Button } from 'antd';
import { MessageOutlined, CloseOutlined } from '@ant-design/icons';  // ← ADD THIS
import { useAuth } from '../hooks/useAuth';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws'); // http→ws, https→wss

const C = { blue: "#2563EB" };

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

export default function Client_General_Chat() {
    const { user } = useAuth();
    const clientId = localStorage.getItem('client_id');
    const clientName = localStorage.getItem('client_name') ?? 'You';

    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [staged, setStaged] = useState<StagedFile | null>(null);
    const [unread, setUnread] = useState(0);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadHistory = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/get_general_chat_history/${clientId}/`);
            const data = await res.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load general chat history", err);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    // Persistent WebSocket — connects once, regardless of open/closed window
    useEffect(() => {
        if (!clientId) return;
        loadHistory();

        const socket = new WebSocket(`${WS_BASE_URL}/ws/general-chat/${clientId}/`);
        socketRef.current = socket;
        socket.onopen = () => console.log(`general chat connected: ${clientId}`);

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.content !== undefined || data.file_url) {
                    const normalized = { ...data, id: data.id ?? data.message_id ?? Date.now() };
                    setMessages(prev => {
                        if (prev.some(m => m.id === normalized.id)) return prev;
                        return [...prev, normalized];
                    });
                    if (normalized.sender_type === 'admin' && !open) {
                        setUnread(u => u + 1);
                    }
                }
            } catch (e) {
                console.error("General chat WS message error", e);
            }
        };

        socket.onclose = () => console.log("General chat WS closed");
        return () => { socket.close(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId]);

    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => setVisible(true));
            setTimeout(() => inputRef.current?.focus(), 150);
            setUnread(0);
        }
    }, [open]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, staged, open]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) {
                if (imagePreview) { setImagePreview(null); return; }
                if (staged) { clearStaged(); return; }
                handleCloseWindow();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [imagePreview, staged, open]);

    const handleCloseWindow = () => {
        setVisible(false);
        setTimeout(() => setOpen(false), 280);
    };

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
        if (!staged || !clientId) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", staged.file);
        formData.append("sender_id", String(user.id));
        formData.append("sender_type", "client");
        try {
            const res = await fetch(`${BASE_URL}/send_general_chat_file/${clientId}/`, { method: "POST", body: formData });
            if (!res.ok) console.error("General chat file upload failed");
        } catch (err) {
            console.error("General chat file send error", err);
        } finally {
            setUploading(false);
            clearStaged();
        }
    };

    const handleSend = () => {
        if (staged) { uploadStagedFile(); return; }
        const text = input.trim();
        if (!text || !socketRef.current || !clientId) return;
        socketRef.current.send(JSON.stringify({
            content: text,
            sender_id: user.id,
            sender_type: "client" as const,
        }));
        setInput("");
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSend();
    };

    const renderMessageContent = (msg: Message) => {
        const isClient = msg.sender_type === "client";
        if (msg.message_type === "image" && msg.file_url) {
            return (
                <div>
                    <img src={msg.file_url} alt={msg.file_name || "image"}
                        onClick={() => setImagePreview(msg.file_url!)}
                        style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8, cursor: "pointer", display: "block", objectFit: "cover" }} />
                    {msg.file_size && <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>{msg.file_name} · {msg.file_size}</div>}
                </div>
            );
        }
        if (msg.message_type === "video" && msg.file_url) {
            return (
                <div>
                    <video src={msg.file_url} controls style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8, display: "block", background: "#000" }} />
                    {msg.file_size && <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>{msg.file_name} · {msg.file_size}</div>}
                </div>
            );
        }
        if (msg.message_type === "file" && msg.file_url) {
            return (
                <a href={msg.file_url} target="_blank" rel="noreferrer" download={msg.file_name}
                    style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", padding: "4px 2px" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: isClient ? "rgba(255,255,255,0.2)" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                        {getFileIcon(msg.file_name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{msg.file_name}</div>
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{msg.file_size} · Click to download</div>
                    </div>
                </a>
            );
        }
        return <span>{msg.content}</span>;
    };

    const canSend = !!staged || !!input.trim();

    const content = (
        <>
            {/* Floating bubble — bottom right, fixed to real viewport via portal */}
            <button
                onClick={() => setOpen(true)}
                style={{
                    position: "fixed", bottom: 24, right: 28, width: 56, height: 56,
                    borderRadius: "50%", background: C.blue, border: "none",
                    boxShadow: "0 6px 20px rgba(37,99,235,0.4)", cursor: "pointer",
                    display: open ? "none" : "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 9999, color: "#fff",
                }}
            >
                <MessageOutlined style={{ fontSize: 24 }} />
                {unread > 0 && (
                    <span style={{
                        position: "absolute", top: -4, right: -4, minWidth: 20, height: 20,
                        borderRadius: 10, background: "#EF4444", color: "#fff", fontSize: 11,
                        fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 5px", border: "2px solid #fff",
                    }}>{unread}</span>
                )}
            </button>

            {open && (
                <>
                    <div onClick={handleCloseWindow} style={{ position: "fixed", inset: 0, zIndex: 9990, background: "transparent" }} />

                    {imagePreview && (
                        <div onClick={() => setImagePreview(null)}
                            style={{ position: "fixed", inset: 0, zIndex: 10000, cursor: "zoom-out", background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <img src={imagePreview} alt="preview" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 10 }} onClick={e => e.stopPropagation()} />
                            <button onClick={() => setImagePreview(null)} style={{ position: "absolute", top: 20, right: 24, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
                        </div>
                    )}

                    <div style={{
                        position: "fixed", bottom: 0, right: 28, width: 380, height: 520,
                        zIndex: 9995, display: "flex", flexDirection: "column", background: "#fff",
                        borderRadius: "16px 16px 0 0", boxShadow: "0 -8px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
                        overflow: "hidden", transform: visible ? "translateY(0)" : "translateY(110%)",
                        transition: "transform 0.3s cubic-bezier(0.34,1.2,0.64,1)",
                    }} onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div style={{ background: C.blue, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", border: "2px solid rgba(255,255,255,0.35)" }}>B</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Support / Admin</div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{clientName}</div>
                            </div>
                            <Button onClick={handleCloseWindow} icon={<CloseOutlined />}
                                style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }} />
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10, background: "#F8FAFC" }}>
                            {loading && <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 12 }}>Loading messages…</div>}
                            {messages.map(msg => {
                                const isClient = msg.sender_type === "client";
                                const isFileMsg = msg.message_type && msg.message_type !== "text";
                                return (
                                    <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isClient ? "flex-end" : "flex-start", marginBottom: 12 }}>
                                        <div style={{
                                            maxWidth: isFileMsg ? "85%" : "78%",
                                            padding: (msg.message_type === "image" || msg.message_type === "video") ? "6px" : "9px 13px",
                                            borderRadius: isClient ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                            background: isClient ? C.blue : "#fff",
                                            color: isClient ? "#fff" : "#1E293B", fontSize: 13,
                                            boxShadow: isClient ? "0 2px 8px rgba(37,99,235,0.25)" : "0 1px 4px rgba(0,0,0,0.08)",
                                            border: isClient ? "none" : "1px solid #E2E8F0", overflow: "hidden",
                                        }}>
                                            {renderMessageContent(msg)}
                                        </div>
                                        <span style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                );
                            })}
                            {uploading && (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                    <div style={{ padding: "10px 14px", borderRadius: "14px 14px 4px 14px", background: "#E2E8F0", fontSize: 12, color: "#64748B" }}>Uploading…</div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div style={{ background: "#fff", borderTop: "1px solid #E2E8F0", flexShrink: 0 }}>
                            {staged && (
                                <div style={{ padding: "10px 14px 0" }}>
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
                            <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                                <input ref={fileInputRef} type="file" style={{ display: "none" }}
                                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); if (fileInputRef.current) fileInputRef.current.value = ""; }} />
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ width: 34, height: 34, borderRadius: "50%", background: staged ? C.blue : "#F1F5F9", border: staged ? "none" : "1px solid #E2E8F0", cursor: "pointer", fontSize: 15 }}>📎</button>
                                {!staged ? (
                                    <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                                        placeholder="Type a message…"
                                        style={{ flex: 1, height: 36, padding: "0 14px", borderRadius: 20, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                                ) : <div style={{ flex: 1 }} />}
                                <Button onClick={handleSend} disabled={!canSend || uploading}
                                    style={{ width: 36, height: 36, borderRadius: "50%", background: canSend && !uploading ? C.blue : "#E2E8F0", border: "none" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={canSend && !uploading ? "#fff" : "#94A3B8"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );

    return createPortal(content, document.body);   // ← KEY CHANGE: portal to body
}