import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from 'antd';
import { useAuth } from '../hooks/useAuth';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws');

const C = { blue: "#7C3AED" }; // purple to visually separate from client chat (blue)

interface CampaignLite {
    campaign_id: string;
    campaign_name: string;
}

interface Message {
    id: number;
    content: string;
    sender_type: "admin" | "member";
    sender_name?: string;
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

interface Props {
    campaign: CampaignLite;
    onClose: () => void;
    teamType?: "creative" | "campaign_team";
    role?: "member" | "admin";   // ← NEW
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

export default function Creative_Team_Chat({ campaign, onClose, teamType = "creative", role = "member" }: Props) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [staged, setStaged] = useState<StagedFile | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const label = teamType === "creative" ? "Creative Team" : "Campaign Team";

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, staged]);

    const loadHistory = useCallback(async () => {
        if (!campaign.campaign_id) return;
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/get_campaign_team_chat_history/${campaign.campaign_id}/${teamType}/`);
            const data = await res.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load campaign team chat history", err);
        } finally {
            setLoading(false);
        }
    }, [campaign.campaign_id, teamType]);

    useEffect(() => {
        if (!campaign.campaign_id) return;
        loadHistory();

        const socket = new WebSocket(`${WS_BASE_URL}/ws/campaign-team-chat/${campaign.campaign_id}/${teamType}/`);
        socketRef.current = socket;
        socket.onopen = () => console.log(`team chat connected: ${campaign.campaign_id} (${teamType})`);

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.content !== undefined || data.file_url) {
                    const normalized = { ...data, id: data.id ?? data.message_id ?? Date.now() };
                    setMessages(prev => prev.some(m => m.id === normalized.id) ? prev : [...prev, normalized]);
                }
            } catch (e) {
                console.error("Campaign team chat WS error", e);
            }
        };

        socket.onclose = () => console.log("Campaign team chat WS closed");
        return () => { socket.close(); };
    }, [campaign.campaign_id, teamType, loadHistory]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (imagePreview) { setImagePreview(null); return; }
                if (staged) { clearStaged(); return; }
                handleClose();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [imagePreview, staged]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 280);
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
        if (!staged || !campaign.campaign_id) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", staged.file);
        formData.append("sender_id", String(user.id));
        formData.append("sender_type", role);
        try {
            const res = await fetch(
                `${BASE_URL}/send_campaign_team_chat_file/${campaign.campaign_id}/${teamType}/`,
                { method: "POST", body: formData }
            );
            if (!res.ok) console.error("Team chat file upload failed");
        } catch (err) {
            console.error("Team chat file send error", err);
        } finally {
            setUploading(false);
            clearStaged();
        }
    };

    const handleSend = () => {
        if (staged) { uploadStagedFile(); return; }
        const text = input.trim();
        if (!text || !socketRef.current || !campaign.campaign_id) return;
        socketRef.current.send(JSON.stringify({
            content: text,
            sender_id: user.id,
            sender_type: role,
        }));
        setInput("");
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSend();
    };

    const renderMessageContent = (msg: Message, isMember: boolean) => {
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
                    <div style={{
                        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                        background: isMember ? "rgba(255,255,255,0.2)" : "#F1F5F9",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                    }}>{getFileIcon(msg.file_name)}</div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{msg.file_name}</div>
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{msg.file_size} · Click to download</div>
                    </div>
                </a>
            );
        }
        return <span>{msg.content}</span>;
    };

    const initials = campaign.campaign_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    const canSend = !!staged || !!input.trim();

    return (
        <>
            <div onClick={handleClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "transparent" }} />

            {imagePreview && (
                <div onClick={() => setImagePreview(null)}
                    style={{ position: "fixed", inset: 0, zIndex: 2000, cursor: "zoom-out", background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={imagePreview} alt="preview" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 10 }} onClick={e => e.stopPropagation()} />
                    <button onClick={() => setImagePreview(null)}
                        style={{ position: "absolute", top: 20, right: 24, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
                </div>
            )}

            <div style={{
                position: "fixed", bottom: 0, right: 32, width: 450, height: 520,
                zIndex: 1001, display: "flex", flexDirection: "column", background: "#ffffff",
                borderRadius: "16px 16px 0 0",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
                overflow: "hidden",
                transform: visible ? "translateY(0)" : "translateY(110%)",
                transition: "transform 0.3s cubic-bezier(0.34,1.2,0.64,1)"
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ background: C.blue, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%", background: "#6D28D9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0,
                        border: "2px solid rgba(255,255,255,0.35)"
                    }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {campaign.campaign_name}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                            {campaign.campaign_id} • {label} ↔ Admin
                        </div>
                    </div>
                    <Button onClick={handleClose}
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        ✕
                    </Button>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10, background: "#F8FAFC" }}>
                    {loading && <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8", fontSize: 12 }}>Loading messages…</div>}
                    {messages.map(msg => {
                        const isSelf = msg.sender_type === role; 
                        const isFileMsg = msg.message_type && msg.message_type !== "text";
                        return (
                            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isSelf ? "flex-end" : "flex-start", marginBottom: 12, animation: "msgIn 0.2s ease" }}>
                                {!isSelf  && msg.sender_name && (
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 2 }}>{msg.sender_name}</span>
                                )}
                                <div style={{
                                    maxWidth: isFileMsg ? "85%" : "78%",
                                    padding: (msg.message_type === "image" || msg.message_type === "video") ? "6px" : "9px 13px",
                                    borderRadius: isSelf ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                    background: isSelf ? C.blue : "#fff",
                                    color: isSelf ? "#fff" : "#1E293B", fontSize: 13,
                                    boxShadow: isSelf ? "0 2px 8px rgba(124,58,237,0.25)" : "0 1px 4px rgba(0,0,0,0.08)",
                                    border: isSelf ? "none" : "1px solid #E2E8F0", overflow: "hidden"
                                }}>
                                    {renderMessageContent(msg, isSelf)}
                                </div>
                                <span style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        );
                    })}
                    {uploading && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginBottom: 12 }}>
                            <div style={{ padding: "10px 14px", borderRadius: "14px 14px 4px 14px", background: "#E2E8F0", fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #94A3B8", borderTopColor: C.blue, animation: "spin 0.7s linear infinite" }} />
                                Uploading…
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div style={{ background: "#fff", borderTop: "1px solid #E2E8F0", flexShrink: 0 }}>
                    {staged && (
                        <div style={{ padding: "10px 14px 0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F1F5F9", borderRadius: 10, padding: "8px 10px", border: "1px solid #E2E8F0" }}>
                                {staged.message_type === "image" && <img src={staged.previewUrl} alt="preview" style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1px solid #E2E8F0" }} />}
                                {staged.message_type === "video" && <video src={staged.previewUrl} style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", flexShrink: 0, background: "#000" }} />}
                                {staged.message_type === "file" && (
                                    <div style={{ width: 48, height: 48, borderRadius: 6, background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                                        {getFileIcon(staged.file.name)}
                                    </div>
                                )}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{staged.file.name}</div>
                                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                                        {staged.file.size < 1024 * 1024 ? `${(staged.file.size / 1024).toFixed(1)} KB` : `${(staged.file.size / (1024 * 1024)).toFixed(1)} MB`}
                                        {" · Press Enter or "}<span style={{ color: C.blue, fontWeight: 600 }}>Send ↑</span>
                                    </div>
                                </div>
                                <button onClick={clearStaged} style={{ width: 22, height: 22, borderRadius: "50%", background: "#CBD5E1", border: "none", cursor: "pointer", fontSize: 11, color: "#475569", fontWeight: 700 }}>✕</button>
                            </div>
                        </div>
                    )}

                    <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                        <input ref={fileInputRef} type="file" style={{ display: "none" }}
                            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                            onChange={e => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); if (fileInputRef.current) fileInputRef.current.value = ""; }} />

                        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Attach file"
                            style={{ width: 36, height: 36, borderRadius: "50%", background: staged ? C.blue : "#F1F5F9", border: staged ? "none" : "1px solid #E2E8F0", cursor: uploading ? "not-allowed" : "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: uploading ? 0.5 : 1 }}>
                            📎
                        </button>

                        {!staged ? (
                            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                                placeholder="Message admin…"
                                style={{ flex: 1, height: 38, padding: "0 14px", borderRadius: 20, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 13, color: "#1E293B", outline: "none", fontFamily: "inherit" }} />
                        ) : <div style={{ flex: 1 }} />}

                        <Button onClick={handleSend} disabled={!canSend || uploading}
                            style={{ width: 38, height: 38, borderRadius: "50%", background: canSend && !uploading ? C.blue : "#E2E8F0", border: "none", cursor: canSend && !uploading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={canSend && !uploading ? "#fff" : "#94A3B8"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </Button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
                @keyframes spin   { to{transform:rotate(360deg)} }
            `}</style>
        </>
    );
}