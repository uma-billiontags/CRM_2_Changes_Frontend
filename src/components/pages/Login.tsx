import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password.trim()) { setError("Please enter your password."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/login_view/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        return;
      }

      localStorage.setItem("user_role", data.user.role);
      localStorage.setItem("user_email", data.user.email);
      localStorage.setItem("user_id", String(data.user.id));
      localStorage.setItem("user_name", data.user.username || "");
      localStorage.setItem("client_id", data.user.client_id || "");
      localStorage.setItem("user_source", data.user.source || "");
      localStorage.setItem("client_name", data.user.client_name || data.user.username || "");

      if (remember) {
        localStorage.setItem("remembered_email", email.trim());
      } else {
        localStorage.removeItem("remembered_email");
      }

      const role = data.user.role.toLowerCase();
      const redirectMap: Record<string, string> = {
        super_admin: "/superadmin",
        admin: "/admin",
        creative_team: "/creative_dashboard",
        campaign_team: "/campaign_dashboard",
        client: "/user_dashboard",
        viewer: "/viewer_dashboard",
      };
      navigate(redirectMap[role] ?? "/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignIn();
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      background: "var(--bg-page)",
      fontFamily: "'Poppins', sans-serif",
    }}>

      {/* ── Left branding panel ──────────────────────────────────── */}
      <div style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        padding: "36px 48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
        {/* Glow blobs */}
        <div style={{
          position: "absolute", bottom: -140, right: -100,
          width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(152,62,245,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "30%", left: -100,
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(152,62,245,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
          <div className="db-logo-icon" style={{ width: 40, height: 40, fontSize: 13, borderRadius: 10 }}>CRM</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--accent)", letterSpacing: "-0.02em", lineHeight: 1 }}>
              BILLION <span style={{ color: "var(--text-primary)" }}>TAGS</span>
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>
              Enterprise CRM
            </div>
          </div>
        </Link>

        {/* Middle copy */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: "var(--accent)",
            letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12,
          }}>
            Enterprise Platform
          </div>
          <h2 style={{
            fontSize: 36, fontWeight: 800, lineHeight: 1.1,
            letterSpacing: "-0.03em", color: "var(--text-primary)", margin: "0 0 16px",
          }}>
            CRM Automation Platform
          </h2>
          <p style={{
            fontSize: 13, color: "var(--text-secondary)",
            lineHeight: 1.7, maxWidth: 340, margin: "0 0 28px",
          }}>
            Governed workflows, live monitoring and full audit trail across every
            client, campaign and transaction.
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Role-based access control",
              "Approval workflows",
              "Real-time dashboards",
            ].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: "rgba(152,62,245,0.15)",
                  border: "1px solid rgba(152,62,245,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 10, color: "var(--accent)" }}>✓</span>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 10, color: "var(--text-muted)", position: "relative", zIndex: 1, letterSpacing: "0.06em" }}>
          SOC 2 · ISO 27001 · GDPR ready
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-page)",
      }}>
        {/* Top bar with theme toggle */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
        }}>
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            style={{
              width: 32, height: 32,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-input)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 15,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.background = "var(--accent-light)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "var(--bg-input)";
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Centered form */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}>
          <div style={{ width: "100%", maxWidth: 380 }} onKeyDown={handleKeyDown}>

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em",
                color: "var(--text-primary)", margin: "0 0 6px",
              }}>
                Welcome back
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                Sign in with your registered credentials
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{
                marginBottom: 20,
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--red-bg)",
                border: "1px solid rgba(248,113,113,0.25)",
                color: "var(--red)",
                fontSize: 12, fontWeight: 500,
                display: "flex", alignItems: "flex-start", gap: 8,
              }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <LoginField
                icon={<Mail size={14} />}
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={setEmail}
              />

              <LoginField
                icon={<Lock size={14} />}
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
              />

              {/* Remember + Forgot */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{
                  display: "flex", alignItems: "center", gap: 7,
                  fontSize: 12, color: "var(--text-secondary)", cursor: "pointer",
                }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                  />
                  Remember me
                </label>
                <a href="#" style={{
                  fontSize: 12, color: "var(--accent)",
                  fontWeight: 600, textDecoration: "none",
                }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSignIn}
                disabled={loading}
                style={{
                  width: "100%", height: 44,
                  background: loading ? "var(--text-muted)" : "var(--accent)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13, fontWeight: 700,
                  color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "'Poppins', sans-serif",
                  boxShadow: loading ? "none" : "0 0 20px rgba(152,62,245,0.35)",
                  transition: "opacity 0.15s",
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 14, height: 14,
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Verifying credentials…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight size={14} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                color: "var(--text-muted)", fontSize: 11,
              }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span>OR</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* Register link */}
              <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                New user?{" "}
                <Link to="/onboarding" style={{
                  color: "var(--accent)", fontWeight: 700, textDecoration: "none",
                }}>
                  Register your company
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-brand { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── Field sub-component ───────────────────────────────────────────────────────
function LoginField({
  icon, label, type, placeholder, value, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 600,
        color: "var(--text-secondary)",
        textTransform: "uppercase", letterSpacing: "0.07em",
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 12, top: "50%",
          transform: "translateY(-50%)",
          color: focused ? "var(--accent)" : "var(--text-muted)",
          display: "flex", alignItems: "center",
          transition: "color 0.15s",
          pointerEvents: "none",
        }}>
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", height: 42,
            paddingLeft: 36, paddingRight: 12,
            background: "var(--bg-input)",
            border: `1px solid ${focused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)",
            fontSize: 13, color: "var(--text-primary)",
            outline: "none",
            fontFamily: "'Poppins', sans-serif",
            transition: "border-color 0.15s",
            boxShadow: focused ? "0 0 0 3px rgba(152,62,245,0.12)" : "none",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}