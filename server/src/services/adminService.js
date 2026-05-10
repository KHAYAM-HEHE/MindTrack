const ProfessionalVerification = require("../models/ProfessionalVerification");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const ProfessionalProfile = require("../models/ProfessionalProfile");
const UserProfile = require("../models/UserProfile");
const Appointment = require("../models/Appointment");
const Task = require("../models/Task");
const MoodSurvey = require("../models/MoodSurvey");
const MedicationLog = require("../models/MedicationLog");
const Review = require("../models/Review");
const bcrypt = require("bcryptjs");
const ApiError = require("../utils/ApiError");
const { VERIFICATION_STATUS, ROLES, COMPLAINT_STATUS, ADMIN_REQUEST_TYPES } = require("../utils/constants");
const { parseListQuery } = require("../utils/adminListQuery");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildUserSearchFilter = (search) => {
  if (!search) return {};
  const rx = new RegExp(escapeRegex(search), "i");
  return { $or: [{ name: rx }, { email: rx }] };
};

const usePagination = (query) => (query.page ?? "") !== "" && query.page != null;

const createAuditLog = async ({ actorUserId, action, targetType, targetId, metadata }) =>
  AuditLog.create({ actorUserId, action, targetType, targetId, metadata });

const listVerifications = async (query = {}) => {
  const paginated = usePagination(query);
  const { page, limit, skip, search, status, sort } = parseListQuery(query);
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { degree: new RegExp(escapeRegex(search), "i") },
      { institution: new RegExp(escapeRegex(search), "i") },
    ];
  }
  const q = ProfessionalVerification.find(filter)
    .populate("professionalUserId", "name email role status phone")
    .populate("reviewedBy", "name email role")
    .sort(sort);
  if (paginated) {
    const [items, total] = await Promise.all([
      q.clone().skip(skip).limit(limit).lean(),
      ProfessionalVerification.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }
  return q.sort({ createdAt: -1 }).lean().exec();
};

const getVerificationById = async (id) => {
  const doc = await ProfessionalVerification.findById(id)
    .populate("professionalUserId", "name email role status phone createdAt")
    .populate("reviewedBy", "name email role")
    .lean();
  if (!doc) throw new ApiError(404, "Verification not found");
  return doc;
};

const approveVerification = async (id, reviewerId) => {
  const data = await ProfessionalVerification.findByIdAndUpdate(
    id,
    {
      status: VERIFICATION_STATUS.APPROVED,
      reviewedBy: reviewerId,
    },
    { new: true }
  )
    .populate("professionalUserId", "name email role")
    .lean();
  if (!data) throw new ApiError(404, "Verification not found");
  await createAuditLog({
    actorUserId: reviewerId,
    action: "APPROVE_VERIFICATION",
    targetType: "PROFESSIONAL_VERIFICATION",
    targetId: String(id),
    metadata: { professionalUserId: data.professionalUserId?._id },
  });
  return data;
};

const rejectVerification = async (id, reviewerId, reviewNotes) => {
  const data = await ProfessionalVerification.findByIdAndUpdate(
    id,
    {
      status: VERIFICATION_STATUS.REJECTED,
      reviewedBy: reviewerId,
      reviewNotes,
    },
    { new: true }
  )
    .populate("professionalUserId", "name email role")
    .lean();
  if (!data) throw new ApiError(404, "Verification not found");
  await createAuditLog({
    actorUserId: reviewerId,
    action: "REJECT_VERIFICATION",
    targetType: "PROFESSIONAL_VERIFICATION",
    targetId: String(id),
    metadata: { reviewNotes },
  });
  return data;
};

const listComplaints = async (query = {}) => {
  const paginated = usePagination(query);
  const { page, limit, skip, status, sort } = parseListQuery(query);
  const filter = {};
  if (status) filter.status = status;
  const q = Complaint.find(filter)
    .populate("reportedBy", "name email role")
    .populate("reportedUserId", "name email role")
    .populate("assignedTo", "name email role")
    .sort(sort);
  if (paginated) {
    const [items, total] = await Promise.all([
      q.clone().skip(skip).limit(limit).lean(),
      Complaint.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }
  return q.sort({ createdAt: -1 }).lean().exec();
};

const resolveComplaint = async (id, resolutionNotes, actorUserId) => {
  const data = await Complaint.findByIdAndUpdate(
    id,
    { status: COMPLAINT_STATUS.RESOLVED, resolutionNotes: resolutionNotes || "" },
    { new: true }
  ).lean();
  if (!data) throw new ApiError(404, "Complaint not found");
  if (actorUserId) {
    await createAuditLog({
      actorUserId,
      action: "RESOLVE_COMPLAINT",
      targetType: "COMPLAINT",
      targetId: String(id),
      metadata: {},
    });
  }
  return data;
};

const getComplaintById = async (id) =>
  Complaint.findById(id)
    .populate("reportedBy", "name email role")
    .populate("reportedUserId", "name email role")
    .populate("assignedTo", "name email role")
    .lean();

const listUsers = async (query = {}) => {
  const paginated = usePagination(query);
  const { page, limit, skip, search, role, status, sort } = parseListQuery(query);
  const filter = { ...buildUserSearchFilter(search) };
  if (role) filter.role = role;
  if (status) filter.status = status;
  const q = User.find(filter).select("-password").sort(sort);
  if (paginated) {
    const [items, total] = await Promise.all([
      q.clone().skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }
  return User.find(filter).select("-password").sort(sort).lean();
};

const getUserById = async (id) => {
  const user = await User.findById(id).select("-password").lean();
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

const listEmployees = async (query = {}) => {
  const p = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const lim = Math.min(Math.max(1, parseInt(String(query.limit || "50"), 10) || 50), 200);
  const sk = (p - 1) * lim;
  const filter = { role: ROLES.EMPLOYEE, ...buildUserSearchFilter((query.search || "").trim()) };
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(sk).limit(lim).lean(),
    User.countDocuments(filter),
  ]);
  return { items, total, page: p, limit: lim };
};

const listHrUsers = async (query = {}) => {
  const filter = { role: ROLES.HR, ...buildUserSearchFilter((query.search || "").trim()) };
  if (query.status) filter.status = query.status;
  const p = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const lim = Math.min(Math.max(1, parseInt(String(query.limit || "50"), 10) || 50), 200);
  const sk = (p - 1) * lim;
  const [items, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(sk).limit(lim).lean(),
    User.countDocuments(filter),
  ]);
  return { items, total, page: p, limit: lim };
};

const listClients = async (query = {}) => {
  const filter = { role: ROLES.CLIENT, ...buildUserSearchFilter((query.search || "").trim()) };
  if (query.status) filter.status = query.status;
  const p = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const lim = Math.min(Math.max(1, parseInt(String(query.limit || "50"), 10) || 50), 200);
  const sk = (p - 1) * lim;
  const [items, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(sk).limit(lim).lean(),
    User.countDocuments(filter),
  ]);
  return { items, total, page: p, limit: lim };
};

const getClientDetail = async (userId) => {
  const user = await User.findById(userId).select("-password").lean();
  if (!user) throw new ApiError(404, "User not found");
  if (user.role !== ROLES.CLIENT) throw new ApiError(400, "User is not a client");
  const [profile, tasks, moods, meds, complaints, appointments] = await Promise.all([
    UserProfile.findOne({ userId }).lean(),
    Task.countDocuments({ userId }),
    MoodSurvey.countDocuments({ userId }),
    MedicationLog.countDocuments({ userId }),
    Complaint.countDocuments({ reportedBy: userId }),
    Appointment.countDocuments({ clientUserId: userId }),
  ]);
  return {
    user,
    profile,
    counts: { tasks, moodSurveys: moods, medicationLogs: meds, complaints, appointments },
  };
};

const listPsychiatrists = async (query = {}) => {
  const filter = { role: ROLES.PROFESSIONAL, ...buildUserSearchFilter((query.search || "").trim()) };
  if (query.status) filter.status = query.status;
  const p = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const lim = Math.min(Math.max(1, parseInt(String(query.limit || "50"), 10) || 50), 200);
  const sk = (p - 1) * lim;
  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(sk).limit(lim).lean(),
    User.countDocuments(filter),
  ]);
  const userIds = users.map((u) => u._id);
  const profiles = await ProfessionalProfile.find({ userId: { $in: userIds } }).lean();
  const profileByUser = Object.fromEntries(profiles.map((pr) => [String(pr.userId), pr]));
  const items = users.map((u) => ({ ...u, professionalProfile: profileByUser[String(u._id)] || null }));
  return { items, total, page: p, limit: lim };
};

const getPsychiatristDetail = async (userId) => {
  const user = await User.findById(userId).select("-password").lean();
  if (!user) throw new ApiError(404, "User not found");
  if (user.role !== ROLES.PROFESSIONAL) throw new ApiError(400, "User is not a professional");
  const [profile, verification, appointmentStats, reviewAgg] = await Promise.all([
    ProfessionalProfile.findOne({ userId }).lean(),
    ProfessionalVerification.findOne({ professionalUserId: userId }).sort({ createdAt: -1 }).lean(),
    Appointment.aggregate([
      { $match: { professionalUserId: user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Review.aggregate([
      { $match: { professionalUserId: user._id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
  ]);
  const appointmentsByStatus = Object.fromEntries(appointmentStats.map((x) => [x._id, x.count]));
  return {
    user,
    profile,
    latestVerification: verification,
    appointmentsByStatus,
    reviewAverage: reviewAgg[0]?.avg ?? null,
    reviewCount: reviewAgg[0]?.count ?? 0,
  };
};

const listUnifiedRequests = async (query = {}) => {
  const type = query.type;
  const statusV = query.verificationStatus || VERIFICATION_STATUS.PENDING;
  const statusA = query.appointmentStatus || "PENDING";
  const p = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const lim = Math.min(Math.max(1, parseInt(String(query.limit || "30"), 10) || 30), 100);
  const sk = (p - 1) * lim;

  const verQuery = {};
  if (statusV) verQuery.status = statusV;
  const apptQuery = {};
  if (statusA) apptQuery.status = statusA;

  const [verifications, appointments] = await Promise.all([
    !type || type === ADMIN_REQUEST_TYPES.VERIFICATION
      ? ProfessionalVerification.find(verQuery)
          .populate("professionalUserId", "name email role status")
          .sort({ createdAt: -1 })
          .limit(500)
          .lean()
      : [],
    !type || type === ADMIN_REQUEST_TYPES.APPOINTMENT
      ? Appointment.find(apptQuery)
          .populate("clientUserId", "name email")
          .populate("professionalUserId", "name email")
          .sort({ createdAt: -1 })
          .limit(500)
          .lean()
      : [],
  ]);

  const merged = [
    ...verifications.map((v) => ({
      kind: ADMIN_REQUEST_TYPES.VERIFICATION,
      _id: v._id,
      status: v.status,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      title: "Professional verification",
      summary: [v.degree, v.institution].filter(Boolean).join(" · ") || "Pending review",
      professionalUserId: v.professionalUserId,
      raw: v,
    })),
    ...appointments.map((a) => ({
      kind: ADMIN_REQUEST_TYPES.APPOINTMENT,
      _id: a._id,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      title: "Appointment",
      summary: `${a.mode || "ONLINE"} · ${a.startTime ? new Date(a.startTime).toISOString() : ""}`,
      clientUserId: a.clientUserId,
      professionalUserId: a.professionalUserId,
      startTime: a.startTime,
      endTime: a.endTime,
      raw: a,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = merged.length;
  const items = merged.slice(sk, sk + lim);
  return { items, total, page: p, limit: lim };
};

const updateAppointmentRequestStatus = async (appointmentId, status, actorUserId) => {
  const allowed = ["PENDING", "CONFIRMED", "CANCELLED"];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Invalid appointment status. Allowed: ${allowed.join(", ")}`);
  }
  const appointment = await Appointment.findByIdAndUpdate(appointmentId, { status }, { new: true })
    .populate("clientUserId", "name email")
    .populate("professionalUserId", "name email")
    .lean();
  if (!appointment) throw new ApiError(404, "Appointment request not found");
  await createAuditLog({
    actorUserId,
    action: "UPDATE_APPOINTMENT_REQUEST_STATUS",
    targetType: "APPOINTMENT",
    targetId: String(appointmentId),
    metadata: { status },
  });
  return appointment;
};

const getDashboardStats = async () => {
  const [usersByRole, complaintsByStatus, appointmentsByStatus, pendingVerifications, openComplaints, totalUsers] =
    await Promise.all([
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      ProfessionalVerification.countDocuments({ status: VERIFICATION_STATUS.PENDING }),
      Complaint.countDocuments({ status: { $in: [COMPLAINT_STATUS.OPEN, COMPLAINT_STATUS.IN_REVIEW, COMPLAINT_STATUS.IN_PROGRESS, COMPLAINT_STATUS.ESCALATED] } }),
      User.countDocuments({ status: "ACTIVE" }),
    ]);
  return {
    usersByRole: Object.fromEntries(usersByRole.map((x) => [x._id, x.count])),
    complaintsByStatus: Object.fromEntries(complaintsByStatus.map((x) => [x._id, x.count])),
    appointmentsByStatus: Object.fromEntries(appointmentsByStatus.map((x) => [x._id, x.count])),
    pendingVerifications,
    openComplaints,
    activeUsers: totalUsers,
  };
};

const updateUserRole = async (id, role, actorUserId) => {
  if (!Object.values(ROLES).includes(role)) {
    throw new ApiError(400, "Invalid role");
  }
  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password").lean();
  if (!user) throw new ApiError(404, "User not found");
  if (actorUserId) {
    await createAuditLog({
      actorUserId,
      action: "UPDATE_USER_ROLE",
      targetType: "USER",
      targetId: String(id),
      metadata: { role },
    });
  }
  return user;
};

const createEmployee = async (payload, actorUserId, actorRole) => {
  const existing = await User.findOne({ email: payload.email });
  if (existing) throw new ApiError(409, "Employee email already exists");
  const targetRole = payload.role || ROLES.EMPLOYEE;
  const allowedCreateTargets = [ROLES.EMPLOYEE, ROLES.HR];
  if (!allowedCreateTargets.includes(targetRole)) {
    throw new ApiError(400, "Only EMPLOYEE or HR roles can be created here");
  }
  if (targetRole === ROLES.HR && actorRole !== ROLES.ADMIN) {
    throw new ApiError(403, "Only ADMIN can create HR accounts");
  }
  if (actorRole !== ROLES.ADMIN && actorRole !== ROLES.HR) {
    throw new ApiError(403, "Only ADMIN or HR can create employees");
  }
  const password = payload.password || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 10);
  const employee = await User.create({
    name: payload.name,
    email: payload.email,
    password: passwordHash,
    role: targetRole,
    status: "ACTIVE",
  });
  await createAuditLog({
    actorUserId,
    action: "CREATE_EMPLOYEE",
    targetType: "USER",
    targetId: String(employee._id),
    metadata: { role: employee.role },
  });
  return User.findById(employee._id).select("-password").lean();
};

const listTickets = async (query = {}) => {
  const paginated = usePagination(query);
  const { page, limit, skip, status, sort } = parseListQuery(query);
  const filter = {};
  if (status) filter.status = status;
  const q = Complaint.find(filter)
    .populate("reportedBy", "name email")
    .populate("reportedUserId", "name email")
    .populate("assignedTo", "name email")
    .sort(sort);
  if (paginated) {
    const [items, total] = await Promise.all([
      q.clone().skip(skip).limit(limit).lean(),
      Complaint.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }
  return q.sort({ updatedAt: -1 }).lean().exec();
};

const VALID_TICKET_STATUSES = Object.values(COMPLAINT_STATUS);

const assignTicket = async (complaintId, assignedTo, actorUserId) => {
  const ticket = await Complaint.findByIdAndUpdate(
    complaintId,
    { assignedTo, status: COMPLAINT_STATUS.IN_REVIEW },
    { new: true }
  ).lean();
  if (!ticket) throw new ApiError(404, "Ticket not found");
  await createAuditLog({
    actorUserId,
    action: "ASSIGN_TICKET",
    targetType: "COMPLAINT",
    targetId: String(ticket._id),
    metadata: { assignedTo },
  });
  return ticket;
};

const updateTicketStatus = async (complaintId, status, actorUserId) => {
  if (!VALID_TICKET_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${VALID_TICKET_STATUSES.join(", ")}`);
  }
  const ticket = await Complaint.findByIdAndUpdate(complaintId, { status }, { new: true }).lean();
  if (!ticket) throw new ApiError(404, "Ticket not found");
  await createAuditLog({
    actorUserId,
    action: "UPDATE_TICKET_STATUS",
    targetType: "COMPLAINT",
    targetId: String(ticket._id),
    metadata: { status },
  });
  return ticket;
};

const listAuditLogs = async (query = {}) => {
  const paginated = usePagination(query);
  const { page, limit, skip, sort } = parseListQuery(query);
  const filter = {};
  if (query.targetType) filter.targetType = query.targetType;
  if (query.targetId) filter.targetId = String(query.targetId);
  const q = AuditLog.find(filter).populate("actorUserId", "name email role").sort(sort);
  if (paginated) {
    const [items, total] = await Promise.all([
      q.clone().skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }
  return AuditLog.find(filter).sort({ createdAt: -1 }).limit(200).populate("actorUserId", "name email role").lean();
};

const updateUserStatus = async (userId, status, actorUserId) => {
  const allowed = ["ACTIVE", "SUSPENDED", "BANNED"];
  if (!allowed.includes(status)) throw new ApiError(400, "Invalid status");
  const user = await User.findByIdAndUpdate(userId, { status }, { new: true }).select("-password").lean();
  if (!user) throw new ApiError(404, "User not found");
  await createAuditLog({
    actorUserId,
    action: "UPDATE_USER_STATUS",
    targetType: "USER",
    targetId: String(user._id),
    metadata: { status },
  });
  return user;
};

const getComplaintEvidence = async (complaintId) => {
  const complaint = await Complaint.findById(complaintId).lean();
  if (!complaint) throw new ApiError(404, "Complaint not found");
  const history = await AuditLog.find({
    targetType: "COMPLAINT",
    targetId: String(complaintId),
  })
    .sort({ createdAt: -1 })
    .populate("actorUserId", "name email role")
    .lean();
  return { complaint, history };
};

module.exports = {
  listVerifications,
  getVerificationById,
  approveVerification,
  rejectVerification,
  listComplaints,
  resolveComplaint,
  getComplaintById,
  listUsers,
  getUserById,
  listEmployees,
  listHrUsers,
  listClients,
  getClientDetail,
  listPsychiatrists,
  getPsychiatristDetail,
  listUnifiedRequests,
  updateAppointmentRequestStatus,
  getDashboardStats,
  updateUserRole,
  createEmployee,
  listTickets,
  assignTicket,
  updateTicketStatus,
  listAuditLogs,
  updateUserStatus,
  getComplaintEvidence,
};
