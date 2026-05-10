import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, Video, ArrowRight, ExternalLink, Receipt } from "lucide-react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { publicFileUrl } from "../../lib/http";

const statusTone = {
  PENDING: "bg-surface-container text-on-surface ring-1 ring-outline-variant/40",
  CONFIRMED: "bg-primary/10 text-primary ring-1 ring-primary/25",
  CANCELLED: "bg-error-container/60 text-on-error-container ring-1 ring-error/20",
};

export default function ClientAppointmentsPage() {
  const token = useAuthStore((s) => s.token);
  const { client, loadClientData, cancelAppointment, loading, error } = useAppStore();
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (token) loadClientData(token);
  }, [token, loadClientData]);

  const appointments = useMemo(() => {
    const list = [...(client.appointments || [])];
    list.sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
    return list;
  }, [client.appointments]);

  useEffect(() => {
    if (!appointments.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !appointments.some((a) => String(a._id) === String(selectedId))) {
      setSelectedId(String(appointments[0]._id));
    }
  }, [appointments, selectedId]);

  const grouped = useMemo(() => {
    const pending = appointments.filter((a) => (a.status || "PENDING") === "PENDING");
    const confirmed = appointments.filter((a) => (a.status || "") === "CONFIRMED");
    const cancelled = appointments.filter((a) => (a.status || "") === "CANCELLED");
    return { pending, confirmed, cancelled };
  }, [appointments]);

  const activeAppointment = useMemo(() => {
    if (!appointments.length) return null;
    return appointments.find((a) => String(a._id) === String(selectedId)) || appointments[0];
  }, [appointments, selectedId]);

  const formatDate = (value) => {
    if (!value) return "TBD";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "TBD";
    return date.toLocaleString();
  };

  return (
    <ClientShell title="Sessions">
      <p className="mb-6 text-sm text-on-surface-variant">
        Pending requests stay here until your psychiatrist confirms payment and the session slot.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Pending", grouped.pending.length],
          ["Confirmed", grouped.confirmed.length],
          ["Cancelled", grouped.cancelled.length],
        ].map(([label, count]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-on-surface">{count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
            <h3 className="mb-1 font-h3 text-h3 text-on-surface">Your bookings</h3>
            <p className="mb-4 text-xs text-on-surface-variant">Newest first in list.</p>
            <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
              {appointments.map((appointment) => {
                const active = activeAppointment && String(activeAppointment._id) === String(appointment._id);
                const status = appointment.status || "PENDING";
                return (
                  <button
                    key={appointment._id}
                    type="button"
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      active
                        ? "border-primary/45 bg-primary/6 shadow-sm ring-1 ring-primary/12"
                        : "border-outline-variant/35 hover:bg-surface-container-low"
                    }`}
                    onClick={() => setSelectedId(String(appointment._id))}
                  >
                    <p className="truncate font-semibold text-on-surface">
                      {appointment.professionalUserId?.name || appointment.professionalUserId || "Psychiatrist"}
                    </p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{formatDate(appointment.startTime)}</p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone[status] || statusTone.PENDING}`}
                    >
                      {status}
                    </span>
                  </button>
                );
              })}
              {!appointments.length ? (
                <p className="rounded-xl border border-dashed border-outline-variant/50 px-4 py-6 text-center text-sm text-on-surface-variant">
                  No sessions yet.{" "}
                  <Link className="font-semibold text-primary underline-offset-2 hover:underline" to="/client/professionals">
                    Find a psychiatrist
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8">
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-h2 text-h2 tracking-tight text-on-surface">Session details</h3>
                <p className="mt-1 text-sm text-on-surface-variant">Payment artifacts and clinician notes.</p>
              </div>
              <Link
                to="/client/professionals"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-md transition-opacity hover:opacity-95"
              >
                New request
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            {activeAppointment ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-outline-variant/35 bg-surface p-6 shadow-inner">
                  <p className="text-lg font-bold text-on-surface">
                    {activeAppointment.professionalUserId?.name || activeAppointment.professionalUserId || "Psychiatrist"}
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 text-sm text-on-surface-variant">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>{formatDate(activeAppointment.startTime)}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-on-surface-variant">
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>{(activeAppointment.durationMinutes || 50) + " minutes"}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-on-surface-variant sm:col-span-2">
                      <Video className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
                      <span>{activeAppointment.mode || "ONLINE"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-outline-variant/40 bg-gradient-to-br from-surface-container-low to-surface-container-lowest p-6">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary shrink-0" aria-hidden />
                    <span className="text-xs font-bold uppercase tracking-wide text-on-surface">Payment</span>
                  </div>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-on-surface-variant">Reference</dt>
                      <dd className="mt-1 font-semibold text-on-surface">
                        {activeAppointment.paymentReference || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-on-surface-variant">Amount paid</dt>
                      <dd className="mt-1 font-semibold tabular-nums text-on-surface">
                        {activeAppointment.amountPaid ?? "—"}
                      </dd>
                    </div>
                  </dl>
                  {activeAppointment.paymentReceiptUrl ? (
                    <a
                      href={publicFileUrl(activeAppointment.paymentReceiptUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      View receipt
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  ) : null}
                  {activeAppointment.paymentVerificationNotes ? (
                    <div className="mt-5 rounded-xl border border-outline-variant/50 bg-background/70 px-4 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                        From your psychiatrist
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface">
                        {activeAppointment.paymentVerificationNotes}
                      </p>
                    </div>
                  ) : activeAppointment.status === "PENDING" ? (
                    <p className="mt-5 text-sm text-on-surface-variant">
                      Verification notes will appear once your psychiatrist reviews payment.
                    </p>
                  ) : null}

                  {(activeAppointment.notes || "").trim() ? (
                    <p className="mt-5 border-t border-outline-variant/35 pt-5 text-sm text-on-surface-variant">
                      <span className="font-semibold text-on-surface">Request note:</span> {activeAppointment.notes}
                    </p>
                  ) : null}
                </div>

                {activeAppointment.status !== "CANCELLED" ? (
                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-xl border border-error/40 px-5 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error-container/25"
                      onClick={() => cancelAppointment(activeAppointment._id, token)}
                    >
                      Cancel session
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-outline-variant/50 p-12 text-center text-sm text-on-surface-variant">
                Select a booking or start a new request.
              </div>
            )}
          </div>
        </section>
      </div>

      {loading ? <p className="mt-4 text-sm font-medium text-primary">Updating…</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}
