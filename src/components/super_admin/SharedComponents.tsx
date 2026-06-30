import { useState, useEffect } from "react";
import { C, fmt, fmtINR } from "../types/types";
import type { Client, ClientStatus, ToastType } from "../types/types";
import { Button, Modal } from "antd";

// ── StatusBadge ───────────────────────────────────────────────────────────────
// In SharedComponents.tsx — find StatusBadge and update:
export function StatusBadge({ status }: { status: ClientStatus }) {
  const map = {
    approved: { 
      bg: "var(--accent-light)",      // was green-bg
      color: "var(--accent)",          // was green
      label: "Approved" 
    },
    pending: { 
      bg: "var(--amber-bg)", 
      color: "var(--amber)", 
      label: "Pending" 
    },
    rejected: { 
      bg: "var(--red-bg)", 
      color: "var(--red)", 
      label: "Rejected" 
    },
  };
  const cfg = map[status] || map.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.color}`,
      textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

export function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0", borderBottom: `1px solid ${C.borderLight}`,
    }}>
      <span style={{ fontSize: 11, color: C.slate500, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{
        fontSize: 12.5, color: mono ? C.blue : C.slate,
        fontWeight: mono ? 700 : 500,
        maxWidth: "60%", textAlign: "right", wordBreak: "break-all",
      }}>
        {value || "—"}
      </span>
    </div>
  );
}

// ── SectionTitle ──────────────────────────────────────────────────────────────

export function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 20 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: C.borderLight }} />
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const color = type === "success" ? C.green : C.red;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 999,
      background: C.white, border: `1px solid ${color}55`, borderRadius: 12,
      padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)", animation: "fadeUp 0.3s ease",
    }}>
      <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{message}</span>
    </div>
  );
}

// ── ClientDetail Modal ────────────────────────────────────────────────────────

type ConfirmAction = "approve" | "reject" | null;

interface ClientDetailProps {
  client: Client;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClose: () => void;
}

export function ClientDetailModal({ client, onApprove, onReject, onClose }: ClientDetailProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  // ── Footer ────────────────────────────────────────────────────────────────
  const footer = client.status === "pending" ? (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
      {confirmAction === null ? (
        <>
          <Button
            onClick={() => setConfirmAction("reject")}
            style={{
              borderRadius: 9, border: `1px solid #FECACA`,
              background: C.redLight, color: C.red,
              fontSize: 13, fontWeight: 700,
            }}
          >
            ✕ Reject Client
          </Button>
          <Button
            onClick={() => setConfirmAction("approve")}
            style={{
              borderRadius: 9, border: "none",
              background: C.green, color: "#fff",
              fontSize: 13, fontWeight: 700,
              boxShadow: `0 4px 14px ${C.green}44`,
            }}
          >
            ✓ Approve Client
          </Button>
        </>
      ) : confirmAction === "approve" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: C.slate }}>
            Confirm approval of <strong>{client.company_name}</strong>?
          </span>
          <Button
            onClick={() => setConfirmAction(null)}
            style={{ borderRadius: 8, border: `1px solid ${C.border}`, color: C.slate500, fontSize: 12 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => { onApprove(client.id); setConfirmAction(null); }}
            style={{ borderRadius: 8, border: "none", background: C.green, color: "#fff", fontSize: 12, fontWeight: 700 }}
          >
            Yes, Approve
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: C.slate }}>
            Confirm rejection of <strong>{client.company_name}</strong>?
          </span>
          <Button
            onClick={() => setConfirmAction(null)}
            style={{ borderRadius: 8, border: `1px solid ${C.border}`, color: C.slate500, fontSize: 12 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => { onReject(client.id); setConfirmAction(null); }}
            style={{ borderRadius: 8, border: "none", background: C.red, color: "#fff", fontSize: 12, fontWeight: 700 }}
          >
            Yes, Reject
          </Button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <Modal
      open
      onCancel={onClose}
      width={820}
      centered
      destroyOnClose
      footer={footer}
      bodyStyle={{ padding: "0 28px 8px", maxHeight: "70vh", overflowY: "auto" }}
      title={
        // ── Modal Header ──────────────────────────────────────────────────
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "4px 0",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: C.blueLight, border: `1px solid ${C.blueMid}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>
            🏢
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.slate }}>
              {client.company_name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span style={{ fontSize: 11, color: C.slate500, }}>
                {client.id}
              </span>
              <StatusBadge status={client.status} />
            </div>
          </div>
        </div>
      }
    >
      {/* ── Submitted On ── */}
      <div style={{
        marginTop: 18, padding: "10px 14px",
        background: C.slate100, borderRadius: 8, border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, color: C.slate500 }}>Submitted on</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.slate }}>{fmt(client.submitted_at)}</span>
      </div>

      {/* ── Basic Information ── */}
      <SectionTitle icon="🪪" title="Basic Information" />
      <InfoRow label="Reporting ID"    value={client.reporting_id} mono />
      <InfoRow label="Company Type"    value={client.company_type} />
      <InfoRow label="Agency Type"     value={client.agency_type} />
      <InfoRow label="Email"           value={client.email} />
      <InfoRow label="Phone"           value={client.phone} />
      <InfoRow label="Website"         value={client.website} />
      <InfoRow label="Country"         value={client.country} />
      <InfoRow label="State"           value={client.state} />
      <InfoRow label="City"            value={client.city} />
      <InfoRow label="CIN Number"      value={client.cin_number} mono />
      <InfoRow label="VAST Number"     value={client.vast_number} mono />
      <InfoRow label="Place of Supply" value={client.place_of_supply} />
      <InfoRow label="Active"          value={client.is_active ? "Yes" : "No"} />

      {/* ── Billing & Commercials ── */}
      <SectionTitle icon="💳" title="Billing & Commercials" />
      <InfoRow label="Payment Type"      value={client.billing.payment_type} />
      <InfoRow label="Payment Terms"     value={client.billing.payment_terms} />
      <InfoRow label="Credit Period"     value={`${client.billing.credit_period_days} days`} />
      <InfoRow label="Tax Type"          value={client.billing.tax_type} />
      <InfoRow label="TDS Applicable"    value={client.billing.tds_applicable ? "Yes" : "No"} />
      {client.billing.tds_section && <InfoRow label="TDS Section" value={client.billing.tds_section} />}
      <InfoRow label="Currency"          value={client.billing.billing_currency} />
      <InfoRow label="Advance Amount"    value={fmtINR(client.billing.advance_amount)} />
      <InfoRow label="Credit Limit"      value={fmtINR(client.billing.credit_limit)} />
      <InfoRow label="Outstanding Limit" value={fmtINR(client.billing.outstanding_limit)} />
      <InfoRow label="Billing Contact"   value={client.billing.billing_contact} />

      {/* ── Primary Contact ── */}
      {client.contacts.length > 0 && (
        <>
          <SectionTitle icon="👤" title="Primary Contact" />
          <InfoRow label="Name"        value={client.contacts[0].name} />
          <InfoRow label="Email"       value={client.contacts[0].email} />
          <InfoRow label="Phone"       value={client.contacts[0].phone} />
          <InfoRow label="Designation" value={client.contacts[0].designation} />
          <InfoRow label="Country"     value={client.contacts[0].country} />
          <InfoRow label="Zipcode"     value={client.contacts[0].zipcode} />
        </>
      )}

      {/* ── Account Ownership ── */}
      <SectionTitle icon="👥" title="Account Ownership" />
      <InfoRow label="Account Manager"  value={client.ownership.account_manager} />
      <InfoRow label="Sales Owner"      value={client.ownership.sales_owner} />
      <InfoRow label="Campaign Manager" value={client.ownership.campaign_manager} />
      <InfoRow label="Finance Owner"    value={client.ownership.finance_owner} />

      {/* ── Classification ── */}
      <SectionTitle icon="🏷️" title="Classification" />
      <InfoRow label="Client Type"       value={client.classification.client_type} />
      <InfoRow label="Priority"          value={client.classification.priority} />
      <InfoRow label="Risk Level"        value={client.classification.risk_level} />
      <InfoRow label="Payment Behavior"  value={client.classification.payment_behavior} />
      <InfoRow label="Avg Response Time" value={`${client.classification.avg_response_time} day(s)`} />
    </Modal>
  );
}