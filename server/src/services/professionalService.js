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

const listProfessionals = async () => {
  const approved = await ProfessionalVerification.find({ status: VERIFICATION_STATUS.APPROVED })
    .select("professionalUserId")
    .lean();
  const approvedIds = [...new Set(approved.map((v) => String(v.professionalUserId)).filter(Boolean))];
  if (!approvedIds.length) return [];

  const [profiles, users] = await Promise.all([
    ProfessionalProfile.find({ userId: { $in: approvedIds } }).sort({ rating: -1, reviewCount: -1 }).lean(),
    User.find({ _id: { $in: approvedIds }, status: "ACTIVE", role: "PROFESSIONAL" })
      .select("name email")
      .lean(),
  ]);

  const userById = Object.fromEntries(users.map((u) => [String(u._id), u]));
  return profiles
    .map((p) => {
      const u = userById[String(p.userId)];
      if (!u) return null;
      return {
        ...p,
        _id: p._id,
        userId: p.userId,
        name: u.name,
        email: u.email,
        verified: true,
      };
    })
    .filter(Boolean);
};

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
    const introChatExists = await ChatSession.exists({
      clientUserId: user._id,
      professionalUserId: body.professionalUserId,
    });
    if (!introChatExists) {
      throw new ApiError(400, "Start an intro chat with this professional before booking.");
    }
    if (body.paymentStatus !== "PAID" || !body.paymentReference) {
      throw new ApiError(400, "Payment proof is required before booking.");
    }
    const profile = await ProfessionalProfile.findOne({ userId: body.professionalUserId }).lean();
    const minFee = Number(profile?.consultationFee || 0);
    const amountPaid = Number(body.amountPaid || 0);
    if (minFee > 0 && amountPaid < minFee) {
      throw new ApiError(400, `Amount paid must be at least session fee (${minFee}).`);
    }
    const receiptUrl = body.paymentReceiptUrl != null ? String(body.paymentReceiptUrl).trim() : "";
    if (!receiptUrl) {
      throw new ApiError(400, "Upload a payment receipt (screenshot or PDF) before booking.");
    }
    const ownPrefix = `/uploads/appointments/${user._id}/`;
    if (!receiptUrl.startsWith(ownPrefix)) {
      throw new ApiError(400, "Receipt must be uploaded from your account.");
    }

    const doc = await Appointment.create({
      clientUserId: user._id,
      professionalUserId: body.professionalUserId,
      mode: body.mode || "ONLINE",
      startTime: body.startTime,
      endTime: body.endTime,
      status: body.status || "PENDING",
      paymentStatus: "PAID",
      paymentReference: body.paymentReference,
      amountPaid,
      paymentReceiptUrl: receiptUrl,
      notes: body.notes || "",
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

const cancelAppointmentForClient = async (clientUserId, appointmentId) => {
  const prev = await Appointment.findOne({ _id: appointmentId, clientUserId }).lean();
  if (!prev) throw new ApiError(404, "Appointment not found");
  if (prev.status === "CANCELLED") return prev;
  const updated = await Appointment.findOneAndUpdate(
    { _id: appointmentId, clientUserId },
    { status: "CANCELLED" },
    { new: true }
  )
    .populate("clientUserId", "name email")
    .populate("professionalUserId", "name email");
  if (updated) {
    notificationService.notifyAppointmentStatusChange(updated, prev.status).catch(() => {});
  }
  return updated;
};

const listClientsForProfessional = async (professionalUserId) => {
  const fromAppt = await Appointment.distinct("clientUserId", { professionalUserId, status: "CONFIRMED" });
  const ids = [...new Set(fromAppt.map(String))].filter(Boolean);
  if (!ids.length) return [];
  return User.find({ _id: { $in: ids }, role: "CLIENT" })
    .select("name email")
    .sort({ name: 1 })
    .lean();
};

const assertProfessionalClientRelationship = async (professionalUserId, clientUserId) => {
  const appt = await Appointment.exists({ professionalUserId, clientUserId, status: "CONFIRMED" });
  if (!appt) throw new ApiError(403, "Client is not yet approved for your care panel");
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
  const allowed = {};
  if (payload.title != null) allowed.title = payload.title;
  if (payload.frequency != null) allowed.frequency = payload.frequency;
  if (payload.goalId !== undefined) allowed.goalId = payload.goalId || undefined;
  if (payload.scheduledDate !== undefined) allowed.scheduledDate = payload.scheduledDate;
  // Professionals manage planning, not daily completion status.
  return Task.findOneAndUpdate({ _id: taskId, userId: clientUserId }, allowed, { new: true });
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

const updateAppointmentStatus = async (professionalUserId, appointmentId, status, extras = {}) => {
  const prev = await Appointment.findOne({ _id: appointmentId, professionalUserId }).lean();
  if (!prev) return null;
  const isPendingDecision = prev.status === "PENDING" && (status === "CONFIRMED" || status === "CANCELLED");
  const notes =
    extras.paymentVerificationNotes != null ? String(extras.paymentVerificationNotes).trim() : "";
  if (isPendingDecision && notes.length < 3) {
    throw new ApiError(
      400,
      "Payment verification notes are required when confirming or rejecting a booking request."
    );
  }
  const patch = { status };
  if (isPendingDecision) patch.paymentVerificationNotes = notes;

  const updated = await Appointment.findOneAndUpdate(
    { _id: appointmentId, professionalUserId },
    patch,
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
  cancelAppointmentForClient,
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

