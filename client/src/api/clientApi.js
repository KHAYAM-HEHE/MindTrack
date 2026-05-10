import { http } from "../lib/http";

export const clientApi = {
  listGoals: (token) => http("/users/goals", {}, token),
  createGoal: (body, token) => http("/users/goals", { method: "POST", body: JSON.stringify(body) }, token),
  updateGoal: (id, body, token) =>
    http(`/users/goals/${id}`, { method: "PATCH", body: JSON.stringify(body) }, token),
  recommendGoalsTasks: (body, token) =>
    http("/users/recommendations/goals-tasks", { method: "POST", body: JSON.stringify(body) }, token),
  listTasks: (token) => http("/users/tasks", {}, token),
  createTask: (body, token) => http("/users/tasks", { method: "POST", body: JSON.stringify(body) }, token),
  updateTask: (id, body, token) =>
    http(`/users/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }, token),
  listMoodSurveys: (token) => http("/users/mood-surveys", {}, token),
  createMoodSurvey: (body, token) =>
    http("/users/mood-surveys", { method: "POST", body: JSON.stringify(body) }, token),
  listMedicationLogs: (token) => http("/users/medications/logs", {}, token),
  createMedicationLog: (body, token) =>
    http("/users/medications/logs", { method: "POST", body: JSON.stringify(body) }, token),
  createComplaint: (body, token) => http("/users/complaints", { method: "POST", body: JSON.stringify(body) }, token),
  listComplaints: (token) => http("/users/complaints", {}, token),
  searchProfessionals: (query, token) =>
    http(`/professionals/search${query ? `?q=${encodeURIComponent(query)}` : ""}`, {}, token),
  bookAppointment: (body, token) =>
    http("/professionals/appointments", { method: "POST", body: JSON.stringify(body) }, token),
  listAppointments: (token) => http("/professionals/appointments", {}, token),
  getReport: (range, token) => http(`/reports/${range}`, {}, token),
};

