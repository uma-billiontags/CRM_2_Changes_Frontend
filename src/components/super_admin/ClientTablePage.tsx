import { useEffect, useState } from "react";
import { C, fmt } from "../types/types";
import { StatusBadge, ClientDetailModal } from "./SharedComponents";
import type { Client, ClientStatus } from "../types/types";
import { Button, Input, Modal, Table } from "antd";
import { CheckCircleOutlined, MessageOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import Chat from "../admin/Chat"; // ← Chat component

const BASE_URL = import.meta.env.VITE_BASE_URL;

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
  const [chatClient, setChatClient] = useState<Client | null>(null); // ← chat state

  const [credClient, setCredClient] = useState<Client | null>(null);
  const [credPassword, setCredPassword] = useState("");
  const [credSending, setCredSending] = useState(false);
  const [credMsg, setCredMsg] = useState("");

  const [sentClients, setSentClients] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("sent_credentials_clients");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Close modals on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (credClient) {
          setCredClient(null);
          setCredPassword("");
          setCredMsg("");
          setSearch("");
        }
        if (selectedClient) setSelectedClient(null);
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
      const res = await fetch(`${BASE_URL}/approve_client/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify({
          client_id: credClient!.id,
          password: credPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCredMsg("✅ Credentials sent to " + credClient!.email);
        setSentClients((prev) => {
          const updated = new Set(prev).add(credClient!.id);
          localStorage.setItem(
            "sent_credentials_clients",
            JSON.stringify([...updated])
          );
          return updated;
        });
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

  // ── Table Columns ─────────────────────────────────────────────────────────
  const columns: ColumnsType<Client> = [
    {
      title: "Client ID",
      dataIndex: "id",
      key: "id",
      width: 155,
      render: (id: string) => (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.blue,
            background: C.blueLight,
            padding: "3px 8px",
            borderRadius: 5,
            fontFamily: "monospace",
          }}
        >
          {id}
        </span>
      ),
    },
    {
      title: "Company Name",
      key: "company_name",
      width: 200,
      render: (_: any, c: Client) => (
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.slate,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {c.company_name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.slate500,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {c.email}
          </div>
        </div>
      ),
    },
    {
      title: "Company Type",
      dataIndex: "company_type",
      key: "company_type",
      width: 130,
      render: (v: string) => (
        <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>
      ),
    },
    {
      title: "Agency Type",
      dataIndex: "agency_type",
      key: "agency_type",
      width: 120,
      render: (v: string) => (
        <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>
      ),
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      width: 100,
      render: (v: string) => (
        <span style={{ fontSize: 12, color: C.slate500 }}>{v || "—"}</span>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "submitted_at",
      key: "submitted_at",
      width: 120,
      render: (v: string) => (
        <span style={{ fontSize: 12, color: C.slate700 }}>{fmt(v)}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v: string) => <StatusBadge status={v as ClientStatus} />,
    },
    {
      title: "Actions",
      key: "actions",
      width: 230,
      fixed: "right",
      render: (_: any, c: Client) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* View */}
          <Button
            size="small"
            onClick={() => setSelectedClient(c)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.blue,
              background: C.blueLight,
              border: `1px solid ${C.blueMid}`,
              borderRadius: 6,
            }}
          >
            View
          </Button>
          {/* ── Chat Button ───────────────────────────────────────────── */}
          <Button
            size="small"
            icon={<MessageOutlined />}
            onClick={() =>
              setChatClient((prev) =>
                prev?.id === c.id ? null : c
              )
            }
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: chatClient?.id === c.id ? "#fff" : "#7C3AED",
              background:
                chatClient?.id === c.id ? "#7C3AED" : "#EDE9FE",
              border: "1px solid #C4B5FD",
              borderRadius: 6,
              transition: "all 0.2s",
            }}
          >
            Chat
          </Button>

          {/* Pending actions */}
          {c.status === "pending" && (
            <>
              <Button
                size="small"
                onClick={() => onApprove(c.id)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.green,
                  background: C.greenLight,
                  border: "1px solid #BBF7D0",
                  borderRadius: 6,
                }}
              >
                Approve
              </Button>
              <Button
                size="small"
                onClick={() => onReject(c.id)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.red,
                  background: C.redLight,
                  border: "1px solid #FECACA",
                  borderRadius: 6,
                }}
              >
                Reject
              </Button>
            </>
          )}

          {/* Send Credentials */}
          {c.status === "approved" && (
            <Button
              size="small"
              icon={sentClients.has(c.id) ? <CheckCircleOutlined /> : null}
              onClick={() => {
                setCredClient(c);
                setCredPassword("");
                setCredMsg("");
              }}
              style={{
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 6,
                background: sentClients.has(c.id) ? C.greenLight : C.purpleLight,
                border: sentClients.has(c.id)
                  ? "1px solid #BBF7D0"
                  : "1px solid #C4B5FD",
                color: sentClients.has(c.id) ? C.green : C.purple,
              }}
            >
              {sentClients.has(c.id) ? "Sent Credential" : "Send Credential"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: C.slate,
            margin: 0,
            letterSpacing: "-0.4px",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 11,
            color: C.slate500,
            margin: "4px 0 0",
            fontWeight: 500,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* ── Search + Count ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>

        <Input
          placeholder="Search by company, ID, email or city…"
          prefix={<SearchOutlined style={{ color: C.slate500 }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{
            flex: 1, maxWidth: 360, height: 38, padding: "0 14px",
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 9, color: C.slate, fontSize: 13, outline: "none",
          }} />
        <span
          style={{ fontSize: 12, color: C.slate500, marginLeft: "auto" }}
        >
          {filtered.length} client{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Ant Design Table ── */}
      <div
        style={{
          background: C.white,
          borderRadius: 14,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} of ${total} clients`,
            style: { padding: "12px 16px" },
          }}
          rowClassName={() => "client-table-row"}
          style={{ fontSize: 13 }}
        />
      </div>

      {/* ── Client Detail Modal (existing component) ── */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onApprove={(id) => {
            onApprove(id);
            setSelectedClient(null);
          }}
          onReject={(id) => {
            onReject(id);
            setSelectedClient(null);
          }}
          onClose={() => setSelectedClient(null)}
        />
      )}

      {/* ── Send Credentials — Ant Design Modal ── */}
      <Modal
        open={!!credClient}
        onCancel={() => {
          setCredClient(null);
          setCredPassword("");
          setCredMsg("");
          setSearch("");
        }}
        footer={null}
        width={450}
        centered
        destroyOnClose
        title={
          <div>
            <div
              style={{ fontSize: 16, fontWeight: 700, color: C.slate }}
            >
              Send Credentials
            </div>
            <div style={{ fontSize: 12, color: C.slate500, fontWeight: 400, marginTop: 2 }}>
              Credentials will be emailed to the client
            </div>
          </div>
        }
        style={{ borderRadius: 16 }}
      >
        {credClient && (
          <div>
            {/* Client Email (read-only) */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.slate500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Client Email
              </label>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: C.slate100,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  color: C.slate,
                  fontWeight: 500,
                }}
              >
                {credClient.email}
              </div>
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.slate500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Set Password
              </label>
              <Input.Password
                placeholder="Enter password to send"
                value={credPassword}
                onChange={(e) => setCredPassword(e.target.value)}
                style={{ height: 40, fontSize: 13 }}
              />
            </div>

            {/* Status Message */}
            {credMsg && (
              <div
                style={{
                  marginBottom: 14,
                  fontSize: 12,
                  color: credMsg.startsWith("✅") ? C.green : C.red,
                  fontWeight: 500,
                }}
              >
                {credMsg}
              </div>
            )}

            {/* Footer Buttons */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <Button
                onClick={() => {
                  setCredClient(null);
                  setCredPassword("");
                  setCredMsg("");
                  setSearch("");
                }}
                style={{
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  color: C.slate500,
                  fontSize: 13,
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleSendCredentials}
                loading={credSending}
                style={{
                  borderRadius: 8,
                  background: C.blue,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(124,58,237,0.25)",
                }}
              >
                {credSending ? "Sending…" : "Send Credentials"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Chat Popup ── */}
      {chatClient && (
        <Chat client={chatClient} onClose={() => setChatClient(null)} />
      )}

      <style>{`
        .client-table-row:hover td { background: #F8FAFC !important; }
        .ant-table-thead > tr > th {
          background: #F1F5F9 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #64748B !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}