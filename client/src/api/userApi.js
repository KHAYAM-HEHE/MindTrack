import { http } from "../lib/http";

/** Shared `/users/me/*` helpers for any authenticated role (client or professional). */
export const userApi = {
  listNotifications: (token, query = {}) => {
    const q = query.limit != null ? `?limit=${encodeURIComponent(String(query.limit))}` : "";
    return http(`/users/me/notifications${q}`, {}, token);
  },
  markNotificationRead: (id, token) =>
    http(`/users/me/notifications/${id}/read`, { method: "PATCH" }, token),
  markAllNotificationsRead: (token) =>
    http("/users/me/notifications/read-all", { method: "POST" }, token),
  getUnreadNotificationCount: (token) => http("/users/me/notifications/unread-count", {}, token),
};
