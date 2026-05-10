import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

const sections = [
  {
    label: "Core",
    items: [
      { to: "/client/dashboard", label: "Dashboard", icon: "grid_view" },
      { to: "/client/profile", label: "Profile", icon: "person" },
      { to: "/client/settings", label: "Settings", icon: "settings" },
      { to: "/client/notifications", label: "Notifications", icon: "notifications" },
    ],
  },
  {
    label: "Care",
    items: [
      { to: "/client/goals", label: "Goals & habits", icon: "flag" },
      { to: "/client/tasks", label: "Daily tasks", icon: "checklist" },
      { to: "/client/mood-survey", label: "Mood", icon: "mood" },
      { to: "/client/medications", label: "Medications", icon: "medication" },
      { to: "/client/medication-impact", label: "Medication Impact", icon: "monitoring" },
    ],
  },
  {
    label: "Sessions",
    items: [
      { to: "/client/professionals", label: "Professionals", icon: "group" },
      { to: "/client/appointments", label: "Appointments", icon: "event_note" },
      { to: "/client/chat", label: "Chat", icon: "chat_bubble" },
      { to: "/client/complaints", label: "Complaints", icon: "report" },
      { to: "/client/reports", label: "Reports", icon: "description" },
    ],
  },
];

export default function ClientSidebar({ sticky = true }) {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const clearSession = useAuthStore((s) => s.clearSession);
  const connectChat = useAppStore((s) => s.connectChat);
  const fetchNotificationUnreadCount = useAppStore((s) => s.fetchNotificationUnreadCount);
  const notificationUnreadCount = useAppStore((s) => s.notificationUnreadCount);

  useEffect(() => {
    if (!token) return;
    connectChat(token);
    fetchNotificationUnreadCount(token);
  }, [token, connectChat, fetchNotificationUnreadCount]);

  return (
    <aside className={`${sticky ? "sticky top-20 h-fit" : ""} rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3 shadow-sm`}>
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-surface px-3 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
            spa
          </span>
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-primary">MindTrack</h3>
          <p className="text-xs text-on-surface-variant">Mental Health Care</p>
        </div>
      </div>

      <nav className="space-y-3">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-outline">{section.label}</p>
            <div className="grid gap-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                      isActive ? "bg-surface-container-low font-semibold text-primary" : "text-on-surface-variant hover:bg-surface-container"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.to === "/client/notifications" && notificationUnreadCount > 0 ? (
                    <span className="min-w-[1.25rem] rounded-full bg-error px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-on-error">
                      {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <button
        className="mt-4 w-full rounded-xl border border-outline-variant px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low"
        onClick={() => {
          clearSession();
          navigate("/auth/login");
        }}
      >
        Logout
      </button>
    </aside>
  );
}

