import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HrShell from "./HrShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

const roleOptions = ["EMPLOYEE", "HR"];
const statusOptions = ["ACTIVE", "INACTIVE", "SUSPENDED"];

const statusClass = {
  ACTIVE: "bg-primary-fixed text-on-primary-fixed",
  SUSPENDED: "bg-error-container text-on-error-container",
  INACTIVE: "bg-surface-container-high text-on-surface-variant",
};

export default function HrEmployeeManagementPage() {
  const token = useAuthStore((s) => s.token);
  const { admin, loadAdminData, updateUserRole, updateUserStatus, loading, error } = useAppStore();
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) loadAdminData(token);
  }, [token, loadAdminData]);

  const employees = useMemo(() => {
    return admin.users
      .filter((user) => ["EMPLOYEE", "HR"].includes(user.role))
      .filter((user) => {
        const text = `${user.name || ""} ${user.email || ""}`.toLowerCase();
        return text.includes(query.toLowerCase());
      });
  }, [admin.users, query]);

  const onRoleChange = async (userId, role) => {
    setSavingId(userId);
    setMessage("");
    try {
      await updateUserRole(userId, role, token);
      setMessage("Role updated.");
    } finally {
      setSavingId("");
    }
  };

  const onStatusChange = async (userId, status) => {
    setSavingId(userId);
    setMessage("");
    try {
      await updateUserStatus(userId, status, token);
      setMessage("Status updated.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <HrShell
      title="Employee Management"
      subtitle="Manage internal staff accounts and access level."
      actions={
        <Link
          to="/hr/employees/new"
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary hover:bg-primary-container"
        >
          Add Employee
        </Link>
      }
    >
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              className="w-full rounded-lg border-none bg-transparent py-3 pl-10 pr-4 text-sm text-on-surface outline-none placeholder:text-outline"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {message ? <p className="mb-3 rounded-md bg-primary-fixed px-3 py-2 text-sm text-on-primary-fixed">{message}</p> : null}
      {error ? <p className="mb-3 rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {employees.map((user) => (
          <article
            key={user._id}
            className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 transition-shadow hover:shadow-lg"
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-primary-container" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-fixed text-sm font-bold text-on-secondary-fixed-variant">
                  {(user.name || "U").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">{user.name || "Unknown User"}</h3>
                  <p className="text-sm text-on-surface-variant">{user.email || "-"}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${statusClass[user.status] || "bg-surface-container-high text-on-surface-variant"}`}
              >
                {user.status || "UNKNOWN"}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Role</span>
                <select
                  className="rounded-lg border border-outline-variant bg-background px-2 py-1 text-sm text-on-surface"
                  value={user.role}
                  disabled={savingId === user._id || loading}
                  onChange={(e) => onRoleChange(user._id, e.target.value)}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Status</span>
                <select
                  className="rounded-lg border border-outline-variant bg-background px-2 py-1 text-sm text-on-surface"
                  value={user.status || "ACTIVE"}
                  disabled={savingId === user._id || loading}
                  onChange={(e) => onStatusChange(user._id, e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </article>
        ))}
        {!employees.length ? <p className="text-sm text-on-surface-variant">No matching employees found.</p> : null}
      </div>
    </HrShell>
  );
}
