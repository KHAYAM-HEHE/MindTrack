import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { professionalApi } from "../../api/professionalApi";
import { PsychiatristShell } from "./PsychiatristShell";

export default function PsychiatristAbuseReportsPage() {
  const token = useAuthStore((s) => s.token);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({ reportedUserId: "", category: "", resolutionNotes: "" });
  const [status, setStatus] = useState("");

  const load = async () => {
    if (!token) return;
    const data = await professionalApi.listMyAbuseReports(token);
    setReports(data || []);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) return;
      const data = await professionalApi.listMyAbuseReports(token);
      if (!cancelled) setReports(data || []);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async () => {
    await professionalApi.createAbuseReport(
      {
        reportedUserId: form.reportedUserId,
        category: form.category,
        resolutionNotes: form.resolutionNotes,
      },
      token
    );
    setStatus("Report submitted.");
    setForm({ reportedUserId: "", category: "", resolutionNotes: "" });
    await load();
  };

  return (
    <PsychiatristShell title="Abuse & Safety Reports" subtitle="Professional abuse reporting">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30">
          <h3 className="font-h3 text-h3 text-on-surface mb-4">Create Report</h3>
          <div className="space-y-3">
            <input className="w-full rounded-lg border border-outline-variant px-3 py-2 bg-surface" placeholder="Reported User ID" value={form.reportedUserId} onChange={(e) => setForm((s) => ({ ...s, reportedUserId: e.target.value }))} />
            <input className="w-full rounded-lg border border-outline-variant px-3 py-2 bg-surface" placeholder="Category (e.g. ABUSE, FRAUD)" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
            <textarea className="w-full rounded-lg border border-outline-variant px-3 py-2 bg-surface" rows={4} placeholder="Evidence / Notes" value={form.resolutionNotes} onChange={(e) => setForm((s) => ({ ...s, resolutionNotes: e.target.value }))} />
            <button className="rounded-lg bg-primary text-on-primary px-4 py-2 text-sm" onClick={onSubmit}>Submit Report</button>
            {status ? <p className="text-xs text-green-700">{status}</p> : null}
          </div>
        </section>
        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30">
          <h3 className="font-h3 text-h3 text-on-surface mb-4">My Submitted Reports</h3>
          <div className="space-y-2">
            {reports.map((item) => (
              <div key={item._id} className="rounded-lg border border-outline-variant/30 p-3 bg-surface">
                <p className="text-sm font-semibold text-on-surface">{item.category || "Complaint"}</p>
                <p className="text-xs text-on-surface-variant">Status: {item.status || "OPEN"}</p>
              </div>
            ))}
            {!reports.length ? <p className="text-sm text-on-surface-variant">No reports submitted yet.</p> : null}
          </div>
        </section>
      </div>
    </PsychiatristShell>
  );
}
