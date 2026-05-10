const mongoose = require("mongoose");

const medicationLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicationName: { type: String, required: true },
    dosage: String,
    intakeTime: { type: Date, default: Date.now },
    adherenceStatus: { type: String, enum: ["TAKEN", "MISSED"], default: "TAKEN" },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicationLog", medicationLogSchema);

