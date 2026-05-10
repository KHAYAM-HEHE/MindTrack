import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import EmployeeShell from "./EmployeeShell";

export default function EmployeeReviewsPage() {
  const token = useAuthStore((s) => s.token);
  const { employee, loadEmployeeVerifications, loading, error } = useAppStore();

  useEffect(() => {
    if (token) loadEmployeeVerifications(token);
  }, [token, loadEmployeeVerifications]);

  const decided = employee.verifications.filter((item) => item.status !== "PENDING");

  return (
    <EmployeeShell title="My Reviews" subtitle="Track completed review decisions and outcomes.">
      {error ? <p className="mb-3 rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low">
              <th className="px-4 py-2 text-on-surface-variant">Verification ID</th>
              <th className="px-4 py-2 text-on-surface-variant">Degree</th>
              <th className="px-4 py-2 text-on-surface-variant">Institution</th>
              <th className="px-4 py-2 text-on-surface-variant">Decision</th>
            </tr>
          </thead>
          <tbody>
            {decided.map((item) => (
              <tr key={item._id} className="border-t border-outline-variant/30">
                <td className="px-4 py-2 font-medium text-on-surface-variant">{item._id}</td>
                <td className="px-4 py-2 text-on-surface-variant">{item.degree || "-"}</td>
                <td className="px-4 py-2 text-on-surface-variant">{item.institution || "-"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      item.status === "APPROVED"
                        ? "bg-primary-fixed text-on-primary-fixed"
                        : "bg-error-container text-on-error-container"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!decided.length ? <p className="mt-3 text-sm text-on-surface-variant">No reviewed items yet.</p> : null}
      {loading ? <p className="mt-3 text-sm text-on-surface-variant">Refreshing records...</p> : null}
    </EmployeeShell>
  );
}
