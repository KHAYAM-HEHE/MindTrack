import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

function isDone(task) {
  return task?.completionStatus === "DONE";
}

function toDayKey(value) {
  const d = new Date(value || Date.now());
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatShortDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const {
    client,
    loadClientData,
    updateTask,
    fetchAiQuote,
    fetchNotificationUnreadCount,
    notificationUnreadCount,
    loading,
    error,
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!token) return;
    loadClientData(token);
    fetchNotificationUnreadCount(token);
    fetchAiQuote(token).catch(() => {});
  }, [token, loadClientData, fetchNotificationUnreadCount, fetchAiQuote]);

  const taskDoneSummary = useMemo(() => {
    const total = client.tasks.length;
    const done = client.tasks.filter((t) => isDone(t)).length;
    return { done, total };
  }, [client.tasks]);

  const nextAppointment = useMemo(() => {
    const items = [...(client.appointments || [])].sort(
      (a, b) => new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime()
    );
    return items.find((a) => ["PENDING", "CONFIRMED"].includes(a.status || "PENDING")) || null;
  }, [client.appointments]);

  const moodSeries = useMemo(() => {
    const byDay = new Map();
    const orderedDays = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      return toDayKey(d.toISOString());
    });
    orderedDays.forEach((key) => byDay.set(key, []));

    client.moods.forEach((m) => {
      const key = toDayKey(m.surveyDate || m.createdAt);
      if (!byDay.has(key)) return;
      const score = Number(m.moodScore ?? m.score);
      if (Number.isFinite(score)) byDay.get(key).push(score);
    });

    return orderedDays.map((key) => {
      const values = byDay.get(key);
      const average = values?.length ? values.reduce((acc, v) => acc + v, 0) / values.length : 0;
      return {
        key,
        label: new Date(key).toLocaleDateString([], { weekday: "short" }),
        score: Number(average.toFixed(1)),
      };
    });
  }, [client.moods]);

  const averageMood = useMemo(() => {
    const valid = client.moods.map((m) => Number(m.moodScore ?? m.score)).filter((v) => Number.isFinite(v));
    if (!valid.length) return 0;
    return Number((valid.reduce((acc, v) => acc + v, 0) / valid.length).toFixed(1));
  }, [client.moods]);

  const quoteType = client.aiQuote?.quoteType || profile?.preferences?.quoteType || "SECULAR";
  const aiQuote = client.aiQuote || {
    quote: "Progress is built through small, intentional actions repeated consistently.",
    tip: averageMood >= 7 ? "Your trend is improving. Build on that momentum with one focused step." : "Start with one stable habit today and keep your check-in consistent.",
  };
  const visibleTasks = useMemo(() => {
    if (!searchQuery.trim()) return client.tasks.slice(0, 4);
    const q = searchQuery.toLowerCase();
    return client.tasks.filter((t) => String(t.title || t.name || "").toLowerCase().includes(q)).slice(0, 4);
  }, [client.tasks, searchQuery]);

  const moodDelta = moodSeries.length >= 2 ? Number((moodSeries[moodSeries.length - 1].score - moodSeries[0].score).toFixed(1)) : 0;
  const todayLabel = new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" });

  return (
    <ClientShell title="Client Dashboard">
      <div className="space-y-6">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-on-surface">Welcome back, {user?.name || "Client"}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">Professional overview powered by your live care data.</p>
            </div>
            <div className="rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">{todayLabel}</div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low"
                onClick={() => navigate("/client/notifications")}
              >
                Notifications {notificationUnreadCount > 0 ? `(${notificationUnreadCount})` : ""}
              </button>
              <button
                className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low"
                onClick={() => navigate("/client/chat")}
              >
                Chat
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low text-sm font-semibold text-primary"
                onClick={() => navigate("/client/profile")}
                title="Open profile"
              >
                {(user?.name || "U").slice(0, 1).toUpperCase()}
              </button>
            </div>
          </div>
          <div className="mt-4">
            <input
              className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-sm text-on-surface"
              placeholder="Search tasks, goals, and care items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <article className="rounded-xl border border-outline-variant/30 bg-primary-container p-5 md:col-span-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-primary-container/80">AI suggestion ({quoteType})</p>
            <p className="mt-2 text-lg font-semibold text-on-primary-container">{aiQuote.quote}</p>
            <p className="mt-2 text-sm text-on-primary-container/90">{aiQuote.tip}</p>
          </article>
          <article className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm md:col-span-4">
            <p className="text-xs uppercase tracking-wide text-on-surface-variant">Next appointment</p>
            <p className="mt-2 text-base font-semibold text-on-surface">
              {nextAppointment?.professionalUserId?.name || nextAppointment?.professionalUserId?.displayName || "Not scheduled"}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">{formatShortDate(nextAppointment?.startTime)}</p>
            <button className="mt-4 rounded-lg bg-primary px-3 py-2 text-sm text-on-primary" onClick={() => navigate("/client/appointments")}>
              Open appointments
            </button>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-on-surface">Mood trend (last 7 days)</h4>
              <span className="text-xs text-on-surface-variant">Avg: {averageMood || "-"}/10</span>
            </div>
            <div className="flex h-44 items-end gap-2 rounded-lg border border-outline-variant/20 bg-background p-3">
              {moodSeries.map((point) => {
                const height = Math.max(10, Math.round((point.score / 10) * 100));
                return (
                  <div key={point.key} className="flex flex-1 flex-col items-center justify-end gap-1">
                    <div className="w-full rounded-t bg-primary/85" style={{ height: `${height}%` }} title={`${point.label}: ${point.score}/10`} />
                    <span className="text-[11px] text-on-surface-variant">{point.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">
              Weekly change: <span className={moodDelta >= 0 ? "text-primary" : "text-error"}>{moodDelta >= 0 ? "+" : ""}{moodDelta}</span>
            </p>
          </article>

          <article className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-on-surface">Priority tasks</h4>
              <span className="rounded-full bg-surface-container-low px-2 py-1 text-xs text-on-surface-variant">
                {taskDoneSummary.total ? `${taskDoneSummary.done}/${taskDoneSummary.total} done` : "No tasks"}
              </span>
            </div>
            <div className="space-y-2">
              {visibleTasks.length === 0 ? (
                <p className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-3 text-sm text-on-surface-variant">
                  No tasks match your search yet.
                </p>
              ) : (
                visibleTasks.map((task) => (
                  <label key={task._id} className="flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low p-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={Boolean(isDone(task))}
                      onChange={() => updateTask(task._id, { isCompleted: !isDone(task) }, token)}
                    />
                    <span className={`text-sm ${isDone(task) ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                      {task.title || task.name || "Untitled task"}
                    </span>
                  </label>
                ))
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low" onClick={() => navigate("/client/tasks")}>
                Manage tasks
              </button>
              <button className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low" onClick={() => navigate("/client/goals")}>
                View goals
              </button>
            </div>
          </article>
        </section>

        {loading ? <p className="text-sm text-primary">Syncing...</p> : null}
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    </ClientShell>
  );
}
