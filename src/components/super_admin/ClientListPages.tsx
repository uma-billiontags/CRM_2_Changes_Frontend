import { useOutletContext } from "react-router-dom";
import ClientTablePage from "./ClientTablePage";
import type { SuperAdminOutletContext } from "./SuperAdminLayout";

// All Clients
export function AllClientsPage() {
  const { clients, handleApprove, handleReject } = useOutletContext<SuperAdminOutletContext>();
  return (
    <ClientTablePage
      clients={clients}
      filterStatus={null}
      onApprove={handleApprove}
      onReject={handleReject}
      title="All Clients"
      subtitle="Every onboarded client across all statuses"
    />
  );
}

// Pending Approval
export function PendingPage() {
  const { clients, handleApprove, handleReject } = useOutletContext<SuperAdminOutletContext>();
  return (
    <ClientTablePage
      clients={clients}
      filterStatus="pending"
      onApprove={handleApprove}
      onReject={handleReject}
      title="Pending Approval"
      subtitle="Clients awaiting your review and decision"
    />
  );
}

// ── Approved ──────────────────────────────────────────────────────────────────

export function ApprovedPage() {
  const { clients, handleApprove, handleReject } = useOutletContext<SuperAdminOutletContext>();
  return (
    <ClientTablePage
      clients={clients}
      filterStatus="approved"
      onApprove={handleApprove}
      onReject={handleReject}
      title="Approved Clients"
      subtitle="Active and approved clients on the platform"
    />
  );
}

// ── Rejected ──────────────────────────────────────────────────────────────────

export function RejectedPage() {
  const { clients, handleApprove, handleReject } = useOutletContext<SuperAdminOutletContext>();
  return (
    <ClientTablePage
      clients={clients}
      filterStatus="rejected"
      onApprove={handleApprove}
      onReject={handleReject}
      title="Rejected Clients"
      subtitle="Clients that did not pass the review process"
    />
  );
}