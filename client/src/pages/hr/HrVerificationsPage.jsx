import { useEffect, useState } from "react";
import HrShell from "./HrShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

const statusClass = {
  PENDING: "bg-tertiary-fixed text-on-tertiary-fixed",
  APPROVED: "bg-primary-fixed text-on-primary-fixed",
  REJECTED: "bg-error-container text-on-error-container",
};

export default function HrVerificationsPage() {
  const token = useAuthStore((s) => s.token);
  const { admin, loadAdminData, approveVerification, rejectVerification, loading, error } = useAppStore();
  const [processingId, setProcessingId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) loadAdminData(token);
  }, [token, loadAdminData]);

  const onApprove = async (id) => {
    setProcessingId(id);
    setMessage("");
    try {
      await approveVerification(id, token);
      setMessage("Verification approved.");
    } finally {
      setProcessingId("");
    }
  };

  const onReject = async (id) => {
    const reviewNotes = window.prompt("Enter rejection notes:");
    if (!reviewNotes) return;
    setProcessingId(id);
    setMessage("");
    try {
      await rejectVerification(id, reviewNotes, token);
      setMessage("Verification rejected.");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <HrShell title="Verification Queue" subtitle="Approve or reject professional credential submissions.">
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            className="w-full rounded-lg border-none bg-transparent py-3 pl-10 pr-4 text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
            placeholder="Search verification requests..."
          />
        </div>
      </div>

      {message ? <p className="mb-3 rounded-md bg-primary-fixed px-3 py-2 text-sm text-on-primary-fixed">{message}</p> : null}
      {error ? <p className="mb-3 rounded-md bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {admin.verifications.map((item) => {
          const disabled = loading || processingId === item._id;
          return (
            <article
              key={item._id}
              className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-on-surface">{item.degree || "Credential submission"}</h3>
                  <p className="text-sm text-on-surface-variant">
                    {item.institution || "Institution unavailable"} {item.batch ? `• Batch ${item.batch}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">ID: {item._id}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${statusClass[item.status] || "bg-surface-container-high text-on-surface-variant"}`}
                >
                  {item.status}
                </span>
              </div>

              {item.status === "PENDING" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary hover:bg-primary-container disabled:opacity-60"
                    onClick={() => onApprove(item._id)}
                    disabled={disabled}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-md bg-error px-3 py-1.5 text-sm font-semibold text-on-error hover:opacity-90 disabled:opacity-60"
                    onClick={() => onReject(item._id)}
                    disabled={disabled}
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {!admin.verifications.length ? <p className="text-sm text-on-surface-variant">No verification records found.</p> : null}
    </HrShell>
  );
}
