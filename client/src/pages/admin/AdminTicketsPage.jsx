import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { AdminCell, AdminRow, AdminSection, AdminTable, StatusPill } from "./AdminUi";

export default function AdminTicketsPage() {
  const token = useAuthStore((s) => s.token);
  const { admin, loadAdminData, loading, error } = useAppStore();

  useEffect(() => {
    if (token) loadAdminData(token);
  }, [token, loadAdminData]);

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-error">{error}</p> : null}
      <AdminSection title="Tickets" subtitle="Operational ticket view (complaints / support).">
        <AdminTable headers={["Category", "Status", "Assignee", "Action"]}>
          {(admin.tickets || []).map((t) => (
            <AdminRow key={t._id}>
              <AdminCell className="font-label-md">{t.category}</AdminCell>
              <AdminCell><StatusPill value={t.status} /></AdminCell>
              <AdminCell>{t.assignedTo?.name || t.assignedTo || "-"}</AdminCell>
              <AdminCell><Link to={`/admin/complaints/${t._id}`} className="text-primary font-label-md hover:underline">Manage</Link></AdminCell>
            </AdminRow>
          ))}
        </AdminTable>
        {!admin.tickets?.length ? <p className="mt-3 text-sm text-on-surface-variant">No tickets.</p> : null}
        {loading ? <p className="mt-3 text-sm text-on-surface-variant">Loading...</p> : null}
      </AdminSection>
    </div>
  );
}

