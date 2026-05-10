const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const chatService = require("../services/chatService");

const getOrCreateSession = asyncHandler(async (req, res) => {
  const payload =
    req.user.role === "PROFESSIONAL"
      ? {
          clientUserId: req.body.clientUserId,
          professionalUserId: req.user._id,
        }
      : {
          clientUserId: req.user._id,
          professionalUserId: req.body.professionalUserId,
        };
  const data = await chatService.getOrCreateSession(payload);
  res.status(201).json({ success: true, data });
});

const listMySessions = asyncHandler(async (req, res) => {
  const data = await chatService.listMySessions(req.user);
  res.json({ success: true, data });
});

const listMessages = asyncHandler(async (req, res) => {
  const data = await chatService.listSessionMessages(req.params.id, req.user, req.query);
  res.json({ success: true, data });
});

const sendMessage = asyncHandler(async (req, res) => {
  const data = await chatService.createMessage({
    sessionId: req.params.id,
    senderUserId: req.user._id,
    content: req.body.content,
    messageType: req.body.messageType,
    attachmentUrl: req.body.attachmentUrl,
    attachmentMimeType: req.body.attachmentMimeType,
    attachmentOriginalName: req.body.attachmentOriginalName,
  });
  const io = req.app.get("io");
  if (io) {
    io.to(String(req.params.id)).emit("new-message", data);
  }
  res.status(201).json({ success: true, data });
});

const uploadSessionAttachment = asyncHandler(async (req, res) => {
  await chatService.assertSessionParticipant(req.params.id, req.user);
  if (!req.file) throw new ApiError(400, "File is required");
  const rel = `/uploads/chat/${req.params.id}/${req.file.filename}`;
  res.status(201).json({
    success: true,
    data: {
      attachmentUrl: rel,
      attachmentMimeType: req.file.mimetype,
      attachmentOriginalName: req.file.originalname,
    },
  });
});

module.exports = {
  getOrCreateSession,
  listMySessions,
  listMessages,
  sendMessage,
  uploadSessionAttachment,
};
