const User = require("../models/User");
const UserProfile = require("../models/UserProfile");
const Goal = require("../models/Goal");
const Task = require("../models/Task");
const MoodSurvey = require("../models/MoodSurvey");
const MedicationLog = require("../models/MedicationLog");
const Complaint = require("../models/Complaint");

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
  const normalized = { ...payload };
  if (normalized.moodScore == null && normalized.score != null) {
    normalized.moodScore = normalized.score;
    delete normalized.score;
  }
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

