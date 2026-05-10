const mongoose = require("mongoose");
const { ROLES } = require("../utils/constants");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CLIENT,
    },
    phone: { type: String, trim: true },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "BANNED"],
      default: "ACTIVE",
    },
    is2FAEnabled: { type: Boolean, default: false },
    /** Base32 TOTP secret (Google Authenticator–compatible); never expose via API */
    totpSecret: { type: String, select: false },
    /** Pending secret until user verifies first code */
    totpPendingSecret: { type: String, select: false },
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

