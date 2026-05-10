import { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { professionalApi } from "../../api/professionalApi";
import { publicFileUrl } from "../../lib/http";
import { PsychiatristShell } from "./PsychiatristShell";

export default function PsychiatristSecureChatPage() {
  const token = useAuthStore((s) => s.token);
  const me = useAuthStore((s) => s.user);
  const {
    professional,
    chat,
    loadProfessionalData,
    loadChatSessions,
    openChatSession,
    sendMessage,
    uploadChatAttachment,
    loadOlderChatMessages,
    toggleChatLock,
    loading,
    error,
  } = useAppStore();

  const [selectedClientId, setSelectedClientId] = useState("");
  const [message, setMessage] = useState("");
  const [clientsFromApi, setClientsFromApi] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    loadChatSessions(token);
    loadProfessionalData(token);
  }, [token, loadChatSessions, loadProfessionalData]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) return;
      try {
        const data = await professionalApi.listMyClients(token);
        if (!cancelled) setClientsFromApi(data || []);
      } catch {
        if (!cancelled) setClientsFromApi([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const clientsFromAppointments = useMemo(() => {
    const map = new Map();
    for (const a of professional.appointments || []) {
      const c = a.clientUserId;
      if (!c) continue;
      const id = c._id || c;
      const key = String(id);
      if (!map.has(key)) map.set(key, typeof c === "object" ? c : { _id: id, name: "Client" });
    }
    return [...map.values()];
  }, [professional.appointments]);

  const clientsForPicker = useMemo(() => {
    const map = new Map();
    for (const c of [...clientsFromApi, ...clientsFromAppointments]) {
      const id = c?._id ?? c;
      const key = String(id);
      if (!map.has(key)) map.set(key, typeof c === "object" && c ? c : { _id: id, name: "Client" });
    }
    return [...map.values()];
  }, [clientsFromApi, clientsFromAppointments]);

  const activeSession = useMemo(
    () => chat.sessions.find((item) => item._id === chat.activeSessionId),
    [chat.sessions, chat.activeSessionId]
  );

  const startChatWithClient = async () => {
    if (!selectedClientId || !token) return;
    await openChatSession({ clientUserId: selectedClientId }, token);
  };

  const openExistingSession = async (session) => {
    const clientId = session.clientUserId?._id || session.clientUserId;
    if (!clientId || !token) return;
    await openChatSession({ clientUserId: clientId }, token);
  };

  const isMine = (item) => String(item.senderUserId?._id || item.senderUserId) === String(me?._id);

  const renderMessageBody = (item, mine) => {
    const href = publicFileUrl(item.attachmentUrl);
    const isFile = item.messageType === "FILE" && item.attachmentUrl;
    const isImg = isFile && item.attachmentMimeType?.startsWith("image/");
    if (isFile) {
      return (
        <div className={mine ? "text-on-primary" : "text-on-surface"}>
          {isImg ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="block">
              <img src={href} alt="" className="max-h-52 w-auto rounded-lg border border-white/20" />
            </a>
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium underline ${mine ? "text-on-primary" : "text-primary"}`}
            >
              {item.attachmentOriginalName || "Download attachment"}
            </a>
          )}
          {item.content ? <p className={`mt-2 ${mine ? "opacity-95" : ""}`}>{item.content}</p> : null}
        </div>
      );
    }
    return <p>{item.content || " "}</p>;
  };

  return (
    <PsychiatristShell title="Secure Session Chat" subtitle="Message clients you work with">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant/30 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-h3 text-h3 text-on-surface">Messages</h3>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-on-surface-variant">Start or open chat</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Select a client…</option>
                  {clientsForPicker.map((c) => (
                    <option key={String(c._id)} value={String(c._id)}>
                      {c.name || c.email || "Client"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded-lg bg-primary px-3 py-2 text-xs text-on-primary disabled:opacity-50"
                  disabled={!selectedClientId}
                  onClick={() => startChatWithClient()}
                >
                  Open
                </button>
              </div>
              {!clientsForPicker.length ? (
                <p className="text-xs text-on-surface-variant">
                  Clients appear here after they book an appointment or message you. You can still open past chat sessions below.
                </p>
              ) : null}
            </div>
          </div>
          <div className="max-h-[560px] space-y-2 overflow-auto p-3">
            {(chat.sessions || []).map((session) => {
              const active = chat.activeSessionId === session._id;
              const clientName = session.clientUserId?.name || session.clientUserId?.email || "Client";
              return (
                <button
                  key={session._id}
                  type="button"
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    active ? "border-primary bg-surface-container-low" : "border-outline-variant/40 hover:bg-surface"
                  }`}
                  onClick={() => openExistingSession(session)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-label-md text-label-md text-on-surface">{clientName}</p>
                    <span className="shrink-0 text-[11px] text-on-surface-variant">{session.isLocked ? "Locked" : "Open"}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-on-surface-variant">Updated {session.updatedAt ? new Date(session.updatedAt).toLocaleString() : ""}</p>
                </button>
              );
            })}
            {!chat.sessions?.length ? <p className="px-2 py-4 text-sm text-on-surface-variant">No sessions yet.</p> : null}
          </div>
        </aside>

        <section className="flex min-h-[620px] flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
          <header className="flex items-center justify-between border-b border-outline-variant/30 px-6 py-4">
            <div>
              <h3 className="font-h3 text-h3 text-on-surface">{activeSession?.clientUserId?.name || activeSession?.clientUserId?.email || "Secure Session"}</h3>
              <p className="text-xs text-on-surface-variant">
                {chat.connected ? "Connected" : "Connecting…"} • Clinical messaging
              </p>
            </div>
            {activeSession ? (
              <button
                type="button"
                className="rounded-full border border-outline-variant bg-surface px-4 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low"
                onClick={() => toggleChatLock(activeSession._id, !activeSession.isLocked, token)}
              >
                {activeSession.isLocked ? "Unlock Chat" : "Lock Chat"}
              </button>
            ) : null}
          </header>

          <div className="flex-1 space-y-3 overflow-auto bg-background p-6">
            {chat.messagesHasMore ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  className="rounded-full border border-outline-variant/40 bg-surface px-4 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low"
                  onClick={() => loadOlderChatMessages(token)}
                >
                  Load older messages
                </button>
              </div>
            ) : null}
            {(chat.messages || []).length === 0 ? (
              <p className="text-sm text-on-surface-variant">No messages yet. Select a client session or start a new chat.</p>
            ) : null}
            {(chat.messages || []).map((item) => {
              const mine = isMine(item);
              return (
                <div key={item._id || `${item.senderUserId}-${item.createdAt}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
                      mine ? "rounded-br-sm bg-primary text-on-primary" : "rounded-bl-sm border border-outline-variant/40 bg-surface text-on-surface"
                    }`}
                  >
                    {!mine ? (
                      <p className="mb-1 text-[11px] font-semibold text-on-surface-variant">{item.senderUserId?.name || "Client"}</p>
                    ) : null}
                    {renderMessageBody(item, mine)}
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="border-t border-outline-variant/30 p-4">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file || !chat.activeSessionId || !token) return;
                await uploadChatAttachment(chat.activeSessionId, file, message.trim(), token);
                setMessage("");
              }}
            />
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface text-on-surface disabled:opacity-40"
                disabled={!chat.activeSessionId}
                title="Attach file"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a secure message..."
                rows={1}
              />
              <button
                type="button"
                className="h-12 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-40"
                disabled={!chat.activeSessionId || !message.trim()}
                onClick={async () => {
                  if (!chat.activeSessionId || !message.trim()) return;
                  await sendMessage(chat.activeSessionId, message, token);
                  setMessage("");
                }}
              >
                Send
              </button>
            </div>
            {loading ? <p className="mt-2 text-xs text-primary">Syncing...</p> : null}
            {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
          </footer>
        </section>
      </div>
    </PsychiatristShell>
  );
}
