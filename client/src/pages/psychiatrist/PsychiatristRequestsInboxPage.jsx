import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { PsychiatristShell } from "./PsychiatristShell";

export default function PsychiatristRequestsInboxPage() {
  const token = useAuthStore((s) => s.token);
  const { professional, loadProfessionalData, updateAppointmentStatus, loading, error } = useAppStore();
  const requests = professional.requests || [];
  const selected = requests[0];

  useEffect(() => {
    if (token) loadProfessionalData(token);
  }, [token, loadProfessionalData]);

  return (
    <PsychiatristShell title="Incoming Requests Inbox" subtitle="39_Incoming_Requests_Inbox.html">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-xl border border-outline-variant/30 bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3">
            <span className="font-label-md text-label-md text-on-surface-variant">{requests.length} Pending Inquiries</span>
            <button className="text-primary font-label-sm text-label-sm">Sort</button>
          </div>
          <div className="max-h-[620px] space-y-2 overflow-auto p-3">
            {requests.map((request, index) => (
              <button
                key={request._id || index}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  index === 0 ? "border-primary/30 bg-surface-container-low" : "border-outline-variant/30 hover:border-primary/40"
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-h3 text-body-lg text-on-surface">{request.clientUserId?.name || "Client Request"}</h4>
                  <span className="text-xs text-on-surface-variant">new</span>
                </div>
                <p className="line-clamp-2 text-sm text-on-surface-variant">
                  {request.notes || "New session request awaiting action."}
                </p>
              </button>
            ))}
            {!requests.length ? (
              <div className="rounded-xl border border-outline-variant/30 p-4 text-sm text-on-surface-variant">
                No incoming requests right now.
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface shadow-sm">
          <div className="flex items-end justify-between border-b border-outline-variant/30 px-6 py-5">
            <div>
              <h3 className="font-h1 text-h1 text-on-surface">
                {selected?.clientUserId?.name || "Select a request"}
              </h3>
              <p className="text-sm text-on-surface-variant">New client inquiry</p>
            </div>
            {selected ? (
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-outline px-4 py-2 text-sm text-on-surface hover:bg-surface-variant"
                  onClick={() => updateAppointmentStatus(selected._id, "CANCELLED", token)}
                >
                  Reject
                </button>
                <button
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-on-primary"
                  onClick={() => updateAppointmentStatus(selected._id, "CONFIRMED", token)}
                >
                  Accept Client
                </button>
              </div>
            ) : null}
          </div>

          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Primary Focus</p>
                <p className="mt-1 text-sm text-on-surface">{selected?.focus || "General Consultation"}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Availability</p>
                <p className="mt-1 text-sm text-on-surface">{selected?.availability || "Weekday Evenings"}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Insurance</p>
                <p className="mt-1 text-sm text-on-surface">{selected?.insurance || "N/A"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5">
              <h4 className="mb-3 font-h3 text-h3 text-on-surface">Initial Message</h4>
              <p className="text-body-md text-on-surface-variant">
                {selected?.notes ||
                  "Client reached out for support and is requesting your earliest available session. Review details and decide whether to accept."}
              </p>
            </div>
          </div>
          {loading ? <p className="px-6 pb-3 text-xs text-primary">Syncing...</p> : null}
          {error ? <p className="px-6 pb-3 text-xs text-error">{error}</p> : null}
        </section>
      </div>
    </PsychiatristShell>
  );
}
