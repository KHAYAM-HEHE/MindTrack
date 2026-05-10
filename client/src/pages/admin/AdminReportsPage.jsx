import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { reportApi } from "../../api/reportApi";
import { AdminCell, AdminPrimaryButton, AdminRow, AdminSection, AdminTable } from "./AdminUi";

export default function AdminReportsPage() {
  const token = useAuthStore((s) => s.token);
  const [platform, setPlatform] = useState(null);
  const [snapshots, setSnapshots] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSnapshots = useCallback(() => {
    if (!token) return;
    reportApi.listAdminSnapshots(token, { page: 1, limit: 20 }).then(setSnapshots).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    reportApi.getAdminPlatform(token).then(setPlatform).catch((e) => setError(e.message || "Failed to load platform report"));
    loadSnapshots();
  }, [token, loadSnapshots]);

  const saveSnapshot = async () => {
    if (!platform || !token) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const { window: win, generatedAt, ...rest } = platform;
      await reportApi.createAdminSnapshot({ periodType: "WEEKLY", periodStart: win?.from, periodEnd: win?.to, reportPayload: { ...rest, generatedAt } }, token);
      setMessage("Snapshot saved.");
      loadSnapshots();
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-error">{error}</p> : null}
      {message ? <p className="rounded-md bg-primary-fixed px-3 py-2 text-sm text-on-primary-fixed">{message}</p> : null}

      <AdminSection title="Platform Analytics" subtitle="Live admin analytics and insights." actions={<AdminPrimaryButton type="button" disabled={saving || !platform} onClick={saveSnapshot}>Save snapshot</AdminPrimaryButton>}>
        {platform ? (
          <div className="grid md:grid-cols-2 gap-4 text-sm text-on-surface">
            <div className="rounded-lg border border-outline-variant/40 p-3 bg-surface-container-low">
              <h3 className="font-label-md mb-1">Users by role</h3>
              <pre className="text-xs overflow-x-auto">{JSON.stringify(platform.usersByRole, null, 2)}</pre>
            </div>
            <div className="rounded-lg border border-outline-variant/40 p-3 bg-surface-container-low">
              <h3 className="font-label-md mb-1">Complaints by status</h3>
              <pre className="text-xs overflow-x-auto">{JSON.stringify(platform.complaintsByStatus, null, 2)}</pre>
            </div>
            <div className="rounded-lg border border-outline-variant/40 p-3 bg-surface-container-low">
              <h3 className="font-label-md mb-1">Appointments by status</h3>
              <pre className="text-xs overflow-x-auto">{JSON.stringify(platform.appointmentsByStatus, null, 2)}</pre>
            </div>
            <div className="rounded-lg border border-outline-variant/40 p-3 bg-surface-container-low">
              <h3 className="font-label-md mb-1">This week</h3>
              <p>New users: {platform.newUsersThisWeek}</p>
              <p>Pending verifications: {platform.pendingVerifications}</p>
              <p>Tasks created: {platform.activityThisWeek?.tasksCreated}</p>
              <p>Mood entries: {platform.activityThisWeek?.moodSurveyEntries}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">Loading report...</p>
        )}
      </AdminSection>

      <AdminSection title="Saved Snapshots" subtitle="Persisted report snapshots.">
        <AdminTable headers={["Type", "Created", "Actor"]}>
          {snapshots.items.map((s) => (
            <AdminRow key={s._id}>
              <AdminCell>{s.periodType}</AdminCell>
              <AdminCell>{s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}</AdminCell>
              <AdminCell>{s.userId?.email || "-"}</AdminCell>
            </AdminRow>
          ))}
        </AdminTable>
        {!snapshots.items.length ? <p className="mt-3 text-sm text-on-surface-variant">No snapshots yet.</p> : null}
      </AdminSection>
    </div>
  );
}

