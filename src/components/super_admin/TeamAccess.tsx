import { useState, useEffect } from "react";

const C = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  slate: "#0F172A",
  slate700: "#334155",
  slate500: "#64748B",
  slate400: "#94A3B8",
  slate300: "#CBD5E1",
  slate100: "#F1F5F9",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  blue: "#2563EB",
  blueLight: "#EFF6FF",
  blueMid: "#BFDBFE",
  green: "#16A34A",
  greenLight: "#F0FDF4",
  red: "#DC2626",
  redLight: "#FEF2F2",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  purple: "#7C3AED",
  purpleLight: "#F5F3FF",
  yellow: "#CA8A04",
  yellowLight: "#FEFCE8",
};

const API = {
  create:       "http://127.0.0.1:8000/create_team_member/",
  getAll:       "http://127.0.0.1:8000/get_team_members/",
  delete:       "http://127.0.0.1:8000/delete_team_member/",
  edit:         "http://127.0.0.1:8000/edit_team_member/",
  getClients:   "http://127.0.0.1:8000/get_client_users/",
  editClient:   "http://127.0.0.1:8000/edit_client_user/",
  deleteClient: "http://127.0.0.1:8000/delete_client_user/",
};

const NGROK_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

const ROLES = [
  {
    name: "Super Admin",
    color: C.slate,
    bg: C.slate100,
    border: C.border,
    permissions: ["Full access — all sections, settings & team management"],
  },
  {
    name: "Admin",
    color: C.blue,
    bg: C.blueLight,
    border: C.blueMid,
    permissions: ["Clients", "Campaigns"],
  },
  {
    name: "Creative_Team",
    color: C.purple,
    bg: C.purpleLight,
    border: "#DDD6FE",
    permissions: ["Creatives", "Line Items"],
  },
  {
    name: "Campaign_Team",
    color: C.yellow,
    bg: C.yellowLight,
    border: "#FDE68A",
    permissions: ["Campaigns"],
  },
  {
    name: "Viewer",
    color: C.slate500,
    bg: C.slate100,
    border: C.border,
    permissions: ["Dashboard (read-only)", "Analytics (read-only)"],
  },
];

const ROLE_NAMES = ROLES.map((r) => r.name);

function getRoleStyle(roleName: string) {
  return ROLES.find((r) => r.name === roleName) ?? ROLES[1];
}

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  last_active: string;
}

interface ClientUser {
  id: number;
  client_id: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  last_active: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMember(raw: any): Member {
  return {
    id:          raw.id,
    name:        raw.member ?? raw.name ?? "",
    email:       raw.email ?? "",
    role:        raw.role ?? "",
    status:      raw.status ?? "Active",
    last_active: raw.last_active ?? raw.lastActive ?? "—",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeClientUser(raw: any): ClientUser {
  // Normalize status: "active" -> "Active", "inactive" -> "Inactive"
  const rawStatus = raw.status ?? "Active";
  const status: "Active" | "Inactive" =
    rawStatus.toLowerCase() === "inactive" ? "Inactive" : "Active";
  return {
    id:          raw.id,
    client_id:   raw.client_id ?? raw.username ?? "—",
    email:       raw.email ?? "",
    role:        raw.role ?? "client",
    status,
    last_active: raw.last_active ?? raw.date_joined ?? "—",
  };
}

function RoleBadge({ role }: { role: string }) {
  const s = getRoleStyle(role);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 600, color: s.color,
      letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>
      {role}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  if (!name) {
    return (
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: C.slate300, flexShrink: 0,
      }} />
    );
  }
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = [C.blue, C.purple, C.green, C.amber, "#0891B2", "#BE185D"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 800, flexShrink: 0, letterSpacing: "0.02em",
    }}>{initials}</div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      flex: 1, background: C.white,
      border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "18px 22px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    }}>
      <div style={{ fontSize: 11, color: C.slate500, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: C.slate, letterSpacing: "-1px" }}>
        {value}
      </div>
    </div>
  );
}

function ChangePasswordModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (newPw !== confirmPw) { setMsg("Passwords do not match."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API.edit}${member.id}/`, {
        method: "PUT",
        headers: NGROK_HEADERS,
        body: JSON.stringify({ password: newPw }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setMsg("✅ Password updated successfully!");
      setTimeout(onClose, 1500);
    } catch (err: unknown) {
      setMsg(`❌ ${err instanceof Error ? err.message : "Failed to update password"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
        width: "100%", maxWidth: 440, padding: 28,
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, margin: 0 }}>Change Password</h3>
            <p style={{ fontSize: 12, color: C.slate500, margin: "4px 0 0" }}>For <strong>{member.name}</strong></p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.slate100, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        {[
          { label: "New Password", val: newPw, set: setNewPw },
          { label: "Confirm Password", val: confirmPw, set: setConfirmPw },
        ].map(({ label, val, set }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
            <input
              type="password" placeholder="Min 8 characters" value={val}
              onChange={(e) => set(e.target.value)}
              style={{
                marginTop: 6, width: "100%", height: 40, padding: "0 14px",
                border: `1px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, color: C.slate, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        ))}
        {msg && (
          <div style={{ marginBottom: 12, fontSize: 12, color: msg.startsWith("✅") ? C.green : C.red, fontWeight: 500 }}>
            {msg}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.slate500, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: saving ? C.slate500 : C.slate, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "Saving…" : "Save Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditMemberModal({
  member,
  onClose,
  onSaved,
}: {
  member: Member;
  onClose: () => void;
  onSaved: (updated: Member) => void;
}) {
  const [editForm, setEditForm] = useState({ name: member.name, email: member.email, role: member.role });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editForm.name.trim()) { setMsg("Name is required."); return; }
    if (!editForm.email.trim() || !/\S+@\S+\.\S+/.test(editForm.email)) { setMsg("Valid email is required."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API.edit}${member.id}/`, {
        method: "PUT",
        headers: NGROK_HEADERS,
        body: JSON.stringify({
          member: editForm.name,
          email: editForm.email,
          role: editForm.role,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const updated: Member = { ...member, ...editForm };
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      setMsg(`❌ ${err instanceof Error ? err.message : "Failed to update member"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
        width: "100%", maxWidth: 480, padding: 28,
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, margin: 0 }}>Edit Member</h3>
            <p style={{ fontSize: 12, color: C.slate500, margin: "4px 0 0" }}>Update details for <strong>{member.name}</strong></p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.slate100, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        {[
          { label: "Full Name", key: "name" as const, type: "text", placeholder: "e.g. Arjun Mehta" },
          { label: "Work Email", key: "email" as const, type: "email", placeholder: "name@company.com" },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              {label}
            </label>
            <input
              type={type}
              placeholder={placeholder}
              value={editForm[key]}
              onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
              style={{
                width: "100%", height: 40, padding: "0 14px",
                border: `1px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, color: C.slate, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Role
          </label>
          <select
            value={editForm.role}
            onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
            style={{
              width: "100%", height: 40, padding: "0 14px",
              border: `1px solid ${C.border}`, borderRadius: 8,
              fontSize: 13, color: C.slate, outline: "none",
              background: C.white, boxSizing: "border-box", cursor: "pointer",
            }}
          >
            {ROLE_NAMES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {msg && (
          <div style={{ marginBottom: 12, fontSize: 12, color: msg.startsWith("❌") ? C.red : C.green, fontWeight: 500 }}>
            {msg}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.slate500, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: saving ? C.slate500 : C.blue, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Change Password Modal for Client Users ────────────────────────────────────
function ChangeClientPasswordModal({ client, onClose }: { client: ClientUser; onClose: () => void }) {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (newPw !== confirmPw) { setMsg("Passwords do not match."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API.editClient}${client.id}/`, {
        method: "PUT",
        headers: NGROK_HEADERS,
        body: JSON.stringify({ password: newPw }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setMsg("✅ Password updated successfully!");
      setTimeout(onClose, 1500);
    } catch (err: unknown) {
      setMsg(`❌ ${err instanceof Error ? err.message : "Failed to update password"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
        width: "100%", maxWidth: 440, padding: 28,
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, margin: 0 }}>Change Password</h3>
            <p style={{ fontSize: 12, color: C.slate500, margin: "4px 0 0" }}>For client <strong>{client.client_id}</strong></p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.slate100, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        {[
          { label: "New Password", val: newPw, set: setNewPw },
          { label: "Confirm Password", val: confirmPw, set: setConfirmPw },
        ].map(({ label, val, set }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.slate500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
            <input
              type="password" placeholder="Min 8 characters" value={val}
              onChange={(e) => set(e.target.value)}
              style={{
                marginTop: 6, width: "100%", height: 40, padding: "0 14px",
                border: `1px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, color: C.slate, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        ))}
        {msg && (
          <div style={{ marginBottom: 12, fontSize: 12, color: msg.startsWith("✅") ? C.green : C.red, fontWeight: 500 }}>
            {msg}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.slate500, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: saving ? C.slate500 : C.slate, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "Saving…" : "Save Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TeamAccess() {
  const [activeTab, setActiveTab] = useState<"members" | "clients" | "add">("members");
  const [search, setSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [changePwMember, setChangePwMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [changePwClient, setChangePwClient] = useState<ClientUser | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Campaign_Team" });
  const [formMsg, setFormMsg] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // ── Client users state ────────────────────────────────────────────────────
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState("");

  // ── FETCH team members ────────────────────────────────────────────────────
  const fetchMembers = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(API.getAll, { headers: NGROK_HEADERS });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const raw = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
      setMembers(raw.map(normalizeMember));
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  // ── FETCH client users ────────────────────────────────────────────────────
  const fetchClientUsers = async () => {
    setClientsLoading(true);
    setClientsError("");
    try {
      const res = await fetch(API.getClients, { headers: NGROK_HEADERS });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const raw = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
      setClientUsers(raw.map(normalizeClientUser));
    } catch (err: unknown) {
      setClientsError(err instanceof Error ? err.message : "Failed to load client users");
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);
  useEffect(() => { if (activeTab === "clients") fetchClientUsers(); }, [activeTab]);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
  });

  const filteredClients = clientUsers.filter((c) => {
    const q = clientSearch.toLowerCase();
    return !q || c.client_id.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const counts = {
    total: members.length,
    active: members.filter((m) => m.status === "Active").length,
    pending: 0,
    roles: new Set(members.map((m) => m.role)).size,
  };

  // ── TOGGLE team member status ─────────────────────────────────────────────
  const toggleStatus = async (id: number) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    const newStatus = member.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`${API.edit}${id}/`, {
        method: "PUT", headers: NGROK_HEADERS,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, status: newStatus } : m));
    } catch (err) {
      alert(`Failed to update status: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // ── TOGGLE client user status ─────────────────────────────────────────────
  const toggleClientStatus = async (id: number) => {
    const cu = clientUsers.find((c) => c.id === id);
    if (!cu) return;
    const newStatus = cu.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`${API.editClient}${id}/`, {
        method: "PUT", headers: NGROK_HEADERS,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setClientUsers((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
    } catch (err) {
      alert(`Failed to update status: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // ── DELETE client user ────────────────────────────────────────────────────
  const removeClientUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this client user?")) return;
    try {
      const res = await fetch(`${API.deleteClient}${id}/`, { method: "DELETE", headers: NGROK_HEADERS });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setClientUsers((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(`Failed to delete client: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };


  const removeMember = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await fetch(`${API.delete}${id}/`, { method: "DELETE", headers: NGROK_HEADERS });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(`Failed to delete member: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // ── CREATE team member ────────────────────────────────────────────────────
  const handleAddMember = async () => {
    if (!form.name.trim()) { setFormMsg("Full name is required."); return; }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) { setFormMsg("Valid work email is required."); return; }
    setFormLoading(true);
    setFormMsg("");
    try {
      const res = await fetch(API.create, {
        method: "POST", headers: NGROK_HEADERS,
        body: JSON.stringify({ member: form.name, email: form.email, password: form.password, role: form.role }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server error ${res.status}`);
      }
      const raw = await res.json();
      setMembers((prev) => [...prev, normalizeMember(raw)]);
      setForm({ name: "", email: "", password: "", role: "Campaign_Team" });
      setFormMsg("✅ Member added successfully!");
      setTimeout(() => { setFormMsg(""); setActiveTab("members"); }, 1500);
    } catch (err: unknown) {
      setFormMsg(`❌ ${err instanceof Error ? err.message : "Failed to add member"}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleMemberSaved = (updated: Member) => {
    setMembers((prev) => prev.map((m) => m.id === updated.id ? updated : m));
  };

  const selectedRole = getRoleStyle(form.role);

  // ── Shared table column config ────────────────────────────────────────────
  const memberCols   = ["MEMBER",    "EMAIL", "ROLE", "STATUS", "PASSWORD", "LAST ACTIVE", "ACTIONS"];
  const memberWidths = [180, 220, 150, 100, 100, 160, 280];

  const clientCols   = ["CLIENT ID", "EMAIL", "ROLE", "STATUS", "PASSWORD", "LAST ACTIVE", "ACTIONS"];
  const clientWidths = [160, 220, 120, 100, 100, 180, 310];

  // ── Status badge helper ───────────────────────────────────────────────────
  function StatusBadge({ status }: { status: "Active" | "Inactive" }) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20,
        background: status === "Active" ? C.greenLight : C.redLight,
        border: `1px solid ${status === "Active" ? "#BBF7D0" : "#FECACA"}`,
        fontSize: 11, fontWeight: 600,
        color: status === "Active" ? C.green : C.red,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: status === "Active" ? C.green : C.red }} />
        {status}
      </span>
    );
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.slate, margin: 0, letterSpacing: "-0.4px" }}>Team & Access</h1>
          <p style={{ fontSize: 11, color: C.slate500, margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.04em" }}>
            MANAGE TEAM MEMBERS AND ROLE PERMISSIONS
          </p>
        </div>
        {/* Add User button only visible on non-clients tabs */}
        {activeTab !== "clients" && (
          <button
            onClick={() => { setActiveTab("add"); setFormMsg(""); }}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: C.blue, color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 2px 8px rgba(15,23,42,0.25)",
            }}
          >
            + Add User
          </button>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Members" value={counts.total} />
        <StatCard label="Active" value={counts.active} />
        <StatCard label="Pending" value={counts.pending} />
        <StatCard label="Roles" value={counts.roles} />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${C.border}`, marginBottom: 24 }}>
        {(["members", "clients", "add"] as const).map((tab) => {
          const label = tab === "members" ? "Team Members" : tab === "clients" ? "Clients" : "Add Member";
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setFormMsg(""); }}
              style={{
                padding: "10px 20px", border: "none", background: "transparent",
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? C.slate : C.slate500,
                cursor: "pointer",
                borderBottom: active ? `2px solid ${C.slate}` : "2px solid transparent",
                marginBottom: -2,
              }}
            >{label}</button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════
          TAB: Team Members
      ══════════════════════════════════════════ */}
      {activeTab === "members" && (
        <div>
          <div style={{
            background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
            overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20,
          }}>
            {/* Table header bar */}
            <div style={{
              padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.slate }}>Members ({filtered.length})</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: 220, height: 36, padding: "0 14px",
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    fontSize: 12, color: C.slate, outline: "none", background: C.bg,
                  }}
                />
                <button
                  onClick={fetchMembers}
                  disabled={loading}
                  title="Refresh list"
                  style={{
                    height: 36, width: 36, borderRadius: 8, border: `1px solid ${C.border}`,
                    background: C.white, cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    color: C.slate500,
                  }}
                >{loading ? "…" : "↻"}</button>
              </div>
            </div>

            {loadError && (
              <div style={{ padding: "12px 20px", background: C.redLight, borderBottom: `1px solid #FECACA`, fontSize: 12, color: C.red }}>
                ❌ {loadError} — <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={fetchMembers}>retry</span>
              </div>
            )}
            {loading && members.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: C.slate500, fontSize: 13 }}>Loading members…</div>
            )}

            {/* Column headers */}
            {!loading && (
              <div style={{ display: "flex", background: C.slate100, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
                {memberCols.map((col, i) => (
                  <div key={col} style={{
                    width: memberWidths[i], flexShrink: 0, padding: "10px 14px",
                    fontSize: 10, fontWeight: 700, color: C.slate500,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>{col}</div>
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && !loadError && (
              <div style={{ padding: 40, textAlign: "center", color: C.slate500, fontSize: 13 }}>No members found.</div>
            )}

            {filtered.map((m, i) => (
              <div
                key={m.id}
                style={{
                  display: "flex", alignItems: "center",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.borderLight}` : "none",
                  transition: "background 0.12s", overflowX: "auto",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.slate100; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div style={{ width: 180, flexShrink: 0, padding: "14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={m.name} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                </div>
                <div style={{ width: 220, flexShrink: 0, padding: "14px", fontSize: 12, color: C.slate500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
                <div style={{ width: 150, flexShrink: 0, padding: "14px" }}><RoleBadge role={m.role} /></div>
                <div style={{ width: 100, flexShrink: 0, padding: "14px" }}><StatusBadge status={m.status} /></div>
                <div style={{ width: 100, flexShrink: 0, padding: "14px", fontSize: 13, color: C.slate400, letterSpacing: "2px" }}>••••••••</div>
                <div style={{ width: 160, flexShrink: 0, padding: "14px", fontSize: 12, color: C.slate500 }}>{m.last_active ?? "—"}</div>
                <div style={{ width: 280, flexShrink: 0, padding: "14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    onClick={() => toggleStatus(m.id)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                      background: m.status === "Active" ? C.amberLight : C.greenLight,
                      border: `1px solid ${m.status === "Active" ? "#FDE68A" : "#BBF7D0"}`,
                      color: m.status === "Active" ? C.amber : C.green,
                      fontSize: 11, fontWeight: 600,
                    }}
                  >{m.status === "Active" ? "Deactivate" : "Activate"}</button>
                  <button
                    onClick={() => setEditMember(m)}
                    style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: C.purpleLight, border: `1px solid #DDD6FE`, color: C.purple, fontSize: 11, fontWeight: 600 }}
                  >Edit</button>
                  <button
                    onClick={() => setChangePwMember(m)}
                    style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: C.blueLight, border: `1px solid ${C.blueMid}`, color: C.blue, fontSize: 11, fontWeight: 600 }}
                  >Change PW</button>
                  <button
                    onClick={() => removeMember(m.id)}
                    style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: C.redLight, border: `1px solid #FECACA`, color: C.red, fontSize: 11, fontWeight: 600 }}
                  >Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Role Permissions Reference */}
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.slate }}>Role Permissions Reference</span>
            </div>
            <div style={{ padding: "0 20px" }}>
              <div style={{ display: "flex", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 200, fontSize: 10, fontWeight: 700, color: C.slate500, letterSpacing: "0.08em", textTransform: "uppercase" }}>ROLE</div>
                <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: C.slate500, letterSpacing: "0.08em", textTransform: "uppercase" }}>ACCESS</div>
              </div>
              {ROLES.map((role, i) => (
                <div key={role.name} style={{
                  display: "flex", alignItems: "center", padding: "14px 0",
                  borderBottom: i < ROLES.length - 1 ? `1px solid ${C.borderLight}` : "none",
                }}>
                  <div style={{ width: 200 }}><RoleBadge role={role.name} /></div>
                  <div style={{ flex: 1, fontSize: 13, color: C.slate500 }}>{role.permissions.join(" · ")}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: Clients
      ══════════════════════════════════════════ */}
      {activeTab === "clients" && (
        <div>
          <div style={{
            background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
            overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            {/* Table header bar */}
            <div style={{
              padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.slate }}>Clients ({filteredClients.length})</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  placeholder="Search by client ID or email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  style={{
                    width: 260, height: 36, padding: "0 14px",
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    fontSize: 12, color: C.slate, outline: "none", background: C.bg,
                  }}
                />
                <button
                  onClick={fetchClientUsers}
                  disabled={clientsLoading}
                  title="Refresh list"
                  style={{
                    height: 36, width: 36, borderRadius: 8, border: `1px solid ${C.border}`,
                    background: C.white, cursor: clientsLoading ? "not-allowed" : "pointer",
                    fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    color: C.slate500,
                  }}
                >{clientsLoading ? "…" : "↻"}</button>
              </div>
            </div>

            {clientsError && (
              <div style={{ padding: "12px 20px", background: C.redLight, borderBottom: `1px solid #FECACA`, fontSize: 12, color: C.red }}>
                ❌ {clientsError} — <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={fetchClientUsers}>retry</span>
              </div>
            )}
            {clientsLoading && clientUsers.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: C.slate500, fontSize: 13 }}>Loading clients…</div>
            )}

            {/* Column headers */}
            {!clientsLoading && (
              <div style={{ display: "flex", background: C.slate100, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
                {clientCols.map((col, i) => (
                  <div key={col} style={{
                    width: clientWidths[i], flexShrink: 0, padding: "10px 14px",
                    fontSize: 10, fontWeight: 700, color: C.slate500,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>{col}</div>
                ))}
              </div>
            )}

            {!clientsLoading && filteredClients.length === 0 && !clientsError && (
              <div style={{ padding: 40, textAlign: "center", color: C.slate500, fontSize: 13 }}>No clients found.</div>
            )}

            {filteredClients.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "flex", alignItems: "center",
                  borderBottom: i < filteredClients.length - 1 ? `1px solid ${C.borderLight}` : "none",
                  transition: "background 0.12s", overflowX: "auto",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.slate100; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {/* Client ID */}
                <div style={{ width: 160, flexShrink: 0, padding: "14px" }}>
                  <span style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: 6,
                    background: C.blueLight, border: `1px solid ${C.blueMid}`,
                    fontSize: 12, fontWeight: 700, color: C.blue,
                    letterSpacing: "0.02em",
                  }}>{c.client_id}</span>
                </div>
                {/* Email */}
                <div style={{ width: 220, flexShrink: 0, padding: "14px", fontSize: 12, color: C.slate500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
                {/* Role */}
                <div style={{ width: 120, flexShrink: 0, padding: "14px" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "3px 10px", borderRadius: 20,
                    background: C.slate100, border: `1px solid ${C.border}`,
                    fontSize: 11, fontWeight: 600, color: C.slate500,
                  }}>{c.role}</span>
                </div>
                {/* Status */}
                <div style={{ width: 100, flexShrink: 0, padding: "14px" }}><StatusBadge status={c.status} /></div>
                {/* Password */}
                <div style={{ width: 100, flexShrink: 0, padding: "14px", fontSize: 13, color: C.slate400, letterSpacing: "2px" }}>••••••••</div>
                {/* Last Active */}
                <div style={{ width: 180, flexShrink: 0, padding: "14px", fontSize: 12, color: C.slate500 }}>{c.last_active ?? "—"}</div>
                {/* Actions */}
                <div style={{ width: 310, flexShrink: 0, padding: "14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    onClick={() => toggleClientStatus(c.id)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                      background: c.status === "Active" ? C.amberLight : C.greenLight,
                      border: `1px solid ${c.status === "Active" ? "#FDE68A" : "#BBF7D0"}`,
                      color: c.status === "Active" ? C.amber : C.green,
                      fontSize: 11, fontWeight: 600,
                    }}
                  >{c.status === "Active" ? "Deactivate" : "Activate"}</button>
                  <button
                    onClick={() => setChangePwClient(c)}
                    style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: C.blueLight, border: `1px solid ${C.blueMid}`, color: C.blue, fontSize: 11, fontWeight: 600 }}
                  >Change PW</button>
                  <button
                    onClick={() => removeClientUser(c.id)}
                    style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: C.redLight, border: `1px solid #FECACA`, color: C.red, fontSize: 11, fontWeight: 600 }}
                  >Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: Add Member
      ══════════════════════════════════════════ */}
      {activeTab === "add" && (
        <div style={{
          background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
          padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.slate, margin: "0 0 20px" }}>Add Team Member</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.slate700, display: "block", marginBottom: 6 }}>Full Name</label>
              <input
                placeholder="e.g. Arjun Mehta"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                style={{ width: "100%", height: 42, padding: "0 14px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, color: C.slate, outline: "none", background: C.bg, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.slate700, display: "block", marginBottom: 6 }}>Work Email</label>
              <input
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                style={{ width: "100%", height: 42, padding: "0 14px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, color: C.slate, outline: "none", background: C.bg, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.slate700, display: "block", marginBottom: 6 }}>Password</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                style={{ width: "100%", height: 42, padding: "0 14px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, color: C.slate, outline: "none", background: C.bg, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.slate700, display: "block", marginBottom: 6 }}>Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                style={{ width: "100%", height: 42, padding: "0 14px", border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, color: C.slate, outline: "none", background: C.bg, boxSizing: "border-box", cursor: "pointer" }}
              >
                {ROLE_NAMES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ padding: "16px 20px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: C.slate500, margin: "0 0 10px" }}>
              Permissions for <strong style={{ color: C.slate }}>{form.role}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedRole.permissions.map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.slate700 }}>
                  <span style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>✓</span>
                  {p}
                </div>
              ))}
            </div>
          </div>
          {formMsg && (
            <div style={{ marginBottom: 14, fontSize: 12, color: formMsg.startsWith("✅") ? C.green : C.red, fontWeight: 500 }}>
              {formMsg}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => { setForm({ name: "", email: "", password: "", role: "Campaign_Team" }); setFormMsg(""); }}
              style={{ padding: "10px 22px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.slate500, fontSize: 13, cursor: "pointer" }}
            >Reset</button>
            <button
              onClick={handleAddMember}
              disabled={formLoading}
              style={{ padding: "10px 28px", borderRadius: 9, border: "none", background: formLoading ? C.slate500 : C.blue, color: "#fff", fontSize: 13, fontWeight: 700, cursor: formLoading ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(15,23,42,0.2)" }}
            >
              {formLoading ? "Adding…" : "Add Member"}
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {changePwMember && <ChangePasswordModal member={changePwMember} onClose={() => setChangePwMember(null)} />}
      {editMember && <EditMemberModal member={editMember} onClose={() => setEditMember(null)} onSaved={handleMemberSaved} />}
      {changePwClient && <ChangeClientPasswordModal client={changePwClient} onClose={() => setChangePwClient(null)} />}
    </div>
  );
}