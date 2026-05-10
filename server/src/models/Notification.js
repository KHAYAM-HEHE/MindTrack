const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: {
      type: String,
      enum: ["APPOINTMENT", "REQUEST", "SYSTEM", "CHAT"],
      default: "SYSTEM",
    },
    relatedType: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    /** In-app route path for web client (e.g. /client/appointments) */
    linkPath: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
