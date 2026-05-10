import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { professionalApi } from "../../api/professionalApi";
import { PsychiatristShell } from "./PsychiatristShell";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export default function PsychiatristSchedulePage() {
  const token = useAuthStore((s) => s.token);
  const { professional, loadProfessionalData, loading, error } = useAppStore();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [form, setForm] = useState({
    clientUserId: "",
    startTime: "",
    endTime: "",
    mode: "ONLINE",
  });
  const [formError, setFormError] = useState("");
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());

  useEffect(() => {
    if (token) loadProfessionalData(token);
  }, [token, loadProfessionalData]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) return;
      setClientsLoading(true);
      try {
        const data = await professionalApi.listMyClients(token);
        if (!cancelled) setClients(data || []);
      } catch {
        if (!cancelled) setClients([]);
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const appointments = useMemo(() => professional.appointments || [], [professional.appointments]);

  const { daysInMonth, firstWeekday, year, monthIndex } = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    const fwd = new Date(y, m, 1).getDay();
    return { daysInMonth: dim, firstWeekday: fwd, year: y, monthIndex: m };
  }, [month]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      const st = a.startTime ? new Date(a.startTime) : null;
      if (!st || st.getFullYear() !== year || st.getMonth() !== monthIndex) continue;
      const day = st.getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(a);
    }
    return map;
  }, [appointments, year, monthIndex]);

  const slotsForSelectedDay = appointmentsByDay.get(selectedDay) || [];

  const onCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.clientUserId || !form.startTime || !form.endTime) {
      setFormError("Choose a client and start/end times.");
      return;
    }
    try {
      await professionalApi.createAppointment(
        {
          clientUserId: form.clientUserId,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
          mode: form.mode,
        },
        token
      );
      await loadProfessionalData(token);
      setForm((s) => ({ ...s, startTime: "", endTime: "" }));
    } catch (err) {
      setFormError(err?.message || "Could not create appointment.");
    }
  };

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  return (
    <PsychiatristShell title="Schedule" subtitle="Create sessions and view your calendar">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="xl:col-span-7 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface hover:bg-surface-container-low"
              onClick={() => setMonth((m) => addMonths(m, -1))}
            >
              Previous
            </button>
            <h3 className="font-h3 text-h3 text-on-surface">
              {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </h3>
            <button
              type="button"
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface hover:bg-surface-container-low"
              onClick={() => setMonth((m) => addMonths(m, 1))}
            >
              Next
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-on-surface-variant">
            {DAYS.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, idx) =>
              d == null ? (
                <div key={`e-${idx}`} className="aspect-square rounded-lg bg-transparent" />
              ) : (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`relative aspect-square rounded-xl border p-1 text-sm transition-colors ${
                    selectedDay === d
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-outline-variant/40 bg-surface hover:bg-surface-container-low"
                  }`}
                >
                  <span className="text-on-surface">{d}</span>
                  {(appointmentsByDay.get(d) || []).length > 0 ? (
                    <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary" />
                  ) : null}
                </button>
              )
            )}
          </div>
        </section>

        <section className="space-y-6 xl:col-span-5">
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
            <h4 className="mb-3 font-h3 text-h3 text-on-surface">Create appointment</h4>
            <p className="mb-4 text-sm text-on-surface-variant">
              Adds a session to your calendar and notifies the client when they next load appointments (same pipeline as client-initiated booking).
            </p>
            <form className="space-y-3" onSubmit={onCreate}>
              <label className="block text-sm font-medium text-on-surface">
                Client
                <select
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface"
                  value={form.clientUserId}
                  onChange={(e) => setForm((s) => ({ ...s, clientUserId: e.target.value }))}
                  required
                >
                  <option value="">{clientsLoading ? "Loading clients…" : "Select client"}</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name || c.email || c._id}
                    </option>
                  ))}
                </select>
              </label>
              {!clients.length && !clientsLoading ? (
                <p className="text-xs text-on-surface-variant">
                  No clients yet. Clients appear after they book with you or start a chat session.
                </p>
              ) : null}
              <label className="block text-sm font-medium text-on-surface">
                Mode
                <select
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface"
                  value={form.mode}
                  onChange={(e) => setForm((s) => ({ ...s, mode: e.target.value }))}
                >
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">In person</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-on-surface">
                Start
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface"
                  value={form.startTime}
                  onChange={(e) => setForm((s) => ({ ...s, startTime: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-on-surface">
                End
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface"
                  value={form.endTime}
                  onChange={(e) => setForm((s) => ({ ...s, endTime: e.target.value }))}
                  required
                />
              </label>
              {formError ? <p className="text-sm text-error">{formError}</p> : null}
              <button type="submit" className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-container">
                Save to calendar
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
            <h4 className="mb-3 font-h3 text-h3 text-on-surface">
              {month.toLocaleString(undefined, { month: "long" })} {selectedDay}
            </h4>
            {slotsForSelectedDay.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No appointments on this day.</p>
            ) : (
              <ul className="space-y-2">
                {slotsForSelectedDay.map((a) => (
                  <li key={a._id} className="rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 text-sm">
                    <p className="font-medium text-on-surface">{a.clientUserId?.name || "Client"}</p>
                    <p className="text-xs text-on-surface-variant">
                      {a.startTime ? new Date(a.startTime).toLocaleString() : ""} —{" "}
                      {a.endTime ? new Date(a.endTime).toLocaleString() : ""}
                    </p>
                    <p className="text-xs text-primary">{a.status}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
      {loading ? <p className="mt-4 text-sm text-primary">Syncing calendar…</p> : null}
      {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
    </PsychiatristShell>
  );
}
