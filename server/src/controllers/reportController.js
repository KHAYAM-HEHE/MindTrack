const asyncHandler = require("../utils/asyncHandler");
const reportService = require("../services/reportService");

const getReport = (period) =>
  asyncHandler(async (req, res) => {
    const data = await reportService.buildReport(req.user._id, period);
    res.json({ success: true, data });
  });

const getPlatformReport = asyncHandler(async (_req, res) => {
  const data = await reportService.buildPlatformReport();
  res.json({ success: true, data });
});

const getMedicationImpactReport = asyncHandler(async (req, res) => {
  const base = await reportService.buildReport(req.user._id, "monthly");
  const data = {
    ...base,
    period: "medication-impact",
    metrics: {
      ...base.metrics,
      medicationImpactScore: Number((base.metrics.moodAverage * (base.metrics.completionRate / 100)).toFixed(2)),
    },
  };
  res.json({ success: true, data });
});

const listAdminSnapshots = asyncHandler(async (req, res) => {
  const data = await reportService.listReportSnapshots(req.query);
  res.json({ success: true, data });
});

const createAdminSnapshot = asyncHandler(async (req, res) => {
  const data = await reportService.saveAdminReportSnapshot(req.user._id, req.body);
  res.status(201).json({ success: true, data });
});

module.exports = {
  getDailyReport: getReport("daily"),
  getWeeklyReport: getReport("weekly"),
  getMonthlyReport: getReport("monthly"),
  getYearlyReport: getReport("yearly"),
  getMedicationImpactReport,
  getPlatformReport,
  listAdminSnapshots,
  createAdminSnapshot,
};
