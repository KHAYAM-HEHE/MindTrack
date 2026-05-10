import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

export default function ClientTasksPage() {
  const token = useAuthStore((s) => s.token);
  const {
    client,
    loadClientData,
    createTask,
    updateTask,
    fetchGoalTaskRecommendations,
    loading,
    error,
  } = useAppStore();
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("DAILY");
  const [goalId, setGoalId] = useState("");
  const [focus, setFocus] = useState("");
  const [notes, setNotes] = useState("");
  const [rec, setRec] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    if (token) loadClientData(token);
  }, [token, loadClientData]);

  const isDone = (task) => task?.completionStatus === "DONE";

  const activeGoals = useMemo(
    () => (client.goals || []).filter((g) => (g.status || "ACTIVE") === "ACTIVE"),
    [client.goals]
  );

  const runRecommendations = async () => {
    if (!token) return;
    setRecLoading(true);
    setRec(null);
    try {
      const data = await fetchGoalTaskRecommendations(
        { focusArea: focus.trim() || undefined, notes: notes.trim() || undefined },
        token
      );
      setRec(data);
    } finally {
      setRecLoading(false);
    }
  };

  const adoptTask = async (t) => {
    if (!token) return;
    await createTask(
      {
        title: t.title,
        frequency: t.frequency || "DAILY",
        goalId: goalId || undefined,
        source: "AI",
      },
      token
    );
  };

  const addOwnTask = async () => {
    if (!token || !title.trim()) return;
    await createTask(
      {
        title: title.trim(),
        frequency,
        goalId: goalId || undefined,
        source: "SELF",
      },
      token
    );
    setTitle("");
  };

  return (
    <ClientShell title="Daily tasks">
      <div className="mb-6">
        <h3 className="text-3xl font-bold text-on-background">Daily tasks</h3>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Short, repeatable actions (study blocks, walks, social reps). Add your own tasks anytime, or pull ideas from AI below.
          Link tasks to a{" "}
          <Link to="/client/goals" className="font-medium text-primary underline">
            long-term goal
          </Link>{" "}
          when it helps.
        </p>
      </div>

      <section className="mb-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-on-surface">Add your own task</h4>
        <p className="mt-1 text-sm text-on-surface-variant">
          Type anything you want to repeat — yours stay labeled as self-created in your plan.
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:flex-wrap">
          <input
            className="min-w-0 flex-1 rounded-xl border border-outline-variant px-3 py-2 text-on-surface"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Study for 2 hours, call a friend, 20 min walk"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOwnTask();
              }
            }}
          />
          <select
            className="rounded-xl border border-outline-variant px-3 py-2 text-sm text-on-surface md:w-44"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          <select
            className="rounded-xl border border-outline-variant px-3 py-2 text-sm text-on-surface md:min-w-[12rem] md:max-w-xs"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
          >
            <option value="">Link to goal (optional)</option>
            {activeGoals.map((g) => (
              <option key={g._id} value={g._id}>
                {g.title}
              </option>
            ))}
          </select>
          <button type="button" className="rounded-xl bg-primary px-4 py-2 text-on-primary" onClick={addOwnTask}>
            Add my task
          </button>
        </div>
      </section>

      <div className="mb-8 rounded-xl border border-outline-variant/30 bg-surface-container-low p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-on-surface">AI task ideas</h4>
        <p className="mt-1 text-sm text-on-surface-variant">
          Generates daily-style suggestions; you can add them with one click.
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface"
            placeholder="Focus (optional)"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
          <input
            className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
            disabled={recLoading}
            onClick={runRecommendations}
          >
            {recLoading ? "…" : "Suggest tasks"}
          </button>
        </div>
        {rec?.dailyTasks?.length ? (
          <ul className="mt-4 space-y-2">
            {rec.dailyTasks.map((t, i) => (
              <li key={`${t.title}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline-variant/40 bg-surface p-3">
                <span className="text-sm text-on-surface">{t.title}</span>
                <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={() => adoptTask(t)}>
                  Add
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
        <h4 className="mb-4 text-xl font-semibold text-on-surface">Your tasks</h4>
        <div className="space-y-3">
          {client.tasks.length === 0 ? <p className="text-sm text-on-surface-variant">No tasks yet.</p> : null}
          {client.tasks.map((task) => {
            const gid = task.goalId?._id || task.goalId;
            const glabel = task.goalId?.title;
            return (
              <div
                key={task._id}
                className={`group flex items-center justify-between rounded-lg border p-3 transition-all ${
                  isDone(task)
                    ? "border-outline-variant bg-surface-container-low"
                    : "border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40 hover:bg-background"
                }`}
              >
                <div>
                  <p className={`${isDone(task) ? "line-through text-on-surface-variant" : "text-on-surface"} font-medium`}>
                    {task.title || task.name || task._id}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {task.frequency || "Daily"}
                    {glabel ? ` · Goal: ${glabel}` : gid ? " · Linked goal" : ""}
                    {task.source && task.source !== "SELF" ? ` · ${task.source === "PROFESSIONAL" ? "From provider" : "AI idea"}` : ""}
                  </p>
                </div>
                <button
                  className="rounded-lg border border-outline-variant px-3 py-1 text-xs hover:bg-surface-container-low"
                  onClick={() => updateTask(task._id, { isCompleted: !isDone(task) }, token)}
                >
                  {isDone(task) ? "Undo" : "Done"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {loading ? <p className="mt-2 text-sm text-primary">Syncing...</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}
