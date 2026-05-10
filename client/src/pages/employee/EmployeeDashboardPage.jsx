import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import EmployeeShell from "./EmployeeShell";

export default function EmployeeDashboardPage() {
  const token = useAuthStore((s) => s.token);
  const { employee, loadEmployeeVerifications, loading, error } = useAppStore();

  useEffect(() => {
    if (token) loadEmployeeVerifications(token);
  }, [token, loadEmployeeVerifications]);

  const pending = employee.verifications.filter((v) => v.status === "PENDING");
  const approved = employee.verifications.filter((v) => v.status === "APPROVED");
  const rejected = employee.verifications.filter((v) => v.status === "REJECTED");

  return (
    <EmployeeShell title="Employee Dashboard" subtitle="Verification operations and workload summary.">
      {error ? <p className="mb-4 rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Pending Verifications</p>
          <p className="mt-1 text-2xl font-bold text-on-surface">{pending.length}</p>
        </article>
        <article className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Approved</p>
          <p className="mt-1 text-2xl font-bold text-on-surface">{approved.length}</p>
        </article>
        <article className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-on-surface">{rejected.length}</p>
        </article>
      </section>

      <section className="mt-6 rounded-lg border border-outline-variant/30">
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3">
          <h3 className="font-semibold text-on-surface">Latest Queue Items</h3>
          <Link className="text-sm text-primary hover:underline" to="/employee/verifications">
            Open queue
          </Link>
        </div>
        <div className="p-3">
          {(employee.verifications || []).slice(0, 6).map((item) => (
            <div key={item._id} className="mb-2 rounded-md border border-outline-variant/30 bg-surface-container-lowest p-3 last:mb-0">
              <p className="text-sm font-semibold text-on-surface">{item.degree || "Credential submission"}</p>
              <p className="text-xs text-on-surface-variant">ID: {item._id}</p>
              <p className="mt-1 text-xs text-on-surface-variant">Status: {item.status}</p>
            </div>
          ))}
          {!employee.verifications.length ? <p className="text-sm text-on-surface-variant">No verification records found.</p> : null}
        </div>
      </section>
      {loading ? <p className="mt-4 text-sm text-on-surface-variant">Refreshing queue...</p> : null}
    </EmployeeShell>
  );
}
