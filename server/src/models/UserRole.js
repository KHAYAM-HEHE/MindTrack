const mongoose = require("mongoose");
const { ROLES } = require("../utils/constants");

const userRoleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: Object.values(ROLES), required: true },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    grantedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserRole", userRoleSchema);

