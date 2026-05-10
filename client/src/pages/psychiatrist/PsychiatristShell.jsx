import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

const navItems = [
  { to: "/psychiatrist/dashboard", label: "Dashboard", icon: "grid_view" },
  { to: "/psychiatrist/notifications", label: "Notifications", icon: "notifications", badge: true },
  { to: "/psychiatrist/schedule", label: "Schedule", icon: "event" },
  { to: "/psychiatrist/client-care", label: "Client goals & tasks", icon: "flag" },
  { to: "/psychiatrist/requests", label: "Requests Inbox", icon: "inbox" },
  { to: "/psychiatrist/chat", label: "Secure Chat", icon: "chat_bubble" },
  { to: "/psychiatrist/external-scheduler", label: "External Scheduler", icon: "calendar_month" },
  { to: "/psychiatrist/reviews", label: "Ratings & Reviews", icon: "star" },
  { to: "/psychiatrist/abuse-reports", label: "Abuse Reports", icon: "report" },
  { to: "/psychiatrist/profile", label: "Manage Profile", icon: "settings" },
  { to: "/psychiatrist/profile/public", label: "Profile Detail", icon: "badge" },
];

function PsychiatristNavLinks({ pathname, notificationUnreadCount, onNavigate, navClassName }) {
  return (
    <nav className={navClassName}>
      {navItems.map((item) => {
        const active = pathname === item.to;
        const showBadge = item.badge && notificationUnreadCount > 0;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
              active ? "bg-surface-container-high font-semibold text-primary" : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="min-w-0 flex-1 truncate font-label-md">{item.label}</span>
            {showBadge ? (
              <span className="min-w-[1.25rem] rounded-full bg-error px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-on-error">
                {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function PsychiatristShell({ title, subtitle, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const clearSession = useAuthStore((s) => s.clearSession);
  const connectChat = useAppStore((s) => s.connectChat);
  const fetchNotificationUnreadCount = useAppStore((s) => s.fetchNotificationUnreadCount);
  const notificationUnreadCount = useAppStore((s) => s.notificationUnreadCount);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    connectChat(token);
    fetchNotificationUnreadCount(token);
  }, [token, connectChat, fetchNotificationUnreadCount]);

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md md:flex">
      <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-64 flex-col gap-2 border-r border-outline-variant bg-surface-container-lowest p-4 shadow-sm md:flex">
        <div className="mb-4 px-4 py-6">
          <h1 className="font-h2 font-extrabold tracking-tight text-primary">MindTrack</h1>
          <p className="font-label-sm text-on-surface-variant">Professional Portal</p>
        </div>
        <PsychiatristNavLinks
          pathname={location.pathname}
          notificationUnreadCount={notificationUnreadCount}
          navClassName="flex flex-1 flex-col gap-1 overflow-y-auto"
        />
      </aside>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed bottom-0 left-0 top-0 z-[70] flex w-[min(18rem,100vw-2rem)] flex-col bg-surface-container-lowest p-4 shadow-xl md:hidden">
            <div className="mb-3 flex items-start justify-between gap-2 border-b border-outline-variant/50 pb-3">
              <div className="min-w-0 px-1">
                <h1 className="font-h2 font-extrabold tracking-tight text-primary">MindTrack</h1>
                <p className="font-label-sm text-on-surface-variant">Professional Portal</p>
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
            <PsychiatristNavLinks
              pathname={location.pathname}
              notificationUnreadCount={notificationUnreadCount}
              onNavigate={() => setMobileNavOpen(false)}
              navClassName="flex flex-1 flex-col gap-1 overflow-y-auto pb-4"
            />
          </div>
        </>
      ) : null}

      <main className="w-full flex-1 md:ml-64">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant/60 bg-surface-container-lowest/80 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <button
              type="button"
              className="mt-0.5 shrink-0 rounded-lg p-2 text-on-surface hover:bg-surface-container-low md:hidden"
              aria-label="Open menu"
              onClick={() => setMobileNavOpen(true)}
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <div className="min-w-0">
              <h2 className="font-h3 text-h3 text-on-surface">{title}</h2>
              {subtitle ? <p className="text-xs text-on-surface-variant">{subtitle}</p> : null}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/psychiatrist/notifications"
              className={`relative flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low md:hidden ${
                location.pathname === "/psychiatrist/notifications" ? "border-primary/50 bg-surface-container-low text-primary" : ""
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
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low"
              onClick={() => {
                clearSession();
                navigate("/auth/login");
              }}
            >
              Logout
            </button>
          </div>
        </header>
        <div className="w-full min-w-0 overflow-x-hidden p-4 md:mx-auto md:max-w-container-max md:p-8">{children}</div>
      </main>
    </div>
  );
}
