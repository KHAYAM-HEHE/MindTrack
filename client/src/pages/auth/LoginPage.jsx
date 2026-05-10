import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Leaf } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { isOnboardingComplete, roleDashboardPath, roleOnboardingPath } from "../../lib/onboarding";
import { professionalApi } from "../../api/professionalApi";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const verifyLogin2FA = useAuthStore((s) => s.verifyLogin2FA);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [form, setForm] = useState({ email: "", password: "" });
  const [step, setStep] = useState("password");
  const [tempToken, setTempToken] = useState("");
  const [otp, setOtp] = useState("");

  const routeAfterLogin = async (user, token) => {
    if (user?.role === "PROFESSIONAL") {
      const verification = await professionalApi.getMyVerificationStatus(token);
      if (verification?.status === "APPROVED") {
        navigate("/psychiatrist/dashboard");
        return;
      }
      if (verification?.status === "PENDING") {
        navigate("/professional/request-in-review");
        return;
      }
      navigate("/onboarding/psychiatrist");
      return;
    }
    if (isOnboardingComplete(user)) navigate(roleDashboardPath(user?.role));
    else navigate(roleOnboardingPath(user?.role));
  };

  const onSubmitPassword = async (event) => {
    event.preventDefault();
    const data = await login(form);
    if (data?.requires2FA && data?.tempToken) {
      setTempToken(data.tempToken);
      setStep("2fa");
      return;
    }
    const user = data?.user;
    const token = data?.token;
    if (user && token) await routeAfterLogin(user, token);
  };

  const onSubmit2FA = async (event) => {
    event.preventDefault();
    const data = await verifyLogin2FA({ tempToken, code: otp.replace(/\s/g, "") });
    const user = data?.user;
    const token = data?.token;
    if (user && token) {
      setStep("password");
      setTempToken("");
      setOtp("");
      await routeAfterLogin(user, token);
    }
  };

  const onCancel2FA = () => {
    clearSession();
    setStep("password");
    setTempToken("");
    setOtp("");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-multiply"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBB4nksJXrZYmeVavc1RnqwXVhy9B_9Rrg3nVKzvCVa39QIHpev3lZJTjPsEvlh5pXNxgyXHFgPPHmQnMcR3wC2V1id1wEErErI6kAMBAuy5V4D1y7sDGX1QKxT6Bt4FN91Gu8s2NgpIAhwzckGYyiZaCkLKydKLcI5EnZG5q5zli2LROuTmH-3Pydk8X31hYzZc4ilsVzsid7qGTEBHwUVKVdHUTU-jEsxlakY-mZAlJZH09EuHn260YliaZU6_DJ9MkqjmQtbUgs')",
        }}
      />

      <main className="relative z-10 w-full max-w-lg">
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest/90 p-8 text-center shadow-lg backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-sm">
            <Leaf size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-bold text-primary">MindWell</h1>
          <p className="mx-auto mb-6 mt-2 max-w-sm text-base text-on-surface-variant">
            {step === "2fa" ? "Enter the code from your authenticator app." : "Welcome back. Sign in to continue your wellness journey."}
          </p>

          {step === "password" ? (
            <form className="space-y-3 text-left" onSubmit={onSubmitPassword}>
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">Email Address</label>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">Password</label>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  required
                />
              </div>
              <div className="flex items-center justify-between pt-1 text-sm">
                <Link className="text-on-surface-variant hover:text-primary" to="/auth/forgot-password">
                  Forgot password?
                </Link>
                <Link className="text-on-surface-variant hover:text-primary" to="/auth/signup">
                  Create account
                </Link>
              </div>
              {error ? <p className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}
              <button
                className="group mt-1 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-all hover:bg-primary-container"
                disabled={loading}
                type="submit"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading ? (
                  <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" size={18} />
                ) : null}
              </button>
            </form>
          ) : (
            <form className="space-y-3 text-left" onSubmit={onSubmit2FA}>
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">Authentication code</label>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              {error ? <p className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}
              <button
                className="group mt-1 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-all hover:bg-primary-container"
                disabled={loading}
                type="submit"
              >
                {loading ? "Verifying..." : "Continue"}
                {!loading ? (
                  <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" size={18} />
                ) : null}
              </button>
              <button type="button" className="w-full text-sm text-on-surface-variant underline" onClick={onCancel2FA}>
                Back to password
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-4 border-t border-outline-variant/40 pt-4 text-xs text-on-surface-variant">
            <a className="hover:text-primary" href="#">
              Learn More
            </a>
            <span className="h-3 w-px bg-outline-variant" />
            <Link className="hover:text-primary" to="/auth/signup">
              Login/Signup
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
