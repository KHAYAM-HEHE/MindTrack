const mongoose = require("mongoose");

const professionalProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    displayName: String,
    specialization: String,
    bio: String,
    consultationFee: Number,
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    availability: [String],
    isOnline: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProfessionalProfile", professionalProfileSchema);

