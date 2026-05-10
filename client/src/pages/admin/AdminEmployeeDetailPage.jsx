import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { adminApi } from "../../api/adminApi";
import { useAppStore } from "../../store/appStore";
import { AdminPrimaryButton, AdminSection, AdminSecondaryButton, StatusPill } from "./AdminUi";

export default function AdminEmployeeDetailPage() {
  const { id } = useParams();
  const token = useAuthStore((s) => s.token);
  const { updateUserStatus, loadAdminData, loading, error } = useAppStore();
  const [user, setUser] = useState(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    adminApi.getUser(id, token).then(setUser).catch((e) => setLocalError(e.message || "Failed"));
  }, [token, id]);

  const onStatus = async (status) => {
    try {
      await updateUserStatus(id, status, token);
      await loadAdminData(token);
      setUser(await adminApi.getUser(id, token));
    } catch (e) {
      setLocalError(e.message || "Update failed");
    }
  };

  if (localError && !user) return <p className="text-sm text-error">{localError}</p>;
  if (!user) return <p className="text-sm text-on-surface-variant">Loading...</p>;

  return (
    <div className="space-y-6">
      <Link to="/admin/employees" className="text-primary font-label-md hover:underline">? Employees</Link>
      {(error || localError) ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-error">{error || localError}</p> : null}
      <AdminSection title={user.name || "Employee"} subtitle={user.email}>
        <div className="space-y-2 text-sm text-on-surface">
          <p>Status: <StatusPill value={user.status} /></p>
          <p>Role: {user.role}</p>
          <div className="flex gap-2 pt-2">
            <AdminSecondaryButton type="button" disabled={loading} onClick={() => onStatus("ACTIVE")}>Set ACTIVE</AdminSecondaryButton>
            <AdminSecondaryButton type="button" disabled={loading} onClick={() => onStatus("SUSPENDED")}>Suspend</AdminSecondaryButton>
            <AdminPrimaryButton type="button" disabled={loading} className="bg-error hover:bg-error/90" onClick={() => onStatus("BANNED")}>Ban</AdminPrimaryButton>
          </div>
        </div>
      </AdminSection>
    </div>
  );
}

