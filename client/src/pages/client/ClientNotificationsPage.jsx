import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { userApi } from "../../api/userApi";

function formatCreated(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ClientNotificationsPage() {
  const token = useAuthStore((s) => s.token);
  const fetchNotificationUnreadCount = useAppStore((s) => s.fetchNotificationUnreadCount);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyAll, setBusyAll] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await userApi.listNotifications(token, { limit: 80 });
      setItems(Array.isArray(data) ? data : []);
      await fetchNotificationUnreadCount(token);
    } catch (e) {
      setError(e?.message || "Could not load notifications");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, fetchNotificationUnreadCount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const markOne = async (id) => {
    if (!token) return;
    try {
      await userApi.markNotificationRead(id, token);
      setItems((prev) =>
        prev.map((n) => (String(n._id) === String(id) ? { ...n, readAt: new Date().toISOString() } : n))
      );
      await fetchNotificationUnreadCount(token);
    } catch {
      load();
    }
  };

  const markAll = async () => {
    if (!token) return;
    setBusyAll(true);
    try {
      await userApi.markAllNotificationsRead(token);
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
      await fetchNotificationUnreadCount(token);
    } catch {
      load();
    } finally {
      setBusyAll(false);
    }
  };

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <ClientShell title="Notifications">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-on-surface-variant">
            {unread > 0 ? <span className="font-medium text-primary">{unread} unread</span> : "All caught up"}
          </p>
          {items.length > 0 ? (
            <button
              type="button"
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface hover:bg-surface-container-low disabled:opacity-50"
              disabled={busyAll || unread === 0}
              onClick={markAll}
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="mb-6 rounded-xl border border-outline-variant/30 bg-surface-container-low p-5">
          <h3 className="text-xl font-semibold text-on-surface">Session security</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            MindWell may sign you out after inactivity to protect sensitive health data. Enable two-factor authentication under{" "}
            <Link className="font-medium text-primary underline" to="/client/settings">
              Settings
            </Link>
            .
          </p>
        </div>

        {loading ? <p className="text-sm text-on-surface-variant">Loading…</p> : null}
        {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

        <div className="space-y-3">
          {!loading && items.length === 0 ? (
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
              No notifications yet. Booking updates and appointment messages will appear here.
            </div>
          ) : null}
          {items.map((n) => {
            const isUnread = !n.readAt;
            const href = n.linkPath || "/client/appointments";
            return (
              <div
                key={n._id}
                className={`rounded-xl border p-4 shadow-sm transition-colors ${
                  isUnread ? "border-primary/30 bg-surface-container-lowest" : "border-outline-variant/30 bg-surface-container-lowest"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface">{n.title}</p>
                    <p className="text-sm text-on-surface-variant">{n.body}</p>
                    <p className="mt-2 text-xs text-outline">{formatCreated(n.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    {isUnread ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary hover:underline"
                        onClick={() => markOne(n._id)}
                      >
                        Mark read
                      </button>
                    ) : null}
                    <Link className="text-xs font-semibold text-primary hover:underline" to={href} onClick={() => markOne(n._id)}>
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ClientShell>
  );
}
