const mongoose = require("mongoose");
const { VERIFICATION_STATUS } = require("../utils/constants");

const professionalVerificationSchema = new mongoose.Schema(
  {
    professionalUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    degree: String,
    institution: String,
    batch: String,
    cvUrl: String,
    companyRegistration: String,
    status: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNotes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProfessionalVerification", professionalVerificationSchema);

