const mongoose = require("mongoose");

const externalAppointmentSchema = new mongoose.Schema(
  {
    professionalUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, trim: true, lowercase: true },
    clientPhone: { type: String, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExternalAppointment", externalAppointmentSchema);
