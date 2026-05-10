import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { adminApi } from "../../api/adminApi";
import { AdminCell, AdminRow, AdminSection, AdminTable } from "./AdminUi";

export default function AdminAuditLogsPage() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    adminApi.listAuditLogs(token, { page: 1, limit: 100 }).then(setData).catch((e) => setError(e.message || "Failed"));
  }, [token]);

  const rows = Array.isArray(data) ? data : data?.items || [];

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-error">{error}</p> : null}
      <AdminSection title="Audit Log" subtitle="Recent administrative actions.">
        <AdminTable headers={["When", "Action", "Target", "Actor", "Meta"]}>
          {rows.map((log) => (
            <AdminRow key={log._id}>
              <AdminCell className="text-xs text-on-surface-variant whitespace-nowrap">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</AdminCell>
              <AdminCell className="font-label-md">{log.action}</AdminCell>
              <AdminCell className="text-xs">{log.targetType} / {log.targetId}</AdminCell>
              <AdminCell className="text-xs">{log.actorUserId?.name || log.actorUserId?.email || "-"}</AdminCell>
              <AdminCell className="text-xs">{JSON.stringify(log.metadata || {})}</AdminCell>
            </AdminRow>
          ))}
        </AdminTable>
        {!rows.length ? <p className="mt-3 text-sm text-on-surface-variant">No audit entries.</p> : null}
      </AdminSection>
    </div>
  );
}

