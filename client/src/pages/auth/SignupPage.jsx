import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, CheckCircle2, HeartHandshake, Leaf } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { roleOnboardingPath } from "../../lib/onboarding";

export default function SignupPage() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CLIENT" });

  const onSubmit = async (event) => {
    event.preventDefault();
    const data = await signup(form);
    navigate(roleOnboardingPath(data?.user?.role));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-background p-4 lg:p-8">
      <div className="pointer-events-none absolute -left-20 -top-20 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-secondary/5 blur-[120px]" />

      <main className="relative z-10 flex w-full max-w-[640px] flex-col rounded-xl bg-surface-container-lowest shadow-lg">
        <header className="flex flex-col items-center px-6 pb-0 pt-8 text-center lg:px-8">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Leaf size={32} strokeWidth={2.5} />
            <span className="text-2xl font-semibold tracking-tight">MindTrack</span>
          </div>
          <h1 className="mb-1 text-3xl font-semibold text-on-background">Create your account</h1>
          <p className="max-w-[420px] text-base text-on-surface-variant">
            Begin your journey to better mental well-being in a safe, professional environment.
          </p>
        </header>

        <form className="flex flex-col gap-6 px-6 py-8 lg:px-8" onSubmit={onSubmit}>
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
                1
              </span>
              <h2 className="text-xl font-semibold text-on-background">Select your role</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setForm((s) => ({ ...s, role: "CLIENT" }))}
                className={`flex flex-col rounded-xl border p-4 text-left transition-colors ${
                  form.role === "CLIENT"
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant bg-surface-container-lowest"
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <HeartHandshake size={20} className="text-primary" />
                  {form.role === "CLIENT" ? <CheckCircle2 size={20} className="text-primary" /> : null}
                </div>
                <span className="mb-1 text-sm font-semibold text-on-background">Client</span>
                <span className="text-sm text-on-surface-variant">I am seeking emotional support and care.</span>
              </button>
              <button
                type="button"
                onClick={() => setForm((s) => ({ ...s, role: "PROFESSIONAL" }))}
                className={`flex flex-col rounded-xl border p-4 text-left transition-colors ${
                  form.role === "PROFESSIONAL"
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant bg-surface-container-lowest"
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <Brain size={20} className="text-outline" />
                  {form.role === "PROFESSIONAL" ? <CheckCircle2 size={20} className="text-primary" /> : null}
                </div>
                <span className="mb-1 text-sm font-semibold text-on-background">Professional</span>
                <span className="text-sm text-on-surface-variant">I am a licensed healthcare provider.</span>
              </button>
            </div>
          </section>

          <hr className="border-t border-outline-variant/50" />
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-sm font-semibold text-on-surface-variant">
                2
              </span>
              <h2 className="text-xl font-semibold text-on-background">Account details</h2>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface">Full Name</label>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface">Email Address</label>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface">Password</label>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  required
                />
                <p className="text-xs text-outline">Must be at least 8 characters.</p>
              </div>
            </div>
          </section>

          <hr className="border-t border-outline-variant/50" />
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-sm font-semibold text-on-surface-variant">
                3
              </span>
              <h2 className="text-xl font-semibold text-on-background">Terms & Consent</h2>
            </div>
            <label className="flex items-start gap-3 text-sm text-on-surface-variant">
              <input className="mt-1 h-5 w-5 rounded border-outline-variant accent-primary" type="checkbox" required />
              <span>I agree to MindTrack Terms of Service and Privacy Policy.</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-on-surface-variant">
              <input className="mt-1 h-5 w-5 rounded border-outline-variant accent-primary" type="checkbox" required />
              <span>I consent to collection and processing of my health-related data for platform services.</span>
            </label>
          </section>

          <div className="pt-1">
            {error ? <p className="mb-3 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}
            <button
              className="w-full rounded-xl bg-primary py-4 text-sm font-semibold text-on-primary transition-all hover:bg-primary-container active:scale-[0.98]"
              disabled={loading}
              type="submit"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
            <p className="mt-4 text-center text-sm text-on-surface-variant">
              Already have an account?{" "}
              <Link className="font-medium text-primary hover:underline" to="/auth/login">
                Log in
              </Link>
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
