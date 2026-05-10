import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ChevronRight, ExternalLink, FileText } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { professionalApi } from "../../api/professionalApi";
import { publicFileUrl } from "../../lib/http";
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

function formatSlot(isoStart, isoEnd) {
  if (!isoStart) return "Slot TBD";
  const start = new Date(isoStart);
  if (Number.isNaN(start.getTime())) return "Slot TBD";
  const dateStr = start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const t0 = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (!isoEnd) return `${dateStr} · ${t0}`;
  const end = new Date(isoEnd);
  if (Number.isNaN(end.getTime())) return `${dateStr} · ${t0}`;
  const t1 = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${dateStr} · ${t0} – ${t1}`;
}

/** Notes field + actions for approving or rejecting a pending paid booking */
function VerificationPanel({
  id,
  verificationNotes,
  setVerificationNotes,
  receiptUrl,
  paymentReference,
  amountPaid,
  onConfirm,
  onReject,
  onNoteInput,
}) {
  const pid = String(id);
  const value = verificationNotes[pid] ?? "";

  return (
    <div className="rounded-xl border border-primary/15 bg-surface-bright px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 gap-y-2 text-xs">
        {(paymentReference || Number(amountPaid) > 0) && (
          <span className="rounded-full bg-surface-container-high px-2.5 py-1 font-medium text-on-surface">
            Ref {paymentReference || "—"} · Paid {amountPaid ?? "—"}
          </span>
        )}
        {receiptUrl ? (
          <a
            href={publicFileUrl(receiptUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary hover:bg-primary/15"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Client receipt
            <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
          </a>
        ) : (
          <span className="text-on-surface-variant">No receipt uploaded</span>
        )}
      </div>
      <label htmlFor={`verify-${pid}`} className="mb-1.5 block text-xs font-semibold text-on-surface">
        Payment verification notes
      </label>
      <textarea
        id={`verify-${pid}`}
        maxLength={800}
        className="mb-3 w-full min-h-[88px] resize-y rounded-xl border border-outline-variant/70 bg-background px-3 py-2.5 text-sm text-on-surface shadow-inner outline-none transition-[box-shadow,border-color] placeholder:text-on-surface-variant/80 focus:border-primary/45 focus:ring-2 focus:ring-primary/12"
        placeholder="Record what you verified (gateway, amount match, payer name, issues, etc.). Required to accept or decline."
        value={value}
        onChange={(e) => {
          onNoteInput?.();
          setVerificationNotes((prev) => ({ ...prev, [pid]: e.target.value }));
        }}
      />
      <p className="mb-3 text-[11px] text-on-surface-variant">{value.trim().length}/800 characters</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-sm transition-opacity hover:opacity-95"
          onClick={() => onConfirm(id)}
        >
          Confirm & accept
        </button>
        <button
          type="button"
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-outline-variant bg-surface px-5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
          onClick={() => onReject(id)}
        >
          Decline request
        </button>
      </div>
    </div>
  );
}

export default function PsychiatristDashboardPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { professional, loadProfessionalData, updateAppointmentStatus, loading, error } = useAppStore();
  const [verification, setVerification] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState({});
  const [verificationErr, setVerificationErr] = useState("");

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

  const pendingAct = async (id, status) => {
    const key = String(id);
    const n = (verificationNotes[key] || "").trim();
    if (n.length < 3) {
      setVerificationErr("Add payment verification notes before confirming or declining.");
      return;
    }
    setVerificationErr("");
    await updateAppointmentStatus(id, status, token, n);
  };

  return (
    <PsychiatristShell title="Professional Dashboard" subtitle="Overview of schedule and requests">
      <main className="mx-auto w-full max-w-container-max flex-1">
        <div className="mb-xl">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-h1 text-h1 mb-1 tracking-tight text-on-background">Good morning, {doctorName}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Review today&apos;s sessions and incoming payment-backed booking requests.
              </p>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 shadow-sm">
              <BadgeCheck className="h-4 w-4 text-primary" />
              <span className="font-label-md text-label-md text-on-surface">Verification</span>
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
            <div className="h-full rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-surface-container-high pb-4">
                <h3 className="font-h3 text-h3 text-on-surface">Today</h3>
                <Link
                  to="/psychiatrist/schedule"
                  className="flex items-center gap-1 font-label-md text-label-md text-primary transition-colors hover:text-primary-container"
                >
                  Full calendar <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {todaysAppointments.map((appointment, idx) => {
                  const pending = (appointment.status || "PENDING") === "PENDING";
                  const dm = durationMinutesForAppointment(appointment);
                  return (
                    <div
                      key={appointment._id || idx}
                      className="group flex items-start gap-4 rounded-xl border border-transparent p-3 transition-colors hover:border-surface-container hover:bg-surface-bright/80"
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
                      <div className="min-w-0 flex-1 rounded-xl border border-surface-container-high bg-surface-container-lowest p-4 shadow-sm">
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-h3 mb-0.5 text-body-lg font-semibold text-on-surface">
                              {appointment.clientUserId?.name || "Client session"}
                            </h4>
                            <p className="text-xs text-on-surface-variant">{formatSlot(appointment.startTime, appointment.endTime)}</p>
                            <p className="mt-1 font-body-md text-sm text-on-surface-variant line-clamp-2">
                              {appointment.notes || "Standard session"}
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
                          <div className="mt-4">
                            <VerificationPanel
                              id={appointment._id}
                              verificationNotes={verificationNotes}
                              setVerificationNotes={setVerificationNotes}
                              receiptUrl={appointment.paymentReceiptUrl}
                              paymentReference={appointment.paymentReference}
                              amountPaid={appointment.amountPaid}
                              onConfirm={(apptId) => pendingAct(apptId, "CONFIRMED")}
                              onReject={(apptId) => pendingAct(apptId, "CANCELLED")}
                              onNoteInput={() => setVerificationErr("")}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {todaysAppointments.length === 0 ? (
                  <div className="rounded-xl border border-surface-container-high bg-surface-bright px-4 py-6 text-center text-sm text-on-surface-variant">
                    No sessions scheduled for today.{" "}
                    <Link className="font-semibold text-primary underline-offset-2 hover:underline" to="/psychiatrist/schedule">
                      Open schedule
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6 lg:col-span-4">
            <div className="h-full rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high pb-4">
                <h3 className="font-h3 text-h3 text-on-surface">Booking requests</h3>
                <span className="rounded-full bg-error/10 px-2.5 py-0.5 font-label-sm text-label-sm font-semibold text-error">
                  {pendingRequests.length} open
                </span>
              </div>
              {pendingRequests.length > 3 ? (
                <Link
                  to="/psychiatrist/requests"
                  className="mb-4 flex items-center justify-center gap-1 rounded-xl border border-primary/25 bg-primary/6 py-2.5 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  Open full inbox <ChevronRight className="h-4 w-4" />
                </Link>
              ) : null}
              <div className="flex flex-col gap-4">
                {pendingRequests.slice(0, 3).map((request, idx) => (
                  <div
                    key={request._id || idx}
                    className="rounded-xl border border-surface-container-highest bg-surface-bright p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${idx % 2 === 0 ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-primary-fixed text-on-primary-fixed"}`}
                      >
                        {(request.clientUserId?.name || "C").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-on-surface">{request.clientUserId?.name || "Client"}</h4>
                        <p className="text-xs text-on-surface-variant">{formatSlot(request.startTime, request.endTime)}</p>
                      </div>
                    </div>
                    <p className="mb-4 line-clamp-2 text-sm text-on-surface-variant">
                      {request.notes || "Awaiting your review of payment and session time."}
                    </p>
                    <VerificationPanel
                      id={request._id}
                      verificationNotes={verificationNotes}
                      setVerificationNotes={setVerificationNotes}
                      receiptUrl={request.paymentReceiptUrl}
                      paymentReference={request.paymentReference}
                      amountPaid={request.amountPaid}
                      onConfirm={(rid) => pendingAct(rid, "CONFIRMED")}
                      onReject={(rid) => pendingAct(rid, "CANCELLED")}
                      onNoteInput={() => setVerificationErr("")}
                    />
                  </div>
                ))}
                {pendingRequests.length === 0 ? (
                  <div className="rounded-xl border border-surface-container-high bg-surface px-4 py-6 text-center text-sm text-on-surface-variant">
                    Inbox clear. New paid requests will appear here.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        {loading ? <p className="mt-4 text-xs font-medium text-primary">Syncing…</p> : null}
        {verificationErr ? <p className="mt-2 text-sm text-error">{verificationErr}</p> : null}
        {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
      </main>
    </PsychiatristShell>
  );
}
