const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: String,
    targetDate: Date,
    /** Long-term outcomes (e.g. GPA, social anxiety); tasks are the daily steps */
    horizon: { type: String, enum: ["LONG_TERM", "SHORT_TERM"], default: "LONG_TERM" },
    status: { type: String, enum: ["ACTIVE", "COMPLETED", "ARCHIVED"], default: "ACTIVE" },
    source: { type: String, enum: ["SELF", "PROFESSIONAL", "AI"], default: "SELF" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", goalSchema);

