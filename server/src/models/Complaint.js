const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    description: String,
    evidenceUrl: String,
    status: {
      type: String,
      enum: ["OPEN", "IN_REVIEW", "IN_PROGRESS", "ESCALATED", "RESOLVED"],
      default: "OPEN",
    },
    resolutionNotes: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);

