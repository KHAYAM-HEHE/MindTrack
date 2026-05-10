import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronLeft, ExternalLink, FileText } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { publicFileUrl } from "../../lib/http";
import { PsychiatristShell } from "./PsychiatristShell";

function formatSlotDetail(isoStart, isoEnd) {
  if (!isoStart) return "Not specified";
  const start = new Date(isoStart);
  if (Number.isNaN(start.getTime())) return "Not specified";
  const weekday = start.toLocaleDateString(undefined, { weekday: "long" });
  const datePart = start.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  const t0 = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (!isoEnd) return `${weekday}, ${datePart} · ${t0}`;
  const end = new Date(isoEnd);
  if (Number.isNaN(end.getTime())) return `${weekday}, ${datePart} · ${t0}`;
  const t1 = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${weekday}, ${datePart} · ${t0} – ${t1}`;
}

export default function PsychiatristRequestsInboxPage() {
  const token = useAuthStore((s) => s.token);
  const { professional, loadProfessionalData, updateAppointmentStatus, loading, error } = useAppStore();
  const rawRequests = professional.requests || [];

  const sortedRequests = useMemo(
    () => [...rawRequests].sort((a, b) => new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime()),
    [rawRequests]
  );

  const [selectedId, setSelectedId] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState({});
  const [verificationErr, setVerificationErr] = useState("");

  const selected = useMemo(
    () => sortedRequests.find((r) => String(r._id) === String(selectedId)) || null,
    [sortedRequests, selectedId]
  );

  useEffect(() => {
    if (!sortedRequests.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !sortedRequests.some((r) => String(r._id) === String(selectedId))) {
      setSelectedId(String(sortedRequests[0]._id));
    }
  }, [sortedRequests, selectedId]);

  useEffect(() => {
    if (token) loadProfessionalData(token);
  }, [token, loadProfessionalData]);

  const pendingAct = async (id, status) => {
    const n = (verificationNotes[String(id)] || "").trim();
    if (n.length < 3) {
      setVerificationErr("Add payment verification notes before confirming or declining.");
      return;
    }
    setVerificationErr("");
    await updateAppointmentStatus(id, status, token, n);
  };

  const noteValue = selected ? verificationNotes[String(selected._id)] ?? "" : "";

  return (
    <PsychiatristShell title="Requests inbox" subtitle="Prioritize by proposed session time and verify payment artifacts">
      <div className="mb-6">
        <Link
          to="/psychiatrist/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <section className="flex max-h-[min(720px,calc(100vh-220px))] flex-col rounded-2xl border border-outline-variant/40 bg-surface shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/35 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Queue</p>
              <p className="text-sm font-semibold text-on-surface">{sortedRequests.length} pending</p>
            </div>
            <span className="rounded-full bg-surface-container-high px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
              Oldest slot first
            </span>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
            {sortedRequests.map((request) => {
              const active = String(selectedId) === String(request._id);
              return (
                <button
                  key={request._id}
                  type="button"
                  onClick={() => setSelectedId(String(request._id))}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    active
                      ? "border-primary/40 bg-primary/6 shadow-sm ring-1 ring-primary/15"
                      : "border-outline-variant/35 bg-surface-container-lowest hover:border-primary/25"
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h4 className="truncate font-semibold text-on-surface">
                      {request.clientUserId?.name || "Client"}
                    </h4>
                    <span className="shrink-0 rounded-md bg-surface-container-high px-1.5 py-0.5 text-[10px] font-bold uppercase text-on-surface-variant">
                      {request.mode || "Online"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-on-surface-variant">
                    {formatSlotDetail(request.startTime, request.endTime)}
                  </p>
                </button>
              );
            })}
            {!sortedRequests.length ? (
              <div className="rounded-xl border border-dashed border-outline-variant/50 p-6 text-center text-sm text-on-surface-variant">
                No pending requests.
              </div>
            ) : null}
          </div>
        </section>

        <section className="flex min-h-[560px] flex-col rounded-2xl border border-outline-variant/40 bg-surface shadow-sm">
          <div className="border-b border-outline-variant/35 px-6 py-5">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">
              {selected?.clientUserId?.name || "Select a request"}
            </h2>
            {selected ? (
              <p className="mt-1 text-sm text-on-surface-variant">
                Proposed {formatSlotDetail(selected.startTime, selected.endTime)}
              </p>
            ) : (
              <p className="mt-1 text-sm text-on-surface-variant">Choose an item from the queue.</p>
            )}
          </div>

          <div className="flex flex-1 flex-col space-y-5 p-6">
            {selected ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
                    <div className="mb-2 flex items-center gap-2 text-on-surface-variant">
                      <Calendar className="h-4 w-4 text-primary shrink-0" aria-hidden />
                      <span className="text-[11px] font-bold uppercase tracking-wide">Requested slot</span>
                    </div>
                    <p className="text-sm font-medium leading-snug text-on-surface">
                      {formatSlotDetail(selected.startTime, selected.endTime)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                      Amount & reference
                    </p>
                    <p className="mt-2 text-lg font-semibold tabular-nums text-on-surface">
                      {selected.amountPaid ?? "—"}
                      <span className="ml-2 text-sm font-normal text-on-surface-variant">
                        Ref {selected.paymentReference || "—"}
                      </span>
                    </p>
                    <div className="mt-3">
                      {selected.paymentReceiptUrl ? (
                        <a
                          href={publicFileUrl(selected.paymentReceiptUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" aria-hidden />
                          Open uploaded receipt
                          <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                        </a>
                      ) : (
                        <p className="text-sm text-error">Receipt missing — follow up before accepting.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                    Client message
                  </h4>
                  <p className="text-sm leading-relaxed text-on-surface">
                    {selected.notes || "No additional message provided with this booking request."}
                  </p>
                </div>

                <div className="mt-auto rounded-xl border border-primary/18 bg-gradient-to-b from-primary/5 to-transparent px-5 py-5">
                  <label htmlFor="inbox-verify-notes" className="mb-2 block text-sm font-semibold text-on-surface">
                    Payment verification notes
                  </label>
                  <textarea
                    id="inbox-verify-notes"
                    maxLength={800}
                    className="mb-2 w-full min-h-[100px] resize-y rounded-xl border border-outline-variant/70 bg-background px-3 py-3 text-sm text-on-surface shadow-inner outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/12"
                    placeholder="Document what you verified or why you are declining (required)."
                    value={noteValue}
                    onChange={(e) => {
                      setVerificationErr("");
                      setVerificationNotes((prev) => ({
                        ...prev,
                        [String(selected._id)]: e.target.value,
                      }));
                    }}
                  />
                  <p className="mb-4 text-[11px] text-on-surface-variant">{noteValue.trim().length}/800</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary shadow-sm hover:opacity-95"
                      onClick={() => pendingAct(selected._id, "CONFIRMED")}
                    >
                      Accept booking
                    </button>
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-xl border border-outline-variant bg-surface px-6 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
                      onClick={() => pendingAct(selected._id, "CANCELLED")}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">
                Select a request to review payment and session details.
              </div>
            )}
          </div>

          {loading ? <p className="border-t border-outline-variant/30 px-6 py-3 text-xs font-medium text-primary">Syncing…</p> : null}
          {verificationErr ? (
            <p className="border-t border-outline-variant/30 px-6 py-3 text-sm text-error">{verificationErr}</p>
          ) : null}
          {error ? <p className="border-t border-outline-variant/30 px-6 py-3 text-sm text-error">{error}</p> : null}
        </section>
      </div>
    </PsychiatristShell>
  );
}
