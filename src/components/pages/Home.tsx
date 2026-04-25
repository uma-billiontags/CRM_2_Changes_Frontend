import { Link } from "react-router-dom";
import {
  Building2, BarChart3, Wallet, ShieldCheck, Megaphone, Activity,
  ArrowRight, CheckCircle2, Sparkles,
} from "lucide-react";

const features = [
  { icon: Building2, title: "Client Management", desc: "Centralised client records, contacts, addresses & onboarding workflows." },
  { icon: BarChart3, title: "Reporting Automation", desc: "Scheduled reports, version diffs, and audit-ready exports across every entity." },
  { icon: Wallet, title: "Wallet Management", desc: "Real-time balances, top-ups and currency-aware ledger reconciliation." },
  { icon: ShieldCheck, title: "Secure Onboarding", desc: "GST/CIN validation, signature capture and role-bound approval flows." },
  { icon: Megaphone, title: "Campaign Management", desc: "Campaigns, sub-campaigns and insertion orders with version control." },
  { icon: Activity, title: "Live Monitoring", desc: "Operational dashboards, health scores and budget pacing in real time." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">N</div>
            <span className="font-semibold tracking-tight">Billion <span className="text-primary">Tags</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-ink-soft">
            <a href="#features" className="hover:text-ink">Features</a>
            <Link to="/" className="hover:text-ink">About</Link>
            <Link to="/" className="hover:text-ink">Services</Link>
            <Link to="/" className="hover:text-ink">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-4 h-9 inline-flex items-center text-sm font-medium hover:bg-muted rounded-md">Login</Link>
            <Link to="/onboarding" className="px-4 h-9 inline-flex items-center text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 shadow-glow">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-medium mb-6 border border-primary/15">
            <Sparkles className="w-3.5 h-3.5" /> Trusted by 400+ enterprise teams
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-ink max-w-4xl mx-auto leading-[1.05]">
            The CRM <span className="text-gradient">Automation Platform</span> built for enterprise operations.
          </h1>
          <p className="mt-6 text-lg text-ink-soft max-w-2xl mx-auto">
            Manage clients, campaigns, billing and approvals on a single governed surface — with audit trails, RBAC and live monitoring out of the box.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link to="/portal" className="px-6 h-12 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-glow hover:opacity-90">
              Open User Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/admin" className="px-6 h-12 inline-flex items-center gap-2 bg-surface border border-border rounded-lg font-medium hover:bg-muted">
              Open Admin Console
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6 max-w-2xl mx-auto text-left">
            {[
              { k: "99.99%", v: "Platform uptime" },
              { k: "SOC 2", v: "Type II certified" },
              { k: "12 ms", v: "Median API latency" },
            ].map((s) => (
              <div key={s.k} className="card-soft p-4">
                <div className="text-2xl font-semibold tracking-tight">{s.k}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs uppercase tracking-widest text-primary font-semibold">Platform</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Six modules. One governed system of record.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card-elevated p-6 hover:shadow-glow transition-shadow group">
              <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-ink">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-success">
                <CheckCircle2 className="w-3.5 h-3.5" /> Audit-logged & approval-gated
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© 2025 Billion Tags CRM. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-ink">Privacy</a>
            <a href="#" className="hover:text-ink">Security</a>
            <a href="#" className="hover:text-ink">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}