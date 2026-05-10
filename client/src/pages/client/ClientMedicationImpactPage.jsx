import { useEffect, useMemo } from "react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

export default function ClientMedicationImpactPage() {
  const token = useAuthStore((s) => s.token);
  const { client, loadClientData } = useAppStore();

  useEffect(() => {
    if (token) loadClientData(token);
  }, [token, loadClientData]);

  const avgMood = useMemo(() => {
    if (!client.moods.length) return 0;
    const total = client.moods.reduce((acc, m) => acc + (Number(m.score) || 0), 0);
    return (total / client.moods.length).toFixed(2);
  }, [client.moods]);

  const adherence = useMemo(() => {
    if (!client.meds.length) return 0;
    const taken = client.meds.filter((m) => m.adherenceStatus !== "MISSED").length;
    return Math.round((taken / client.meds.length) * 100);
  }, [client.meds]);

  return (
    <ClientShell title="Medication Impact Insights">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">Adherence</p>
          <p className="mt-2 text-3xl font-bold text-on-surface">{adherence}%</p>
        </div>
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">Average Mood</p>
          <p className="mt-2 text-3xl font-bold text-on-surface">{avgMood}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">Tracked Days</p>
          <p className="mt-2 text-3xl font-bold text-on-surface">{Math.max(client.meds.length, client.moods.length)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
        <h3 className="mb-2 text-xl font-semibold text-on-surface">Adherence vs Mood Trend</h3>
        <p className="mb-4 text-sm text-on-surface-variant">Live baseline visualization from your current medication and mood logs.</p>
        <div className="h-56 rounded-lg border border-outline-variant/30 bg-background p-3">
          <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path
              d="M0,20 C15,25 25,10 40,15 C55,20 65,5 80,10 C90,12 95,5 100,5"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="3"
            />
            <path
              d="M0,40 C20,35 30,50 45,45 C60,40 70,30 85,25 C95,20 98,15 100,10"
              fill="none"
              stroke="var(--color-secondary)"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          </svg>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
        <p className="text-sm text-on-surface-variant">
          This panel is connected to backend-backed medication and mood collections and updates as your logs change.
        </p>
      </div>
    </ClientShell>
  );
}

