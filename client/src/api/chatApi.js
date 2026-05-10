import { http, httpForm } from "../lib/http";

export const chatApi = {
  listSessions: (token) => http("/chat/sessions", {}, token),
  getOrCreateSession: (body, token) =>
    http("/chat/sessions", { method: "POST", body: JSON.stringify(body) }, token),
  listMessages: (sessionId, token, query = {}) => {
    const q = new URLSearchParams();
    if (query.before != null) {
      const b = query.before instanceof Date ? query.before.toISOString() : String(query.before);
      q.set("before", b);
    }
    if (query.limit) q.set("limit", String(query.limit));
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return http(`/chat/sessions/${sessionId}/messages${suffix}`, {}, token);
  },
  sendMessage: (sessionId, body, token) =>
    http(`/chat/sessions/${sessionId}/messages`, { method: "POST", body: JSON.stringify(body) }, token),
  uploadAttachment: (sessionId, file, token) => {
    const fd = new FormData();
    fd.append("file", file);
    return httpForm(`/chat/sessions/${sessionId}/upload`, fd, token);
  },
};
