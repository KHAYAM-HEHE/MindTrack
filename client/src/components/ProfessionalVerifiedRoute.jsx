import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { professionalApi } from "../api/professionalApi";

export function ProfessionalVerifiedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadVerification = async () => {
      if (!token || !user || user.role !== "PROFESSIONAL") {
        setLoading(false);
        return;
      }
      try {
        const data = await professionalApi.getMyVerificationStatus(token);
        if (!cancelled) setStatus(data?.status || "NOT_SUBMITTED");
      } catch {
        if (!cancelled) setStatus("NOT_SUBMITTED");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadVerification();
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  if (!token || !user) return <Navigate to="/auth/login" replace />;
  if (user.role !== "PROFESSIONAL") return <Navigate to="/access-denied" replace />;
  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Checking verification...</div>;
  }
  if (status === "APPROVED") return children;
  if (status === "PENDING") return <Navigate to="/professional/request-in-review" replace />;
  return <Navigate to="/onboarding/psychiatrist" replace />;
}
