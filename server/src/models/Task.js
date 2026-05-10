const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal" },
    title: { type: String, required: true },
    frequency: { type: String, enum: ["DAILY", "WEEKLY", "MONTHLY"], default: "DAILY" },
    scheduledDate: Date,
    completionStatus: { type: String, enum: ["PENDING", "DONE", "MISSED"], default: "PENDING" },
    completionReason: String,
    source: { type: String, enum: ["SELF", "PROFESSIONAL", "AI"], default: "SELF" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);

