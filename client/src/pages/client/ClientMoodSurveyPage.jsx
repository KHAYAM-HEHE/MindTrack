import { useEffect, useState } from "react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

export default function ClientMoodSurveyPage() {
  const token = useAuthStore((s) => s.token);
  const { client, loadClientData, createMood, loading, error } = useAppStore();
  const [score, setScore] = useState(7);
  const [reflection, setReflection] = useState("");
  const [sleep, setSleep] = useState("FAIR");
  const [emotions, setEmotions] = useState(["Calm", "Happy"]);
  const [anxietyScore, setAnxietyScore] = useState(4);
  const [stressScore, setStressScore] = useState(4);
  const [focusScore, setFocusScore] = useState(6);
  const [socialConnectionScore, setSocialConnectionScore] = useState(6);
  const [irritabilityScore, setIrritabilityScore] = useState(3);

  useEffect(() => {
    if (token) loadClientData(token);
  }, [token, loadClientData]);

  const toggleEmotion = (label) => {
    setEmotions((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]));
  };

  const submittedToday = client.moods.some((item) => {
    const d = new Date(item.surveyDate || item.createdAt);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  const submit = async () => {
    if (submittedToday) return;
    await createMood(
      {
        mood: "CHECK_IN",
        score,
        anxietyScore,
        stressScore,
        focusScore,
        socialConnectionScore,
        irritabilityScore,
        reflection,
        sleepQuality: sleep,
        emotions,
      },
      token
    );
    setReflection("");
  };

  return (
    <ClientShell title="Daily Mood Survey">
      <div className="mb-8 text-center">
        <span className="mb-3 inline-block rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-on-surface-variant">
          Daily Check-In
        </span>
        <h3 className="text-2xl font-bold leading-snug text-on-background sm:text-3xl md:text-4xl">
          How are you feeling today?
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-on-surface-variant">
          DMS is submitted once per day and includes detailed clinical questions for meaningful trend analysis.
        </p>
        {submittedToday ? (
          <p className="mx-auto mt-3 max-w-2xl rounded-lg bg-secondary-container/40 px-4 py-2 text-sm text-on-surface">
            You have already submitted today&apos;s Daily Mood Survey.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-6 md:col-span-12">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h4 className="text-lg font-semibold text-on-surface sm:text-xl">Energy & Mood Level</h4>
              <p className="text-sm text-on-surface-variant">Slide to indicate your overall energy today.</p>
            </div>
            <p className="shrink-0 self-start rounded-full bg-surface-container-low px-3 py-1 text-sm font-semibold text-primary sm:self-center">
              Score: {score}
            </p>
          </div>
          <input
            className="w-full accent-primary"
            type="range"
            min="1"
            max="10"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
          />
          <div className="mt-2 flex justify-between text-xs text-on-surface-variant">
            <span>Depleted (1)</span>
            <span>Balanced (5)</span>
            <span>Energized (10)</span>
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-6 md:col-span-7">
          <h4 className="mb-1 text-xl font-semibold text-on-surface">Current Emotions</h4>
          <p className="mb-4 text-sm text-on-surface-variant">Select all that apply.</p>
          <div className="flex flex-wrap gap-2">
            {["Calm", "Happy", "Focused", "Grateful", "Tired", "Distracted", "Anxious", "Overwhelmed", "Sad"].map(
              (label) => {
                const active = emotions.includes(label);
                return (
                  <button
                    key={label}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      active
                        ? "border-primary-container bg-primary-container text-on-primary-container"
                        : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                    onClick={() => toggleEmotion(label)}
                  >
                    {label}
                  </button>
                );
              }
            )}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-6 md:col-span-5">
          <h4 className="mb-4 text-xl font-semibold text-on-surface">Sleep Quality</h4>
          <div className="space-y-2">
            {[
              { value: "POOR", label: "Poor (< 5 hours)" },
              { value: "FAIR", label: "Fair (5-7 hours)" },
              { value: "GOOD", label: "Good (7+ hours)" },
            ].map((item) => (
              <label key={item.value} className="flex items-center gap-2 text-sm text-on-surface">
                <input
                  type="radio"
                  name="sleep"
                  checked={sleep === item.value}
                  onChange={() => setSleep(item.value)}
                  className="accent-primary"
                />
                {item.label}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-6 md:col-span-12">
          <h4 className="mb-2 text-xl font-semibold text-on-surface">Detailed DMS Questions</h4>
          <p className="mb-4 text-sm text-on-surface-variant">
            Rate each area from 1 (very low) to 10 (very high) to support better analysis.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Anxiety intensity", value: anxietyScore, set: setAnxietyScore },
              { label: "Stress load", value: stressScore, set: setStressScore },
              { label: "Focus and concentration", value: focusScore, set: setFocusScore },
              { label: "Social connectedness", value: socialConnectionScore, set: setSocialConnectionScore },
              { label: "Irritability", value: irritabilityScore, set: setIrritabilityScore },
            ].map((item) => (
              <label key={item.label} className="text-sm text-on-surface">
                <span className="mb-1 block">{item.label}: {item.value}</span>
                <input
                  className="w-full accent-primary"
                  type="range"
                  min="1"
                  max="10"
                  value={item.value}
                  onChange={(e) => item.set(Number(e.target.value))}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-6 md:col-span-12">
          <label className="mb-2 block text-xl font-semibold text-on-surface">Daily Reflection (Optional)</label>
          <textarea
            className="w-full rounded-lg border border-outline-variant bg-background p-3 text-on-surface"
            rows={4}
            placeholder="Today I noticed that..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />
          <div className="mt-4 flex justify-end">
            <button className="rounded-xl bg-primary px-5 py-2 text-on-primary disabled:opacity-50" onClick={submit} disabled={submittedToday}>
              Complete Check-In
            </button>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-2">
        {client.moods.slice(0, 8).map((item) => (
          <div
            key={item._id}
            className="rounded border border-outline-variant/30 bg-surface-container-low p-2 text-sm text-on-surface"
          >
            Score: {item.score ?? "-"} | Sleep: {item.sleepQuality || "-"} | Emotions:{" "}
            {(item.emotions || []).join(", ") || "-"}
          </div>
        ))}
      </div>
      {loading ? <p className="mt-2 text-sm text-primary">Syncing...</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}
