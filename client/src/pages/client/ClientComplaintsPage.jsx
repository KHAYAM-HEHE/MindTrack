import { useEffect, useState } from "react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

export default function ClientComplaintsPage() {
  const token = useAuthStore((s) => s.token);
  const { client, loadClientData, createComplaint, loading, error } = useAppStore();
  const [reportedUserId, setReportedUserId] = useState("");
  const [category, setCategory] = useState("ABUSE");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (token) loadClientData(token);
  }, [token, loadClientData]);

  return (
    <ClientShell title="Submit a Fraud Report">
      <div className="mb-6 rounded-xl border border-outline-variant/30 bg-surface-container-low p-5">
        <h3 className="mb-1 text-lg font-semibold text-on-surface">Privacy Assurance</h3>
        <p className="text-sm text-on-surface-variant">
          Your report is confidential and reviewed only by moderation staff.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
        <h4 className="mb-4 text-xl font-semibold text-on-surface">Issue Details</h4>
        <div className="grid gap-3">
          <input
            className="rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface"
            value={reportedUserId}
            onChange={(e) => setReportedUserId(e.target.value)}
            placeholder="Reported user id"
          />
          <select
            className="rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="ABUSE">Abuse</option>
            <option value="BILLING">Billing Discrepancy</option>
            <option value="MISCONDUCT">Professional Misconduct</option>
            <option value="OTHER">Other</option>
          </select>
          <textarea
            className="rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue..."
            rows={5}
          />
          <div className="flex justify-end">
            <button
              className="rounded-xl bg-error px-4 py-2 text-on-error"
              onClick={() => createComplaint({ reportedUserId, category, description }, token)}
            >
              Submit Report
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        {client.complaints.map((c) => (
          <div key={c._id} className="rounded border border-outline-variant/30 bg-surface-container-low p-2 text-sm text-on-surface">
            {c.category || "Complaint"} - {c.status || "PENDING"}
          </div>
        ))}
      </div>
      {loading ? <p className="mt-2 text-sm text-primary">Syncing...</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}
