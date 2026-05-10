import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ChevronRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { professionalApi } from "../../api/professionalApi";
import { PsychiatristShell } from "./PsychiatristShell";

function sameLocalCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function durationMinutesForAppointment(a) {
  if (a.durationMinutes != null) return a.durationMinutes;
  if (a.startTime && a.endTime) {
    const ms = new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
    return ms > 0 ? Math.round(ms / 60000) : 45;
  }
  return 45;
}

export default function PsychiatristDashboardPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { professional, loadProfessionalData, updateAppointmentStatus, loading, error } = useAppStore();
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    if (token) loadProfessionalData(token);
  }, [token, loadProfessionalData]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      try {
        const v = await professionalApi.getMyVerificationStatus(token);
        if (!cancelled) setVerification(v);
      } catch {
        if (!cancelled) setVerification(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const appointments = useMemo(() => professional.appointments || [], [professional.appointments]);
  const pendingRequests = useMemo(() => professional.requests || [], [professional.requests]);

  const todaysAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((a) => {
        if (!a.startTime) return false;
        return sameLocalCalendarDay(new Date(a.startTime), now);
      })
      .sort((x, y) => new Date(x.startTime).getTime() - new Date(y.startTime).getTime());
  }, [appointments]);

  const { verificationLabel, verificationBadgeClass } = useMemo(() => {
    const s = verification?.status;
    if (s === "APPROVED") return { verificationLabel: "Approved", verificationBadgeClass: "bg-primary/10 text-primary" };
    if (s === "PENDING") return { verificationLabel: "Pending review", verificationBadgeClass: "bg-tertiary-container/40 text-on-surface" };
    if (s === "REJECTED") return { verificationLabel: "Rejected", verificationBadgeClass: "bg-error/15 text-error" };
    return { verificationLabel: "Not submitted", verificationBadgeClass: "bg-surface-container-high text-on-surface-variant" };
  }, [verification]);

  const toTime = (value) => {
    if (!value) return "TBD";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "TBD";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const doctorName = user?.name ? `Dr. ${user.name}` : "Dr. Professional";

  return (
    <PsychiatristShell title="Professional Dashboard" subtitle="Overview of schedule and requests">
      <main className="mx-auto w-full max-w-container-max flex-1">
        <div className="mb-xl">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-h1 text-h1 mb-1 text-on-background">Good morning, {doctorName}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Here is an overview of your schedule and new client requests.
              </p>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-4 py-2">
              <BadgeCheck className="h-4 w-4 text-primary" />
              <span className="font-label-md text-label-md text-on-surface">Verification:</span>
              <span
                className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm uppercase tracking-wider ${verificationBadgeClass}`}
              >
                {verificationLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          <section className="flex flex-col gap-6 lg:col-span-8">
            <div className="h-full rounded-xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-surface-container-high pb-4">
                <h3 className="font-h3 text-h3 text-on-surface">Today&apos;s schedule</h3>
                <Link
                  to="/psychiatrist/schedule"
                  className="flex items-center gap-1 font-label-md text-label-md text-primary transition-colors hover:text-primary-container"
                >
                  View full calendar <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {todaysAppointments.map((appointment, idx) => {
                  const pending = (appointment.status || "PENDING") === "PENDING";
                  const dm = durationMinutesForAppointment(appointment);
                  return (
                    <div
                      key={appointment._id || idx}
                      className="group flex items-start gap-4 rounded-lg border border-transparent p-4 transition-colors hover:border-surface-container hover:bg-surface-bright"
                    >
                      <div className="w-20 pt-1 text-right">
                        <p className="font-label-md text-label-md text-on-surface">{toTime(appointment.startTime)}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">{dm} min</p>
                      </div>
                      <div className="relative h-auto min-h-16 w-1 self-stretch rounded-full bg-surface-container-high">
                        <div
                          className={`absolute -left-1 top-2 h-3 w-3 rounded-full ring-4 ring-white ${idx % 2 === 0 ? "bg-primary" : "bg-secondary"}`}
                        />
                      </div>
                      <div className="flex-1 rounded-lg border border-surface-container-high bg-surface-container-lowest p-4 shadow-sm">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-h3 mb-0.5 text-body-lg font-semibold text-on-surface">
                              {appointment.clientUserId?.name || "Client session"}
                            </h4>
                            <p className="font-body-md text-body-md text-on-surface-variant">
                              {appointment.notes || "Therapy session"}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="rounded-full bg-primary/10 px-2 py-1 font-label-sm text-label-sm uppercase text-primary">
                              {appointment.mode || "Online"}
                            </span>
                            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                              {appointment.status || "PENDING"}
                            </span>
                          </div>
                        </div>
                        {pending ? (
                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              className="rounded-lg bg-primary px-4 py-2 font-label-sm text-label-sm text-on-primary transition-colors hover:bg-primary-container"
                              onClick={() => updateAppointmentStatus(appointment._id, "CONFIRMED", token)}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-outline-variant px-4 py-2 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container-low"
                              onClick={() => updateAppointmentStatus(appointment._id, "CANCELLED", token)}
                            >
                              Decline
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {todaysAppointments.length === 0 ? (
                  <div className="rounded-lg border border-surface-container-high bg-surface-bright p-4 text-sm text-on-surface-variant">
                    Nothing on your calendar today. Open{" "}
                    <Link className="font-medium text-primary underline" to="/psychiatrist/schedule">
                      Schedule
                    </Link>{" "}
                    to book or view other days.
                  </div>
                ) : null}

                {todaysAppointments.length > 0 ? (
                  <div className="flex items-center gap-4 px-4 py-2 opacity-60">
                    <div className="w-20 text-right">
                      <p className="font-label-md text-label-md text-on-surface-variant">12:00 PM</p>
                    </div>
                    <div className="flex-1 border-t border-dashed border-outline-variant" />
                    <p className="font-label-sm text-label-sm italic text-on-surface-variant">Lunch break</p>
                    <div className="flex-1 border-t border-dashed border-outline-variant" />
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6 lg:col-span-4">
            <div className="h-full rounded-xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-surface-container-high pb-4">
                <h3 className="font-h3 text-h3 text-on-surface">New requests</h3>
                <span className="rounded-full bg-error/10 px-2 py-0.5 font-label-sm text-label-sm text-error">
                  {pendingRequests.length} pending
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {pendingRequests.slice(0, 3).map((request, idx) => (
                  <div key={request._id || idx} className="rounded-lg border border-surface-container-highest bg-surface-bright p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-h3 text-h3 ${idx % 2 === 0 ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-primary-fixed text-on-primary-fixed"}`}
                      >
                        {(request.clientUserId?.name || "C").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface">{request.clientUserId?.name || "Client request"}</h4>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Pending appointment request</p>
                      </div>
                    </div>
                    <p className="mb-4 line-clamp-2 font-body-md text-label-sm text-on-surface-variant">
                      {request.notes || "Client is waiting for your response."}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-lg bg-primary py-2 px-3 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container"
                        onClick={() => updateAppointmentStatus(request._id, "CONFIRMED", token)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-lg bg-surface-container py-2 px-3 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
                        onClick={() => updateAppointmentStatus(request._id, "CANCELLED", token)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {pendingRequests.length === 0 ? (
                  <div className="rounded-lg border border-surface-container-high bg-surface p-4 text-sm text-on-surface-variant">
                    No new requests right now.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        {loading ? <p className="mt-4 text-xs text-primary">Syncing...</p> : null}
        {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
      </main>
    </PsychiatristShell>
  );
}
