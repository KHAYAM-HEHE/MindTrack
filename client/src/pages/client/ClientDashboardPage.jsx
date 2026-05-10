import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import ClientSidebar from "./ClientSidebar";

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { client, loadClientData, createGoal, updateTask, createMood, loading, error } = useAppStore();
  const [goalTitle, setGoalTitle] = useState("");
  const [moodScore, setMoodScore] = useState(7);

  useEffect(() => {
    if (token) loadClientData(token);
  }, [token, loadClientData]);

  const isDone = (task) => task?.completionStatus === "DONE";
  const activeTasks = useMemo(() => client.tasks.filter((t) => !isDone(t)).slice(0, 5), [client.tasks]);
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

  const submitGoal = async () => {
    if (!goalTitle.trim()) return;
    await createGoal({ title: goalTitle }, token);
    setGoalTitle("");
  };

  return (
    <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen flex">
      {/* SideNavBar (from JSON) */}
      <div className="fixed bottom-0 left-0 top-0 z-50 hidden w-64 border-r border-outline-variant bg-surface-container-lowest p-4 shadow-sm md:block">
        <ClientSidebar sticky={false} />
      </div>
      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* TopAppBar (from JSON) */}
        <header className="sticky top-0 z-40 flex justify-between items-center w-full px-6 py-3 bg-surface-container-lowest/80 backdrop-blur-md text-primary font-body-md text-on-surface docked full-width border-b border-outline-variant/60 shadow-sm shadow-outline-variant/20">
          <div className="flex items-center gap-4 md:hidden">
            <span className="font-h3 text-h3 text-primary-container font-extrabold tracking-tight">MindWell</span>
          </div>
          <div className="hidden md:flex flex-1" />
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <input className="bg-surface-container-low border border-outline-variant text-on-surface font-body-md rounded-full py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant" placeholder="Search..." type="text" />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant">search</span>
            </div>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-95 duration-200 cursor-pointer relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-95 duration-200 cursor-pointer">
              <span className="material-symbols-outlined">chat_bubble</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-95 duration-200 cursor-pointer md:hidden">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant cursor-pointer ml-2">
              <img alt="User profile settings" className="w-full h-full object-cover" data-alt="A close up portrait of a young woman with a calm, serene expression, bathed in soft, natural morning light. The background is slightly blurred, featuring muted tones of white and slate grey, perfectly aligning with a minimalist, professional healthcare aesthetic. Her demeanor suggests clarity and composure." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHdZ8zpwkig3mKoU2p2NEZ8seehLcPd_8cwPyxWWJH3dQNS5l7vnh1bIHxv5t2hE9t5AjUESw3UiMf7drH4oABLd7y-XvbwSa877ef_e7QnuAQ0DNb9IZKvLZEgCQdOeRz00G1umosr_EpOk2HZk-oJF-pCKlVzVMLaJ39RXSTfgWjcrzn83I0JXlms1TbRVdl5rAHUk0iITbQKe35kr91xSoInW5svKdPWejkK7tQ5cWi0pQ20cKQ5Cp5EpOXbIJtG5m9WhK6uNA" />
            </div>
          </div>
        </header>
        {/* Dashboard Content */}
        <div className="flex-1 p-6 lg:p-8 max-w-container-max mx-auto w-full">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="font-h1 text-h1 text-on-surface mb-1">Good Morning, {user?.name || "there"}.</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Take a deep breath. Here is your overview for today.</p>
            </div>
            <div className="hidden sm:flex text-on-surface-variant font-label-md text-label-md bg-surface-container-highest px-4 py-2 rounded-xl items-center gap-2">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              Thursday, Oct 26
            </div>
          </div>
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Daily Mood Pulse */}
            <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-container-highest flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-h3 text-h3 text-on-surface">Daily Mood Pulse</h3>
                  <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">more_horiz</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">How are you feeling right now? Tap an icon to log your current state.</p>
                <div className="flex justify-between items-center px-4 md:px-12 py-4">
                  <button className="group flex flex-col items-center gap-2 hover:scale-110 transition-transform cursor-pointer" onClick={() => createMood({ mood: "LOW", score: 2 }, token)}>
                    <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center group-hover:shadow-md transition-shadow">
                      <span className="text-3xl">🌧️</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-error transition-colors">Low</span>
                  </button>
                  <button className="group flex flex-col items-center gap-2 hover:scale-110 transition-transform cursor-pointer" onClick={() => createMood({ mood: "OKAY", score: 5 }, token)}>
                    <div className="w-16 h-16 rounded-full bg-tertiary-fixed flex items-center justify-center group-hover:shadow-md transition-shadow">
                      <span className="text-3xl">☁️</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-tertiary-container transition-colors">Okay</span>
                  </button>
                  <button className="group flex flex-col items-center gap-2 hover:scale-110 transition-transform cursor-pointer" onClick={() => createMood({ mood: "GOOD", score: 7 }, token)}>
                    <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center group-hover:shadow-md transition-shadow ring-2 ring-primary ring-offset-2">
                      <span className="text-3xl">🌤️</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary font-bold">Good</span>
                  </button>
                  <button className="group flex flex-col items-center gap-2 hover:scale-110 transition-transform cursor-pointer" onClick={() => createMood({ mood: "GREAT", score: 9 }, token)}>
                    <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center group-hover:shadow-md transition-shadow">
                      <span className="text-3xl">☀️</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-primary-container transition-colors">Great</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Next Appointment */}
            <div className="md:col-span-4 bg-primary text-on-primary rounded-xl p-6 shadow-lg shadow-primary/30 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined" style={{fontSize: 150}}>videocam</span>
              </div>
              <h3 className="font-h3 text-h3 mb-2 relative z-10">Next Appointment</h3>
              <p className="font-body-md text-body-md text-primary-fixed mb-6 relative z-10">
                {nextAppointment ? (nextAppointment.mode || "Virtual Session") : "No upcoming session"}
              </p>
              <div className="mt-auto rounded-lg bg-on-primary/10 p-4 backdrop-blur-sm relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <img alt="Dr. Emily Chen" className="w-10 h-10 rounded-full object-cover" data-alt="A small, circular headshot portrait of a professional female therapist wearing glasses, smiling warmly against a bright, clinical white background. The lighting is soft and inviting, emphasizing a trustworthy and calming healthcare presence." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGwoqSswvcuElo3BsXgZFTyyuKODTL0OQGgUMX1N15ZJS57jLwKwKew90Pwmo5sS-r9gG1lzCH89lYSlkVZw1Hagog9aJNM1XK2a1oSuUt_fdVw-lM9I-D2bq3yXp_I73rK-CnooE8yamR2qN29emC0LI19UupIKwVSJYUsAhqsJxmDClQ1ugJBRuwfR2Jv8JHzTffouuab6L53cjqjyjpAvodBm2zNxzm1otYG92IjBqgBzNjNOFIXQzzSos488e_EOSwEbBgBDE" />
                  <div>
                    <p className="font-label-md text-label-md">
                      {nextAppointment?.professionalUserId?.name || nextAppointment?.professionalUserId || "TBD Professional"}
                    </p>
                    <p className="font-label-sm text-label-sm text-primary-fixed">
                      {nextAppointment ? (nextAppointment.status || "PENDING") : "Not booked"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span className="font-label-sm text-label-sm">{nextAppointment?.startTime || "Not scheduled"}</span>
                  </div>
                  <button className="bg-on-primary text-primary px-3 py-1 rounded-full font-label-sm text-label-sm hover:bg-primary-fixed transition-colors" onClick={() => navigate("/client/appointments")}>
                    Open
                  </button>
                </div>
              </div>
            </div>
            {/* Daily Goals */}
            <div className="md:col-span-6 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-container-highest">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">checklist</span>
                  Daily Goals
                </h3>
                <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-1 rounded-full uppercase">
                  {taskDoneSummary.total ? `${taskDoneSummary.done}/${taskDoneSummary.total} done` : "No tasks"}
                </span>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                {(client.tasks || []).slice(0, 3).map((task) => (
                  <label key={task._id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer border ${isDone(task) ? "bg-surface-container-low border-outline-variant" : "bg-surface-container-highest border-outline-variant"}`}>
                    <input
                      checked={Boolean(isDone(task))}
                      onChange={() => updateTask(task._id, { isCompleted: !isDone(task) }, token)}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 bg-surface-container-lowest"
                      type="checkbox"
                    />
                    <span className={`font-body-md text-body-md ${isDone(task) ? "text-on-surface-variant line-through" : "text-on-surface font-medium"}`}>
                      {task.title || task.name || task._id}
                    </span>
                  </label>
                ))}
              </div>
              <button className="mt-4 w-full py-2 flex items-center justify-center gap-1 text-primary hover:bg-surface-container-low rounded-lg transition-colors font-label-md text-label-md" onClick={() => navigate("/client/tasks")}>
                <span className="material-symbols-outlined text-sm">add</span> Manage tasks
              </button>
            </div>
            {/* Mood Trends Mini Chart */}
            <div className="md:col-span-6 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-container-highest flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">trending_up</span>
                  Mood Trends
                </h3>
                <select className="bg-surface-container-low border-none text-on-surface-variant font-label-sm text-label-sm rounded-lg py-1 pl-2 pr-8 focus:ring-0 cursor-pointer">
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
              </div>
              <div className="flex-1 w-full h-40 relative flex items-end justify-between px-2 pb-6 pt-4 border-b border-outline-variant/30">
                {/* Abstract Line Chart Visualization */}
                <div className="absolute inset-0 top-4 bottom-6 left-2 right-2">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="chartGradient" x1={0} x2={0} y1={0} y2={1}>
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <path d="M0,80 C20,80 30,40 50,50 C70,60 80,20 100,30 L100,100 L0,100 Z" fill="url(#chartGradient)" />
                    <path
                      d="M0,80 C20,80 30,40 50,50 C70,60 80,20 100,30"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                    />
                    {/* Data Points */}
                    <circle cx={50} cy={50} fill="var(--color-surface-container-lowest)" r={4} stroke="var(--color-primary)" strokeWidth={2} />
                    <circle cx={100} cy={30} fill="var(--color-surface-container-lowest)" r={4} stroke="var(--color-primary)" strokeWidth={2} />
                  </svg>
                </div>
                {/* X Axis Labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-on-surface-variant font-label-sm text-label-sm px-2">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-body-md text-body-md text-on-surface-variant">Your mood has improved by <span className="text-primary font-bold">12%</span> this week.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <section className="fixed bottom-4 right-4 z-50 w-[360px] rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-xl">
        <h3 className="mb-2 text-sm font-semibold text-on-surface">Live Backend Data</h3>
        <p className="mb-2 text-xs text-on-surface-variant">
          Goals: {client.goals.length} | Tasks: {client.tasks.length} | Appointments: {client.appointments.length}
        </p>
        <div className="mb-2 flex gap-2">
          <input
            className="flex-1 rounded border border-outline-variant bg-background px-2 py-1 text-xs text-on-surface"
            placeholder="New goal title"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
          />
          <button className="rounded bg-primary px-2 py-1 text-xs text-on-primary" onClick={submitGoal}>
            Add
          </button>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <input
            className="w-16 rounded border border-outline-variant bg-background px-2 py-1 text-xs text-on-surface"
            type="number"
            min="1"
            max="10"
            value={moodScore}
            onChange={(e) => setMoodScore(Number(e.target.value))}
          />
          <button
            className="rounded bg-secondary px-2 py-1 text-xs text-on-secondary"
            onClick={() => createMood({ mood: "CHECK_IN", score: moodScore }, token)}
          >
            Log Mood
          </button>
        </div>
        <div className="max-h-28 space-y-1 overflow-auto">
          {activeTasks.map((task) => (
            <button
              key={task._id}
              className="block w-full rounded bg-surface-container-high px-2 py-1 text-left text-xs text-on-surface hover:bg-surface-container-highest"
              onClick={() => updateTask(task._id, { isCompleted: true }, token)}
            >
              Mark done: {task.title || task.name || task._id}
            </button>
          ))}
        </div>
        {loading ? <p className="mt-2 text-xs text-primary">Syncing...</p> : null}
        {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
      </section>
    </div>
    
  );
}
