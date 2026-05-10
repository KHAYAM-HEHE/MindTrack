import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Video, ArrowRight } from "lucide-react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

const statusTone = {
  PENDING: "bg-surface-container text-on-surface",
  CONFIRMED: "bg-primary/10 text-primary",
  CANCELLED: "bg-error-container text-on-error-container",
};

export default function ClientAppointmentsPage() {
  const token = useAuthStore((s) => s.token);
  const { client, loadClientData, loading, error } = useAppStore();
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (token) loadClientData(token);
  }, [token, loadClientData]);

  const appointments = useMemo(() => client.appointments || [], [client.appointments]);

  const grouped = useMemo(() => {
    const pending = appointments.filter((a) => (a.status || "PENDING") === "PENDING");
    const confirmed = appointments.filter((a) => (a.status || "") === "CONFIRMED");
    const cancelled = appointments.filter((a) => (a.status || "") === "CANCELLED");
    return { pending, confirmed, cancelled };
  }, [appointments]);

  const activeAppointment = useMemo(() => {
    if (!appointments.length) return null;
    return appointments.find((a) => a._id === selectedId) || appointments[0];
  }, [appointments, selectedId]);

  const formatDate = (value) => {
    if (!value) return "TBD";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "TBD";
    return date.toLocaleString();
  };

  return (
    <ClientShell title="Book & Manage Sessions">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">Pending</p>
          <p className="text-2xl font-bold text-on-surface">{grouped.pending.length}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">Confirmed</p>
          <p className="text-2xl font-bold text-on-surface">{grouped.confirmed.length}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">Cancelled</p>
          <p className="text-2xl font-bold text-on-surface">{grouped.cancelled.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
          <h3 className="mb-3 font-h3 text-h3 text-on-surface">Appointments</h3>
          <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
            {appointments.map((appointment) => {
              const active = activeAppointment?._id === appointment._id;
              const status = appointment.status || "PENDING";
              return (
                <button
                  key={appointment._id}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${active ? "border-primary bg-surface-container-low" : "border-outline-variant/30 hover:bg-surface-container-low"}`}
                  onClick={() => setSelectedId(appointment._id)}
                >
                  <p className="font-label-md text-label-md text-on-surface truncate">
                    {appointment.professionalUserId?.name || appointment.professionalUserId || "Professional"}
                  </p>
                  <p className="text-xs text-on-surface-variant">{formatDate(appointment.startTime)}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${statusTone[status] || statusTone.PENDING}`}>
                    {status}
                  </span>
                </button>
              );
            })}
            {!appointments.length ? <p className="text-sm text-on-surface-variant">No appointments yet.</p> : null}
          </div>
        </aside>

        <section className="lg:col-span-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-h2 text-h2 text-on-surface">Session Details</h3>
              <p className="text-sm text-on-surface-variant">Review your selected booking information.</p>
            </div>
            <button className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
              Book New
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {activeAppointment ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-outline-variant/30 bg-surface p-4">
                <p className="mb-2 text-sm font-semibold text-on-surface">
                  {activeAppointment.professionalUserId?.name || activeAppointment.professionalUserId || "Professional"}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {formatDate(activeAppointment.startTime)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Clock3 className="h-4 w-4 text-primary" />
                    {(activeAppointment.durationMinutes || 50) + " min"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant sm:col-span-2">
                    <Video className="h-4 w-4 text-secondary" />
                    Mode: {activeAppointment.mode || "ONLINE"}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                Notes: {activeAppointment.notes || "No extra notes provided for this appointment."}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-outline-variant/30 bg-surface p-6 text-sm text-on-surface-variant">No appointment selected.</div>
          )}
        </section>
      </div>

      {loading ? <p className="mt-2 text-sm text-primary">Syncing...</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}
