import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HrShell from "./HrShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

export default function HrCreateEmployeePage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { createEmployee, loading, error } = useAppStore();
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "ChangeMe123!",
    role: "EMPLOYEE",
  });

  const canCreateHr = user?.role === "ADMIN";

  const onSubmit = async (event) => {
    event.preventDefault();
    setSuccess("");
    await createEmployee(form, token);
    setSuccess("Employee account created successfully.");
    setTimeout(() => navigate("/hr/employees"), 700);
  };

  return (
    <HrShell title="Create Employee" subtitle="Provision new employee or HR accounts in the platform.">
      <form onSubmit={onSubmit} className="grid max-w-2xl gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
        <label className="grid gap-1 text-sm font-medium text-on-surface">
          Full Name
          <input
            className="rounded-lg border border-outline-variant bg-background px-3 py-2.5 text-on-surface outline-none focus:border-primary"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-on-surface">
          Email
          <input
            type="email"
            className="rounded-lg border border-outline-variant bg-background px-3 py-2.5 text-on-surface outline-none focus:border-primary"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-on-surface">
          Temporary Password
          <input
            className="rounded-lg border border-outline-variant bg-background px-3 py-2.5 text-on-surface outline-none focus:border-primary"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-on-surface">
          Role
          <select
            className="rounded-lg border border-outline-variant bg-background px-3 py-2.5 text-on-surface outline-none focus:border-primary"
            value={form.role}
            onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
          >
            <option value="EMPLOYEE">EMPLOYEE</option>
            {canCreateHr ? <option value="HR">HR</option> : null}
          </select>
        </label>

        {error ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}
        {success ? <p className="rounded-md bg-primary-fixed px-3 py-2 text-sm text-on-primary-fixed">{success}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-container disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Employee"}
        </button>
      </form>
    </HrShell>
  );
}
