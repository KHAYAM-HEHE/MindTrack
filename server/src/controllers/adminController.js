const asyncHandler = require("../utils/asyncHandler");
const adminService = require("../services/adminService");

const listVerifications = asyncHandler(async (req, res) => {
  const data = await adminService.listVerifications(req.query);
  res.json({ success: true, data });
});

const getVerificationById = asyncHandler(async (req, res) => {
  const data = await adminService.getVerificationById(req.params.id);
  res.json({ success: true, data });
});

const approveVerification = asyncHandler(async (req, res) => {
  const data = await adminService.approveVerification(req.params.id, req.user._id);
  res.json({ success: true, data });
});

const rejectVerification = asyncHandler(async (req, res) => {
  const data = await adminService.rejectVerification(
    req.params.id,
    req.user._id,
    req.body.reviewNotes
  );
  res.json({ success: true, data });
});

const listComplaints = asyncHandler(async (req, res) => {
  const data = await adminService.listComplaints(req.query);
  res.json({ success: true, data });
});

const resolveComplaint = asyncHandler(async (req, res) => {
  const data = await adminService.resolveComplaint(
    req.params.id,
    req.body.resolutionNotes,
    req.user._id
  );
  res.json({ success: true, data });
});

const getComplaintById = asyncHandler(async (req, res) => {
  const data = await adminService.getComplaintById(req.params.id);
  res.json({ success: true, data });
});

const listUsers = asyncHandler(async (req, res) => {
  const data = await adminService.listUsers(req.query);
  res.json({ success: true, data });
});

const getUserById = asyncHandler(async (req, res) => {
  const data = await adminService.getUserById(req.params.id);
  res.json({ success: true, data });
});

const listEmployees = asyncHandler(async (req, res) => {
  const data = await adminService.listEmployees(req.query);
  res.json({ success: true, data });
});

const listHrUsers = asyncHandler(async (req, res) => {
  const data = await adminService.listHrUsers(req.query);
  res.json({ success: true, data });
});

const listClients = asyncHandler(async (req, res) => {
  const data = await adminService.listClients(req.query);
  res.json({ success: true, data });
});

const getClientDetail = asyncHandler(async (req, res) => {
  const data = await adminService.getClientDetail(req.params.id);
  res.json({ success: true, data });
});

const listPsychiatrists = asyncHandler(async (req, res) => {
  const data = await adminService.listPsychiatrists(req.query);
  res.json({ success: true, data });
});

const getPsychiatristDetail = asyncHandler(async (req, res) => {
  const data = await adminService.getPsychiatristDetail(req.params.id);
  res.json({ success: true, data });
});

const listUnifiedRequests = asyncHandler(async (req, res) => {
  const data = await adminService.listUnifiedRequests(req.query);
  res.json({ success: true, data });
});

const updateAppointmentRequestStatus = asyncHandler(async (req, res) => {
  const data = await adminService.updateAppointmentRequestStatus(
    req.params.id,
    req.body.status,
    req.user._id
  );
  res.json({ success: true, data });
});

const getDashboardStats = asyncHandler(async (_req, res) => {
  const data = await adminService.getDashboardStats();
  res.json({ success: true, data });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const data = await adminService.updateUserRole(req.params.id, req.body.role, req.user._id);
  res.json({ success: true, data });
});

const createEmployee = asyncHandler(async (req, res) => {
  const data = await adminService.createEmployee(req.body, req.user._id, req.user.role);
  res.status(201).json({ success: true, data });
});

const listTickets = asyncHandler(async (req, res) => {
  const data = await adminService.listTickets(req.query);
  res.json({ success: true, data });
});

const assignTicket = asyncHandler(async (req, res) => {
  const data = await adminService.assignTicket(
    req.params.id,
    req.body.assignedTo,
    req.user._id
  );
  res.json({ success: true, data });
});

const updateTicketStatus = asyncHandler(async (req, res) => {
  const data = await adminService.updateTicketStatus(
    req.params.id,
    req.body.status,
    req.user._id
  );
  res.json({ success: true, data });
});

const listAuditLogs = asyncHandler(async (req, res) => {
  const data = await adminService.listAuditLogs(req.query);
  res.json({ success: true, data });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const data = await adminService.updateUserStatus(
    req.params.id,
    req.body.status,
    req.user._id
  );
  res.json({ success: true, data });
});

const getComplaintEvidence = asyncHandler(async (req, res) => {
  const data = await adminService.getComplaintEvidence(req.params.id);
  res.json({ success: true, data });
});

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
