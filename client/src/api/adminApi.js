import { http } from "../lib/http";
import { toQueryString } from "../lib/queryString";

export const adminApi = {
  getDashboardStats: (token) => http("/admin/dashboard/stats", {}, token),

  listVerifications: (token, query) => http(`/admin/verifications${toQueryString(query)}`, {}, token),
  getVerification: (id, token) => http(`/admin/verifications/${id}`, {}, token),
  approveVerification: (id, token) => http(`/admin/verifications/${id}/approve`, { method: "POST" }, token),
  rejectVerification: (id, reviewNotes, token) =>
    http(`/admin/verifications/${id}/reject`, { method: "POST", body: JSON.stringify({ reviewNotes }) }, token),

  listRequests: (token, query) => http(`/admin/requests${toQueryString(query)}`, {}, token),
  updateAppointmentRequestStatus: (id, status, token) =>
    http(`/admin/requests/appointments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token),

  listEmployees: (token, query) => http(`/admin/employees${toQueryString(query)}`, {}, token),
  listHrUsers: (token, query) => http(`/admin/hr-users${toQueryString(query)}`, {}, token),
  listClients: (token, query) => http(`/admin/clients${toQueryString(query)}`, {}, token),
  getClient: (id, token) => http(`/admin/clients/${id}`, {}, token),
  listPsychiatrists: (token, query) => http(`/admin/psychiatrists${toQueryString(query)}`, {}, token),
  getPsychiatrist: (id, token) => http(`/admin/psychiatrists/${id}`, {}, token),
  getUser: (id, token) => http(`/admin/users/${id}`, {}, token),

  listComplaints: (token, query) => http(`/admin/complaints${toQueryString(query)}`, {}, token),
  getComplaintById: (id, token) => http(`/admin/complaints/${id}`, {}, token),
  resolveComplaint: (id, resolutionNotes, token) =>
    http(`/admin/complaints/${id}/resolve`, { method: "POST", body: JSON.stringify({ resolutionNotes }) }, token),
  complaintEvidence: (id, token) => http(`/admin/complaints/${id}/evidence`, {}, token),

  listUsers: (token, query) => http(`/admin/users${toQueryString(query)}`, {}, token),
  updateUserRole: (id, role, token) =>
    http(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }, token),
  updateUserStatus: (id, status, token) =>
    http(`/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token),
  createEmployee: (body, token) => http("/admin/employees", { method: "POST", body: JSON.stringify(body) }, token),

  listTickets: (token, query) => http(`/admin/tickets${toQueryString(query)}`, {}, token),
  assignTicket: (id, assignedTo, token) =>
    http(`/admin/tickets/${id}/assign`, { method: "POST", body: JSON.stringify({ assignedTo }) }, token),
  updateTicketStatus: (id, status, token) =>
    http(`/admin/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token),

  listAuditLogs: (token, query) => http(`/admin/audit-logs${toQueryString(query)}`, {}, token),
};
