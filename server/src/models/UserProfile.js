const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    nickname: String,
    age: Number,
    religion: String,
    educationLevel: String,
    country: String,
    preferences: {
      quoteType: { type: String, default: "SECULAR" },
      theme: { type: String, default: "light" },
      colorScheme: { type: String, default: "default" },
    },
    medicalData: {
      mentalConditions: [String],
      emergencyContact: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);

