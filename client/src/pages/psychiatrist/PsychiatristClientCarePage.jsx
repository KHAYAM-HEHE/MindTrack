import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { professionalApi } from "../../api/professionalApi";
import { PsychiatristShell } from "./PsychiatristShell";

const GOAL_STATUSES = ["ACTIVE", "COMPLETED", "ARCHIVED"];

export default function PsychiatristClientCarePage() {
  const token = useAuthStore((s) => s.token);
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [goalForm, setGoalForm] = useState({ title: "", description: "", horizon: "LONG_TERM" });
  const [taskForm, setTaskForm] = useState({ title: "", frequency: "DAILY", goalId: "" });
  const [aiFocus, setAiFocus] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      try {
        const list = await professionalApi.listMyClients(token);
        if (!cancelled) setClients(list || []);
      } catch {
        if (!cancelled) setClients([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const loadCare = useCallback(async (cid) => {
    if (!token || !cid) return;
    setLoading(true);
    setError("");
    try {
      const data = await professionalApi.getClientGoalsTasks(cid, token);
      setGoals(data?.goals || []);
      setTasks(data?.tasks || []);
    } catch (e) {
      setError(e.message || "Could not load client care plan");
      setGoals([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!clientId || !token) return;
    const timer = setTimeout(() => {
      loadCare(clientId);
    }, 0);
    return () => clearTimeout(timer);
  }, [clientId, token, loadCare]);

  const goalOptions = useMemo(() => goals.filter((g) => g.status === "ACTIVE"), [goals]);

  const addGoal = async (e) => {
    e.preventDefault();
    if (!goalForm.title.trim() || !clientId || !token) return;
    await professionalApi.createClientGoal(
      clientId,
      {
        title: goalForm.title.trim(),
        description: goalForm.description.trim() || undefined,
        horizon: goalForm.horizon,
      },
      token
    );
    setGoalForm({ title: "", description: "", horizon: "LONG_TERM" });
    await loadCare(clientId);
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !clientId || !token) return;
    await professionalApi.createClientTask(
      clientId,
      {
        title: taskForm.title.trim(),
        frequency: taskForm.frequency,
        goalId: taskForm.goalId || undefined,
      },
      token
    );
    setTaskForm({ title: "", frequency: "DAILY", goalId: "" });
    await loadCare(clientId);
  };

  const runAi = async () => {
    if (!clientId || !token) return;
    setAiLoading(true);
    setAiResult(null);
    setError("");
    try {
      const data = await professionalApi.recommendClientGoalsTasks(
        clientId,
        { focusArea: aiFocus.trim() || undefined, notes: aiNotes.trim() || undefined },
        token
      );
      setAiResult(data);
    } catch (e) {
      setError(e.message || "AI suggestions failed");
    } finally {
      setAiLoading(false);
    }
  };

  const adoptAiGoal = async (g) => {
    if (!clientId || !token) return;
    await professionalApi.createClientGoal(
      clientId,
      { title: g.title, description: g.description || "", horizon: "LONG_TERM" },
      token
    );
    await loadCare(clientId);
  };

  const adoptAiTask = async (t) => {
    if (!clientId || !token) return;
    await professionalApi.createClientTask(
      clientId,
      { title: t.title, frequency: t.frequency || "DAILY" },
      token
    );
    await loadCare(clientId);
  };

  const patchGoalStatus = async (goalId, status) => {
    if (!clientId || !token) return;
    await professionalApi.updateClientGoal(clientId, goalId, { status }, token);
    await loadCare(clientId);
  };

  return (
    <PsychiatristShell
      title="Goals & tasks"
      subtitle="Long-term goals and daily tasks for clients with confirmed sessions"
    >
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm md:flex-row md:items-end">
        <div className="min-w-[240px] flex-1">
          <label className="mb-1 block text-xs font-medium text-on-surface-variant">Client</label>
          <select
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
            value={clientId}
            onChange={(e) => {
              const nextId = e.target.value;
              setClientId(nextId);
              if (!nextId) {
                setGoals([]);
                setTasks([]);
              }
            }}
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name || c.email || c._id}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-on-surface-variant md:max-w-md">
          Only clients with psychiatrist-verified and confirmed appointments appear here.
        </p>
      </div>

      {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
          <h3 className="font-h3 text-h3 text-on-surface">Assign long-term goal</h3>
          <p className="mt-1 text-sm text-on-surface-variant">Examples: academic targets, exposure milestones, stability goals.</p>
          <form className="mt-4 space-y-3" onSubmit={addGoal}>
            <input
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              placeholder="Goal title"
              value={goalForm.title}
              onChange={(e) => setGoalForm((s) => ({ ...s, title: e.target.value }))}
            />
            <textarea
              className="min-h-[72px] w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              placeholder="Optional description"
              value={goalForm.description}
              onChange={(e) => setGoalForm((s) => ({ ...s, description: e.target.value }))}
            />
            <select
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              value={goalForm.horizon}
              onChange={(e) => setGoalForm((s) => ({ ...s, horizon: e.target.value }))}
            >
              <option value="LONG_TERM">Long-term</option>
              <option value="SHORT_TERM">Short-term (weeks)</option>
            </select>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40" disabled={!clientId}>
              Add goal
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
          <h3 className="font-h3 text-h3 text-on-surface">Assign daily task</h3>
          <p className="mt-1 text-sm text-on-surface-variant">Concrete actions (study block, walk, social exposure).</p>
          <form className="mt-4 space-y-3" onSubmit={addTask}>
            <input
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm((s) => ({ ...s, title: e.target.value }))}
            />
            <select
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              value={taskForm.frequency}
              onChange={(e) => setTaskForm((s) => ({ ...s, frequency: e.target.value }))}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            <select
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              value={taskForm.goalId}
              onChange={(e) => setTaskForm((s) => ({ ...s, goalId: e.target.value }))}
            >
              <option value="">Link to goal (optional)</option>
              {goalOptions.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.title}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40" disabled={!clientId}>
              Add task
            </button>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-outline-variant/30 bg-surface-container-low p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="font-h3 text-h3 text-on-surface">AI-assisted suggestions</h3>
            <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
              Uses recent mood check-ins and existing goals/tasks when available. Set{" "}
              <code className="rounded bg-surface-container-high px-1 text-xs">OPENROUTER_API_KEY</code> on the server for
              full AI quality; otherwise built-in templates apply.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low disabled:opacity-40"
            disabled={!clientId || aiLoading}
            onClick={runAi}
          >
            {aiLoading ? "Generating…" : "Generate suggestions"}
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
            placeholder="Focus (e.g. social anxiety, GPA, sleep)"
            value={aiFocus}
            onChange={(e) => setAiFocus(e.target.value)}
          />
          <input
            className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
            placeholder="Extra clinical notes (optional)"
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
          />
        </div>
        {aiResult ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-outline">Suggested long-term goals</p>
              <ul className="space-y-3">
                {(aiResult.longTermGoals || []).map((g, i) => (
                  <li key={`${g.title}-${i}`} className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3">
                    <p className="font-medium text-on-surface">{g.title}</p>
                    {g.description ? <p className="mt-1 text-sm text-on-surface-variant">{g.description}</p> : null}
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-primary hover:underline"
                      disabled={!clientId}
                      onClick={() => adoptAiGoal(g)}
                    >
                      Add to client plan
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-outline">Suggested daily tasks</p>
              <ul className="space-y-3">
                {(aiResult.dailyTasks || []).map((t, i) => (
                  <li key={`${t.title}-${i}`} className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3">
                    <p className="font-medium text-on-surface">{t.title}</p>
                    <p className="text-xs text-on-surface-variant">{t.frequency || "DAILY"} · {t.suggestedGoalHint || "—"}</p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-primary hover:underline"
                      disabled={!clientId}
                      onClick={() => adoptAiTask(t)}
                    >
                      Add to client plan
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
        {aiResult?.engine ? (
          <p className="mt-4 text-[11px] text-on-surface-variant">Engine: {aiResult.engine}</p>
        ) : null}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
          <h3 className="mb-4 font-h3 text-h3 text-on-surface">Client long-term goals</h3>
          {loading ? <p className="text-sm text-on-surface-variant">Loading…</p> : null}
          {!clientId ? <p className="text-sm text-on-surface-variant">Select a client.</p> : null}
          {clientId && !loading && goals.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No goals yet.</p>
          ) : null}
          <ul className="space-y-3">
            {goals.map((g) => (
              <li key={g._id} className="rounded-lg border border-outline-variant/40 bg-surface p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-on-surface">{g.title}</p>
                    <p className="text-xs text-on-surface-variant">
                      {g.horizon === "SHORT_TERM" ? "Short-term" : "Long-term"} · {g.source || "SELF"}
                    </p>
                  </div>
                  <select
                    className="rounded border border-outline-variant bg-surface-container-lowest px-2 py-1 text-xs text-on-surface"
                    value={g.status}
                    onChange={(e) => patchGoalStatus(g._id, e.target.value)}
                  >
                    {GOAL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                {g.description ? <p className="mt-2 text-sm text-on-surface-variant">{g.description}</p> : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
          <h3 className="mb-4 font-h3 text-h3 text-on-surface">Client daily tasks</h3>
          <p className="mb-3 text-xs text-on-surface-variant">
            Completion is tracked by the client. You can review and plan tasks, but cannot mark them done.
          </p>
          {loading ? <p className="text-sm text-on-surface-variant">Loading…</p> : null}
          {!clientId ? <p className="text-sm text-on-surface-variant">Select a client.</p> : null}
          {clientId && !loading && tasks.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No tasks yet.</p>
          ) : null}
          <ul className="space-y-2">
            {tasks.map((t) => {
              const done = t.completionStatus === "DONE";
              const linked = t.goalId?.title || t.goalId;
              return (
                <li key={t._id} className="flex items-center justify-between gap-2 rounded-lg border border-outline-variant/40 bg-surface p-3">
                  <div className="min-w-0">
                    <p className={`truncate font-medium ${done ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                      {t.title}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {t.frequency || "DAILY"}
                      {linked ? ` · Goal: ${typeof linked === "object" ? linked.title : ""}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${done ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                    {done ? "Client completed" : "Pending"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </PsychiatristShell>
  );
}
