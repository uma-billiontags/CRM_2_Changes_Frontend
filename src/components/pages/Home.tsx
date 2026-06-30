import { Link } from "react-router-dom";
import {
  Building2, BarChart3, Wallet, ShieldCheck, Megaphone, Activity,
  ArrowRight, CheckCircle2, Sparkles,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme"; // ← adjust path as needed

const features = [
  { icon: Building2, title: "Client Management", desc: "Centralised client records, contacts, addresses & onboarding workflows." },
  { icon: BarChart3, title: "Reporting Automation", desc: "Scheduled reports, version diffs, and audit-ready exports across every entity." },
  { icon: Wallet, title: "Wallet Management", desc: "Real-time balances, top-ups and currency-aware ledger reconciliation." },
  { icon: ShieldCheck, title: "Secure Onboarding", desc: "GST/CIN validation, signature capture and role-bound approval flows." },
  { icon: Megaphone, title: "Campaign Management", desc: "Campaigns, sub-campaigns and insertion orders with version control." },
  { icon: Activity, title: "Live Monitoring", desc: "Operational dashboards, health scores and budget pacing in real time." },
];

const stats = [
  { k: "99.99%", v: "Platform uptime" },
  { k: "SOC 2", v: "Type II certified" },
  { k: "12 ms", v: "Median API latency" },
];

const navLinks = ["Features", "About", "Services", "Contact"];

export default function Home() {
  const { theme, toggleTheme } = useTheme(); // ← persistent theme

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      color: "var(--text-primary)",
      fontFamily: "'Poppins', sans-serif",
    }}>

      {/* ── Top Nav ─────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--bg-header)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          height: 56, padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div className="db-logo-icon">B</div>
            <span style={{ fontWeight: 800, fontSize: 14, color: "var(--accent)", letterSpacing: "-0.02em" }}>
              BILLION <span style={{ color: "var(--text-primary)" }}>TAGS</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {navLinks.map((n) => (
              <a key={n} href={n === "Features" ? "#features" : "#"} style={{ textDecoration: "none" }}>
                <div className="db-tab">{n}</div>
              </a>
            ))}
          </nav>

          {/* Right: theme toggle + Login + Register */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            {/* ── Theme Toggle ── */}
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
                color: "var(--text-secondary)",
                flexShrink: 0,
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

            {/* Login */}
            <Link to="/login" style={{ textDecoration: "none" }}>
              <button style={{
                height: 32, padding: "0 14px",
                background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600,
                color: "var(--text-primary)", cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                Login
              </button>
            </Link>

            {/* Register */}
            <Link to="/onboarding" style={{ textDecoration: "none" }}>
              <button style={{
                height: 32, padding: "0 14px",
                background: "var(--accent)", border: "none",
                borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600,
                color: "#fff", cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                boxShadow: "0 0 16px rgba(152,62,245,0.35)",
                transition: "opacity 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Register
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(160deg, var(--bg-page) 0%, var(--bg-sidebar) 60%, var(--bg-page) 100%)",
        borderBottom: "1px solid var(--border)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Glow blobs */}
        <div style={{
          position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)",
          width: 700, height: 400,
          background: "radial-gradient(ellipse, rgba(152,62,245,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -80, right: "10%",
          width: 350, height: 350,
          background: "radial-gradient(ellipse, rgba(255,101,132,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "72px 24px 80px",
          textAlign: "center", position: "relative",
        }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 14px", borderRadius: 20,
            background: "rgba(152,62,245,0.12)", border: "1px solid rgba(152,62,245,0.25)",
            fontSize: 11, fontWeight: 600, color: "var(--accent)",
            marginBottom: 24, letterSpacing: "0.04em",
          }}>
            <Sparkles size={12} /> Trusted by 400+ enterprise teams
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800,
            lineHeight: 1.08, letterSpacing: "-0.03em",
            color: "var(--text-primary)", maxWidth: 760, margin: "0 auto 20px",
          }}>
            The CRM{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Automation Platform
            </span>{" "}
            built for enterprise operations.
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 15, color: "var(--text-secondary)", maxWidth: 560,
            margin: "0 auto 36px", lineHeight: 1.7,
          }}>
            Manage clients, campaigns, billing and approvals on a single governed surface — with audit trails, RBAC and live monitoring out of the box.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link to="/portal" style={{ textDecoration: "none" }}>
              <button style={{
                height: 44, padding: "0 24px",
                background: "var(--accent)", border: "none",
                borderRadius: "var(--radius-card)", fontSize: 13, fontWeight: 700,
                color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "'Poppins', sans-serif",
                boxShadow: "0 0 24px rgba(152,62,245,0.4)",
                transition: "opacity 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Open User Portal <ArrowRight size={15} />
              </button>
            </Link>
            <Link to="/admin" style={{ textDecoration: "none" }}>
              <button style={{
                height: 44, padding: "0 24px",
                background: "var(--bg-card)", border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-card)", fontSize: 13, fontWeight: 600,
                color: "var(--text-primary)", cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                transition: "border-color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-strong)")}
              >
                Open Admin Console
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: "flex", gap: 14, marginTop: 52,
            justifyContent: "center", flexWrap: "wrap",
          }}>
            {stats.map((s) => (
              <div key={s.k} className="db-stat-card" style={{ minWidth: 160, textAlign: "left" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.02em" }}>{s.k}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "var(--accent)",
            letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8,
          }}>
            Platform
          </div>
          <h2 style={{
            fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800,
            letterSpacing: "-0.02em", color: "var(--text-primary)", maxWidth: 500,
          }}>
            Six modules. One governed system of record.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {features.map((f) => (
            <div
              key={f.title}
              className="db-card"
              style={{ padding: "22px 22px 20px", transition: "all 0.2s", cursor: "default" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(152,62,245,0.35)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 24px rgba(152,62,245,0.1)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: "var(--radius-sm)",
                background: "rgba(152,62,245,0.12)", border: "1px solid rgba(152,62,245,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14, color: "var(--accent)",
              }}>
                <f.icon size={17} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                {f.title}
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
                {f.desc}
              </p>
              <div style={{
                marginTop: 16, display: "flex", alignItems: "center", gap: 5,
                fontSize: 10, fontWeight: 600, color: "var(--green)",
              }}>
                <CheckCircle2 size={12} /> Audit-logged & approval-gated
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 72px" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(152,62,245,0.15) 0%, rgba(255,101,132,0.08) 100%)",
          border: "1px solid rgba(152,62,245,0.25)",
          borderRadius: "var(--radius-card)",
          padding: "40px 36px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.02em" }}>
              Ready to streamline your operations?
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              Get onboarded in minutes. No setup fee. Full access from day one.
            </p>
          </div>
          <Link to="/onboarding" style={{ textDecoration: "none" }}>
            <button style={{
              height: 42, padding: "0 22px",
              background: "var(--accent)", border: "none",
              borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700,
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: "'Poppins', sans-serif",
              boxShadow: "0 0 20px rgba(152,62,245,0.35)",
              transition: "opacity 0.15s", whiteSpace: "nowrap",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Get Started Free <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            © 2025 Billion Tags CRM. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy", "Security", "Status"].map((l) => (
              <a key={l} href="#"
                style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}