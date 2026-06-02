import { useEffect, useRef, useState } from "react";
import type { Client } from "../types/types";
import { Button } from 'antd';

// ── Color Palette ─────────────────────────────────────────────────────
const C = {
  blue: "#0057B8",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  text: string;
  sender: "admin" | "client";
  time: string;
}

interface ChatProps {
  client: Client;
  onClose: () => void;
}

// ── Static seed messages (replace with socket later) ─────────────────────────

const SEED_MESSAGES: Message[] = [
  {
    id: 1,
    text: "Hi! 👋",
    sender: "client",
    time: "09:00 AM",
  },
  {
    id: 2,
    text: "Hello! How can I help you today?",
    sender: "admin",
    time: "09:01 AM",
  },
  {
    id: 3,
    text: "How are you doing?",
    sender: "client",
    time: "09:02 AM",
  },
  {
    id: 4,
    text: "I'm doing great, thank you for asking! 😊",
    sender: "admin",
    time: "09:03 AM",
  },
  {
    id: 5,
    text: "I had a question about my account status.",
    sender: "client",
    time: "09:04 AM",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ── Component ─────────────────────────────────────────────────────────────────

export default function Chat({ client, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Slide-up on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280); // wait for slide-down animation
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const msg: Message = {
      id: Date.now(),
      text,
      sender: "admin",
      time: now(),
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const initials = client.company_name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
      {/* ── Backdrop (subtle) ───────────────────────────────────────────── */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "transparent",
        }}
      />

      {/* ── Chat Panel ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 32,
          width: 450,
          height: 480,
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: "16px 16px 0 0",
          boxShadow:
            "0 -8px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
          overflow: "hidden",
          transform: visible ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          style={{
            background: C.blue,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#0057B8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
              border: "2px solid rgba(255,255,255,0.35)",
            }}
          >
            {initials}
          </div>

          {/* Name + status */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {client.company_name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#4ADE80",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                Online
              </span>
            </div>
          </div>

          {/* Close */}
          <Button
            onClick={handleClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.28)")
            }
            onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.15)")
            }
          >
            ✕
          </Button>
        </div>

        {/* ── Messages ────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            background: "#F8FAFC",
          }}
        >
          {/* Date chip */}
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#94A3B8",
                background: "#E2E8F0",
                padding: "3px 10px",
                borderRadius: 20,
                letterSpacing: "0.04em",
              }}
            >
              TODAY
            </span>
          </div>

          {messages.map((msg) => {
            const isAdmin = msg.sender === "admin";
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isAdmin ? "flex-end" : "flex-start",
                  animation: "msgIn 0.2s ease both",
                }}
              >
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "9px 13px",
                    borderRadius: isAdmin
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                    background: isAdmin ? C.blue : "#fff",
                    color: isAdmin ? "#fff" : "#1E293B",
                    fontSize: 13,
                    lineHeight: 1.45,
                    boxShadow: isAdmin
                      ? "0 2px 8px rgba(37,99,235,0.25)"
                      : "0 1px 4px rgba(0,0,0,0.08)",
                    border: isAdmin ? "none" : "1px solid #E2E8F0",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: "#94A3B8",
                    marginTop: 3,
                    paddingInline: 2,
                  }}
                >
                  {msg.time}
                </span>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "12px 14px",
            background: "#fff",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            style={{
              flex: 1,
              height: 38,
              padding: "0 14px",
              borderRadius: 20,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              fontSize: 13,
              color: "#1E293B",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = C.blue)
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "#E2E8F0")
            }
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: input.trim() ? C.blue : "#E2E8F0",
              border: "none",
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.2s, transform 0.15s",
              transform: "scale(1)",
            }}
            onMouseEnter={(e) => {
              if (input.trim())
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1)";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={input.trim() ? "#fff" : "#94A3B8"}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}