import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import ClientSidebar from "./ClientSidebar";

export default function ClientShell({ title, children }) {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-outline-variant/30 bg-surface-container-lowest/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-extrabold text-primary">MindWell</h1>
            <p className="text-xs text-on-surface-variant">Mental Health Care</p>
          </div>
          <button
            className="rounded-xl border border-outline-variant px-3 py-1.5 text-sm text-on-surface hover:bg-surface-container-low"
            onClick={() => {
              clearSession();
              navigate("/auth/login");
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[250px_1fr]">
        <ClientSidebar />
        <main className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-2xl font-semibold text-on-surface">{title}</h2>
          {children}
        </main>
      </div>
    </div>
  );
}

