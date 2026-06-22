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
