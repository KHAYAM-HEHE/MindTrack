const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");
const ApiError = require("../utils/ApiError");

const getOrCreateSession = async ({ clientUserId, professionalUserId }) => {
  let session = await ChatSession.findOne({ clientUserId, professionalUserId });
  if (!session) {
    session = await ChatSession.create({ clientUserId, professionalUserId });
  }
  return ChatSession.findById(session._id)
    .populate("clientUserId", "name email")
    .populate("professionalUserId", "name email");
};

const assertSessionParticipant = async (sessionId, user) => {
  const session = await ChatSession.findById(sessionId)
    .populate("clientUserId", "name email")
    .populate("professionalUserId", "name email");
  if (!session) throw new ApiError(404, "Session not found");
  const uid = user._id.toString();
  const clientId = (session.clientUserId._id || session.clientUserId).toString();
  const profId = (session.professionalUserId._id || session.professionalUserId).toString();
  if (uid !== clientId && uid !== profId) {
    throw new ApiError(403, "Not a participant in this session");
  }
  return session;
};

const listMySessions = async (user) => {
  const filter =
    user.role === "PROFESSIONAL"
      ? { professionalUserId: user._id }
      : { clientUserId: user._id };
  return ChatSession.find(filter)
    .populate("clientUserId", "name email")
    .populate("professionalUserId", "name email")
    .sort({ updatedAt: -1 });
};

const listSessionMessages = async (sessionId, user, query = {}) => {
  await assertSessionParticipant(sessionId, user);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 50, 1), 100);
  const beforeCreatedAt = query.before ? new Date(query.before) : null;
  if (query.before && Number.isNaN(beforeCreatedAt?.getTime?.())) {
    throw new ApiError(400, "Invalid before cursor");
  }

  const filter = { chatSessionId: sessionId };
  if (beforeCreatedAt) {
    filter.createdAt = { $lt: beforeCreatedAt };
  }

  const batch = await ChatMessage.find(filter)
    .populate("senderUserId", "name email")
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = batch.length > limit;
  const slice = hasMore ? batch.slice(0, limit) : batch;
  const messages = slice.reverse();

  return {
    messages,
    hasMore,
    nextBefore: messages.length ? messages[0].createdAt : null,
  };
};

const createMessage = async ({
  sessionId,
  senderUserId,
  content,
  messageType = "TEXT",
  attachmentUrl,
  attachmentMimeType,
  attachmentOriginalName,
}) => {
  const session = await ChatSession.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");

  const sid = senderUserId.toString();
  const isClient = session.clientUserId.toString() === sid;
  const isProf = session.professionalUserId.toString() === sid;
  if (!isClient && !isProf) throw new ApiError(403, "Not a participant in this session");
  if (session.isLocked && isClient) {
    throw new ApiError(403, "Chat is locked by your provider");
  }

  const type = messageType === "FILE" ? "FILE" : "TEXT";
  const text = typeof content === "string" ? content.trim() : "";

  if (type === "FILE") {
    if (!attachmentUrl || !String(attachmentUrl).trim()) {
      throw new ApiError(400, "attachmentUrl is required for file messages");
    }
  } else if (!text) {
    throw new ApiError(400, "Message content is required");
  }

  const created = await ChatMessage.create({
    chatSessionId: sessionId,
    senderUserId,
    content: type === "FILE" ? text : text,
    messageType: type,
    attachmentUrl: type === "FILE" ? String(attachmentUrl).trim() : undefined,
    attachmentMimeType: attachmentMimeType || undefined,
    attachmentOriginalName: attachmentOriginalName || undefined,
  });
  await ChatSession.findByIdAndUpdate(sessionId, { updatedAt: new Date() });
  return ChatMessage.findById(created._id).populate("senderUserId", "name email");
};

module.exports = {
  getOrCreateSession,
  assertSessionParticipant,
  listMySessions,
  listSessionMessages,
  createMessage,
};
