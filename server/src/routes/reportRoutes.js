const express = require("express");
const reportController = require("../controllers/reportController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { ROLES } = require("../utils/constants");

const router = express.Router();
router.use(protect);

router.get("/daily", reportController.getDailyReport);
router.get("/weekly", reportController.getWeeklyReport);
router.get("/monthly", reportController.getMonthlyReport);
router.get("/yearly", reportController.getYearlyReport);
router.get("/medication-impact", reportController.getMedicationImpactReport);

router.get("/admin/platform", authorize(ROLES.ADMIN), reportController.getPlatformReport);
router.get("/admin/snapshots", authorize(ROLES.ADMIN), reportController.listAdminSnapshots);
router.post("/admin/snapshots", authorize(ROLES.ADMIN), reportController.createAdminSnapshot);

module.exports = router;

