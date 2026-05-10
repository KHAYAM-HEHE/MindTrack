import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { adminApi } from "../../api/adminApi";
import { AdminPrimaryButton, AdminSection, AdminTextInput } from "./AdminUi";

export default function AdminVerificationDetailPage() {
  const { id } = useParams();
  const token = useAuthStore((s) => s.token);
  const { approveVerification, rejectVerification, loadAdminData, loading, error } = useAppStore();
  const [row, setRow] = useState(null);
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    adminApi.getVerification(id, token).then(setRow).catch((e) => setLocalError(e.message || "Load failed"));
  }, [token, id]);

  const onApprove = async () => {
    try { await approveVerification(id, token); await loadAdminData(token); setRow(await adminApi.getVerification(id, token)); }
    catch (e) { setLocalError(e.message || "Approve failed"); }
  };

  const onReject = async () => {
    try { await rejectVerification(id, notes || "Rejected", token); await loadAdminData(token); setRow(await adminApi.getVerification(id, token)); }
    catch (e) { setLocalError(e.message || "Reject failed"); }
  };

  if (!row && !localError) return <p className="text-sm text-on-surface-variant">Loading...</p>;

  return (
    <div className="space-y-6">
      <Link to="/admin/verifications" className="text-primary font-label-md hover:underline">? Back to verifications</Link>
      {(error || localError) ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-error">{error || localError}</p> : null}
      {row ? (
        <AdminSection title="Verification detail" subtitle={`${row.professionalUserId?.name || "Professional"} (${row.professionalUserId?.email || "-"})`}>
          <div className="space-y-2 text-sm text-on-surface">
            <p>Status: {row.status}</p>
            <p>Degree: {row.degree || "-"}</p>
            <p>Institution: {row.institution || "-"}</p>
            <p>Batch: {row.batch || "-"}</p>
            <p>CV URL: {row.cvUrl ? <a className="text-primary underline" href={row.cvUrl} target="_blank" rel="noreferrer">Open</a> : "-"}</p>
            {row.status === "PENDING" ? (
              <div className="pt-2 space-y-2">
                <AdminTextInput placeholder="Reject notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <div className="flex gap-2">
                  <AdminPrimaryButton type="button" disabled={loading} onClick={onApprove}>Approve</AdminPrimaryButton>
                  <AdminPrimaryButton type="button" disabled={loading} className="bg-error hover:bg-error/90" onClick={onReject}>Reject</AdminPrimaryButton>
                </div>
              </div>
            ) : null}
          </div>
        </AdminSection>
      ) : null}
    </div>
  );
}

