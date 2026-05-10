const express = require("express");
const professionalController = require("../controllers/professionalController");
const ApiError = require("../utils/ApiError");
const appointmentReceiptUpload = require("../middlewares/appointmentReceiptUpload");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();

const uploadReceiptSingle = (req, res, next) =>
  appointmentReceiptUpload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") return next(new ApiError(400, "Receipt file too large"));
    next(new ApiError(400, err.message || "Upload failed"));
  });

router.get("/search", professionalController.listProfessionals);
router.get("/profile/:id", professionalController.getProfessionalById);
router.get("/:professionalUserId/reviews", professionalController.listReviewsForProfessional);
router.post(
  "/:professionalUserId/reviews",
  protect,
  authorize(ROLES.CLIENT),
  professionalController.createReview
);
router.post(
  "/appointments/upload-receipt",
  protect,
  authorize(ROLES.CLIENT),
  uploadReceiptSingle,
  professionalController.uploadAppointmentReceipt
);
router.post("/appointments", protect, professionalController.createAppointment);
router.get("/appointments", protect, professionalController.listAppointments);
router.patch(
  "/appointments/:id/cancel",
  protect,
  authorize(ROLES.CLIENT),
  professionalController.cancelMyAppointment
);
router.get(
  "/me/clients",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.listMyClients
);
router.get(
  "/clients/:clientUserId/goals-tasks",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.getClientGoalsAndTasks
);
router.post(
  "/clients/:clientUserId/goals",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.createClientGoal
);
router.patch(
  "/clients/:clientUserId/goals/:goalId",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.updateClientGoal
);
router.post(
  "/clients/:clientUserId/tasks",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.createClientTask
);
router.patch(
  "/clients/:clientUserId/tasks/:taskId",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.updateClientTask
);
router.post(
  "/clients/:clientUserId/recommendations/goals-tasks",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.recommendClientGoalsTasks
);
router.get(
  "/requests",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.listIncomingRequests
);
router.patch(
  "/appointments/:id/status",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.updateAppointmentStatus
);

router.post(
  "/me/profile",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.upsertProfile
);
router.get(
  "/me/profile",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.getMyProfile
);
router.post(
  "/me/verification",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.submitVerification
);
router.get(
  "/me/verification-status",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.getMyVerificationStatus
);
router.patch(
  "/chat-sessions/:id/lock",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.toggleChatLock
);
router.get(
  "/external-appointments",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.listExternalAppointments
);
router.post(
  "/external-appointments",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.createExternalAppointment
);
router.patch(
  "/external-appointments/:id/status",
  protect,
  authorize(ROLES.PROFESSIONAL),
  professionalController.updateExternalAppointmentStatus
);

module.exports = router;

