import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { professionalApi } from "../../api/professionalApi";
import { useAuthStore } from "../../store/authStore";

export default function RequestInReviewPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadStatus = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const data = await professionalApi.getMyVerificationStatus(token);
        if (cancelled) return;
        setStatus(data?.status || "NOT_SUBMITTED");
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Failed to load verification status.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!loading && status === "APPROVED") {
    return <Navigate to="/psychiatrist/dashboard" replace />;
  }

  if (!loading && (status === "REJECTED" || status === "NOT_SUBMITTED")) {
    return <Navigate to="/onboarding/psychiatrist" replace />;
  }

  return (
    <div className="bg-background min-h-screen text-on-background">
      <header className="sticky top-0 z-40 flex justify-between items-center w-full px-6 py-3 bg-surface-container-lowest/80 backdrop-blur-md shadow-sm border-b border-outline-variant/60">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" data-weight="fill">health_and_safety</span>
          <span className="font-h3 text-h3 text-primary-container">MindTrack Pro Verification</span>
        </div>
        <button
          type="button"
          className="font-label-md text-label-md text-on-surface-variant hover:text-primary"
          onClick={() => {
            clearSession();
            navigate("/auth/login");
          }}
        >
          Logout
        </button>
      </header>

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-xl border border-surface-container-high bg-surface-container-lowest p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-primary" data-weight="fill">hourglass_top</span>
          </div>
          <h1 className="text-h2 font-h2 text-on-surface">Application In Review</h1>
          {loading ? <p className="mt-3 text-sm text-on-surface-variant">Checking verification status...</p> : null}
          {error ? <p className="mt-3 rounded bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}
          <p className="mt-3 text-body-md text-on-surface-variant">
            Your professional verification request has been submitted successfully and is now under employer review.
          </p>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Once approved, you will get full dashboard access. If rejected, you will see employer comments and can resubmit.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-container" to="/">
              Back to Home
            </Link>
            <Link className="rounded-lg border border-outline-variant px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low" to="/auth/login">
              Re-login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

