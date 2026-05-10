const asyncHandler = require("../utils/asyncHandler");
const professionalService = require("../services/professionalService");
const recommendationService = require("../services/recommendationService");

const listProfessionals = asyncHandler(async (_req, res) => {
  const data = await professionalService.listProfessionals();
  res.json({ success: true, data });
});

const upsertProfile = asyncHandler(async (req, res) => {
  const data = await professionalService.upsertProfessionalProfile(
    req.user._id,
    req.body
  );
  res.json({ success: true, data });
});

const getMyProfile = asyncHandler(async (req, res) => {
  const data = await professionalService.getMyProfessionalProfile(req.user._id);
  res.json({ success: true, data });
});

const submitVerification = asyncHandler(async (req, res) => {
  const data = await professionalService.submitVerification(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

const getMyVerificationStatus = asyncHandler(async (req, res) => {
  const data = await professionalService.getMyVerificationStatus(req.user._id);
  res.json({ success: true, data });
});

const createAppointment = asyncHandler(async (req, res) => {
  const data = await professionalService.createAppointmentForRole(req.user, req.body);
  res.status(201).json({ success: true, data });
});

const listMyClients = asyncHandler(async (req, res) => {
  const data = await professionalService.listClientsForProfessional(req.user._id);
  res.json({ success: true, data });
});

const getClientGoalsAndTasks = asyncHandler(async (req, res) => {
  const data = await professionalService.listClientGoalsAndTasks(req.user._id, req.params.clientUserId);
  res.json({ success: true, data });
});

const createClientGoal = asyncHandler(async (req, res) => {
  const data = await professionalService.createGoalForClient(
    req.user._id,
    req.params.clientUserId,
    req.body
  );
  res.status(201).json({ success: true, data });
});

const createClientTask = asyncHandler(async (req, res) => {
  const data = await professionalService.createTaskForClient(
    req.user._id,
    req.params.clientUserId,
    req.body
  );
  res.status(201).json({ success: true, data });
});

const updateClientGoal = asyncHandler(async (req, res) => {
  const data = await professionalService.updateGoalForClient(
    req.user._id,
    req.params.clientUserId,
    req.params.goalId,
    req.body
  );
  res.json({ success: true, data });
});

const updateClientTask = asyncHandler(async (req, res) => {
  const data = await professionalService.updateTaskForClient(
    req.user._id,
    req.params.clientUserId,
    req.params.taskId,
    req.body
  );
  res.json({ success: true, data });
});

const recommendClientGoalsTasks = asyncHandler(async (req, res) => {
  await professionalService.assertProfessionalClientRelationship(req.user._id, req.params.clientUserId);
  const ctx = await recommendationService.buildClientContext(req.params.clientUserId);
  const data = await recommendationService.recommendGoalsAndTasks({
    focusArea: req.body.focusArea || req.body.focus || "general wellbeing",
    notes: req.body.notes || "",
    existingGoals: ctx.goals.map((g) => g.title),
    existingTasks: ctx.tasks.map((t) => t.title),
    moodSummary: ctx.moodSummary,
  });
  res.json({ success: true, data });
});

const listAppointments = asyncHandler(async (req, res) => {
  const data = await professionalService.listAppointments(req.user._id);
  res.json({ success: true, data });
});

const toggleChatLock = asyncHandler(async (req, res) => {
  const data = await professionalService.toggleChatLock(
    req.user._id,
    req.params.id,
    req.body.isLocked
  );
  res.json({ success: true, data });
});

const listIncomingRequests = asyncHandler(async (req, res) => {
  const data = await professionalService.listIncomingRequests(req.user._id);
  res.json({ success: true, data });
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const data = await professionalService.updateAppointmentStatus(
    req.user._id,
    req.params.id,
    req.body.status
  );
  res.json({ success: true, data });
});

const getProfessionalById = asyncHandler(async (req, res) => {
  const data = await professionalService.getProfessionalById(req.params.id);
  res.json({ success: true, data });
});

const listExternalAppointments = asyncHandler(async (req, res) => {
  const data = await professionalService.listExternalAppointments(req.user._id);
  res.json({ success: true, data });
});

const createExternalAppointment = asyncHandler(async (req, res) => {
  const data = await professionalService.createExternalAppointment(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

const updateExternalAppointmentStatus = asyncHandler(async (req, res) => {
  const data = await professionalService.updateExternalAppointmentStatus(
    req.user._id,
    req.params.id,
    req.body.status
  );
  res.json({ success: true, data });
});

const listReviewsForProfessional = asyncHandler(async (req, res) => {
  const data = await professionalService.listReviewsForProfessional(req.params.professionalUserId);
  res.json({ success: true, data });
});

const createReview = asyncHandler(async (req, res) => {
  const data = await professionalService.createReview(
    req.params.professionalUserId,
    req.user._id,
    req.body
  );
  res.status(201).json({ success: true, data });
});

module.exports = {
  listProfessionals,
  upsertProfile,
  getMyProfile,
  submitVerification,
  getMyVerificationStatus,
  createAppointment,
  listMyClients,
  getClientGoalsAndTasks,
  createClientGoal,
  createClientTask,
  updateClientGoal,
  updateClientTask,
  recommendClientGoalsTasks,
  listAppointments,
  toggleChatLock,
  listIncomingRequests,
  updateAppointmentStatus,
  getProfessionalById,
  listExternalAppointments,
  createExternalAppointment,
  updateExternalAppointmentStatus,
  listReviewsForProfessional,
  createReview,
};

