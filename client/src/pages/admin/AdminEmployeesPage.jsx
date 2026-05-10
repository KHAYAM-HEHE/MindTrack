import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { adminApi } from "../../api/adminApi";
import { AdminCell, AdminPagination, AdminRow, AdminSection, AdminTable, StatusPill } from "./AdminUi";

export default function AdminEmployeesPage() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 50 });
  const [error, setError] = useState("");

  const load = useCallback((page = 1) => {
    if (!token) return;
    adminApi.listEmployees(token, { page, limit: 50 }).then(setData).catch((e) => setError(e.message || "Failed"));
  }, [token]);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-error">{error}</p> : null}
      <AdminSection title="Employees" subtitle="Manage employee accounts and status.">
        <AdminTable headers={["Name", "Email", "Status", "Action"]}>
          {data.items.map((u) => (
            <AdminRow key={u._id}>
              <AdminCell className="font-label-md">{u.name}</AdminCell>
              <AdminCell>{u.email}</AdminCell>
              <AdminCell><StatusPill value={u.status} /></AdminCell>
              <AdminCell><Link to={`/admin/employees/${u._id}`} className="text-primary font-label-md hover:underline">Details</Link></AdminCell>
            </AdminRow>
          ))}
        </AdminTable>
        <div className="mt-4"><AdminPagination page={data.page} limit={data.limit} total={data.total} onPage={load} /></div>
      </AdminSection>
    </div>
  );
}

