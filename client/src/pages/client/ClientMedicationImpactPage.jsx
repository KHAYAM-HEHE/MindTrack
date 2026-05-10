import { useEffect, useMemo } from "react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

function toDayKey(value) {
  const d = new Date(value || Date.now());
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

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

  const trendRows = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      return toDayKey(d.toISOString());
    });
    const moodByDay = new Map(days.map((d) => [d, []]));
    const medByDay = new Map(days.map((d) => [d, { total: 0, taken: 0 }]));

    client.moods.forEach((m) => {
      const key = toDayKey(m.surveyDate || m.createdAt);
      if (!moodByDay.has(key)) return;
      const score = Number(m.moodScore ?? m.score);
      if (Number.isFinite(score)) moodByDay.get(key).push(score);
    });

    client.meds.forEach((m) => {
      const key = toDayKey(m.intakeTime || m.createdAt);
      if (!medByDay.has(key)) return;
      const entry = medByDay.get(key);
      entry.total += 1;
      if (m.adherenceStatus !== "MISSED") entry.taken += 1;
    });

    return days.map((day) => {
      const moods = moodByDay.get(day);
      const med = medByDay.get(day);
      const moodAvg = moods.length ? Number((moods.reduce((acc, v) => acc + v, 0) / moods.length).toFixed(1)) : 0;
      const adherenceRate = med.total ? Math.round((med.taken / med.total) * 100) : 0;
      return {
        key: day,
        label: new Date(day).toLocaleDateString([], { weekday: "short" }),
        mood: moodAvg,
        adherence: adherenceRate,
      };
    });
  }, [client.moods, client.meds]);

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
        <p className="mb-4 text-sm text-on-surface-variant">Based on real logs from your last 7 days.</p>
        <div className="rounded-lg border border-outline-variant/30 bg-background p-4">
          <div className="grid gap-2">
            {trendRows.map((row) => (
              <div key={row.key} className="grid grid-cols-[50px_1fr] items-center gap-3">
                <span className="text-xs text-on-surface-variant">{row.label}</span>
                <div className="space-y-1">
                  <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, row.adherence))}%` }} />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.min(100, Math.max(0, row.mood * 10))}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-on-surface-variant">
            <p className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              Medication adherence %
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-secondary" />
              Mood score (scaled to 100)
            </p>
          </div>
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

