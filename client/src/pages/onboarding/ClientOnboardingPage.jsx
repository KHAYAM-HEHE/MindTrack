import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { markOnboardingComplete, roleDashboardPath } from "../../lib/onboarding";

export default function ClientOnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const saveOnboardingProfile = useAuthStore((s) => s.saveOnboardingProfile);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nickname: user?.name || "",
    quoteType: "SECULAR",
    goals: "",
    emergencyContact: "",
  });

  const totalSteps = 3;
  const progress = useMemo(() => Math.round((step / totalSteps) * 100), [step]);

  const finish = async (skip = false) => {
    setSaving(true);
    setError("");
    try {
      if (!skip) {
        await saveOnboardingProfile({
          nickname: form.nickname || user?.name || "Client",
          preferences: { quoteType: form.quoteType, theme: "light", colorScheme: "default" },
          medicalData: {
            emergencyContact: form.emergencyContact || undefined,
            goals: form.goals || undefined,
          },
          onboardingCompletedAt: new Date().toISOString(),
        });
      }
      markOnboardingComplete(user);
      navigate(roleDashboardPath("CLIENT"));
    } catch (e) {
      setError(e?.message || "Failed to save onboarding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <main className="relative z-10 w-full max-w-2xl rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-lg md:p-8">
        <h1 className="text-2xl font-bold text-on-background">Client Onboarding</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Step {step} of {totalSteps}
        </p>
        <div className="mt-3 h-2 w-full rounded-full bg-surface-container-high">
          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        {step === 1 && (
          <div className="mt-5">
            <label className="mb-1 block text-sm font-medium text-on-surface">Nickname</label>
            <input
              className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface"
              value={form.nickname}
              onChange={(e) => setForm((s) => ({ ...s, nickname: e.target.value }))}
            />
          </div>
        )}
        {step === 2 && (
          <div className="mt-5 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Quote Type</label>
              <select
                className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface"
                value={form.quoteType}
                onChange={(e) => setForm((s) => ({ ...s, quoteType: e.target.value }))}
              >
                <option value="SECULAR">Secular</option>
                <option value="RELIGIOUS">Religious</option>
                <option value="ISLAMIC">Islamic</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Goals</label>
              <textarea
                className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface"
                rows={3}
                value={form.goals}
                onChange={(e) => setForm((s) => ({ ...s, goals: e.target.value }))}
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="mt-5">
            <label className="mb-1 block text-sm font-medium text-on-surface">Emergency Contact (optional)</label>
            <input
              className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface"
              value={form.emergencyContact}
              onChange={(e) => setForm((s) => ({ ...s, emergencyContact: e.target.value }))}
            />
          </div>
        )}

        {error ? <p className="mt-4 rounded bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}

        <div className="mt-7 flex items-center justify-between">
          <button
            className="rounded border border-outline-variant px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low disabled:opacity-50"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || saving}
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              className="rounded border border-outline-variant px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low"
              onClick={() => finish(true)}
              disabled={saving}
            >
              Skip
            </button>
            {step < totalSteps ? (
              <button
                className="rounded bg-primary px-4 py-2 text-sm text-on-primary hover:bg-primary-container"
                onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
              >
                Next
              </button>
            ) : (
              <button
                className="rounded bg-primary px-4 py-2 text-sm text-on-primary hover:bg-primary-container disabled:opacity-50"
                onClick={() => finish(false)}
                disabled={saving}
              >
                {saving ? "Saving..." : "Complete"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
