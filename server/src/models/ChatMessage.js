const mongoose = require("mongoose");



const chatMessageSchema = new mongoose.Schema(

  {

    chatSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatSession", required: true },

    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    content: { type: String, default: "" },

    messageType: { type: String, enum: ["TEXT", "FILE"], default: "TEXT" },

    attachmentUrl: String,

    attachmentMimeType: String,

    attachmentOriginalName: String,

  },

  { timestamps: true }

);



module.exports = mongoose.model("ChatMessage", chatMessageSchema);


