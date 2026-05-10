const express = require("express");
const adminController = require("../controllers/adminController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();
router.use(protect);

const hrAdmin = [ROLES.HR, ROLES.ADMIN];
const staffVerification = [ROLES.EMPLOYEE, ROLES.HR, ROLES.ADMIN];

router.get("/dashboard/stats", authorize(...hrAdmin), adminController.getDashboardStats);

router.get("/verifications", authorize(...staffVerification), adminController.listVerifications);
router.get("/verifications/:id", authorize(...staffVerification), adminController.getVerificationById);
router.post("/verifications/:id/approve", authorize(...staffVerification), adminController.approveVerification);
router.post("/verifications/:id/reject", authorize(...staffVerification), adminController.rejectVerification);

router.get("/requests", authorize(...hrAdmin), adminController.listUnifiedRequests);
router.patch(
  "/requests/appointments/:id/status",
  authorize(...hrAdmin),
  adminController.updateAppointmentRequestStatus
);

router.get("/employees", authorize(...hrAdmin), adminController.listEmployees);
router.get("/hr-users", authorize(...hrAdmin), adminController.listHrUsers);
router.get("/clients", authorize(...hrAdmin), adminController.listClients);
router.get("/clients/:id", authorize(...hrAdmin), adminController.getClientDetail);
router.get("/psychiatrists", authorize(...hrAdmin), adminController.listPsychiatrists);
router.get("/psychiatrists/:id", authorize(...hrAdmin), adminController.getPsychiatristDetail);

router.get("/users/:id", authorize(...hrAdmin), adminController.getUserById);

router.get("/complaints", authorize(...hrAdmin), adminController.listComplaints);
router.get("/complaints/:id", authorize(...hrAdmin), adminController.getComplaintById);
router.post("/complaints/:id/resolve", authorize(...hrAdmin), adminController.resolveComplaint);
router.get("/complaints/:id/evidence", authorize(...hrAdmin), adminController.getComplaintEvidence);

router.get("/users", authorize(...hrAdmin), adminController.listUsers);
router.patch("/users/:id/role", authorize(ROLES.ADMIN), adminController.updateUserRole);
router.patch("/users/:id/status", authorize(...hrAdmin), adminController.updateUserStatus);
router.post("/employees", authorize(...hrAdmin), adminController.createEmployee);

router.get("/tickets", authorize(...hrAdmin), adminController.listTickets);
router.post("/tickets/:id/assign", authorize(...hrAdmin), adminController.assignTicket);
router.patch("/tickets/:id/status", authorize(...hrAdmin), adminController.updateTicketStatus);

router.get("/audit-logs", authorize(ROLES.ADMIN), adminController.listAuditLogs);

module.exports = router;
