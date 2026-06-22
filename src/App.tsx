import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Onboarding from "./components/pages/Onboarding";

// ── User Layout + Pages ───────────────────────────────────────────────────────
import UserLayout from "./components/user_dashboard/UserLayout";
import User_Dashboard from "./components/user_dashboard/User_Dashboard";
import Campaign_Create from "./components/user_dashboard/Campaign_Create";
import Creative__Image_Upload from "./components/user_dashboard/Creative_Image_Upload";
import Creative_Video_Upload from "./components/user_dashboard/Creative_Video_Upload";
import User_Campaigns from "./components/user_dashboard/User_Campaigns";
import View_Campaign from "./components/user_dashboard/View_Campaign";
import Edit_Campaign from "./components/user_dashboard/Edit_Campaign";
import User_Drafts from "./components/user_dashboard/User_Drafts";
import User_IO from "./components/user_dashboard/User_IO";
import User_Invoice from "./components/user_dashboard/User_Invoice";
import User_Reports from "./components/user_dashboard/User_Reports";
import Campaign_Choice from "./components/user_dashboard/Campaign_Choice";
import Bulk_Campaign_Create from "./components/user_dashboard/Bulk_Campaign_Create";

// ── Creatives ─────────────────────────────────────────────────────────────────
import Creative_Dashboard from "./components/creatives_team_dashboard/Creative_Dashboard";
import Image_Creatives from "./components/creatives_team_dashboard/Image_Creatives";
import Video_Creatives from "./components/creatives_team_dashboard/Video_Creatives";
import View_Creative from "./components/creatives_team_dashboard/View_Creative";
import Third_Party_Creative from "./components/creatives_team_dashboard/Third_Party_Creative";
import CreativeLayout from "./components/creatives_team_dashboard/CreativeLayout";

// ── Campaign Team ─────────────────────────────────────────────────────────────
import Campaign_Dashboard from "./components/campaign_team_dashboard/Campaign_Dashboard";
import View_Campaign_Team from "./components/campaign_team_dashboard/View_Campaign_Team";
import Reports from "./components/campaign_team_dashboard/Reports";
import CampaignLayout from "./components/campaign_team_dashboard/CampaignLayout";

// ── Super Admin ───────────────────────────────────────────────────────────────
import SuperAdminLayout from "./components/super_admin/SuperAdminLayout";
import SuperAdminOverview from "./components/super_admin/SuperAdminOverview";
import { AllClientsPage, PendingPage,  } from "./components/super_admin/ClientListPages";
import { AdminUsersPage, AuditLogsPage, SystemSettingsPage } from "./components/super_admin/SettingsPages";
import TeamAccess from "./components/super_admin/TeamAccess";
import All_Campaigns from "./components/super_admin/All_Campaigns";
import Superadmin_Daily_Reports from "./components/super_admin/Daily_Reports"
import Superadmin_Bulk_Campaigns_Details from "./components/super_admin/Bulk_Campaign_Details"
import Superadmin_CampaignReports from "./components/super_admin/CampaignReports";

// ── Admin ─────────────────────────────────────────────────────────────────────
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverview from "./components/admin/AdminOverview";
import Admin_Campaigns from "./components/admin/Admin_Campaigns";
import CampaignReports from "./components/admin/CampaignReports";
import Daily_Reports from "./components/admin/Daily_Reports";
import Bulk_Campaigns_Details from "./components/admin/Bulk_Campaign_Details";
import Admin_Messages_Sidebar from "./components/admin/Admin_Messages_Sidebar";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* ── User routes — all wrapped in UserLayout ── */}
        <Route element={<UserLayout />}>
          <Route path="/user_dashboard" element={<User_Dashboard />} />
          <Route path="/campaign_create" element={<Campaign_Create />} />
          <Route path="/creative_image_upload" element={<Creative__Image_Upload />} />
          <Route path="/creative_video_upload" element={<Creative_Video_Upload />} />
          <Route path="/user_campaigns" element={<User_Campaigns />} />
          <Route path="/campaign/:campaign_id" element={<View_Campaign />} />
          <Route path="/update_campaign/:campaign_id" element={<Edit_Campaign />} />
          <Route path="/user_drafts" element={<User_Drafts />} />
          <Route path="/user_io" element={<User_IO />} />
          <Route path="/user_invoices" element={<User_Invoice />} />
          <Route path="user_reports" element={<User_Reports />} />
          <Route path="campaign_choice" element={<Campaign_Choice />} />
          <Route path="bulk_campaign_create" element={<Bulk_Campaign_Create />} />
        </Route>

        {/* Creatives team (has its own layout inside each page, leave as-is) */}
        <Route element={<CreativeLayout />}>
          <Route path="/creative_dashboard" element={<Creative_Dashboard />} />
          <Route path="/image_creatives" element={<Image_Creatives />} />
          <Route path="/video_creatives" element={<Video_Creatives />} />
          <Route path="/creative/:campaign_id" element={<View_Creative />} />
          <Route path="/third_party_creatives" element={<Third_Party_Creative />} />
        </Route>

        {/* Campaign team */}
        <Route element={<CampaignLayout />}>
          <Route path="/campaign_dashboard" element={<Campaign_Dashboard />} />
          <Route path="/campaign_view_team/:campaign_id" element={<View_Campaign_Team />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Super Admin */}
        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<SuperAdminOverview />} />
          <Route path="clients" element={<AllClientsPage />} />
          <Route path="pending" element={<PendingPage />} />
          <Route path="system-settings" element={<SystemSettingsPage />} />
          <Route path="admin-users" element={<AdminUsersPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="team" element={<TeamAccess />} />
          <Route path="campaigns" element={<All_Campaigns />} />
          <Route path="campaign_reports" element={<Superadmin_CampaignReports />} />
          <Route path="daily_reports" element={<Superadmin_Daily_Reports />} />
          <Route path="bulk_campaigns_details" element={<Superadmin_Bulk_Campaigns_Details />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="clients" element={<AllClientsPage />} />
          <Route path="pending" element={<PendingPage />} />
          <Route path="system-settings" element={<SystemSettingsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="campaigns" element={<Admin_Campaigns />} />
          <Route path="campaign_reports" element={<CampaignReports />} />
          <Route path="daily_reports" element={<Daily_Reports />} />
          <Route path="bulk_campaigns_details" element={<Bulk_Campaigns_Details />} />
          <Route path="admin_messages" element={<Admin_Messages_Sidebar />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;