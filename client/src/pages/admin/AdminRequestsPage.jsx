import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { adminApi } from "../../api/adminApi";
import { useAppStore } from "../../store/appStore";
import { AdminCell, AdminPagination, AdminPrimaryButton, AdminRow, AdminSection, AdminTable, StatusPill } from "./AdminUi";

export default function AdminRequestsPage() {
  const token = useAuthStore((s) => s.token);
  const { approveVerification, rejectVerification } = useAppStore();
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 30 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState("");

  const load = useCallback((page = 1) => {
    if (!token) return;
    setLoading(true);
    setError("");
    adminApi
      .listRequests(token, { page, limit: 30 })
      .then(setData)
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const onApproveVerification = async (id) => {
    if (!token) return;
    try {
      setActingId(id);
      await approveVerification(id, token);
      await load(data.page || 1);
    } catch (e) {
      setError(e.message || "Failed to approve verification");
    } finally {
      setActingId("");
    }
  };

  const onRejectVerification = async (id) => {
    if (!token) return;
    try {
      setActingId(id);
      await rejectVerification(id, "Rejected from requests queue", token);
      await load(data.page || 1);
    } catch (e) {
      setError(e.message || "Failed to reject verification");
    } finally {
      setActingId("");
    }
  };

  const onUpdateAppointment = async (id, status) => {
    if (!token) return;
    try {
      setActingId(id);
      await adminApi.updateAppointmentRequestStatus(id, status, token);
      await load(data.page || 1);
    } catch (e) {
      setError(e.message || `Failed to set ${status}`);
    } finally {
      setActingId("");
    }
  };

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-error">{error}</p> : null}
      <AdminSection title="Requests" subtitle={`Unified queue of professional verifications and appointment requests (${data.total} items).`}>
        <AdminTable headers={["Type", "Summary", "Status", "Created", "Action"]}>
          {data.items.map((row) => (
            <AdminRow key={`${row.kind}-${row._id}`}>
              <AdminCell className="font-label-md text-on-surface-variant">{row.kind}</AdminCell>
              <AdminCell>{row.summary || "-"}</AdminCell>
              <AdminCell><StatusPill value={row.status} /></AdminCell>
              <AdminCell className="text-on-surface-variant text-sm">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</AdminCell>
              <AdminCell>
                {row.kind === "VERIFICATION" ? (
                  <div className="flex flex-wrap gap-2">
                    <Link className="text-primary font-label-md hover:underline" to={`/admin/verifications/${row._id}`}>Open</Link>
                    {row.status === "PENDING" ? (
                      <>
                        <AdminPrimaryButton type="button" disabled={actingId === row._id} onClick={() => onApproveVerification(row._id)}>
                          Approve
                        </AdminPrimaryButton>
                        <AdminPrimaryButton
                          type="button"
                          className="bg-error hover:bg-error/90"
                          disabled={actingId === row._id}
                          onClick={() => onRejectVerification(row._id)}
                        >
                          Reject
                        </AdminPrimaryButton>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <AdminPrimaryButton
                      type="button"
                      disabled={actingId === row._id || row.status === "CONFIRMED"}
                      onClick={() => onUpdateAppointment(row._id, "CONFIRMED")}
                    >
                      Confirm
                    </AdminPrimaryButton>
                    <AdminPrimaryButton
                      type="button"
                      className="bg-error hover:bg-error/90"
                      disabled={actingId === row._id || row.status === "CANCELLED"}
                      onClick={() => onUpdateAppointment(row._id, "CANCELLED")}
                    >
                      Cancel
                    </AdminPrimaryButton>
                  </div>
                )}
              </AdminCell>
            </AdminRow>
          ))}
        </AdminTable>
        <div className="mt-4"><AdminPagination page={data.page} limit={data.limit} total={data.total} onPage={load} loading={loading} /></div>
      </AdminSection>
    </div>
  );
}

