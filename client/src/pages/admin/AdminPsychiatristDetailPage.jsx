import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { adminApi } from "../../api/adminApi";
import { AdminSection } from "./AdminUi";

export default function AdminPsychiatristDetailPage() {
  const { id } = useParams();
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    adminApi.getPsychiatrist(id, token).then(setData).catch((e) => setError(e.message || "Failed"));
  }, [token, id]);

  if (error) return <p className="text-sm text-error">{error}</p>;
  if (!data) return <p className="text-sm text-on-surface-variant">Loading...</p>;

  const { user, profile, latestVerification, appointmentsByStatus, reviewAverage, reviewCount } = data;

  return (
    <div className="space-y-6">
      <Link to="/admin/psychiatrists" className="text-primary font-label-md hover:underline">? Psychiatrists</Link>
      <AdminSection title={user.name || "Psychiatrist"} subtitle={user.email}>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-on-surface">
          <div className="rounded-lg border border-outline-variant/40 p-3 bg-surface-container-low">
            <h3 className="font-label-md mb-2">Professional profile</h3>
            <p>Status: {user.status}</p>
            <p>Phone: {user.phone || "-"}</p>
            <p>Specialization: {profile?.specialization || "-"}</p>
            <p>Display name: {profile?.displayName || "-"}</p>
            <p>Fee: {profile?.consultationFee ?? "-"}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/40 p-3 bg-surface-container-low">
            <h3 className="font-label-md mb-2">Stats</h3>
            <p>Review average: {reviewAverage != null ? reviewAverage.toFixed(2) : "-"}</p>
            <p>Review count: {reviewCount}</p>
            <pre className="text-xs mt-2">{JSON.stringify(appointmentsByStatus, null, 2)}</pre>
          </div>
        </div>
        {latestVerification ? (
          <p className="mt-3 text-sm">Latest verification: <Link to={`/admin/verifications/${latestVerification._id}`} className="text-primary hover:underline">{latestVerification.status}</Link></p>
        ) : null}
      </AdminSection>
    </div>
  );
}

