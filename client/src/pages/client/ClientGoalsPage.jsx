import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

export default function ClientGoalsPage() {
  const token = useAuthStore((s) => s.token);
  const {
    client,
    loadClientData,
    createGoal,
    createTask,
    updateGoal,
    updateTask,
    fetchGoalTaskRecommendations,
    loading,
    error,
  } = useAppStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [focus, setFocus] = useState("");
  const [notes, setNotes] = useState("");
  const [rec, setRec] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    if (token) loadClientData(token);
  }, [token, loadClientData]);

  const isDone = (task) => task?.completionStatus === "DONE";
  const todayTasks = useMemo(() => client.tasks.slice(0, 10), [client.tasks]);
  const longTermGoals = useMemo(
    () => client.goals.filter((g) => (g.horizon || "LONG_TERM") === "LONG_TERM"),
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

  const addSuggestedGoal = async (g) => {
    if (!token) return;
    await createGoal(
      {
        title: g.title,
        description: g.description || "",
        horizon: "LONG_TERM",
        source: "AI",
      },
      token
    );
  };

  const addSuggestedTask = async (t) => {
    if (!token) return;
    await createTask(
      {
        title: t.title,
        frequency: t.frequency || "DAILY",
        source: "AI",
      },
      token
    );
  };

  return (
    <ClientShell title="Goals & daily habits">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h3 className="text-3xl font-bold text-on-background">Long-term goals</h3>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            Long-term goals describe where you want to be (academics, confidence, mood stability). Daily tasks live on the{" "}
            <Link to="/client/tasks" className="font-medium text-primary underline">
              Tasks
            </Link>{" "}
            page.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input
            className="rounded-xl border border-outline-variant px-3 py-2 text-on-surface"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New goal title"
          />
          <button
            className="rounded-xl bg-primary px-4 py-2 text-on-primary"
            onClick={async () => {
              if (!title.trim()) return;
              await createGoal({ title: title.trim(), description: description.trim() || undefined, horizon: "LONG_TERM" }, token);
              setTitle("");
              setDescription("");
            }}
          >
            Add goal
          </button>
        </div>
      </div>

      <textarea
        className="mb-8 min-h-[72px] w-full max-w-3xl rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
        placeholder="Optional description (why this matters, first milestone…)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="mb-10 rounded-xl border border-primary/30 bg-primary-fixed/10 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-on-surface">AI suggestions</h4>
            <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
              Personalized ideas based on your focus, notes, recent moods, and what you already track. With{" "}
              <code className="rounded bg-surface-container-high px-1 text-xs">OPENAI_API_KEY</code> on the server, responses are
              richer; otherwise you still get helpful templates.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
            disabled={recLoading}
            onClick={runRecommendations}
          >
            {recLoading ? "Thinking…" : "Get suggestions"}
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
            placeholder="Focus (e.g. GPA, social anxiety, sleep)"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
          <input
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
            placeholder="Notes for AI (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        {rec ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-outline">Suggested long-term goals</p>
              <ul className="space-y-3">
                {(rec.longTermGoals || []).map((g, i) => (
                  <li key={`${g.title}-${i}`} className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3">
                    <p className="font-medium text-on-surface">{g.title}</p>
                    {g.description ? <p className="mt-1 text-sm text-on-surface-variant">{g.description}</p> : null}
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-primary hover:underline"
                      onClick={() => addSuggestedGoal(g)}
                    >
                      Add to my goals
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-outline">Suggested daily tasks</p>
              <ul className="space-y-3">
                {(rec.dailyTasks || []).map((t, i) => (
                  <li key={`${t.title}-${i}`} className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3">
                    <p className="font-medium text-on-surface">{t.title}</p>
                    <p className="text-xs text-on-surface-variant">{t.frequency || "DAILY"}</p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-primary hover:underline"
                      onClick={() => addSuggestedTask(t)}
                    >
                      Add to my tasks
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
        {rec?.engine ? <p className="mt-4 text-[11px] text-on-surface-variant">Engine: {rec.engine}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm lg:col-span-8">
          <div className="mb-5 flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <h4 className="text-xl font-semibold text-on-surface">Recent daily tasks</h4>
            <Link to="/client/tasks" className="text-sm font-semibold text-primary hover:underline">
              Open task planner
            </Link>
          </div>

          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No tasks yet — add daily actions on the Tasks page.</p>
            ) : (
              todayTasks.map((task) => (
                <div
                  key={task._id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isDone(task) ? "border-primary-container/40 bg-primary-fixed/20" : "border-outline-variant/30 bg-surface-container-lowest"
                  }`}
                >
                  <div>
                    <p className={`font-medium ${isDone(task) ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                      {task.title || task.name || task._id}
                    </p>
                    <p className="text-xs text-on-surface-variant">{task.frequency || "Daily"}</p>
                  </div>
                  <button
                    className="rounded-lg border border-outline-variant px-3 py-1 text-xs hover:bg-surface-container-low"
                    onClick={() => updateTask(task._id, { isCompleted: !isDone(task) }, token)}
                  >
                    {isDone(task) ? "Undo" : "Complete"}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
            <h4 className="mb-4 text-xl font-semibold text-on-surface">Your long-term goals</h4>
            <div className="space-y-4">
              {longTermGoals.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No goals added yet.</p>
              ) : (
                longTermGoals.slice(0, 10).map((goal) => (
                  <div key={goal._id} className="rounded-lg border border-outline-variant/40 bg-surface p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface">{goal.title}</p>
                        {goal.description ? (
                          <p className="mt-1 text-xs text-on-surface-variant">{goal.description}</p>
                        ) : null}
                      </div>
                      <select
                        className="shrink-0 rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-xs text-on-surface"
                        value={goal.status || "ACTIVE"}
                        onChange={(e) => updateGoal(goal._id, { status: e.target.value }, token)}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-6">
            <h5 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Weekly insight</h5>
            <p className="text-sm text-on-surface-variant">
              Tie daily tasks to one or two long-term goals so progress feels coherent. Small wins compound.
            </p>
          </div>
        </section>
      </div>

      {loading ? <p className="mt-2 text-sm text-primary">Syncing...</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}
