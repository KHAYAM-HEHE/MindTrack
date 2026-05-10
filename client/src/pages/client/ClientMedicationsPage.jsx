import { useEffect, useState } from "react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

export default function ClientMedicationsPage() {
  const token = useAuthStore((s) => s.token);
  const { client, loadClientData, createMedicationLog, loading, error } = useAppStore();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");

  useEffect(() => {
    if (token) loadClientData(token);
  }, [token, loadClientData]);

  const avgScore = client.moods.length
    ? (client.moods.reduce((acc, item) => acc + (Number(item.score) || 0), 0) / client.moods.length).toFixed(1)
    : "0.0";

  return (
    <ClientShell title="Medication & Mood Impact">
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm lg:col-span-4">
          <h3 className="mb-4 text-xl font-semibold text-on-surface">Daily Schedule</h3>
          <div className="space-y-3">
            {client.meds.length === 0 ? <p className="text-sm text-on-surface-variant">No medication logs yet.</p> : null}
            {client.meds.slice(0, 6).map((m) => (
              <div key={m._id} className="rounded-lg border border-outline-variant/30 bg-background p-3">
                <p className="text-xs text-on-surface-variant">{m.intakeTime || "Scheduled"}</p>
                <p className="font-semibold text-on-surface">{m.medicationName || m.name || "-"}</p>
                <p className="text-sm text-on-surface-variant">{m.dosage || "-"}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-8">
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="mb-1 text-xl font-semibold text-on-surface">Log Medication</h3>
            <p className="mb-4 text-sm text-on-surface-variant">Track adherence and correlate with mood trends.</p>
            <div className="grid gap-2 md:grid-cols-3">
              <input className="rounded-lg border border-outline-variant bg-background px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Medication" />
              <input className="rounded-lg border border-outline-variant bg-background px-3 py-2" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Dosage" />
              <button
                className="rounded-xl bg-primary px-3 py-2 text-on-primary"
                onClick={async () => {
                  if (!name.trim()) return;
                  await createMedicationLog({ medicationName: name, dosage }, token);
                  setName("");
                  setDosage("");
                }}
              >
                Add Log
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">Current Streak</p>
              <p className="mt-2 text-3xl font-bold text-on-surface">{client.meds.length} Days</p>
            </div>
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">Mood Correlation</p>
              <p className="mt-2 text-3xl font-bold text-on-surface">{avgScore} / 10</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-2">
        {client.meds.map((m) => (
          <div key={m._id} className="rounded border border-outline-variant/30 bg-surface-container-low p-2 text-sm text-on-surface">
            {m.medicationName || m.name || "-"} - {m.dosage || "-"}
          </div>
        ))}
      </div>
      {loading ? <p className="mt-2 text-sm text-primary">Syncing...</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}

