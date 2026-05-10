import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { AdminCell, AdminRow, AdminSection, AdminTable, StatusPill } from "./AdminUi";

export default function AdminComplaintsPage() {
  const token = useAuthStore((s) => s.token);
  const { admin, loadAdminData, loading, error } = useAppStore();

  useEffect(() => {
    if (token) loadAdminData(token);
  }, [token, loadAdminData]);

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-error">{error}</p> : null}
      <AdminSection title="Complaints" subtitle="Moderate and resolve complaint records.">
        <AdminTable headers={["Category", "Status", "Updated", "Action"]}>
          {(admin.complaints || []).map((c) => (
            <AdminRow key={c._id}>
              <AdminCell className="font-label-md">{c.category}</AdminCell>
              <AdminCell><StatusPill value={c.status} /></AdminCell>
              <AdminCell className="text-on-surface-variant text-sm">{c.updatedAt ? new Date(c.updatedAt).toLocaleString() : "-"}</AdminCell>
              <AdminCell><Link to={`/admin/complaints/${c._id}`} className="text-primary font-label-md hover:underline">Details</Link></AdminCell>
            </AdminRow>
          ))}
        </AdminTable>
        {!admin.complaints?.length ? <p className="mt-3 text-sm text-on-surface-variant">No complaints.</p> : null}
        {loading ? <p className="mt-3 text-sm text-on-surface-variant">Loading...</p> : null}
      </AdminSection>
    </div>
  );
}

