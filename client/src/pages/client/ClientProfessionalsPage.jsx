import { useEffect, useMemo, useState } from "react";
import { Search, Star, Video, SlidersHorizontal } from "lucide-react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

export default function ClientProfessionalsPage() {
  const token = useAuthStore((s) => s.token);
  const { client, loadClientData, bookAppointment, loading, error } = useAppStore();

  const [query, setQuery] = useState("");
  const [professionalUserId, setProfessionalUserId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [bookError, setBookError] = useState("");

  useEffect(() => {
    if (token) loadClientData(token);
  }, [token, loadClientData]);

  const filtered = useMemo(() => {
    if (!query.trim()) return client.professionals;
    const q = query.toLowerCase();
    return client.professionals.filter((p) => (p.name || p.displayName || "").toLowerCase().includes(q));
  }, [client.professionals, query]);

  const onBook = async () => {
    if (!professionalUserId || !startTime) return;
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
        },
        token
      );
    } catch (e) {
      setBookError(e?.message || "Failed to book appointment.");
    }
  };

  const initials = (name) => {
    const parts = String(name || "P").trim().split(/\s+/).slice(0, 2);
    return parts.map((s) => s.charAt(0).toUpperCase()).join("") || "P";
  };

  return (
    <ClientShell title="Find a Professional">
      <header className="mb-6">
        <h2 className="font-h1 text-h1 text-on-background mb-2">Find a Professional</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Connect with licensed therapists and counselors suited to your mental health journey.
        </p>
      </header>

      <section className="mb-6 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
          <input
            className="w-full rounded-xl border border-outline-variant bg-background py-3 pl-10 pr-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, specialty, or keywords..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-semibold text-on-surface-variant">Filters:</span>
          <select className="rounded-xl border border-outline-variant bg-background px-3 py-2 text-sm">
            <option>Specialization</option>
          </select>
          <select className="rounded-xl border border-outline-variant bg-background px-3 py-2 text-sm">
            <option>Fee Range</option>
          </select>
          <select className="rounded-xl border border-outline-variant bg-background px-3 py-2 text-sm">
            <option>Rating</option>
          </select>
          <button className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
            <SlidersHorizontal className="h-4 w-4" />
            More Filters
          </button>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
        <h3 className="mb-3 font-h3 text-h3 text-on-surface">Quick Book</h3>
        <div className="grid gap-2 md:grid-cols-3">
          <input className="rounded-lg border border-outline-variant bg-background px-3 py-2" value={professionalUserId} onChange={(e) => setProfessionalUserId(e.target.value)} placeholder="Professional user id" />
          <input className="rounded-lg border border-outline-variant bg-background px-3 py-2" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <button className="rounded-xl bg-primary px-3 py-2 text-on-primary" onClick={onBook}>
            Book Session
          </button>
        </div>
        {bookError ? <p className="mt-2 text-xs text-error">{bookError}</p> : null}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const name = p.name || p.displayName || "Professional";
          const specialization = p.specialization || p.category || "Mental Health Specialist";
          const bio = p.bio || p.description || "Licensed professional available for online and in-person support.";
          const id = p.userId || p._id || "";

          return (
            <article key={p._id || p.userId || p.email} className="flex h-full flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-base font-semibold text-on-surface">
                    {initials(name)}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface-container-lowest bg-primary" />
                </div>
                <div>
                  <h4 className="font-h3 text-h3 text-on-surface">{name}</h4>
                  <p className="text-sm text-on-surface-variant">{specialization}</p>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold uppercase text-secondary">Verified</span>
                <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold uppercase text-secondary">Therapy</span>
              </div>

              <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-on-surface-variant">{bio}</p>

              <div className="mt-auto flex items-center justify-between border-t border-outline-variant/20 pt-3">
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <Star className="h-4 w-4 fill-current text-tertiary" />
                  <span className="text-sm font-semibold text-on-surface">{p.rating || "4.8"}</span>
                </div>
                <button
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-on-primary"
                  onClick={() => {
                    setProfessionalUserId(id);
                    if (!startTime) {
                      const next = new Date(Date.now() + 60 * 60 * 1000);
                      next.setMinutes(0, 0, 0);
                      setStartTime(new Date(next.getTime() - next.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                    }
                  }}
                >
                  <Video className="h-3.5 w-3.5" />
                  Select
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {loading ? <p className="mt-2 text-sm text-primary">Syncing...</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}
