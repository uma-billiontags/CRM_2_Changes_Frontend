import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";


export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  
  const USERS = [
  {
    email: 'creative@gmail.com',
    password: '123',
    role: 'creative',
    redirect: '/creative_dashboard',
  },
  {
    email: 'campaign@gmail.com',
    password: '123',
    role: 'campaign',
    redirect: '/campaign_dashboard',
  },
  {
    email: 'client@gmail.com',
    password: '123',
    role: 'client',
    redirect: '/user_dashboard',
  },
];

const handleSignIn = async () => {
  setError('');

  if (!email.trim()) {
    setError('Please enter your email address.');
    return;
  }
  if (!password.trim()) {
    setError('Please enter your password.');
    return;
  }

  const matched = USERS.find(
    u => u.email === email.trim().toLowerCase() && u.password === password
  );

  if (matched) {
    if (remember) {
      localStorage.setItem('remembered_email', email.trim());
    } else {
      localStorage.removeItem('remembered_email');
    }
    // Store role for use across the app
    localStorage.setItem('user_role', matched.role);
    localStorage.setItem('user_email', matched.email);
    navigate(matched.redirect);
  } else {
    setError('Invalid email or password. Please try again.');
  }
};
 
  // Submit on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignIn();
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">

      {/* ── Visual / branding side ── */}
      <div className="hidden md:flex relative overflow-hidden bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold">
            CRM
          </div>
          <span className="font-semibold tracking-tight text-lg">
            Billion <span className="text-primary">Tags</span>
          </span>
        </Link>

        <div className="relative z-10">
          <div className="text-xs uppercase tracking-widest text-sidebar-foreground/60 mb-3">
            Enterprise CRM
          </div>
          <h2 className="text-4xl font-bold leading-tight">
            CRM Automation<br />Platform
          </h2>
          <p className="mt-4 text-sidebar-foreground/70 max-w-md">
            Governed workflows, live monitoring and full audit trail across every client,
            campaign and transaction.
          </p>
          <br />
          <div className="flex flex-col gap-3">
            {[
              "✓ Role-based access control",
              "✓ Approval workflows",
              "✓ Real-time dashboards",
            ].map((t) => (
              <span key={t} className="text-white/75 text-sm">{t}</span>
            ))}
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full gradient-primary opacity-30 blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-[320px] h-[320px] rounded-full bg-primary opacity-20 blur-3xl" />

        <div className="text-xs text-sidebar-foreground/50 relative z-10">
          SOC 2 · ISO 27001 · GDPR ready
        </div>
      </div>

      {/* ── Form side ── */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-smx text-muted-foreground mt-1.5">
            Sign in with your registered credentials
          </p>

          {/* ✅ Error banner — shown when credentials don't match DB */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="mt-7 space-y-4" onKeyDown={handleKeyDown}>

            {/* Email field */}
            <Field
              icon={<Mail className="w-4 h-4" />}
              type="email"
              label="Email"
              placeholder="you@company.com"
              value={email}
              onChange={setEmail}
            />

            {/* Password field */}
            <Field
              icon={<Lock className="w-4 h-4" />}
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-ink-soft cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-border"
                />
                Remember me
              </label>
              <a href="#" className="text-primary font-medium hover:underline">
                Forgot password?
              </a>
            </div>

            {/* ✅ Sign in button — disabled while loading */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md font-medium shadow-glow hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verifying credentials…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              New user?{" "}
              <Link to="/onboarding" className="text-primary font-medium hover:underline">
                Register your company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Field sub-component ───────────────────────────────────────────────────────

function Field({
  icon, label, value, onChange, ...props
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-ink-soft mb-1.5">{label}</div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <input
          {...props}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-9 pr-3 rounded-md border border-input bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
        />
      </div>
    </label>
  );
}