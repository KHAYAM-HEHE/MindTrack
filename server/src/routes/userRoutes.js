const express = require("express");
const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();
router.use(protect);

router.get("/me", userController.getMe);
router.patch("/me/profile", userController.updateProfile);

router.get("/me/notifications", userController.listNotifications);
router.get("/me/notifications/unread-count", userController.getUnreadNotificationCount);
router.post("/me/notifications/read-all", userController.markAllNotificationsRead);
router.patch("/me/notifications/:id/read", userController.markNotificationRead);

router.post("/goals", authorize(ROLES.CLIENT), userController.createGoal);
router.get("/goals", authorize(ROLES.CLIENT), userController.listGoals);
router.patch("/goals/:id", authorize(ROLES.CLIENT), userController.updateGoal);

router.post(
  "/recommendations/goals-tasks",
  authorize(ROLES.CLIENT),
  userController.recommendGoalsTasks
);

router.post("/tasks", authorize(ROLES.CLIENT), userController.createTask);
router.get("/tasks", authorize(ROLES.CLIENT), userController.listTasks);
router.patch("/tasks/:id", authorize(ROLES.CLIENT), userController.updateTask);

router.post("/mood-surveys", userController.createMoodSurvey);
router.get("/mood-surveys", userController.listMoodSurveys);

router.post("/medications/logs", userController.createMedicationLog);
router.get("/medications/logs", userController.listMedicationLogs);
router.post("/complaints", userController.createComplaint);
router.get("/complaints", userController.listMyComplaints);

module.exports = router;

