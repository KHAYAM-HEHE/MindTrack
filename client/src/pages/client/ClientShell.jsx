import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import ClientSidebar, { ClientSidebarNav } from "./ClientSidebar";

function useMinMd() {
  const [minMd, setMinMd] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setMinMd(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return minMd;
}

export default function ClientShell({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const clearSession = useAuthStore((s) => s.clearSession);
  const connectChat = useAppStore((s) => s.connectChat);
  const fetchNotificationUnreadCount = useAppStore((s) => s.fetchNotificationUnreadCount);
  const notificationUnreadCount = useAppStore((s) => s.notificationUnreadCount);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const minMd = useMinMd();

  useEffect(() => {
    if (!token) return;
    connectChat(token);
    fetchNotificationUnreadCount(token);
  }, [token, connectChat, fetchNotificationUnreadCount]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-outline-variant/30 bg-surface-container-lowest/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="shrink-0 rounded-xl p-2 text-on-surface hover:bg-surface-container-low md:hidden"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <span className="material-symbols-outlined text-[26px]">menu</span>
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold text-primary">MindTrack</h1>
              <p className="truncate text-xs text-on-surface-variant">Mental Health Care</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/client/notifications"
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low md:hidden ${
                location.pathname === "/client/notifications" ? "border-primary/50 bg-surface-container-low text-primary" : ""
              }`}
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {notificationUnreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-0.5 text-[9px] font-bold leading-none text-on-error">
                  {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              className="hidden rounded-xl border border-outline-variant px-3 py-1.5 text-sm text-on-surface hover:bg-surface-container-low md:inline-flex"
              onClick={() => {
                clearSession();
                navigate("/auth/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed bottom-0 left-0 top-0 z-[70] flex w-[min(20rem,100vw-1rem)] flex-col border-r border-outline-variant bg-surface-container-lowest shadow-xl md:hidden">
            <div className="flex shrink-0 items-start justify-between gap-2 border-b border-outline-variant/50 px-4 py-4">
              <div className="min-w-0">
                <p className="font-semibold text-on-surface">Menu</p>
                <p className="text-xs text-on-surface-variant">Navigate your care</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-3">
              <ClientSidebarNav showBrand={false} onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        </>
      ) : null}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[minmax(0,250px)_1fr] md:items-start md:gap-6">
        {minMd ? (
          <div>
            <ClientSidebar />
          </div>
        ) : null}
        <main className="min-w-0 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm sm:p-5 md:p-6">
          <h2 className="mb-4 text-xl font-semibold text-on-surface sm:text-2xl">{title}</h2>
          {children}
        </main>
      </div>
    </div>
  );
}
