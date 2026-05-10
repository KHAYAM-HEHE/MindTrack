import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Paperclip, Search, Send, Shield, UserRound } from "lucide-react";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { publicFileUrl } from "../../lib/http";

export default function ClientChatPage() {
  const token = useAuthStore((s) => s.token);
  const me = useAuthStore((s) => s.user);
  const {
    client,
    chat,
    loadClientData,
    loadChatSessions,
    openChatSession,
    sendMessage,
    uploadChatAttachment,
    loadOlderChatMessages,
    loading,
    error,
  } = useAppStore();

  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    loadChatSessions(token);
    loadClientData(token);
  }, [token, loadChatSessions, loadClientData]);

  const sessions = useMemo(() => {
    if (!query.trim()) return chat.sessions;
    const q = query.toLowerCase();
    return chat.sessions.filter((s) => {
      const name = s.professionalUserId?.name || s.professionalUserId?.displayName || "";
      return String(name).toLowerCase().includes(q);
    });
  }, [chat.sessions, query]);

  const activeSession = useMemo(
    () => chat.sessions.find((s) => s._id === chat.activeSessionId),
    [chat.sessions, chat.activeSessionId]
  );

  const professionals = client.professionals || [];

  const startChatWithProfessional = async () => {
    if (!selectedProfessionalId || !token) return;
    await openChatSession({ professionalUserId: selectedProfessionalId }, token);
  };

  const openExistingSession = async (session) => {
    const profId = session.professionalUserId?._id || session.professionalUserId;
    if (!profId || !token) return;
    await openChatSession({ professionalUserId: profId }, token);
  };

  const isMine = (m) => String(m.senderUserId?._id || m.senderUserId) === String(me?._id);

  const renderMessageBody = (m, mine) => {
    const href = publicFileUrl(m.attachmentUrl);
    const isFile = m.messageType === "FILE" && m.attachmentUrl;
    const isImg = isFile && m.attachmentMimeType?.startsWith("image/");
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
              {m.attachmentOriginalName || "Download attachment"}
            </a>
          )}
          {m.content ? <p className={`mt-2 leading-relaxed ${mine ? "opacity-95" : ""}`}>{m.content}</p> : null}
        </div>
      );
    }
    return <p className="leading-relaxed">{m.content || " "}</p>;
  };

  return (
    <ClientShell title="Secure Session Chat">
      <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm lg:grid-cols-[360px_1fr]">
        <aside className="flex min-h-[640px] flex-col border-r border-outline-variant bg-surface">
          <div className="border-b border-outline-variant px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-h2 text-h2 text-on-surface">Messages</h2>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-10 pr-3 text-sm text-on-surface"
                placeholder="Search conversations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="mt-3 space-y-2">
              <label className="block text-xs font-medium text-on-surface-variant">Message your provider</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                  value={selectedProfessionalId}
                  onChange={(e) => setSelectedProfessionalId(e.target.value)}
                >
                  <option value="">Select a professional…</option>
                  {professionals
                    .filter((p) => p.userId || p.user?._id)
                    .map((p) => {
                      const id = p.userId || p.user?._id;
                      const label = p.displayName || p.name || p.specialization || "Professional";
                      return (
                        <option key={String(id)} value={String(id)}>
                          {label}
                        </option>
                      );
                    })}
                </select>
                <button
                  type="button"
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary disabled:opacity-50"
                  disabled={!selectedProfessionalId}
                  onClick={() => startChatWithProfessional()}
                >
                  Open
                </button>
              </div>
              {!professionals.length ? (
                <p className="text-xs text-on-surface-variant">
                  No professionals in directory yet. Book an appointment from Find a Professional first, or search the directory there so profiles load here.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex-1 space-y-1 overflow-auto px-3 py-3">
            {sessions.map((session) => {
              const active = chat.activeSessionId === session._id;
              const name =
                session.professionalUserId?.name ||
                session.professionalUserId?.displayName ||
                "Professional";
              return (
                <button
                  key={session._id}
                  type="button"
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${active ? "border-outline-variant bg-surface-container-low" : "border-transparent hover:border-outline-variant/50 hover:bg-surface-container"}`}
                  onClick={() => openExistingSession(session)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
                      {String(name).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-md text-label-md text-on-surface">{name}</p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {session.isLocked ? "Locked by provider" : "Secure clinical conversation"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
            {!sessions.length ? <p className="px-2 py-6 text-sm text-on-surface-variant">No conversations yet.</p> : null}
          </div>
        </aside>

        <section className="flex min-h-[640px] flex-col bg-surface-container-lowest">
          <header className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-h3 text-h3 text-on-surface">
                  {activeSession?.professionalUserId?.name ||
                    activeSession?.professionalUserId?.displayName ||
                    "Conversation"}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {chat.connected ? "Connected • Real-time sync" : "Connecting…"} • Clinical messaging
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs text-on-surface-variant">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Authenticated session
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-auto bg-surface p-6">
            {chat.messagesHasMore ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  className="rounded-full border border-outline-variant bg-surface-container-low px-4 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container"
                  onClick={() => loadOlderChatMessages(token)}
                >
                  Load older messages
                </button>
              </div>
            ) : null}
            {!chat.messages.length ? (
              <p className="text-sm text-on-surface-variant">No messages yet. Choose a professional and open a conversation.</p>
            ) : null}
            {chat.messages.map((m) => {
              const mine = isMine(m);
              return (
                <div key={m._id || `${m.senderUserId}-${m.createdAt}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${mine ? "rounded-br-sm bg-primary text-on-primary" : "rounded-bl-sm border border-outline-variant/50 bg-surface-container-low text-on-surface"}`}
                  >
                    {!mine ? (
                      <p className="mb-1 text-xs font-semibold text-on-surface-variant">{m.senderUserId?.name || "Professional"}</p>
                    ) : null}
                    {renderMessageBody(m, mine)}
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="border-t border-outline-variant bg-surface-container-lowest p-4">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file || !chat.activeSessionId || !token || activeSession?.isLocked) return;
                await uploadChatAttachment(chat.activeSessionId, file, message.trim(), token);
                setMessage("");
              }}
            />
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low text-on-surface disabled:opacity-40"
                disabled={!chat.activeSessionId || Boolean(activeSession?.isLocked)}
                title="Attach file"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={activeSession?.isLocked ? "Chat is locked by your provider…" : "Type a message…"}
                rows={1}
                disabled={Boolean(activeSession?.isLocked)}
              />
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-on-primary disabled:opacity-40"
                disabled={!chat.activeSessionId || !message.trim() || Boolean(activeSession?.isLocked)}
                onClick={async () => {
                  if (!chat.activeSessionId || !message.trim()) return;
                  await sendMessage(chat.activeSessionId, message, token);
                  setMessage("");
                }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-outline">
              <Shield className="h-3.5 w-3.5" />
              TLS-protected channel — use only for non-emergency coordination with your provider.
            </p>
          </footer>
        </section>
      </div>

      {loading ? <p className="mt-2 text-sm text-primary">Syncing...</p> : null}
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </ClientShell>
  );
}
