const mongoose = require("mongoose");

const reportSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    periodType: { type: String, enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"], required: true },
    periodStart: Date,
    periodEnd: Date,
    reportPayload: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReportSnapshot", reportSnapshotSchema);

