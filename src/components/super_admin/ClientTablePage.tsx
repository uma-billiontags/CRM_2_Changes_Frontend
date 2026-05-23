import { useEffect, useState } from "react";
import { C, fmt } from "../types/types";
import { StatusBadge, ClientDetailModal } from "./SharedComponents";
import type { Client, ClientStatus } from "../types/types";
import { Button } from 'antd';
import { CheckOutlined } from "@ant-design/icons";

interface ColDef {
  label: string;
  w: number;
}

interface ClientTablePageProps {
  clients: Client[];
  filterStatus: ClientStatus | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  title: string;
  subtitle: string;
}

export default function ClientTablePage({
  clients,
  filterStatus,
  onApprove,
  onReject,
  title,
  subtitle,
}: ClientTablePageProps) {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [credClient, setCredClient] = useState<Client | null>(null);
  const [credPassword, setCredPassword] = useState("");
  const [credSending, setCredSending] = useState(false);
  const [credMsg, setCredMsg] = useState("");

  const [sentClients, setSentClients] = useState<Set<string>>(new Set());


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (credClient) {
          setCredClient(null);
          setCredPassword("");
          setCredMsg("");
          setSearch("");
        }
        if (selectedClient) {
          setSelectedClient(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [credClient, selectedClient]);

  const handleSendCredentials = async () => {
    if (!credPassword.trim()) {
      setCredMsg("Password is required");
      return;
    }

    setCredSending(true);
    setCredMsg("");

    try {
      const res = await fetch(`http://127.0.0.1:8000/approve_client/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1"
        },
        body: JSON.stringify({
          client_id: credClient!.id,   // e.g. CLT-2026-00006
          password: credPassword        // password superadmin typed
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCredMsg("✅ Credentials sent to " + credClient!.email);
        setSentClients(prev => new Set(prev).add(credClient!.id)); // ← ADD THIS

        setTimeout(() => {
          setCredClient(null);
          setCredPassword("");
          setCredMsg("");
          setSearch("");
        }, 2500);
      } else {
        setCredMsg(`❌ ${data.error}`);
      }
    } catch {
      setCredMsg("❌ Network error. Try again.");
    } finally {
      setCredSending(false);
    }
  };

  const filtered = clients.filter((c) => {
    const matchStatus = !filterStatus || c.status === filterStatus;

    // ← Don't filter when credentials modal is open
    if (credClient) return matchStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.company_name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const cols: ColDef[] = [
    { label: "Client ID", w: 150 },
    { label: "Company Name", w: 200 },
    { label: "Company Type", w: 130 },
    { label: "Agency Type", w: 120 },
    { label: "City", w: 100 },
    { label: "Submitted", w: 110 },
    { label: "Status", w: 120 },
    { label: "Actions", w: 220 },
  ];

  return (
    <div>
      {/* Page heading */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0, letterSpacing: "-0.4px" }}>
          {title}
        </h1>
        <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", fontWeight: 500 }}>
          {subtitle}
        </p>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <input
          placeholder="Search by company, ID, email or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, maxWidth: 360, height: 38, padding: "0 14px",
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 9, color: C.slate, fontSize: 13, outline: "none",
          }}
        />
        <span style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}>
          {filtered.length} client{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
        overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        {/* Head */}
        <div style={{
          display: "flex", background: C.slate100, borderBottom: `1px solid ${C.border}`,
          overflowX: "auto",
        }}>
          {cols.map((col) => (
            <div key={col.label} style={{
              width: col.w, flexShrink: 0, padding: "10px 14px",
              fontSize: 10, fontWeight: 700, color: C.slate500,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              {col.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.slate500, fontSize: 13 }}>
            No clients found.
          </div>
        ) : (
          filtered.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: "flex", alignItems: "center",
                borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : "none",
                transition: "background 0.12s", cursor: "default",
                overflowX: "auto",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.slate100; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              {/* Client ID */}
              <div style={{ width: 155, flexShrink: 0, padding: "14px 14px" }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: C.blue,
                  background: C.blueLight, padding: "3px 8px",
                  borderRadius: 5, fontFamily: "monospace",
                }}>{c.id}</span>
              </div>

              {/* Company */}
              <div style={{ width: 200, flexShrink: 0, padding: "14px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.company_name}
                </div>
                <div style={{ fontSize: 11, color: C.slate500, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.email}
                </div>
              </div>
              <div style={{ width: 130, flexShrink: 0, padding: "14px 14px", fontSize: 12, color: C.slate500 }}>
                {c.company_type}
              </div>
              {/* Agency Type */}
              <div style={{ width: 120, flexShrink: 0, padding: "14px 14px", fontSize: 12, color: C.slate500 }}>
                {c.agency_type}
              </div>

              {/* City */}
              <div style={{ width: 100, flexShrink: 0, padding: "14px 14px", fontSize: 12, color: C.slate500 }}>
                {c.city}
              </div>

              {/* Submitted */}
              <div style={{ width: 110, flexShrink: 0, padding: "14px 14px", fontSize: 12, color: C.slate700 }}>
                {fmt(c.submitted_at)}
              </div>

              {/* Status */}
              <div style={{ width: 120, flexShrink: 0, padding: "14px 14px" }}>
                <StatusBadge status={c.status} />
              </div>

              {/* Actions */}
              <div style={{ width: 220, flexShrink: 0, padding: "14px 14px", display: "flex", gap: 6 }}>
                <Button
                  onClick={() => setSelectedClient(c)}
                  style={{
                    padding: "4px 10px", borderRadius: 6,
                    background: C.blueLight, border: `1px solid ${C.blueMid}`,
                    color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}
                >View</Button>
                {c.status === "pending" && (
                  <>
                    <Button
                      onClick={() => onApprove(c.id)}
                      style={{
                        padding: "4px 10px", borderRadius: 6,
                        background: C.greenLight, border: `1px solid #BBF7D0`,
                        color: C.green, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      }}
                    >Approve</Button>
                    <Button
                      onClick={() => onReject(c.id)}
                      style={{
                        padding: "4px 10px", borderRadius: 6,
                        background: C.redLight, border: `1px solid #FECACA`,
                        color: C.red, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      }}
                    >Reject</Button>
                  </>
                )}
                {c.status === "approved" && (
                  <Button
                    onClick={() => { setCredClient(c); setCredPassword(""); setCredMsg(""); }}
                    icon={sentClients.has(c.id) ? <CheckOutlined /> : null}
                    style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      cursor: "pointer",
                      background: sentClients.has(c.id) ? C.greenLight : C.purpleLight,
                      border: sentClients.has(c.id) ? "1px solid #BBF7D0" : "1px solid #C4B5FD",
                      color: sentClients.has(c.id) ? C.green : C.purple,
                    }}
                  >
                    {sentClients.has(c.id) ? "Sent" : "Send Credentials"}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onApprove={(id) => { onApprove(id); setSelectedClient(null); }}
          onReject={(id) => { onReject(id); setSelectedClient(null); }}
          onClose={() => setSelectedClient(null)}
        />
      )}
      {credClient && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 300,
        }}>
          <div style={{
            background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
            width: "100%", maxWidth: 460, padding: 28,
            boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, margin: 0 }}>Send Credentials</h3>
                <p style={{ fontSize: 12, color: C.slate500, margin: "4px 0 0" }}>Credentials will be emailed to the client</p>
              </div>
              <Button
                onClick={() => { setCredClient(null); setSearch(""); }}
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.slate100, cursor: "pointer", fontSize: 16 }}
              >✕</Button>
            </div>

            {/* Client email (read-only) */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Client Email
              </label>
              <div style={{
                marginTop: 6, padding: "10px 14px", borderRadius: 8,
                background: C.slate100, border: `1px solid ${C.border}`,
                fontSize: 13, color: C.slate, fontWeight: 500,
              }}>{credClient.email}</div>
            </div>

            {/* Password input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Set Password
              </label>
              <input
                type="password"
                placeholder="Enter password to send"
                value={credPassword}
                onChange={(e) => setCredPassword(e.target.value)}
                style={{
                  marginTop: 6, width: "100%", height: 40, padding: "0 14px",
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  fontSize: 13, color: C.slate, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Message */}
            {credMsg && (
              <div style={{ marginBottom: 14, fontSize: 12, color: credMsg.startsWith("✅") ? C.green : C.red, fontWeight: 500 }}>
                {credMsg}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button
                onClick={() => { setCredClient(null); setSearch(""); }}
                style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.slate500, fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendCredentials}
                disabled={credSending}
                style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: C.purple, color: C.white, fontSize: 13, fontWeight: 700, cursor: credSending ? "not-allowed" : "pointer", opacity: credSending ? 0.7 : 1 }}
              >
                {credSending ? "Sending…" : "Send Credentials"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}