import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { adminApi } from "../../api/adminApi";
import { useAppStore } from "../../store/appStore";
import { AdminPrimaryButton, AdminSection, AdminSelect, AdminSecondaryButton, StatusPill } from "./AdminUi";

export default function AdminHrDetailPage() {
  const { id } = useParams();
  const token = useAuthStore((s) => s.token);
  const userRole = useAuthStore((s) => s.user?.role);
  const { updateUserRole, updateUserStatus, loadAdminData, loading, error } = useAppStore();
  const [user, setUser] = useState(null);
  const [localError, setLocalError] = useState("");
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    adminApi.getUser(id, token).then((u) => { setUser(u); setNewRole(u.role); }).catch((e) => setLocalError(e.message || "Failed"));
  }, [token, id]);

  const saveRole = async () => {
    if (userRole !== "ADMIN") return setLocalError("Only ADMIN can change roles.");
    try {
      await updateUserRole(id, newRole, token);
      await loadAdminData(token);
      setUser(await adminApi.getUser(id, token));
    } catch (e) {
      setLocalError(e.message || "Role update failed");
    }
  };

  const onStatus = async (status) => {
    try {
      await updateUserStatus(id, status, token);
      setUser(await adminApi.getUser(id, token));
    } catch (e) {
      setLocalError(e.message || "Status update failed");
    }
  };

  if (localError && !user) return <p className="text-sm text-error">{localError}</p>;
  if (!user) return <p className="text-sm text-on-surface-variant">Loading...</p>;

  return (
    <div className="space-y-6">
      <Link to="/admin/hr" className="text-primary font-label-md hover:underline">? HR users</Link>
      {(error || localError) ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-error">{error || localError}</p> : null}
      <AdminSection title={user.name || "HR User"} subtitle={user.email}>
        <div className="space-y-3 text-sm text-on-surface">
          <p>Current role: {user.role}</p>
          <p>Status: <StatusPill value={user.status} /></p>
          {userRole === "ADMIN" ? (
            <div className="flex items-center gap-2">
              <AdminSelect value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                {["CLIENT", "PROFESSIONAL", "EMPLOYEE", "HR", "ADMIN"].map((r) => <option key={r} value={r}>{r}</option>)}
              </AdminSelect>
              <AdminPrimaryButton type="button" disabled={loading} onClick={saveRole}>Save role</AdminPrimaryButton>
            </div>
          ) : null}
          <div className="flex gap-2">
            <AdminSecondaryButton type="button" disabled={loading} onClick={() => onStatus("ACTIVE")}>ACTIVE</AdminSecondaryButton>
            <AdminSecondaryButton type="button" disabled={loading} onClick={() => onStatus("SUSPENDED")}>SUSPENDED</AdminSecondaryButton>
            <AdminPrimaryButton type="button" disabled={loading} className="bg-error hover:bg-error/90" onClick={() => onStatus("BANNED")}>BANNED</AdminPrimaryButton>
          </div>
        </div>
      </AdminSection>
    </div>
  );
}

