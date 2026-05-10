import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { professionalApi } from "../../api/professionalApi";

export default function PsychiatristOnboardingPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const submitVerification = useAppStore((s) => s.submitVerification);
  const saveOnboardingProfile = useAuthStore((s) => s.saveOnboardingProfile);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [verification, setVerification] = useState(null);
  const [form, setForm] = useState({
    degree: "",
    institution: "",
    batch: "",
    cvUrl: "",
    companyRegistration: "",
  });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const status = useMemo(() => verification?.status || "NOT_SUBMITTED", [verification?.status]);

  useEffect(() => {
    let cancelled = false;
    const loadStatus = async () => {
      if (!token) return;
      setStatusLoading(true);
      setStatusError("");
      try {
        const data = await professionalApi.getMyVerificationStatus(token);
        if (cancelled) return;
        setVerification(data);
        if (data?.status === "APPROVED") {
          navigate("/psychiatrist/dashboard", { replace: true });
          return;
        }
        if (data?.status === "PENDING") {
          navigate("/professional/request-in-review", { replace: true });
          return;
        }
        if (data?.status === "REJECTED") {
          setForm({
            degree: data?.degree || "",
            institution: data?.institution || "",
            batch: data?.batch || "",
            cvUrl: data?.cvUrl || "",
            companyRegistration: data?.companyRegistration || "",
          });
        }
      } catch (error) {
        if (cancelled) return;
        setStatusError(error?.message || "Failed to load verification status.");
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  const onFinish = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSubmitError("");
    try {
      // Keep a basic profile in sync for professional discoverability.
      await saveOnboardingProfile({
        bio: "Licensed mental health professional.",
        specializations: ["General Therapy"],
        consultationFee: 100,
        onboardingCompletedAt: new Date().toISOString(),
      });

      await submitVerification(form, token);
      navigate("/professional/request-in-review");
    } catch (e) {
      setSubmitError(e?.message || "Failed to submit verification.");
    } finally {
      setSaving(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-xl rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center shadow-lg">
          <p className="text-sm text-on-surface-variant">Loading verification details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md text-body-md min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 flex justify-between items-center w-full px-6 py-3 bg-surface-container-lowest/80 backdrop-blur-md shadow-sm border-b border-outline-variant/60">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" data-weight="fill">health_and_safety</span>
          <span className="font-h3 text-h3 text-primary-container">MindWell Pro Verification</span>
        </div>
        <Link className="font-label-md text-label-md text-on-surface-variant" to="/auth/login">
          Save & Exit
        </Link>
      </header>

      <main className="flex-grow flex justify-center py-xl px-gutter">
        <div className="w-full max-w-4xl flex flex-col md:flex-row gap-xl">
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-md sticky top-24">
              <h3 className="font-h3 text-h3 text-on-surface mb-lg">Onboarding</h3>
              <ul className="flex flex-col gap-sm relative">
                <div className="absolute left-[15px] top-[24px] bottom-[24px] w-0.5 bg-outline-variant z-0" />
                <li className="flex items-start gap-sm relative z-10">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                    <span className="material-symbols-outlined text-label-sm">badge</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-primary">Step 1</span>
                    <span className="font-body-md text-body-md text-on-surface font-semibold">Professional Identity</span>
                  </div>
                </li>
                <li className="flex items-start gap-sm relative z-10 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center flex-shrink-0 mt-1 border-2 border-surface-container-lowest">
                    <span className="material-symbols-outlined text-label-sm">psychology</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface-variant">Step 2</span>
                    <span className="font-body-md text-body-md text-on-surface">Verification Review</span>
                  </div>
                </li>
              </ul>
            </div>
          </aside>

          <div className="flex-grow flex flex-col gap-lg">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-xl">
              <div className="flex items-center justify-between mb-lg border-b border-outline-variant/30 pb-sm">
                <h1 className="font-h2 text-h2 text-on-surface">Professional Identity</h1>
                <span className="material-symbols-outlined text-outline">info</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-xl">
                Submit your credentials for employer verification. Dashboard access is enabled only after approval.
              </p>

              {statusError ? <p className="mb-4 rounded bg-error-container px-3 py-2 text-sm text-on-error-container">{statusError}</p> : null}
              {status === "REJECTED" ? (
                <div className="mb-4 rounded-xl border border-tertiary-container/40 bg-tertiary-fixed p-4">
                  <p className="text-sm font-semibold text-on-tertiary-fixed">Previous request was rejected</p>
                  <p className="mt-1 text-sm text-on-tertiary-fixed-variant">
                    Employer comment: {verification?.reviewNotes || "No reason was provided. Please update details and resubmit."}
                  </p>
                </div>
              ) : null}

              <form className="flex flex-col gap-lg" onSubmit={onFinish}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface">Degree</label>
                    <input className="w-full bg-surface rounded-lg border border-outline-variant px-sm py-[10px] font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.degree} onChange={(e) => setForm((prev) => ({ ...prev, degree: e.target.value }))} placeholder="Clinical Psychology" required />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface">Institution</label>
                    <input className="w-full bg-surface rounded-lg border border-outline-variant px-sm py-[10px] font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.institution} onChange={(e) => setForm((prev) => ({ ...prev, institution: e.target.value }))} placeholder="Institute / University" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface">Batch / Graduation Year</label>
                    <input className="w-full bg-surface rounded-lg border border-outline-variant px-sm py-[10px] font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.batch} onChange={(e) => setForm((prev) => ({ ...prev, batch: e.target.value }))} placeholder="2020" required />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface">Company Registration</label>
                    <input className="w-full bg-surface rounded-lg border border-outline-variant px-sm py-[10px] font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.companyRegistration} onChange={(e) => setForm((prev) => ({ ...prev, companyRegistration: e.target.value }))} placeholder="Registration details" />
                  </div>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface">CV URL</label>
                  <input className="w-full bg-surface rounded-lg border border-outline-variant px-sm py-[10px] font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" type="url" value={form.cvUrl} onChange={(e) => setForm((prev) => ({ ...prev, cvUrl: e.target.value }))} placeholder="https://example.com/your-cv.pdf" />
                </div>

                {submitError ? <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">{submitError}</p> : null}
                <div className="mt-lg pt-lg border-t border-outline-variant/30 flex justify-end gap-sm">
                  <Link className="px-md py-[10px] rounded-lg bg-surface-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-dim transition-colors" to="/auth/login">
                    Cancel
                  </Link>
                  <button className="px-xl py-[10px] rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-xs shadow-sm disabled:opacity-50" type="submit" disabled={saving}>
                    {saving ? "Submitting..." : status === "REJECTED" ? "Resubmit for Review" : "Submit for Review"}
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

