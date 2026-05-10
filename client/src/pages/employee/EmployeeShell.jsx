import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const links = [
  { to: "/employee/dashboard", label: "Dashboard" },
  { to: "/employee/verifications", label: "Verification Queue" },
  { to: "/employee/reviews", label: "My Reviews" },
];

function employeeLinkIcon(label) {
  if (label === "Dashboard") return "grid_view";
  if (label === "Verification Queue") return "verified_user";
  return "history";
}

export default function EmployeeShell({ title, subtitle, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const onLogout = () => {
    clearSession();
    navigate("/auth/login");
  };

  const employeeNavLinks = (onNavigate = () => {}) =>
    links.map((item) => {
      const active = location.pathname === item.to;
      return (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
            active
              ? "bg-surface-container-low text-primary"
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{employeeLinkIcon(item.label)}</span>
          {item.label}
        </Link>
      );
    });

  return (
    <div className="flex min-h-screen overflow-hidden bg-background text-on-background">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-outline-variant bg-surface-container-lowest p-4 shadow-sm md:flex">
        <div className="mb-4 flex items-center gap-3 px-2 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-primary-container">
            <span className="material-symbols-outlined">spa</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-primary">MindTrack</h1>
            <p className="text-xs text-on-surface-variant">Mental Health Care</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">{employeeNavLinks()}</nav>

        <div className="mt-auto border-t border-outline-variant/40 pt-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:bg-surface-container-low hover:text-primary"
            onClick={onLogout}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
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
                <h1 className="text-lg font-extrabold tracking-tight text-primary">MindTrack</h1>
                <p className="text-xs text-on-surface-variant">Mental Health Care</p>
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
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pb-4">{employeeNavLinks(() => setMobileNavOpen(false))}</nav>
            <div className="border-t border-outline-variant/40 pt-4">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:bg-surface-container-low hover:text-primary"
                onClick={() => {
                  setMobileNavOpen(false);
                  onLogout();
                }}
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Logout
              </button>
            </div>
          </div>
        </>
      ) : null}

      <div className="flex min-h-screen w-full flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant/60 bg-surface-container-lowest/80 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6">
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
              <p className="text-sm font-semibold text-on-surface">{title}</p>
              <p className="text-xs text-on-surface-variant">
                {user?.name || "Employee"} • {user?.role || "EMPLOYEE"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center rounded-full bg-surface-container-low px-3 py-2 sm:flex">
              <span className="material-symbols-outlined mr-2 text-outline">search</span>
              <input
                className="w-52 border-none bg-transparent p-0 text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                placeholder="Search..."
              />
            </div>
            <button type="button" className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              type="button"
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low md:hidden"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h2 className="text-3xl font-semibold text-on-background">{title}</h2>
              {subtitle ? <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p> : null}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
