import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { professionalApi } from "../../api/professionalApi";
import { PsychiatristShell } from "./PsychiatristShell";

export default function PsychiatristExternalSchedulerPage() {
  const token = useAuthStore((s) => s.token);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ clientName: "", clientEmail: "", clientPhone: "", startTime: "", endTime: "", notes: "" });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const data = await professionalApi.listExternalAppointments(token);
        if (!cancelled) setItems(data || []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load external appointments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const load = async () => {
    if (!token) return;
    setItems((await professionalApi.listExternalAppointments(token)) || []);
  };

  const onCreate = async () => {
    if (!form.clientName || !form.startTime || !form.endTime) return;
    setError("");
    try {
      await professionalApi.createExternalAppointment(form, token);
      setForm({ clientName: "", clientEmail: "", clientPhone: "", startTime: "", endTime: "", notes: "" });
      await load();
    } catch (e) {
      setError(e?.message || "Failed to create external booking.");
    }
  };

  const onStatus = async (id, status) => {
    await professionalApi.updateExternalAppointmentStatus(id, status, token);
    await load();
  };

  return (
    <PsychiatristShell title="Unified Schedule" subtitle="31_External_Client_Scheduler.html">
      <div className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
        <h3 className="mb-4 font-h3 text-h3 text-on-surface">Add External Client</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="rounded-lg border border-outline-variant bg-surface px-3 py-2" placeholder="Client Name" value={form.clientName} onChange={(e) => setForm((s) => ({ ...s, clientName: e.target.value }))} />
          <input className="rounded-lg border border-outline-variant bg-surface px-3 py-2" placeholder="Client Email" value={form.clientEmail} onChange={(e) => setForm((s) => ({ ...s, clientEmail: e.target.value }))} />
          <input className="rounded-lg border border-outline-variant bg-surface px-3 py-2" placeholder="Client Phone" value={form.clientPhone} onChange={(e) => setForm((s) => ({ ...s, clientPhone: e.target.value }))} />
          <input className="rounded-lg border border-outline-variant bg-surface px-3 py-2" type="datetime-local" value={form.startTime} onChange={(e) => setForm((s) => ({ ...s, startTime: e.target.value }))} />
          <input className="rounded-lg border border-outline-variant bg-surface px-3 py-2 md:col-span-2" type="datetime-local" value={form.endTime} onChange={(e) => setForm((s) => ({ ...s, endTime: e.target.value }))} />
          <textarea className="rounded-lg border border-outline-variant bg-surface px-3 py-2 md:col-span-2" rows={3} placeholder="Intake Notes" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
        </div>
        <button className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary" onClick={onCreate}>Save External Client</button>
        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="xl:col-span-8 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
          <h3 className="mb-4 font-h3 text-h3 text-on-surface">Session Timeline</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item._id} className="rounded-xl border border-outline-variant/30 bg-surface p-4">
                <p className="font-label-md text-label-md text-on-surface">{item.clientName}</p>
                <p className="text-xs text-on-surface-variant">{new Date(item.startTime).toLocaleString()} - {new Date(item.endTime).toLocaleString()}</p>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-lg bg-primary px-3 py-1.5 text-xs text-on-primary" onClick={() => onStatus(item._id, "CONFIRMED")}>Confirm</button>
                  <button className="rounded-lg bg-error-container px-3 py-1.5 text-xs text-on-error-container" onClick={() => onStatus(item._id, "CANCELLED")}>Cancel</button>
                </div>
              </div>
            ))}
            {!items.length && !loading ? <div className="rounded-lg border border-outline-variant/30 bg-surface p-4 text-sm text-on-surface-variant">No external bookings yet.</div> : null}
            {loading ? <p className="text-sm text-on-surface-variant">Loading...</p> : null}
          </div>
        </section>
        <aside className="xl:col-span-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
          <h3 className="mb-4 font-h3 text-h3 text-on-surface">External Roster</h3>
          <div className="space-y-2">
            {items.slice(0, 8).map((item) => (
              <div key={`r-${item._id}`} className="rounded-lg border border-outline-variant/30 p-3">
                <p className="text-sm font-semibold text-on-surface">{item.clientName}</p>
                <p className="text-xs text-on-surface-variant">{item.clientEmail || "No email"}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </PsychiatristShell>
  );
}
