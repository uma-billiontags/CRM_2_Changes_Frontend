import { useState, useEffect } from "react";
import { C, STATUS_MAP, fmt, fmtINR } from "../types/types";
import type { Client, ClientStatus, StatusStyle, ToastType } from "../types/types";

// ── StatusBadge ───────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: ClientStatus }) {
  const s: StatusStyle = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 600, color: s.color,
      letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label.toUpperCase()}
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
        fontFamily: mono ? "monospace" : "inherit",
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

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 250,
    }}>
      <div style={{
        background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
        width: "100%", maxWidth: 820, maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 28px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: C.slate100, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: C.blueLight, border: `1px solid ${C.blueMid}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>🏢</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.slate }}>{client.company_name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: 11, color: C.slate500, fontFamily: "monospace" }}>{client.id}</span>
                <StatusBadge status={client.status} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, background: C.slate100,
              border: `1px solid ${C.border}`, cursor: "pointer",
              color: C.slate500, fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "0 28px 24px", flex: 1 }}>
          <div style={{
            marginTop: 18, padding: "10px 14px",
            background: C.slate100, borderRadius: 8, border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 12, color: C.slate500 }}>Submitted on</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.slate }}>{fmt(client.submitted_at)}</span>
          </div>

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

          <SectionTitle icon="👥" title="Account Ownership" />
          <InfoRow label="Account Manager"  value={client.ownership.account_manager} />
          <InfoRow label="Sales Owner"      value={client.ownership.sales_owner} />
          <InfoRow label="Campaign Manager" value={client.ownership.campaign_manager} />
          <InfoRow label="Finance Owner"    value={client.ownership.finance_owner} />

          <SectionTitle icon="🏷️" title="Classification" />
          <InfoRow label="Client Type"       value={client.classification.client_type} />
          <InfoRow label="Priority"          value={client.classification.priority} />
          <InfoRow label="Risk Level"        value={client.classification.risk_level} />
          <InfoRow label="Payment Behavior"  value={client.classification.payment_behavior} />
          <InfoRow label="Avg Response Time" value={`${client.classification.avg_response_time} day(s)`} />
        </div>

        {/* Footer Actions */}
        {client.status === "pending" && (
          <div style={{
            padding: "16px 28px", borderTop: `1px solid ${C.border}`,
            background: C.slate100, display: "flex", gap: 10,
            justifyContent: "flex-end", flexShrink: 0,
          }}>
            {confirmAction === null ? (
              <>
                <button
                  onClick={() => setConfirmAction("reject")}
                  style={{
                    padding: "10px 22px", borderRadius: 9,
                    border: `1px solid #FECACA`, background: C.redLight,
                    color: C.red, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >✕ Reject Client</button>
                <button
                  onClick={() => setConfirmAction("approve")}
                  style={{
                    padding: "10px 28px", borderRadius: 9, border: "none",
                    background: C.green, color: "#fff",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    boxShadow: `0 4px 14px ${C.green}44`,
                  }}
                >✓ Approve Client</button>
              </>
            ) : confirmAction === "approve" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: C.slate }}>Confirm approval of <strong>{client.company_name}</strong>?</span>
                <button onClick={() => setConfirmAction(null)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.slate500, cursor: "pointer", fontSize: 12 }}>Cancel</button>
                <button onClick={() => { onApprove(client.id); setConfirmAction(null); }} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: C.green, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Yes, Approve</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: C.slate }}>Confirm rejection of <strong>{client.company_name}</strong>?</span>
                <button onClick={() => setConfirmAction(null)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.slate500, cursor: "pointer", fontSize: 12 }}>Cancel</button>
                <button onClick={() => { onReject(client.id); setConfirmAction(null); }} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: C.red, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Yes, Reject</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}