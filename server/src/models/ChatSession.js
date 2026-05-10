const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema(
  {
    clientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    professionalUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isLocked: { type: Boolean, default: false },
    lockPolicy: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatSession", chatSessionSchema);

