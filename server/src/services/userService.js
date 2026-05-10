const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const Goal = require("../models/Goal");
const Task = require("../models/Task");
const MoodSurvey = require("../models/MoodSurvey");
const MedicationLog = require("../models/MedicationLog");
const Complaint = require("../models/Complaint");
const ApiError = require("../utils/ApiError");

const getMyProfile = async (userId) => {
  const [user, profile] = await Promise.all([
    User.findById(userId).select("-password"),
    UserProfile.findOne({ userId }),
  ]);
  return { user, profile };
};

const updateMyProfile = async (userId, payload) =>
  UserProfile.findOneAndUpdate({ userId }, payload, { new: true, upsert: true });

const createGoal = async (userId, payload) => Goal.create({ userId, ...payload });
const listGoals = async (userId) => Goal.find({ userId }).sort({ createdAt: -1 });
const updateGoal = async (userId, goalId, payload) =>
  Goal.findOneAndUpdate({ _id: goalId, userId }, payload, { new: true });

const createTask = async (userId, payload) => Task.create({ userId, ...payload });
const listTasks = async (userId) =>
  Task.find({ userId }).sort({ createdAt: -1 }).populate("goalId", "title status horizon");
const updateTask = async (userId, taskId, payload) =>
  Task.findOneAndUpdate({ _id: taskId, userId }, payload, { new: true });

const createMoodSurvey = async (userId, payload) => {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const existingToday = await MoodSurvey.findOne({
    userId,
    surveyDate: { $gte: dayStart, $lte: dayEnd },
  }).lean();
  if (existingToday) {
    throw new ApiError(409, "Daily Mood Survey can only be submitted once per day.");
  }

  const normalized = { ...payload };
  if (normalized.moodScore == null && normalized.score != null) {
    normalized.moodScore = normalized.score;
    delete normalized.score;
  }
  if (!normalized.notes && normalized.reflection) {
    normalized.notes = normalized.reflection;
  }
  normalized.extraFields = {
    ...(normalized.extraFields || {}),
    ...(normalized.sleepQuality ? { sleepQuality: normalized.sleepQuality } : {}),
    ...(Array.isArray(normalized.emotions) ? { emotions: normalized.emotions } : {}),
    ...(normalized.focusScore != null ? { focusScore: normalized.focusScore } : {}),
    ...(normalized.socialConnectionScore != null ? { socialConnectionScore: normalized.socialConnectionScore } : {}),
    ...(normalized.irritabilityScore != null ? { irritabilityScore: normalized.irritabilityScore } : {}),
  };
  return MoodSurvey.create({ userId, ...normalized });
};
const listMoodSurveys = async (userId) =>
  MoodSurvey.find({ userId }).sort({ surveyDate: -1 });

const createMedicationLog = async (userId, payload) =>
  MedicationLog.create({ userId, ...payload });
const listMedicationLogs = async (userId) =>
  MedicationLog.find({ userId }).sort({ intakeTime: -1 });

const createComplaint = async (userId, payload) =>
  Complaint.create({ reportedBy: userId, ...payload });

const listMyComplaints = async (userId) =>
  Complaint.find({ reportedBy: userId }).sort({ createdAt: -1 });

module.exports = {
  getMyProfile,
  updateMyProfile,
  createGoal,
  listGoals,
  updateGoal,
  createTask,
  listTasks,
  updateTask,
  createMoodSurvey,
  listMoodSurveys,
  createMedicationLog,
  listMedicationLogs,
  createComplaint,
  listMyComplaints,
};

