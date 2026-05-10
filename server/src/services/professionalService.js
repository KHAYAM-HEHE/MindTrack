const User = require("../models/User");
const Goal = require("../models/Goal");
const Task = require("../models/Task");
const ProfessionalProfile = require("../models/ProfessionalProfile");
const ProfessionalVerification = require("../models/ProfessionalVerification");
const Appointment = require("../models/Appointment");
const ChatSession = require("../models/ChatSession");
const Review = require("../models/Review");
const ExternalAppointment = require("../models/ExternalAppointment");
const ApiError = require("../utils/ApiError");
const { VERIFICATION_STATUS } = require("../utils/constants");
const notificationService = require("./notificationService");

const listProfessionals = async () =>
  ProfessionalProfile.find().sort({ rating: -1, reviewCount: -1 });

const upsertProfessionalProfile = async (userId, payload) =>
  ProfessionalProfile.findOneAndUpdate({ userId }, payload, {
    upsert: true,
    new: true,
  });

const getMyProfessionalProfile = async (userId) =>
  ProfessionalProfile.findOne({ userId });

const submitVerification = async (userId, payload) =>
  ProfessionalVerification.create({
    professionalUserId: userId,
    ...payload,
    status: VERIFICATION_STATUS.PENDING,
  });

const getMyVerificationStatus = async (userId) => {
  const latest = await ProfessionalVerification.findOne({ professionalUserId: userId }).sort({
    createdAt: -1,
  });
  if (!latest) return { status: "NOT_SUBMITTED" };
  return latest;
};

const createAppointmentForRole = async (user, body) => {
  if (user.role === "CLIENT") {
    if (!body.professionalUserId || !body.startTime || !body.endTime) {
      throw new ApiError(400, "professionalUserId, startTime, and endTime are required");
    }
    const doc = await Appointment.create({
      clientUserId: user._id,
      professionalUserId: body.professionalUserId,
      mode: body.mode || "ONLINE",
      startTime: body.startTime,
      endTime: body.endTime,
      status: body.status || "PENDING",
    });
    const populated = await Appointment.findById(doc._id)
      .populate("clientUserId", "name email")
      .populate("professionalUserId", "name email");
    notificationService.notifyAppointmentCreated(populated, user.role).catch(() => {});
    return populated;
  }
  if (user.role === "PROFESSIONAL") {
    if (!body.clientUserId || !body.startTime || !body.endTime) {
      throw new ApiError(400, "clientUserId, startTime, and endTime are required");
    }
    const doc = await Appointment.create({
      clientUserId: body.clientUserId,
      professionalUserId: user._id,
      mode: body.mode || "ONLINE",
      startTime: body.startTime,
      endTime: body.endTime,
      status: body.status || "CONFIRMED",
    });
    const populatedPro = await Appointment.findById(doc._id)
      .populate("clientUserId", "name email")
      .populate("professionalUserId", "name email");
    notificationService.notifyAppointmentCreated(populatedPro, user.role).catch(() => {});
    return populatedPro;
  }
  throw new ApiError(403, "Only clients and professionals can create appointments");
};

const listClientsForProfessional = async (professionalUserId) => {
  const [fromAppt, fromChat] = await Promise.all([
    Appointment.distinct("clientUserId", { professionalUserId }),
    ChatSession.distinct("clientUserId", { professionalUserId }),
  ]);
  const ids = [...new Set([...fromAppt.map(String), ...fromChat.map(String)])].filter(Boolean);
  if (!ids.length) return [];
  return User.find({ _id: { $in: ids }, role: "CLIENT" })
    .select("name email")
    .sort({ name: 1 })
    .lean();
};

const assertProfessionalClientRelationship = async (professionalUserId, clientUserId) => {
  const [appt, chat] = await Promise.all([
    Appointment.exists({ professionalUserId, clientUserId }),
    ChatSession.exists({ professionalUserId, clientUserId }),
  ]);
  if (!appt && !chat) throw new ApiError(403, "No active relationship with this client");
};

const listClientGoalsAndTasks = async (professionalUserId, clientUserId) => {
  await assertProfessionalClientRelationship(professionalUserId, clientUserId);
  const [goals, tasks] = await Promise.all([
    Goal.find({ userId: clientUserId }).sort({ createdAt: -1 }),
    Task.find({ userId: clientUserId }).sort({ createdAt: -1 }).populate("goalId", "title"),
  ]);
  return { goals, tasks };
};

const createGoalForClient = async (professionalUserId, clientUserId, payload) => {
  await assertProfessionalClientRelationship(professionalUserId, clientUserId);
  return Goal.create({
    userId: clientUserId,
    title: payload.title,
    description: payload.description,
    targetDate: payload.targetDate,
    horizon: payload.horizon || "LONG_TERM",
    status: payload.status || "ACTIVE",
    source: "PROFESSIONAL",
  });
};

const createTaskForClient = async (professionalUserId, clientUserId, payload) => {
  await assertProfessionalClientRelationship(professionalUserId, clientUserId);
  return Task.create({
    userId: clientUserId,
    goalId: payload.goalId || undefined,
    title: payload.title,
    frequency: payload.frequency || "DAILY",
    scheduledDate: payload.scheduledDate,
    completionStatus: payload.completionStatus || "PENDING",
    source: "PROFESSIONAL",
  });
};

const updateGoalForClient = async (professionalUserId, clientUserId, goalId, payload) => {
  await assertProfessionalClientRelationship(professionalUserId, clientUserId);
  return Goal.findOneAndUpdate({ _id: goalId, userId: clientUserId }, payload, { new: true });
};

const updateTaskForClient = async (professionalUserId, clientUserId, taskId, payload) => {
  await assertProfessionalClientRelationship(professionalUserId, clientUserId);
  return Task.findOneAndUpdate({ _id: taskId, userId: clientUserId }, payload, { new: true });
};

const listAppointments = async (userId) =>
  Appointment.find({
    $or: [{ clientUserId: userId }, { professionalUserId: userId }],
  })
    .populate("clientUserId", "name email")
    .populate("professionalUserId", "name email")
    .sort({ startTime: 1 });

const toggleChatLock = async (professionalUserId, sessionId, isLocked) => {
  const updated = await ChatSession.findOneAndUpdate(
    { _id: sessionId, professionalUserId },
    { isLocked },
    { new: true }
  ).populate("professionalUserId", "name");
  if (updated) {
    notificationService.notifyChatLockChange(updated, isLocked).catch(() => {});
  }
  return updated;
};

const listIncomingRequests = async (professionalUserId) =>
  Appointment.find({ professionalUserId, status: "PENDING" })
    .populate("clientUserId", "name email")
    .sort({ createdAt: -1 });

const updateAppointmentStatus = async (professionalUserId, appointmentId, status) => {
  const prev = await Appointment.findOne({ _id: appointmentId, professionalUserId }).lean();
  if (!prev) return null;
  const updated = await Appointment.findOneAndUpdate(
    { _id: appointmentId, professionalUserId },
    { status },
    { new: true }
  )
    .populate("clientUserId", "name email")
    .populate("professionalUserId", "name email");
  if (updated) {
    notificationService.notifyAppointmentStatusChange(updated, prev.status).catch(() => {});
  }
  return updated;
};

const getProfessionalById = async (id) =>
  ProfessionalProfile.findById(id);

const listExternalAppointments = async (professionalUserId) =>
  ExternalAppointment.find({ professionalUserId }).sort({ startTime: 1 });

const createExternalAppointment = async (professionalUserId, payload) =>
  ExternalAppointment.create({ professionalUserId, ...payload });

const updateExternalAppointmentStatus = async (professionalUserId, appointmentId, status) =>
  ExternalAppointment.findOneAndUpdate(
    { _id: appointmentId, professionalUserId },
    { status },
    { new: true }
  );

const listReviewsForProfessional = async (professionalUserId) =>
  Review.find({ professionalUserId })
    .populate("clientUserId", "name")
    .sort({ createdAt: -1 });

const createReview = async (professionalUserId, clientUserId, payload) => {
  const review = await Review.create({
    professionalUserId,
    clientUserId,
    rating: payload.rating,
    comment: payload.comment || "",
  });
  const reviewer = await User.findById(clientUserId).select("name").lean();
  notificationService
    .notifyNewReview(professionalUserId, review._id, payload.rating, reviewer?.name || "A client")
    .catch(() => {});
  const agg = await Review.aggregate([
    { $match: { professionalUserId: review.professionalUserId } },
    {
      $group: {
        _id: "$professionalUserId",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  const avgRating = agg[0]?.avgRating || 0;
  const count = agg[0]?.count || 0;
  await ProfessionalProfile.findOneAndUpdate(
    { userId: professionalUserId },
    { rating: Number(avgRating.toFixed(2)), reviewCount: count }
  );
  return review;
};

module.exports = {
  listProfessionals,
  upsertProfessionalProfile,
  getMyProfessionalProfile,
  submitVerification,
  getMyVerificationStatus,
  createAppointmentForRole,
  listClientsForProfessional,
  assertProfessionalClientRelationship,
  listClientGoalsAndTasks,
  createGoalForClient,
  createTaskForClient,
  updateGoalForClient,
  updateTaskForClient,
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

