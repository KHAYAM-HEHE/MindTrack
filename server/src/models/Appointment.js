const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    clientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    professionalUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["ONLINE", "OFFLINE"], default: "ONLINE" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ["PENDING", "CONFIRMED", "CANCELLED"], default: "PENDING" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);

