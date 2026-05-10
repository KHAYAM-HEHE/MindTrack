const Notification = require("../models/Notification");

let ioRef = null;

const attachIo = (io) => {
  ioRef = io;
};

const emitToUser = (userId, payload) => {
  if (!ioRef || !userId) return;
  ioRef.to(`user:${String(userId)}`).emit("notification", payload);
};

const formatWhen = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const createNotification = async (payload) => {
  const doc = await Notification.create({
    readAt: null,
    ...payload,
  });
  const plain = doc.toObject ? doc.toObject() : doc;
  emitToUser(plain.userId, plain);
  return doc;
};

const listForUser = async (userId, { limit = 50 } = {}) =>
  Notification.find({ userId }).sort({ createdAt: -1 }).limit(Math.min(Number(limit) || 50, 100)).lean();

const markRead = async (userId, notificationId) =>
  Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { readAt: new Date() },
    { new: true }
  ).lean();

const markAllRead = async (userId) => {
  const result = await Notification.updateMany({ userId, readAt: null }, { readAt: new Date() });
  return { modifiedCount: result.modifiedCount };
};

const countUnread = async (userId) => Notification.countDocuments({ userId, readAt: null });

/** @param {import('mongoose').Document} appt populated client + professional */
const notifyAppointmentCreated = async (appt, creatorRole) => {
  const tid = appt._id;
  const start = formatWhen(appt.startTime);
  const client = appt.clientUserId;
  const prof = appt.professionalUserId;
  const clientId = client?._id || client;
  const profId = prof?._id || prof;
  const clientName = typeof client === "object" && client?.name ? client.name : "A client";
  const profName = typeof prof === "object" && prof?.name ? prof.name : "Your provider";

  if (creatorRole === "CLIENT") {
    await createNotification({
      userId: profId,
      title: "New booking request",
      body: `${clientName} requested an appointment (${start || "time TBD"}). Review in Requests.`,
      category: "REQUEST",
      relatedType: "Appointment",
      relatedId: tid,
      linkPath: "/psychiatrist/requests",
    });
  } else if (creatorRole === "PROFESSIONAL") {
    await createNotification({
      userId: clientId,
      title: "Appointment scheduled",
      body: `${profName} scheduled a session with you (${start || "see appointments"}).`,
      category: "APPOINTMENT",
      relatedType: "Appointment",
      relatedId: tid,
      linkPath: "/client/appointments",
    });
  }
};

const notifyAppointmentStatusChange = async (updated, previousStatus) => {
  if (!updated || String(previousStatus) === String(updated.status)) return;
  const status = updated.status;
  const clientRef = updated.clientUserId;
  const clientId = clientRef?._id || clientRef;
  const profRef = updated.professionalUserId;
  const profName = typeof profRef === "object" && profRef?.name ? profRef.name : "Your provider";
  const start = formatWhen(updated.startTime);

  if (status === "CONFIRMED") {
    await createNotification({
      userId: clientId,
      title: "Appointment confirmed",
      body: `Your session with ${profName} is confirmed (${start || "see appointments"}).`,
      category: "APPOINTMENT",
      relatedType: "Appointment",
      relatedId: updated._id,
      linkPath: "/client/appointments",
    });
  }
  if (status === "CANCELLED") {
    await createNotification({
      userId: clientId,
      title: "Appointment cancelled",
      body: `A session (${start || "scheduled time"}) was cancelled. Check your appointments for details.`,
      category: "APPOINTMENT",
      relatedType: "Appointment",
      relatedId: updated._id,
      linkPath: "/client/appointments",
    });
  }
};

/** @param session mongoose doc with clientUserId and populated professionalUserId */
const notifyChatLockChange = async (session, isLocked) => {
  const clientId = session.clientUserId?._id || session.clientUserId;
  const profName =
    typeof session.professionalUserId === "object" && session.professionalUserId?.name
      ? session.professionalUserId.name
      : "Your provider";
  await createNotification({
    userId: clientId,
    title: isLocked ? "Chat locked" : "Chat unlocked",
    body: isLocked
      ? `${profName} locked the secure chat until further notice.`
      : `${profName} unlocked your secure chat.`,
    category: "CHAT",
    relatedType: "ChatSession",
    relatedId: session._id,
    linkPath: "/client/chat",
  });
};

const notifyNewReview = async (professionalUserId, reviewId, rating, clientName) => {
  await createNotification({
    userId: professionalUserId,
    title: "New review received",
    body: `${clientName || "A client"} left a ${rating}-star rating.`,
    category: "SYSTEM",
    relatedType: "Review",
    relatedId: reviewId,
    linkPath: "/psychiatrist/reviews",
  });
};

module.exports = {
  attachIo,
  createNotification,
  listForUser,
  markRead,
  markAllRead,
  countUnread,
  notifyAppointmentCreated,
  notifyAppointmentStatusChange,
  notifyChatLockChange,
  notifyNewReview,
};
