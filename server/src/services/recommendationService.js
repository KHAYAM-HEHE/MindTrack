const Goal = require("../models/Goal");
const Task = require("../models/Task");
const MoodSurvey = require("../models/MoodSurvey");

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct:free";

const buildMoodSummary = (moods) => {
  if (!moods?.length) return "";
  return moods
    .map((m) => {
      const d = m.surveyDate ? new Date(m.surveyDate).toISOString().slice(0, 10) : "";
      const parts = [];
      const moodVal = m.moodScore != null ? m.moodScore : m.extraFields?.score;
      if (moodVal != null) parts.push(`mood ${moodVal}/10`);
      if (m.anxietyScore != null) parts.push(`anxiety ${m.anxietyScore}/10`);
      if (m.stressScore != null) parts.push(`stress ${m.stressScore}/10`);
      if (m.notes) parts.push(`note: ${String(m.notes).slice(0, 120)}`);
      return `${d}: ${parts.join(", ")}`;
    })
    .join(" | ");
};

const buildClientContext = async (clientUserId) => {
  const [goals, tasks, moods] = await Promise.all([
    Goal.find({ userId: clientUserId }).sort({ createdAt: -1 }).limit(12).lean(),
    Task.find({ userId: clientUserId }).sort({ createdAt: -1 }).limit(20).lean(),
    MoodSurvey.find({ userId: clientUserId }).sort({ surveyDate: -1 }).limit(6).lean(),
  ]);
  return { goals, tasks, moods, moodSummary: buildMoodSummary(moods) };
};

const parseJsonFromContent = (text) => {
  if (!text) return null;
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  return JSON.parse(trimmed.slice(start, end + 1));
};

const normalizeResult = (raw) => {
  const longTermGoals = (raw.longTermGoals || raw.goals || []).map((g) => ({
    title: String(g.title || "").trim(),
    description: g.description ? String(g.description).trim() : "",
    horizon: "LONG_TERM",
  })).filter((g) => g.title);

  const dailyTasks = (raw.dailyTasks || raw.tasks || []).map((t) => ({
    title: String(t.title || "").trim(),
    frequency: ["DAILY", "WEEKLY", "MONTHLY"].includes(t.frequency) ? t.frequency : "DAILY",
    suggestedGoalHint: t.suggestedGoalHint ? String(t.suggestedGoalHint).trim() : "",
  })).filter((t) => t.title);

  return { longTermGoals, dailyTasks };
};

const fallbackRecommend = ({ focusArea, notes, existingGoals, existingTasks }) => {
  const focus = (focusArea || "wellbeing").trim() || "wellbeing";
  const avoidGoals = new Set((existingGoals || []).map((s) => String(s).toLowerCase()));
  const avoidTasks = new Set((existingTasks || []).map((s) => String(s).toLowerCase()));

  const poolGoals = [
    { title: `Sustainable progress on: ${focus}`, description: "Break this into weekly milestones you can review with your clinician." },
    { title: "Build consistent sleep and energy habits", description: "Anchor wake time and wind-down routines to support mood and focus." },
    { title: "Strengthen social confidence step by step", description: "Use graded exposure with small, repeatable social situations." },
  ];
  const poolTasks = [
    { title: "15 minutes of journaling or mood tracking", frequency: "DAILY", suggestedGoalHint: "Self-awareness" },
    { title: "One focused study or work block (45–90 min)", frequency: "DAILY", suggestedGoalHint: "Academic or career focus" },
    { title: "Short walk or movement break", frequency: "DAILY", suggestedGoalHint: "Energy and stress" },
    { title: "Reach out to one person (text or in person)", frequency: "DAILY", suggestedGoalHint: "Social connection" },
    { title: "Practice one anxiety-management skill (breathing, grounding)", frequency: "DAILY", suggestedGoalHint: "Symptom management" },
  ];

  const longTermGoals = poolGoals.filter((g) => !avoidGoals.has(g.title.toLowerCase())).slice(0, 3);
  const dailyTasks = poolTasks.filter((t) => !avoidTasks.has(t.title.toLowerCase())).slice(0, 5);

  if (notes) {
    longTermGoals.unshift({
      title: `Address your stated priority: ${notes.slice(0, 80)}${notes.length > 80 ? "…" : ""}`,
      description: "Translate this priority into small weekly actions and daily habits.",
      horizon: "LONG_TERM",
    });
  }

  return {
    longTermGoals: longTermGoals.slice(0, 4),
    dailyTasks,
    engine: "fallback",
  };
};

const openAiRecommend = async ({ focusArea, notes, existingGoals, existingTasks, moodSummary }) => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");

  const system = `You are a clinical support assistant for a mental health app. Suggest realistic, ethical, non-diagnostic goals and habits.
Return ONLY valid JSON with this shape:
{
  "longTermGoals": [ { "title": string, "description": string } ],
  "dailyTasks": [ { "title": string, "frequency": "DAILY"|"WEEKLY"|"MONTHLY", "suggestedGoalHint": string } ]
}
Rules:
- longTermGoals are multi-week or multi-month outcomes (e.g. GPA, social anxiety exposure).
- dailyTasks are concrete same-day actions (study block, conversations, skills practice).
- No medical prescriptions or crisis handling; encourage professional care when needed.
- 2–4 longTermGoals and 4–7 dailyTasks.`;

  const userMsg = [
    `Focus area: ${focusArea || "general wellbeing"}`,
    notes ? `User/clinician notes: ${notes}` : "",
    existingGoals?.length ? `Existing goals (avoid duplicates): ${existingGoals.join("; ")}` : "",
    existingTasks?.length ? `Existing tasks (avoid duplicates): ${existingTasks.join("; ")}` : "",
    moodSummary ? `Recent mood context: ${moodSummary}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText || "OpenAI request failed";
    throw new Error(msg);
  }

  const content = data?.choices?.[0]?.message?.content;
  const parsed = typeof content === "string" ? parseJsonFromContent(content) : content;
  if (!parsed) throw new Error("Invalid model response");

  const normalized = normalizeResult(parsed);
  return { ...normalized, engine: "openai" };
};

const openRouterRecommend = async ({ focusArea, notes, existingGoals, existingTasks, moodSummary }) => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Missing OPENROUTER_API_KEY");

  const system = `You are a clinical support assistant for a mental health app. Suggest realistic, ethical, non-diagnostic goals and habits.
Return ONLY valid JSON with this shape:
{
  "longTermGoals": [ { "title": string, "description": string } ],
  "dailyTasks": [ { "title": string, "frequency": "DAILY"|"WEEKLY"|"MONTHLY", "suggestedGoalHint": string } ]
}
Rules:
- longTermGoals are multi-week or multi-month outcomes (e.g. GPA, social anxiety exposure).
- dailyTasks are concrete same-day actions (study block, conversations, skills practice).
- No medical prescriptions or crisis handling; encourage professional care when needed.
- 2–4 longTermGoals and 4–7 dailyTasks.`;

  const userMsg = [
    `Focus area: ${focusArea || "general wellbeing"}`,
    notes ? `User/clinician notes: ${notes}` : "",
    existingGoals?.length ? `Existing goals (avoid duplicates): ${existingGoals.join("; ")}` : "",
    existingTasks?.length ? `Existing tasks (avoid duplicates): ${existingTasks.join("; ")}` : "",
    moodSummary ? `Recent mood context: ${moodSummary}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5000",
      "X-Title": process.env.OPENROUTER_APP_NAME || "MindTrack",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText || "OpenRouter request failed";
    throw new Error(msg);
  }

  const content = data?.choices?.[0]?.message?.content;
  const parsed = typeof content === "string" ? parseJsonFromContent(content) : content;
  if (!parsed) throw new Error("Invalid model response");

  const normalized = normalizeResult(parsed);
  return { ...normalized, engine: "openrouter" };
};

/**
 * @param {{ focusArea?: string, notes?: string, existingGoals?: string[], existingTasks?: string[], moodSummary?: string }} params
 */
const recommendGoalsAndTasks = async (params) => {
  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await openRouterRecommend(params);
    } catch (err) {
      console.error("[recommendations] OpenRouter failed:", err.message);
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      return await openAiRecommend(params);
    } catch (err) {
      console.error("[recommendations] OpenAI failed:", err.message);
    }
  }
  return fallbackRecommend(params);
};

/**
 * Client self-service: uses own goals/tasks/moods as context.
 */
const recommendForClientUser = async (userId, body) => {
  const ctx = await buildClientContext(userId);
  const focusArea = body?.focusArea || body?.focus || "general wellbeing";
  const notes = body?.notes || "";
  return recommendGoalsAndTasks({
    focusArea,
    notes,
    existingGoals: ctx.goals.map((g) => g.title),
    existingTasks: ctx.tasks.map((t) => t.title),
    moodSummary: ctx.moodSummary,
  });
};

module.exports = {
  buildClientContext,
  recommendGoalsAndTasks,
  recommendForClientUser,
};
