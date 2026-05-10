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

const buildReport = async (userId, period) => {
  const { start, end } = getDateRange(period);
  const [tasks, moods, meds] = await Promise.all([
    Task.find({ userId, createdAt: { $gte: start, $lte: end } }),
    MoodSurvey.find({ userId, surveyDate: { $gte: start, $lte: end } }),
    MedicationLog.find({ userId, intakeTime: { $gte: start, $lte: end } }),
  ]);

  const done = tasks.filter((t) => t.completionStatus === "DONE").length;
  const completionRate = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const moodAverage = moods.length
    ? Number(
        (
          moods.reduce((sum, item) => sum + (item.moodScore || 0), 0) / moods.length
        ).toFixed(2)
      )
    : 0;

  return {
    period,
    from: start,
    to: end,
    totals: {
      tasks: tasks.length,
      tasksCompleted: done,
      moodEntries: moods.length,
      medicationLogs: meds.length,
    },
    metrics: { completionRate, moodAverage },
    insights: generateSimpleInsights({ moodAverage, completionRate }),
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

module.exports = { buildReport, buildPlatformReport, listReportSnapshots, saveAdminReportSnapshot };

