const Task = require("../models/Task");
const MoodSurvey = require("../models/MoodSurvey");
const MedicationLog = require("../models/MedicationLog");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const Appointment = require("../models/Appointment");
const ProfessionalVerification = require("../models/ProfessionalVerification");
const ReportSnapshot = require("../models/ReportSnapshot");
const { VERIFICATION_STATUS } = require("../utils/constants");
const ApiError = require("../utils/ApiError");
const { generateSimpleInsights } = require("./aiService");

const getDateRange = (period) => {
  const end = new Date();
  const start = new Date();
  if (period === "daily") start.setDate(start.getDate() - 1);
  if (period === "weekly") start.setDate(start.getDate() - 7);
  if (period === "monthly") start.setMonth(start.getMonth() - 1);
  if (period === "yearly") start.setFullYear(start.getFullYear() - 1);
  return { start, end };
};

const dayKey = (value) => new Date(value).toISOString().slice(0, 10);

const buildReport = async (userId, period) => {
  const { start, end } = getDateRange(period);
  const moods = await MoodSurvey.find({ userId, surveyDate: { $gte: start, $lte: end } })
    .sort({ surveyDate: 1 })
    .lean();

  const moodAverage = moods.length
    ? Number((moods.reduce((sum, item) => sum + (item.moodScore || 0), 0) / moods.length).toFixed(2))
    : 0;
  const anxietyAverage = moods.length
    ? Number((moods.reduce((sum, item) => sum + (item.anxietyScore || 0), 0) / moods.length).toFixed(2))
    : 0;
  const stressAverage = moods.length
    ? Number((moods.reduce((sum, item) => sum + (item.stressScore || 0), 0) / moods.length).toFixed(2))
    : 0;
  const sleepQualityCounts = moods.reduce((acc, item) => {
    const key = item.extraFields?.sleepQuality || "UNSPECIFIED";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const detailedQuestionAverages = (() => {
    const keys = ["focusScore", "socialConnectionScore", "irritabilityScore"];
    return keys.reduce((acc, key) => {
      const list = moods
        .map((item) => Number(item.extraFields?.[key]))
        .filter((v) => Number.isFinite(v));
      acc[key] = list.length
        ? Number((list.reduce((sum, v) => sum + v, 0) / list.length).toFixed(2))
        : 0;
      return acc;
    }, {});
  })();

  const dailySeries = (() => {
    const map = new Map();
    moods.forEach((m) => {
      const key = dayKey(m.surveyDate || m.createdAt);
      const entry = map.get(key) || { mood: [], anxiety: [], stress: [] };
      const mood = Number(m.moodScore || 0);
      const anxiety = Number(m.anxietyScore || 0);
      const stress = Number(m.stressScore || 0);
      if (Number.isFinite(mood)) entry.mood.push(mood);
      if (Number.isFinite(anxiety) && anxiety > 0) entry.anxiety.push(anxiety);
      if (Number.isFinite(stress) && stress > 0) entry.stress.push(stress);
      map.set(key, entry);
    });
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({
        date,
        moodAverage: v.mood.length ? Number((v.mood.reduce((s, x) => s + x, 0) / v.mood.length).toFixed(2)) : 0,
        anxietyAverage: v.anxiety.length ? Number((v.anxiety.reduce((s, x) => s + x, 0) / v.anxiety.length).toFixed(2)) : 0,
        stressAverage: v.stress.length ? Number((v.stress.reduce((s, x) => s + x, 0) / v.stress.length).toFixed(2)) : 0,
      }));
  })();

  return {
    period,
    reportType: "DMS",
    from: start,
    to: end,
    totals: {
      moodEntries: moods.length,
      dmsDaysCovered: new Set(moods.map((m) => new Date(m.surveyDate).toISOString().slice(0, 10))).size,
    },
    metrics: {
      moodAverage,
      anxietyAverage,
      stressAverage,
      detailedQuestionAverages,
    },
    breakdown: {
      sleepQualityCounts,
      dailySeries,
    },
    insights: generateSimpleInsights({
      moodAverage,
      completionRate: 0,
    }),
  };
};

const buildMedicationImpactReport = async (userId, period = "monthly") => {
  const { start, end } = getDateRange(period);
  const [moods, meds] = await Promise.all([
    MoodSurvey.find({ userId, surveyDate: { $gte: start, $lte: end } }),
    MedicationLog.find({ userId, intakeTime: { $gte: start, $lte: end } }),
  ]);
  const medsByDay = new Map();
  meds.forEach((m) => {
    const key = new Date(m.intakeTime || m.createdAt).toISOString().slice(0, 10);
    const entry = medsByDay.get(key) || { total: 0, taken: 0, names: new Set() };
    entry.total += 1;
    if (m.adherenceStatus !== "MISSED") entry.taken += 1;
    if (m.medicationName) entry.names.add(m.medicationName);
    medsByDay.set(key, entry);
  });
  const moodsByDay = new Map();
  moods.forEach((m) => {
    const key = new Date(m.surveyDate || m.createdAt).toISOString().slice(0, 10);
    const entry = moodsByDay.get(key) || [];
    const score = Number(m.moodScore || 0);
    if (Number.isFinite(score)) entry.push(score);
    moodsByDay.set(key, entry);
  });
  const overlapDays = [...moodsByDay.keys()].filter((d) => medsByDay.has(d));
  const dayComparisons = overlapDays.map((day) => {
    const m = medsByDay.get(day);
    const moodScores = moodsByDay.get(day) || [];
    const moodAverage = moodScores.length
      ? Number((moodScores.reduce((sum, v) => sum + v, 0) / moodScores.length).toFixed(2))
      : 0;
    const adherenceRate = m.total ? Math.round((m.taken / m.total) * 100) : 0;
    return { day, moodAverage, adherenceRate };
  });
  const medicationImpactScore = dayComparisons.length
    ? Number(
        (
          dayComparisons.reduce((sum, d) => sum + d.moodAverage * (d.adherenceRate / 100), 0) /
          dayComparisons.length
        ).toFixed(2)
      )
    : 0;
  const moodOnHighAdherenceDays = dayComparisons.filter((d) => d.adherenceRate >= 80).map((d) => d.moodAverage);
  const moodOnLowAdherenceDays = dayComparisons.filter((d) => d.adherenceRate < 80).map((d) => d.moodAverage);
  const highAvg = moodOnHighAdherenceDays.length
    ? Number((moodOnHighAdherenceDays.reduce((s, v) => s + v, 0) / moodOnHighAdherenceDays.length).toFixed(2))
    : 0;
  const lowAvg = moodOnLowAdherenceDays.length
    ? Number((moodOnLowAdherenceDays.reduce((s, v) => s + v, 0) / moodOnLowAdherenceDays.length).toFixed(2))
    : 0;

  const perMedicationImpact = (() => {
    const medsMap = new Map();
    meds.forEach((m) => {
      const name = String(m.medicationName || "Unspecified").trim();
      const key = dayKey(m.intakeTime || m.createdAt);
      const medEntry = medsMap.get(name) || { byDay: new Map(), logs: 0 };
      const dayEntry = medEntry.byDay.get(key) || { total: 0, taken: 0 };
      dayEntry.total += 1;
      if (m.adherenceStatus !== "MISSED") dayEntry.taken += 1;
      medEntry.byDay.set(key, dayEntry);
      medEntry.logs += 1;
      medsMap.set(name, medEntry);
    });

    return [...medsMap.entries()].map(([name, info]) => {
      const trend = [...info.byDay.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, adherence]) => {
          const moodsForDay = moodsByDay.get(date) || [];
          const moodAverage = moodsForDay.length
            ? Number((moodsForDay.reduce((s, x) => s + x, 0) / moodsForDay.length).toFixed(2))
            : 0;
          const adherenceRate = adherence.total ? Math.round((adherence.taken / adherence.total) * 100) : 0;
          return { date, adherenceRate, moodAverage };
        });

      const overlap = trend.filter((t) => t.moodAverage > 0);
      const impactScore = overlap.length
        ? Number((overlap.reduce((s, t) => s + t.moodAverage * (t.adherenceRate / 100), 0) / overlap.length).toFixed(2))
        : 0;

      return {
        medicationName: name,
        logs: info.logs,
        overlapDays: overlap.length,
        impactScore,
        trend,
      };
    });
  })();

  return {
    period: "medication-impact",
    reportType: "MEDICATION",
    from: start,
    to: end,
    totals: {
      moodEntries: moods.length,
      medicationLogs: meds.length,
      overlapDays: overlapDays.length,
    },
    metrics: {
      medicationImpactScore,
      moodOnHighAdherenceDays: highAvg,
      moodOnLowAdherenceDays: lowAvg,
      adherenceSensitiveDelta: Number((highAvg - lowAvg).toFixed(2)),
    },
    breakdown: {
      dayComparisons,
      medicationsTracked: [...new Set(meds.map((m) => m.medicationName).filter(Boolean))],
      perMedicationImpact,
    },
    insights: [
      `Medication impact score is ${medicationImpactScore}.`,
      `Average DMS mood on high-adherence days is ${highAvg}, versus ${lowAvg} on lower-adherence days.`,
      "This report tracks medication influence on DMS only; task completion is calculated separately.",
    ],
  };
};

const buildPlatformReport = async () => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const [
    usersByRole,
    newUsersThisWeek,
    complaintsByStatus,
    appointmentsByStatus,
    pendingVerifications,
    tasksCreatedWeek,
    moodEntriesWeek,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ProfessionalVerification.countDocuments({ status: VERIFICATION_STATUS.PENDING }),
    Task.countDocuments({ createdAt: { $gte: weekAgo } }),
    MoodSurvey.countDocuments({ surveyDate: { $gte: weekAgo } }),
  ]);

  return {
    generatedAt: now,
    window: { from: weekAgo, to: now },
    usersByRole: Object.fromEntries(usersByRole.map((x) => [x._id, x.count])),
    newUsersThisWeek,
    complaintsByStatus: Object.fromEntries(complaintsByStatus.map((x) => [x._id, x.count])),
    appointmentsByStatus: Object.fromEntries(appointmentsByStatus.map((x) => [x._id, x.count])),
    pendingVerifications,
    activityThisWeek: {
      tasksCreated: tasksCreatedWeek,
      moodSurveyEntries: moodEntriesWeek,
    },
    insights: (() => {
      const text = generateSimpleInsights({ moodAverage: 0, completionRate: 0 });
      return typeof text === "string" ? [text] : Array.isArray(text) ? text : [String(text)];
    })(),
  };
};

const listReportSnapshots = async (query = {}) => {
  const p = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const lim = Math.min(Math.max(1, parseInt(String(query.limit || "20"), 10) || 20), 100);
  const sk = (p - 1) * lim;
  const filter = {};
  if (query.periodType) filter.periodType = query.periodType;
  const [items, total] = await Promise.all([
    ReportSnapshot.find(filter).sort({ createdAt: -1 }).skip(sk).limit(lim).populate("userId", "name email role").lean(),
    ReportSnapshot.countDocuments(filter),
  ]);
  return { items, total, page: p, limit: lim };
};

const saveAdminReportSnapshot = async (actorUserId, body) => {
  const { periodType = "MONTHLY", reportPayload = {}, periodStart, periodEnd } = body;
  const allowed = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
  if (!allowed.includes(periodType)) {
    throw new ApiError(400, `periodType must be one of: ${allowed.join(", ")}`);
  }
  return ReportSnapshot.create({
    userId: actorUserId,
    periodType,
    periodStart: periodStart ? new Date(periodStart) : new Date(),
    periodEnd: periodEnd ? new Date(periodEnd) : new Date(),
    reportPayload,
  });
};

module.exports = {
  buildReport,
  buildMedicationImpactReport,
  buildPlatformReport,
  listReportSnapshots,
  saveAdminReportSnapshot,
};

