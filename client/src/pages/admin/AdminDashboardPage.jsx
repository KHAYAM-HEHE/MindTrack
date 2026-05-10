import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

export default function AdminDashboardPage() {
  const token = useAuthStore((s) => s.token);
  const { admin, loadAdminData, loading, error } = useAppStore();

  useEffect(() => {
    if (!token) return;
    loadAdminData(token);
  }, [token, loadAdminData]);

  const stats = admin.stats;
  const totalUsers = stats?.usersByRole
    ? Object.values(stats.usersByRole).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="flex flex-col gap-8">
      {error ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total users" value={totalUsers} icon="group" />
        <KpiCard label="Active accounts" value={stats?.activeUsers ?? "â€”"} icon="person_check" />
        <KpiCard label="Pending verifications" value={stats?.pendingVerifications ?? "â€”"} icon="how_to_reg" />
        <KpiCard label="Open complaints" value={stats?.openComplaints ?? "â€”"} icon="warning" accent="error" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-h3 text-on-surface">Recent complaints</h2>
            <Link to="/admin/complaints" className="text-primary text-sm font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-on-surface-variant border-b border-outline-variant/30">
                  <th className="py-2 pr-2">Category</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {(admin.complaints || []).slice(0, 8).map((c) => (
                  <tr key={c._id} className="border-b border-outline-variant/20">
                    <td className="py-2 pr-2">
                      <Link to={`/admin/complaints/${c._id}`} className="text-primary hover:underline">
                        {c.category || "â€”"}
                      </Link>
                    </td>
                    <td className="py-2 pr-2">{c.status}</td>
                    <td className="py-2 text-on-surface-variant text-xs">
                      {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : "â€”"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!admin.complaints?.length ? <p className="text-sm text-on-surface-variant py-4">No complaints yet.</p> : null}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-h3 text-on-surface">Verification queue</h2>
            <Link to="/admin/verifications" className="text-primary text-sm font-medium hover:underline">
              Open queue
            </Link>
          </div>
          <ul className="space-y-2">
            {(admin.verifications || [])
              .filter((v) => v.status === "PENDING")
              .slice(0, 6)
              .map((v) => (
                <li key={v._id} className="rounded-lg border border-outline-variant/40 p-3">
                  <Link to={`/admin/verifications/${v._id}`} className="font-medium text-primary hover:underline">
                    {v.degree || "Verification"}
                  </Link>
                  <p className="text-xs text-on-surface-variant mt-1">{v.institution || "â€”"}</p>
                </li>
              ))}
          </ul>
          {!admin.verifications?.filter((v) => v.status === "PENDING").length ? (
            <p className="text-sm text-on-surface-variant py-4">No pending verifications.</p>
          ) : null}
        </section>
      </div>

      {loading ? <p className="text-sm text-on-surface-variant">Syncingâ€¦</p> : null}
    </div>
  );
}

function KpiCard({ label, value, icon, accent }) {
  return (
    <article
      className={`rounded-xl p-5 border ${
        accent === "error" ? "border-error/30 bg-error-container/10" : "border-outline-variant/50 bg-surface-container-lowest"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-on-surface-variant text-sm mb-1">{label}</p>
          <p className={`text-2xl font-bold ${accent === "error" ? "text-error" : "text-on-surface"}`}>{value}</p>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant">{icon}</span>
      </div>
    </article>
  );
}

