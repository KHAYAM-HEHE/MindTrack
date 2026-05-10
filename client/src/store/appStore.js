import { create } from "zustand";
import { clientApi } from "../api/clientApi";
import { professionalApi } from "../api/professionalApi";
import { adminApi } from "../api/adminApi";
import { chatApi } from "../api/chatApi";
import { userApi } from "../api/userApi";
import { createSocket } from "../lib/socket";
import { HttpError } from "../lib/http";
import { useAuthStore } from "./authStore";

export const useAppStore = create((set, get) => ({
  loading: false,
  error: "",
  client: {
    goals: [],
    tasks: [],
    moods: [],
    meds: [],
    complaints: [],
    professionals: [],
    appointments: [],
    reports: {},
    aiQuote: null,
  },
  professional: {
    requests: [],
    appointments: [],
    reviews: [],
  },
  admin: {
    verifications: [],
    complaints: [],
    users: [],
    tickets: [],
    auditLogs: [],
    stats: null,
  },
  employee: {
    verifications: [],
  },
  chat: {
    sessions: [],
    activeSessionId: "",
    messages: [],
    messagesHasMore: false,
    messagesNextBefore: null,
    connected: false,
  },
  socket: null,
  notificationUnreadCount: 0,

  setError: (error) => set({ error }),
  clearError: () => set({ error: "" }),

  fetchNotificationUnreadCount: async (token) => {
    if (!token) return;
    try {
      const data = await userApi.getUnreadNotificationCount(token);
      const count = typeof data?.count === "number" ? data.count : 0;
      set({ notificationUnreadCount: count });
    } catch {
      /* ignore */
    }
  },

  withLoad: async (fn) => {
    set({ loading: true, error: "" });
    try {
      return await fn();
    } catch (error) {
      set({ error: error.message || "Request failed" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadClientData: async (token) =>
    get().withLoad(async () => {
      const [goals, tasks, moods, meds, complaints, professionals, appointments] = await Promise.all([
        clientApi.listGoals(token),
        clientApi.listTasks(token),
        clientApi.listMoodSurveys(token),
        clientApi.listMedicationLogs(token),
        clientApi.listComplaints(token),
        clientApi.searchProfessionals("", token),
        clientApi.listAppointments(token),
      ]);
      set((state) => ({
        client: { ...state.client, goals, tasks, moods, meds, complaints, professionals, appointments },
      }));
    }),

  createGoal: async (payload, token) =>
    get().withLoad(async () => {
      await clientApi.createGoal(payload, token);
      await get().loadClientData(token);
    }),
  updateGoal: async (id, payload, token) =>
    get().withLoad(async () => {
      await clientApi.updateGoal(id, payload, token);
      await get().loadClientData(token);
    }),
  fetchGoalTaskRecommendations: async (body, token) => {
    set({ error: "" });
    try {
      return await clientApi.recommendGoalsTasks(body, token);
    } catch (error) {
      set({ error: error.message || "Request failed" });
      throw error;
    }
  },
  fetchAiQuote: async (token) => {
    set({ error: "" });
    try {
      const aiQuote = await clientApi.getAiQuote(token);
      set((state) => ({ client: { ...state.client, aiQuote } }));
      return aiQuote;
    } catch (error) {
      set({ error: error.message || "Request failed" });
      throw error;
    }
  },
  createTask: async (payload, token) =>
    get().withLoad(async () => {
      await clientApi.createTask(payload, token);
      await get().loadClientData(token);
    }),
  updateTask: async (id, payload, token) =>
    get().withLoad(async () => {
      const mappedPayload =
        typeof payload?.isCompleted === "boolean"
          ? {
              ...payload,
              completionStatus: payload.isCompleted ? "DONE" : "PENDING",
            }
          : payload;
      await clientApi.updateTask(id, mappedPayload, token);
      await get().loadClientData(token);
    }),
  createMood: async (payload, token) =>
    get().withLoad(async () => {
      await clientApi.createMoodSurvey(payload, token);
      await get().loadClientData(token);
    }),
  createMedicationLog: async (payload, token) =>
    get().withLoad(async () => {
      await clientApi.createMedicationLog(payload, token);
      await get().loadClientData(token);
    }),
  createComplaint: async (payload, token) =>
    get().withLoad(async () => {
      await clientApi.createComplaint(payload, token);
      await get().loadClientData(token);
    }),
  bookAppointment: async (payload, token) =>
    get().withLoad(async () => {
      await clientApi.bookAppointment(payload, token);
      await get().loadClientData(token);
    }),
  cancelAppointment: async (id, token) =>
    get().withLoad(async () => {
      await clientApi.cancelAppointment(id, token);
      await get().loadClientData(token);
    }),
  loadReport: async (range, token) =>
    get().withLoad(async () => {
      const report = await clientApi.getReport(range, token);
      set((state) => ({ client: { ...state.client, reports: { ...state.client.reports, [range]: report } } }));
    }),

  loadProfessionalData: async (token) =>
    get().withLoad(async () => {
      const [requests, appointments] = await Promise.all([
        professionalApi.listRequests(token),
        professionalApi.listAppointments(token),
      ]);
      set((state) => ({ professional: { ...state.professional, requests, appointments } }));
    }),
  upsertProfessionalProfile: async (payload, token) => get().withLoad(async () => professionalApi.upsertProfile(payload, token)),
  submitVerification: async (payload, token) => get().withLoad(async () => professionalApi.submitVerification(payload, token)),
  updateAppointmentStatus: async (id, status, token, paymentVerificationNotes) =>
    get().withLoad(async () => {
      await professionalApi.updateAppointmentStatus(id, status, token, paymentVerificationNotes);
      await get().loadProfessionalData(token);
    }),
  loadReviews: async (professionalUserId, token) =>
    get().withLoad(async () => {
      const reviews = await professionalApi.listReviews(professionalUserId, token);
      set((state) => ({ professional: { ...state.professional, reviews } }));
    }),
  createReview: async (professionalUserId, payload, token) =>
    get().withLoad(async () => {
      await professionalApi.createReview(professionalUserId, payload, token);
      await get().loadReviews(professionalUserId, token);
    }),
  toggleChatLock: async (chatSessionId, isLocked, token) =>
    get().withLoad(async () => {
      await professionalApi.toggleChatLock(chatSessionId, isLocked, token);
      await get().loadChatSessions(token);
    }),

  loadAdminData: async (token) =>
    get().withLoad(async () => {
      const auditLogsPromise = adminApi.listAuditLogs(token).catch((error) => {
        // HR users can access operational admin data but may not have audit-log permission.
        if ((error instanceof HttpError || typeof error === "object") && error?.status === 403) return [];
        throw error;
      });
      const statsPromise = adminApi.getDashboardStats(token).catch(() => null);
      const [verifications, complaints, users, tickets, auditLogs, stats] = await Promise.all([
        adminApi.listVerifications(token),
        adminApi.listComplaints(token),
        adminApi.listUsers(token),
        adminApi.listTickets(token),
        auditLogsPromise,
        statsPromise,
      ]);
      set((state) => ({
        admin: { ...state.admin, verifications, complaints, users, tickets, auditLogs, stats },
      }));
    }),
  loadAdminStatsOnly: async (token) =>
    get().withLoad(async () => {
      const stats = await adminApi.getDashboardStats(token);
      set((state) => ({ admin: { ...state.admin, stats } }));
    }),
  approveVerification: async (id, token) =>
    get().withLoad(async () => {
      await adminApi.approveVerification(id, token);
      await get().loadAdminData(token);
    }),
  rejectVerification: async (id, reason, token) =>
    get().withLoad(async () => {
      await adminApi.rejectVerification(id, reason, token);
      await get().loadAdminData(token);
    }),
  resolveComplaint: async (id, resolution, token) =>
    get().withLoad(async () => {
      await adminApi.resolveComplaint(id, resolution, token);
      await get().loadAdminData(token);
    }),
  updateUserRole: async (id, role, token) =>
    get().withLoad(async () => {
      await adminApi.updateUserRole(id, role, token);
      await get().loadAdminData(token);
    }),
  updateUserStatus: async (id, status, token) =>
    get().withLoad(async () => {
      await adminApi.updateUserStatus(id, status, token);
      await get().loadAdminData(token);
    }),
  createEmployee: async (payload, token) =>
    get().withLoad(async () => {
      await adminApi.createEmployee(payload, token);
      await get().loadAdminData(token);
    }),
  assignTicket: async (id, assigneeUserId, token) =>
    get().withLoad(async () => {
      await adminApi.assignTicket(id, assigneeUserId, token);
      await get().loadAdminData(token);
    }),
  updateTicketStatus: async (id, status, token) =>
    get().withLoad(async () => {
      await adminApi.updateTicketStatus(id, status, token);
      await get().loadAdminData(token);
    }),

  loadEmployeeVerifications: async (token) =>
    get().withLoad(async () => {
      const verifications = await adminApi.listVerifications(token);
      set((state) => ({ employee: { ...state.employee, verifications } }));
    }),
  approveEmployeeVerification: async (id, token) =>
    get().withLoad(async () => {
      await adminApi.approveVerification(id, token);
      await get().loadEmployeeVerifications(token);
    }),
  rejectEmployeeVerification: async (id, reviewNotes, token) =>
    get().withLoad(async () => {
      await adminApi.rejectVerification(id, reviewNotes, token);
      await get().loadEmployeeVerifications(token);
    }),

  connectChat: (token) => {
    let next = get().socket;
    if (!next) {
      next = createSocket(token);
      next.on("connect", () => set((state) => ({ chat: { ...state.chat, connected: true } })));
      next.on("disconnect", () => set((state) => ({ chat: { ...state.chat, connected: false } })));
      next.on("new-message", (message) =>
        set((state) => {
          const id = message?._id;
          if (id && state.chat.messages.some((m) => m._id === id)) return state;
          return { chat: { ...state.chat, messages: [...state.chat.messages, message] } };
        })
      );
      set({ socket: next });
    }
    if (next && !next._mindtrackNotificationListener) {
      next._mindtrackNotificationListener = true;
      next.on("notification", () => {
        const tok = useAuthStore.getState().token;
        if (tok) get().fetchNotificationUnreadCount(tok);
      });
    }
    return next;
  },
  disconnectChat: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({
      socket: null,
      notificationUnreadCount: 0,
      chat: {
        sessions: [],
        activeSessionId: "",
        messages: [],
        messagesHasMore: false,
        messagesNextBefore: null,
        connected: false,
      },
    });
  },
  loadChatSessions: async (token) =>
    get().withLoad(async () => {
      const sessions = await chatApi.listSessions(token);
      set((state) => ({ chat: { ...state.chat, sessions } }));
    }),
  openChatSession: async (payload, token) =>
    get().withLoad(async () => {
      const session = await chatApi.getOrCreateSession(payload, token);
      const page = await chatApi.listMessages(session._id, token, {});
      set((state) => ({
        chat: {
          ...state.chat,
          activeSessionId: session._id,
          messages: page.messages || [],
          messagesHasMore: Boolean(page.hasMore),
          messagesNextBefore: page.nextBefore || null,
          sessions: state.chat.sessions.some((s) => s._id === session._id)
            ? state.chat.sessions
            : [session, ...state.chat.sessions],
        },
      }));
      const socket = get().connectChat(token);
      socket.emit("join-session", session._id);
    }),
  loadOlderChatMessages: async (token) =>
    get().withLoad(async () => {
      const { chat } = get();
      if (!chat.activeSessionId || !chat.messagesHasMore || !chat.messagesNextBefore) return;
      const page = await chatApi.listMessages(chat.activeSessionId, token, {
        before: chat.messagesNextBefore,
        limit: 50,
      });
      set((state) => ({
        chat: {
          ...state.chat,
          messages: [...(page.messages || []), ...state.chat.messages],
          messagesHasMore: Boolean(page.hasMore),
          messagesNextBefore: page.nextBefore || null,
        },
      }));
    }),
  sendMessage: async (sessionId, payload, token) =>
    get().withLoad(async () => {
      const body = typeof payload === "string" ? { content: payload } : payload;
      const message = await chatApi.sendMessage(sessionId, body, token);
      set((state) => {
        if (message?._id && state.chat.messages.some((m) => m._id === message._id)) return state;
        return { chat: { ...state.chat, messages: [...state.chat.messages, message] } };
      });
    }),
  uploadChatAttachment: async (sessionId, file, caption, token) =>
    get().withLoad(async () => {
      const meta = await chatApi.uploadAttachment(sessionId, file, token);
      const message = await chatApi.sendMessage(
        sessionId,
        {
          content: caption || "",
          messageType: "FILE",
          attachmentUrl: meta.attachmentUrl,
          attachmentMimeType: meta.attachmentMimeType,
          attachmentOriginalName: meta.attachmentOriginalName,
        },
        token
      );
      set((state) => {
        if (message?._id && state.chat.messages.some((m) => m._id === message._id)) return state;
        return { chat: { ...state.chat, messages: [...state.chat.messages, message] } };
      });
    }),
}));

