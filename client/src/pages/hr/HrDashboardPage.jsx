import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import HrShell from "./HrShell";

const statusClass = {
  PENDING: "bg-tertiary-fixed text-on-tertiary-fixed",
  APPROVED: "bg-primary-fixed text-on-primary-fixed",
  REJECTED: "bg-error-container text-on-error-container",
  ACTIVE: "bg-primary-fixed text-on-primary-fixed",
  SUSPENDED: "bg-error-container text-on-error-container",
  BANNED: "bg-inverse-surface text-inverse-on-surface",
};

export default function HrDashboardPage() {
  const token = useAuthStore((s) => s.token);
  const { admin, loadAdminData, loading, error } = useAppStore();

  useEffect(() => {
    if (!token) return;
    loadAdminData(token);
  }, [token, loadAdminData]);

  const stats = admin.stats;

  const pendingVerifications = admin.verifications.filter((v) => v.status === "PENDING");
  const activeEmployees = admin.users.filter((u) => u.role === "EMPLOYEE");
  const openTickets = admin.tickets.filter((t) => t.status !== "RESOLVED");
  const kpiEmployees = stats?.usersByRole ? stats.usersByRole.EMPLOYEE || 0 : activeEmployees.length;
  const kpiPending = stats?.pendingVerifications ?? pendingVerifications.length;
  const kpiOpenTickets = stats?.openComplaints != null ? stats.openComplaints : openTickets.length;

  return (
    <HrShell
      title="HR Dashboard"
      subtitle="Operations overview for employees, verification queue, and ticket workload."
      actions={
        <Link
          to="/hr/employees/new"
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary hover:bg-primary-container"
        >
          Create Employee
        </Link>
      }
    >
      {error ? <p className="mb-4 rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Employees</p>
          <p className="mt-1 text-2xl font-bold text-on-surface">{kpiEmployees}</p>
        </article>
        <article className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Pending Verifications</p>
          <p className="mt-1 text-2xl font-bold text-on-surface">{kpiPending}</p>
        </article>
        <article className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Open complaints / tickets</p>
          <p className="mt-1 text-2xl font-bold text-on-surface">{kpiOpenTickets}</p>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-outline-variant/30">
          <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3">
            <h3 className="font-semibold text-on-surface">Verification Queue</h3>
            <Link to="/hr/verifications" className="text-sm text-primary hover:underline">
              Open full queue
            </Link>
          </div>
          <div className="p-3">
            {pendingVerifications.slice(0, 5).map((item) => (
              <div key={item._id} className="mb-2 rounded-md border border-outline-variant/30 bg-surface-container-lowest p-3 last:mb-0">
                <p className="text-sm font-semibold text-on-surface">{item.degree || "Professional verification"}</p>
                <p className="text-xs text-on-surface-variant">
                  {item.institution || "Institution not provided"} {item.batch ? `• ${item.batch}` : ""}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs ${statusClass[item.status] || "bg-surface-container-high text-on-surface-variant"}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
            {!pendingVerifications.length && (
              <p className="rounded-md bg-primary-fixed px-3 py-2 text-sm text-on-primary-fixed">No pending verifications.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-outline-variant/30">
          <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3">
            <h3 className="font-semibold text-on-surface">Employee Snapshot</h3>
            <Link to="/hr/employees" className="text-sm text-primary hover:underline">
              Manage employees
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-4 py-2 text-on-surface-variant">Name</th>
                  <th className="px-4 py-2 text-on-surface-variant">Role</th>
                  <th className="px-4 py-2 text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeEmployees.slice(0, 6).map((user) => (
                  <tr key={user._id} className="border-t border-outline-variant/30">
                    <td className="px-4 py-2 font-medium text-on-surface-variant">{user.name || "Unnamed user"}</td>
                    <td className="px-4 py-2 text-on-surface-variant">{user.role}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusClass[user.status] || "bg-surface-container-high text-on-surface-variant"}`}
                      >
                        {user.status || "UNKNOWN"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!activeEmployees.length && <p className="p-4 text-sm text-on-surface-variant">No employees found.</p>}
          </div>
        </div>
      </section>

      {loading ? <p className="mt-4 text-sm text-on-surface-variant">Refreshing data...</p> : null}
    </HrShell>
  );
}
