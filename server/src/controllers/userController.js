const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const userService = require("../services/userService");
const recommendationService = require("../services/recommendationService");
const notificationService = require("../services/notificationService");

const getMe = asyncHandler(async (req, res) => {
  const data = await userService.getMyProfile(req.user._id);
  res.json({ success: true, data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const data = await userService.updateMyProfile(req.user._id, req.body);
  res.json({ success: true, data });
});

const createGoal = asyncHandler(async (req, res) => {
  const data = await userService.createGoal(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

const listGoals = asyncHandler(async (req, res) => {
  const data = await userService.listGoals(req.user._id);
  res.json({ success: true, data });
});

const updateGoal = asyncHandler(async (req, res) => {
  const data = await userService.updateGoal(req.user._id, req.params.id, req.body);
  res.json({ success: true, data });
});

const recommendGoalsTasks = asyncHandler(async (req, res) => {
  const data = await recommendationService.recommendForClientUser(req.user._id, req.body);
  res.json({ success: true, data });
});

const createTask = asyncHandler(async (req, res) => {
  const data = await userService.createTask(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

const listTasks = asyncHandler(async (req, res) => {
  const data = await userService.listTasks(req.user._id);
  res.json({ success: true, data });
});

const updateTask = asyncHandler(async (req, res) => {
  const data = await userService.updateTask(req.user._id, req.params.id, req.body);
  res.json({ success: true, data });
});

const createMoodSurvey = asyncHandler(async (req, res) => {
  const data = await userService.createMoodSurvey(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

const listMoodSurveys = asyncHandler(async (req, res) => {
  const data = await userService.listMoodSurveys(req.user._id);
  res.json({ success: true, data });
});

const createMedicationLog = asyncHandler(async (req, res) => {
  const data = await userService.createMedicationLog(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

const listMedicationLogs = asyncHandler(async (req, res) => {
  const data = await userService.listMedicationLogs(req.user._id);
  res.json({ success: true, data });
});

const createComplaint = asyncHandler(async (req, res) => {
  const data = await userService.createComplaint(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

const listMyComplaints = asyncHandler(async (req, res) => {
  const data = await userService.listMyComplaints(req.user._id);
  res.json({ success: true, data });
});

const listNotifications = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const data = await notificationService.listForUser(req.user._id, { limit });
  res.json({ success: true, data });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markRead(req.user._id, req.params.id);
  if (!data) throw new ApiError(404, "Notification not found");
  res.json({ success: true, data });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAllRead(req.user._id);
  res.json({ success: true, data });
});

const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const count = await notificationService.countUnread(req.user._id);
  res.json({ success: true, data: { count } });
});

module.exports = {
  getMe,
  updateProfile,
  createGoal,
  listGoals,
  updateGoal,
  recommendGoalsTasks,
  createTask,
  listTasks,
  updateTask,
  createMoodSurvey,
  listMoodSurveys,
  createMedicationLog,
  listMedicationLogs,
  createComplaint,
  listMyComplaints,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
};

