import { http, httpForm } from "../lib/http";

export const professionalApi = {
  getMyProfile: (token) => http("/professionals/me/profile", {}, token),
  upsertProfile: (body, token) =>
    http("/professionals/me/profile", { method: "POST", body: JSON.stringify(body) }, token),
  submitVerification: (body, token) =>
    http("/professionals/me/verification", { method: "POST", body: JSON.stringify(body) }, token),
  getMyVerificationStatus: (token) => http("/professionals/me/verification-status", {}, token),
  listRequests: (token) => http("/professionals/requests", {}, token),
  listAppointments: (token) => http("/professionals/appointments", {}, token),
  uploadAppointmentReceipt: (formData, token) =>
    httpForm("/professionals/appointments/upload-receipt", formData, token),
  /** Client books with professionalUserId; professional books with clientUserId. */
  createAppointment: (body, token) =>
    http("/professionals/appointments", { method: "POST", body: JSON.stringify(body) }, token),
  listMyClients: (token) => http("/professionals/me/clients", {}, token),
  getClientGoalsTasks: (clientUserId, token) =>
    http(`/professionals/clients/${clientUserId}/goals-tasks`, {}, token),
  createClientGoal: (clientUserId, body, token) =>
    http(`/professionals/clients/${clientUserId}/goals`, { method: "POST", body: JSON.stringify(body) }, token),
  updateClientGoal: (clientUserId, goalId, body, token) =>
    http(`/professionals/clients/${clientUserId}/goals/${goalId}`, { method: "PATCH", body: JSON.stringify(body) }, token),
  createClientTask: (clientUserId, body, token) =>
    http(`/professionals/clients/${clientUserId}/tasks`, { method: "POST", body: JSON.stringify(body) }, token),
  updateClientTask: (clientUserId, taskId, body, token) =>
    http(`/professionals/clients/${clientUserId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(body) }, token),
  recommendClientGoalsTasks: (clientUserId, body, token) =>
    http(`/professionals/clients/${clientUserId}/recommendations/goals-tasks`, { method: "POST", body: JSON.stringify(body) }, token),
  updateAppointmentStatus: (id, status, token, paymentVerificationNotes) =>
    http(`/professionals/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, paymentVerificationNotes }),
    }, token),
  listReviews: (professionalUserId, token) => http(`/professionals/${professionalUserId}/reviews`, {}, token),
  createReview: (professionalUserId, body, token) =>
    http(`/professionals/${professionalUserId}/reviews`, { method: "POST", body: JSON.stringify(body) }, token),
  toggleChatLock: (chatSessionId, isLocked, token) =>
    http(`/professionals/chat-sessions/${chatSessionId}/lock`, { method: "PATCH", body: JSON.stringify({ isLocked }) }, token),
  listExternalAppointments: (token) => http("/professionals/external-appointments", {}, token),
  createExternalAppointment: (body, token) =>
    http("/professionals/external-appointments", { method: "POST", body: JSON.stringify(body) }, token),
  updateExternalAppointmentStatus: (id, status, token) =>
    http(`/professionals/external-appointments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token),
  createAbuseReport: (body, token) =>
    http("/users/complaints", { method: "POST", body: JSON.stringify(body) }, token),
  listMyAbuseReports: (token) => http("/users/complaints", {}, token),
};

