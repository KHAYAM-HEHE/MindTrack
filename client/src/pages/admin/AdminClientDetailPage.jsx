import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { adminApi } from "../../api/adminApi";
import { AdminSection } from "./AdminUi";

export default function AdminClientDetailPage() {
  const { id } = useParams();
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    adminApi.getClient(id, token).then(setData).catch((e) => setError(e.message || "Failed"));
  }, [token, id]);

  if (error) return <p className="text-sm text-error">{error}</p>;
  if (!data) return <p className="text-sm text-on-surface-variant">Loading...</p>;

  const { user, profile, counts } = data;

  return (
    <div className="space-y-6">
      <Link to="/admin/clients" className="text-primary font-label-md hover:underline">? Clients</Link>
      <AdminSection title={user.name || "Client"} subtitle={user.email}>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-on-surface">
          <div className="rounded-lg border border-outline-variant/40 p-3 bg-surface-container-low">
            <h3 className="font-label-md mb-2">Profile</h3>
            <p>Status: {user.status}</p>
            <p>Nickname: {profile?.nickname || "-"}</p>
            <p>Age: {profile?.age ?? "-"}</p>
            <p>Country: {profile?.country || "-"}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/40 p-3 bg-surface-container-low">
            <h3 className="font-label-md mb-2">Activity counts</h3>
            <p>Tasks: {counts.tasks}</p>
            <p>Mood surveys: {counts.moodSurveys}</p>
            <p>Medication logs: {counts.medicationLogs}</p>
            <p>Complaints filed: {counts.complaints}</p>
            <p>Appointments: {counts.appointments}</p>
          </div>
        </div>
      </AdminSection>
    </div>
  );
}

