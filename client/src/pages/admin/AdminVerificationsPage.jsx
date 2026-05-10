import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { AdminCell, AdminRow, AdminSection, AdminTable, StatusPill } from "./AdminUi";

export default function AdminVerificationsPage() {
  const token = useAuthStore((s) => s.token);
  const { admin, loadAdminData, loading, error } = useAppStore();

  useEffect(() => {
    if (token) loadAdminData(token);
  }, [token, loadAdminData]);

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-error">{error}</p> : null}
      <AdminSection title="Verification Queue" subtitle="Review and moderate professional verification submissions.">
        <AdminTable headers={["Professional", "Degree / Institution", "Status", "Action"]}>
          {(admin.verifications || []).map((v) => (
            <AdminRow key={v._id}>
              <AdminCell>{v.professionalUserId?.name || v.professionalUserId?.email || String(v.professionalUserId || "-")}</AdminCell>
              <AdminCell>{[v.degree, v.institution].filter(Boolean).join(" · ") || "-"}</AdminCell>
              <AdminCell><StatusPill value={v.status} /></AdminCell>
              <AdminCell><Link to={`/admin/verifications/${v._id}`} className="text-primary font-label-md hover:underline">Details</Link></AdminCell>
            </AdminRow>
          ))}
        </AdminTable>
        {loading ? <p className="mt-3 text-sm text-on-surface-variant">Loading...</p> : null}
      </AdminSection>
    </div>
  );
}

