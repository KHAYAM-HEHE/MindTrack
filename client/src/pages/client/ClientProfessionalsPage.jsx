import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Star,
  Video,
  MessageSquare,
  Calendar,
  Upload,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { professionalApi } from "../../api/professionalApi";
import { publicFileUrl } from "../../lib/http";

const inputClass =
  "w-full rounded-xl border border-outline-variant/70 bg-background px-3 py-2.5 text-sm text-on-surface shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-on-surface-variant/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

export default function ClientProfessionalsPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const chatSessions = useAppStore((s) => s.chat.sessions);
  const { client, loadClientData, loadChatSessions, bookAppointment, loading, error } = useAppStore();

  const [query, setQuery] = useState("");
  const [professionalUserId, setProfessionalUserId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [bookError, setBookError] = useState("");
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [receiptUploadErr, setReceiptUploadErr] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState("");
  const [chatOpening, setChatOpening] = useState(false);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [reviewByProfessional, setReviewByProfessional] = useState({});

  useEffect(() => {
    if (token) {
      loadClientData(token);
      loadChatSessions(token);
    }
  }, [token, loadClientData, loadChatSessions]);

  useEffect(() => {
    setPaymentReceiptUrl("");
    setReceiptUploadErr("");
    setBookError("");
  }, [professionalUserId]);

  useEffect(() => {
    if (!bookSuccess) return;
    const t = window.setTimeout(() => setBookSuccess(false), 8000);
    return () => window.clearTimeout(t);
  }, [bookSuccess]);

  const filtered = useMemo(() => {
    if (!query.trim()) return client.professionals;
    const q = query.toLowerCase();
    return client.professionals.filter((p) => (p.name || p.displayName || "").toLowerCase().includes(q));
  }, [client.professionals, query]);

  const selectedPro = useMemo(
    () => filtered.find((p) => String(p.userId || p._id || "") === String(professionalUserId)),
    [filtered, professionalUserId]
  );

  const sessionFee = Number(selectedPro?.consultationFee || 0);

  const hasIntroChat = useMemo(() => {
    if (!professionalUserId) return false;
    return chatSessions.some(
      (s) => String(s.professionalUserId?._id || s.professionalUserId) === String(professionalUserId)
    );
  }, [chatSessions, professionalUserId]);

  const trimmedRef = paymentReference.trim();
  const amountNum = amountPaid === "" ? NaN : Number(amountPaid);
  const meetsFee = sessionFee <= 0 || (!Number.isNaN(amountNum) && amountNum >= sessionFee);

  const stepChat = Boolean(professionalUserId && hasIntroChat);
  const stepSchedule = Boolean(professionalUserId && startTime);
  const stepPayment = Boolean(trimmedRef && !Number.isNaN(amountNum) && amountNum > 0 && meetsFee);
  const stepReceipt = Boolean(paymentReceiptUrl);

  const canSubmitBooking =
    stepChat &&
    stepSchedule &&
    stepPayment &&
    stepReceipt &&
    !uploadingReceipt &&
    meetsFee &&
    trimmedRef.length > 0;

  const steps = [
    { key: "chat", label: "Intro chat", hint: "Connect once before payment", ok: stepChat },
    { key: "slot", label: "Session slot", hint: "Choose date & time", ok: stepSchedule },
    { key: "pay", label: "Payment details", hint: refLine(sessionFee), ok: stepPayment },
    { key: "recv", label: "Receipt upload", hint: "Screenshot or PDF", ok: stepReceipt },
  ];

  function refLine(fee) {
    if (!professionalUserId) return "Txn ID & amount paid";
    if (fee <= 0) return "Txn ID & amount (fee not listed)";
    return `Min ${fee} • reference & amount`;
  }

  const handleReceiptChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!professionalUserId) {
      setReceiptUploadErr("Choose a psychiatrist first.");
      return;
    }
    if (!hasIntroChat) {
      setReceiptUploadErr("Start your intro chat before uploading a receipt.");
      return;
    }
    setReceiptUploadErr("");
    setUploadingReceipt("upload");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("professionalUserId", professionalUserId);
      const data = await professionalApi.uploadAppointmentReceipt(fd, token);
      setPaymentReceiptUrl(data?.receiptUrl || "");
    } catch (err) {
      setReceiptUploadErr(err?.message || "Upload failed.");
      setPaymentReceiptUrl("");
    } finally {
      setUploadingReceipt("");
    }
  };

  const onStartIntro = async () => {
    if (!professionalUserId) return;
    setChatOpening(true);
    setBookError("");
    try {
      await useAppStore.getState().openChatSession({ professionalUserId }, token);
      await loadChatSessions(token);
    } catch (e) {
      setBookError(e?.message || "Could not open chat.");
    } finally {
      setChatOpening(false);
    }
  };

  const onBook = async () => {
    if (!canSubmitBooking) return;
    setBookError("");
    try {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + 50 * 60 * 1000);
      await bookAppointment(
        {
          professionalUserId,
          mode: "ONLINE",
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          paymentStatus: "PAID",
          paymentReference: trimmedRef,
          amountPaid: amountNum,
          paymentReceiptUrl,
          notes:
            "Client submitted pre-session payment reference, receipt attachment, and requested session approval.",
        },
        token
      );
      setPaymentReference("");
      setAmountPaid("");
      setPaymentReceiptUrl("");
      setBookSuccess(true);
    } catch (e) {
      setBookError(e?.message || "Could not submit request.");
    }
  };

  const connectedProfessionals = useMemo(() => {
    const confirmed = (client.appointments || []).filter((a) => a.status === "CONFIRMED");
    const map = new Map();
    confirmed.forEach((a) => {
      const id = String(a.professionalUserId?._id || a.professionalUserId || "");
      if (!id) return;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: a.professionalUserId?.name || "Professional",
          lastSession: a.startTime,
        });
      }
    });
    return [...map.values()];
  }, [client.appointments]);

  const submitReview = async (professionalId) => {
    const row = reviewByProfessional[professionalId] || {};
    if (!row.rating) return;
    await professionalApi.createReview(
      professionalId,
      { rating: Number(row.rating), comment: row.comment || "" },
      token
    );
    setReviewByProfessional((prev) => ({ ...prev, [professionalId]: { rating: "", comment: "" } }));
  };

  const initials = (name) => {
    const parts = String(name || "P").trim().split(/\s+/).slice(0, 2);
    return parts.map((s) => s.charAt(0).toUpperCase()).join("") || "P";
  };

  return (
    <ClientShell title="Find a Professional">
      <header className="mb-8">
        <h2 className="font-h1 text-h1 text-on-background mb-2 tracking-tight">Find a psychiatrist</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Every listed clinician is verification-approved. Secure intro chat → payment verification → booking.
        </p>
      </header>

      {bookSuccess ? (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/8 px-4 py-4 text-sm text-on-surface"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-semibold text-on-surface">Request sent</p>
            <p className="mt-1 text-on-surface-variant">
              Your psychiatrist will review payment and confirm the session. You will see updates under Appointments.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              onClick={() => navigate("/client/appointments")}
            >
              View appointments <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <section className="mb-6 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm md:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Directory</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {filtered.length} verified psychiatrist{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            className={`${inputClass} pl-10`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or specialization…"
          />
        </div>
      </section>

      <section className="mb-8 overflow-hidden rounded-2xl border border-outline-variant/40 bg-gradient-to-b from-surface-container-lowest to-surface-container-low/30 shadow-md">
        <div className="border-b border-outline-variant/35 bg-surface-container-lowest/80 px-5 py-4 md:px-6 md:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="font-h3 text-h3 text-on-surface">Request a session</h3>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
            Follow the steps below. Payments are acknowledged only after your psychiatrist reviews your receipt and notes.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.key}
                className={`flex gap-3 rounded-xl border px-3 py-3 transition-colors ${
                  s.ok
                    ? "border-primary/35 bg-primary/6"
                    : "border-outline-variant/45 bg-surface-container-lowest/90"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {s.ok ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
                  ) : (
                    <Circle className="h-5 w-5 text-outline-variant" aria-hidden />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Step {i + 1}
                  </p>
                  <p className="text-sm font-semibold text-on-surface">{s.label}</p>
                  <p className="text-xs text-on-surface-variant">{s.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[1fr_280px] md:gap-8 md:p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">Psychiatrist</label>
              <select
                className={inputClass}
                value={professionalUserId}
                onChange={(e) => setProfessionalUserId(e.target.value)}
              >
                <option value="">Select from directory</option>
                {filtered.map((p) => {
                  const id = String(p.userId || p._id || "");
                  const fee = Number(p.consultationFee || 0);
                  return (
                    <option key={id} value={id}>
                      {(p.name || p.displayName || "Professional") +
                        (p.specialization ? ` — ${p.specialization}` : "") +
                        (fee > 0 ? ` · ${fee}/session` : "")}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">Preferred start</label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    className={`${inputClass} pl-10`}
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={!professionalUserId}
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface px-4 text-sm font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high disabled:pointer-events-none disabled:opacity-45"
                  onClick={onStartIntro}
                  disabled={!professionalUserId || chatOpening}
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
                  {chatOpening ? "Connecting…" : hasIntroChat ? "Open intro chat again" : "Start intro chat"}
                </button>
              </div>
            </div>

            {professionalUserId && !hasIntroChat ? (
              <p className="rounded-xl border border-tertiary-container/40 bg-tertiary-container/15 px-3 py-2 text-xs text-on-surface">
                Intro chat reduces fraud and aligns expectations. Tap <strong>Start intro chat</strong>, send a brief
                hello, then return here.
              </p>
            ) : null}

            <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/95 p-4">
              <div className="mb-3 flex items-center gap-2 text-on-surface">
                <Upload className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-semibold">Payment receipt</span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                className="block w-full cursor-pointer rounded-xl border border-dashed border-outline-variant/70 bg-background/80 px-3 py-3 text-xs file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-on-primary hover:border-primary/30"
                disabled={!professionalUserId || !hasIntroChat || uploadingReceipt === "upload"}
                onChange={handleReceiptChange}
              />
              {uploadingReceipt === "upload" ? (
                <p className="mt-2 text-xs font-medium text-primary">Uploading…</p>
              ) : null}
              {paymentReceiptUrl ? (
                <a
                  href={publicFileUrl(paymentReceiptUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  View uploaded file
                </a>
              ) : null}
              {receiptUploadErr ? <p className="mt-2 text-xs text-error">{receiptUploadErr}</p> : null}
              <p className="mt-3 text-[11px] leading-relaxed text-on-surface-variant">
                JPG, PNG, WebP, GIF, or PDF · up to 12 MB
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                  Payment reference / transaction ID
                </label>
                <input
                  className={inputClass}
                  placeholder="e.g. bank ref, gateway ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  disabled={!professionalUserId}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-on-surface-variant">Amount paid</label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={sessionFee > 0 ? `Minimum ${sessionFee}` : "Amount"}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  disabled={!professionalUserId}
                />
                {professionalUserId && sessionFee > 0 && !meetsFee && !Number.isNaN(amountNum) ? (
                  <p className="mt-1 text-xs text-error">Amount must be at least the listed session fee.</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                className="inline-flex min-h-[44px] min-w-[180px] items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary shadow-md transition-[transform,opacity] hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                onClick={onBook}
                disabled={!canSubmitBooking || loading}
              >
                Submit booking request
                <ArrowRight className="h-4 w-4" />
              </button>
              {bookError ? <span className="text-sm text-error">{bookError}</span> : null}
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-outline-variant/50 bg-surface-bright p-4 shadow-inner md:sticky md:top-28">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Summary</p>
            {selectedPro ? (
              <>
                <div className="mt-3 flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-sm font-bold text-on-surface">
                    {initials(selectedPro.name || selectedPro.displayName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-on-surface">
                      {selectedPro.name || selectedPro.displayName}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {selectedPro.specialization || "Psychiatry"}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 border-t border-outline-variant/30 pt-4 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-on-surface-variant">Listed fee</dt>
                    <dd className="font-medium text-on-surface">
                      {sessionFee > 0 ? `${sessionFee}` : "Not specified"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-on-surface-variant">Intro chat</dt>
                    <dd className="font-medium text-on-surface">{hasIntroChat ? "Done" : "Required"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-on-surface-variant">Receipt</dt>
                    <dd className="font-medium text-on-surface">{paymentReceiptUrl ? "Uploaded" : "Needed"}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="mt-3 text-sm text-on-surface-variant">Pick a clinician to see session details.</p>
            )}
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-outline-variant py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
              onClick={() => navigate("/client/chat")}
            >
              Go to Messages
            </button>
          </aside>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const name = p.name || p.displayName || "Professional";
          const specialization = p.specialization || p.category || "Mental Health Specialist";
          const bio = p.bio || p.description || "Approved psychiatrist available for clinical consultations.";
          const id = p.userId || p._id || "";
          const sessionFeeCard = Number(p.consultationFee || 0);

          return (
            <article
              key={p._id || p.userId || p.email}
              className="flex h-full flex-col rounded-2xl border border-outline-variant/35 bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-base font-semibold text-on-surface">
                    {initials(name)}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface-container-lowest bg-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-h3 text-h3 truncate text-on-surface">{name}</h4>
                  <p className="text-sm text-on-surface-variant">{specialization}</p>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                  Verified
                </span>
              </div>

              <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-on-surface-variant">{bio}</p>
              <div className="mb-4 flex items-baseline justify-between gap-2 border-t border-outline-variant/25 pt-4">
                <span className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">Session fee</span>
                <span className="text-lg font-semibold tabular-nums text-on-surface">
                  {sessionFeeCard > 0 ? `${sessionFeeCard}` : "—"}
                </span>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-outline-variant/25 pt-3">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <Star className="h-4 w-4 fill-current text-tertiary" />
                  <span className="text-sm font-semibold text-on-surface">{p.rating ?? "New"}</span>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-on-primary shadow-sm transition-opacity hover:opacity-95"
                  onClick={() => {
                    setProfessionalUserId(String(id));
                    if (!startTime) {
                      const next = new Date(Date.now() + 60 * 60 * 1000);
                      next.setMinutes(0, 0, 0);
                      setStartTime(new Date(next.getTime() - next.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                    }
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Video className="h-3.5 w-3.5" />
                  Use for booking
                </button>
              </div>
            </article>
          );
        })}
      </section>
      {!filtered.length ? (
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low px-5 py-6 text-center text-sm text-on-surface-variant">
          No matches. Try another search term.
        </div>
      ) : null}

      <section className="mt-8 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
        <h3 className="font-h3 text-h3 text-on-surface">Your care team</h3>
        <p className="mt-1 text-sm text-on-surface-variant">Confirmed psychiatrists — leave structured feedback anytime.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {connectedProfessionals.map((pro) => {
            const draft = reviewByProfessional[pro.id] || {};
            return (
              <article
                key={pro.id}
                className="rounded-xl border border-outline-variant/35 bg-surface p-5 shadow-sm"
              >
                <p className="font-semibold text-on-surface">{pro.name}</p>
                <p className="text-xs text-on-surface-variant">
                  Last session: {pro.lastSession ? new Date(pro.lastSession).toLocaleString() : "—"}
                </p>
                <div className="mt-4 grid gap-2">
                  <select
                    className={inputClass}
                    value={draft.rating || ""}
                    onChange={(e) =>
                      setReviewByProfessional((prev) => ({
                        ...prev,
                        [pro.id]: { ...(prev[pro.id] || {}), rating: e.target.value },
                      }))
                    }
                  >
                    <option value="">Rating</option>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} stars
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputClass}
                    placeholder="Comment (optional)"
                    value={draft.comment || ""}
                    onChange={(e) =>
                      setReviewByProfessional((prev) => ({
                        ...prev,
                        [pro.id]: { ...(prev[pro.id] || {}), comment: e.target.value },
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-outline-variant px-3 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                    onClick={() => submitReview(pro.id)}
                  >
                    Submit review
                  </button>
                </div>
              </article>
            );
          })}
          {!connectedProfessionals.length ? (
            <p className="text-sm text-on-surface-variant md:col-span-2">
              After a booking is accepted, your psychiatrist appears here for ongoing reviews.
            </p>
          ) : null}
        </div>
      </section>

      {loading ? <p className="mt-4 text-sm font-medium text-primary">Updating…</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}
