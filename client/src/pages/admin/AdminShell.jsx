import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-label-md transition-all ${
    isActive
      ? "bg-surface-container-high text-on-surface"
      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
  }`;

const items = [
  { to: "/admin/dashboard", label: "Overview", icon: "dashboard" },
  { to: "/admin/requests", label: "Requests", icon: "inbox" },
  { to: "/admin/verifications", label: "Verifications", icon: "verified_user" },
  { to: "/admin/psychiatrists", label: "Psychiatrists", icon: "psychology" },
  { to: "/admin/clients", label: "Clients", icon: "groups" },
  { to: "/admin/employees", label: "Employees", icon: "badge" },
  { to: "/admin/hr", label: "HR", icon: "corporate_fare" },
  { to: "/admin/complaints", label: "Complaints", icon: "report_problem" },
  { to: "/admin/tickets", label: "Tickets", icon: "confirmation_number" },
  { to: "/admin/reports", label: "Reports", icon: "analytics" },
  { to: "/admin/audit-logs", label: "Audit log", icon: "manage_search" },
];

function AdminBrand({ className = "mb-6 mt-2" }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 px-2 ${className}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
          spa
        </span>
      </div>
      <div>
        <div className="font-h3 text-primary">MindWell</div>
        <div className="font-label-sm text-on-surface-variant">Admin</div>
      </div>
    </div>
  );
}

export default function AdminShell({ children, title = "Admin" }) {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const onLogout = () => {
    clearSession();
    navigate("/auth/login");
  };

  const navLinks = (
    <>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={navClass}
          end={item.to === "/admin/dashboard"}
          onClick={() => setMobileNavOpen(false)}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface font-body-md text-on-surface antialiased">
      <nav className="fixed bottom-0 left-0 top-0 z-50 hidden h-screen w-64 flex-col gap-2 border-r border-outline-variant bg-surface-container-lowest p-4 md:flex">
        <AdminBrand />
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto">{navLinks}</div>
        <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant pt-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-label-md text-on-surface-variant hover:bg-error-container/50 hover:text-error"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </nav>

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
              <AdminBrand className="mb-0 mt-0 min-w-0 pr-1" />
              <button
                type="button"
                className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto">{navLinks}</div>
            <div className="mt-auto border-t border-outline-variant pt-4">
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-label-md text-on-surface-variant hover:bg-error-container/50 hover:text-error"
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
            </div>
          </div>
        </>
      ) : null}

      <main className="flex min-h-screen w-full min-w-0 flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest/80 px-4 py-3 backdrop-blur-md md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-on-surface hover:bg-surface-container-low md:hidden"
              aria-label="Open menu"
              onClick={() => setMobileNavOpen(true)}
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <h1 className="min-w-0 truncate text-h2 text-on-surface">{title}</h1>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low md:hidden"
            onClick={onLogout}
          >
            Logout
          </button>
        </header>
        <div className="p-4 md:p-8 flex-1 max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}

