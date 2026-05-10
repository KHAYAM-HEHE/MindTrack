import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { adminApi } from "../../api/adminApi";
import { AdminPrimaryButton, AdminSection, AdminSelect, AdminTextInput, StatusPill } from "./AdminUi";

const STATUSES = ["OPEN", "IN_REVIEW", "IN_PROGRESS", "ESCALATED", "RESOLVED"];

export default function AdminComplaintDetailPage() {
  const { id } = useParams();
  const token = useAuthStore((s) => s.token);
  const { resolveComplaint, updateTicketStatus, assignTicket, loadAdminData, loading, error } = useAppStore();
  const [complaint, setComplaint] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [resolution, setResolution] = useState("");
  const [assignee, setAssignee] = useState("");
  const [localError, setLocalError] = useState("");

  const refresh = useCallback(async () => {
    const [c, ev] = await Promise.all([adminApi.getComplaintById(id, token), adminApi.complaintEvidence(id, token)]);
    setComplaint(c); setEvidence(ev);
  }, [id, token]);

  useEffect(() => {
    if (!token || !id) return;
    const timer = setTimeout(() => {
      refresh().catch((e) => setLocalError(e.message || "Failed"));
    }, 0);
    return () => clearTimeout(timer);
  }, [token, id, refresh]);

  const onResolve = async () => { try { await resolveComplaint(id, resolution || "Resolved", token); await loadAdminData(token); await refresh(); } catch (e) { setLocalError(e.message || "Failed"); } };
  const onStatus = async (status) => { try { await updateTicketStatus(id, status, token); await loadAdminData(token); await refresh(); } catch (e) { setLocalError(e.message || "Failed"); } };
  const onAssign = async () => { if (!assignee.trim()) return; try { await assignTicket(id, assignee.trim(), token); await loadAdminData(token); await refresh(); } catch (e) { setLocalError(e.message || "Assign failed"); } };

  if (!complaint && !localError) return <p className="text-sm text-on-surface-variant">Loading...</p>;

  return (
    <div className="space-y-6">
      <Link to="/admin/complaints" className="text-primary font-label-md hover:underline">? Complaints</Link>
      {(error || localError) ? <p className="rounded-md bg-error-container px-3 py-2 text-sm text-error">{error || localError}</p> : null}
      {complaint ? (
        <>
          <AdminSection title={complaint.category || "Complaint"} subtitle={complaint.description || "No description"}>
            <div className="space-y-3 text-sm text-on-surface">
              <p>Status: <StatusPill value={complaint.status} /></p>
              <p>Evidence URL: {complaint.evidenceUrl ? <a className="text-primary underline" href={complaint.evidenceUrl} target="_blank" rel="noreferrer">Open</a> : "-"}</p>
              <div className="flex items-center gap-2">
                <span>Set status:</span>
                <AdminSelect value={complaint.status} disabled={loading} onChange={(e) => onStatus(e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </AdminSelect>
              </div>
              <div className="flex gap-2">
                <AdminTextInput className="w-64" placeholder="Assign to user ID" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
                <AdminPrimaryButton type="button" disabled={loading} onClick={onAssign}>Assign</AdminPrimaryButton>
              </div>
              <div className="flex gap-2">
                <AdminTextInput className="w-96" placeholder="Resolution notes" value={resolution} onChange={(e) => setResolution(e.target.value)} />
                <AdminPrimaryButton type="button" disabled={loading} onClick={onResolve}>Mark resolved</AdminPrimaryButton>
              </div>
            </div>
          </AdminSection>
          <AdminSection title="Audit trail" subtitle="Complaint action history.">
            <ul className="space-y-2 text-sm">
              {(evidence?.history || []).map((h) => (
                <li key={h._id} className="rounded-lg border border-outline-variant/40 p-3">
                  <p className="text-xs text-on-surface-variant">{new Date(h.createdAt).toLocaleString()}</p>
                  <p className="font-label-md">{h.action}</p>
                  <p className="text-xs">By: {h.actorUserId?.name || h.actorUserId?.email || "-"}</p>
                </li>
              ))}
            </ul>
          </AdminSection>
        </>
      ) : null}
    </div>
  );
}

