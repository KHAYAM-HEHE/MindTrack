import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export default function AuthPageLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4 py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary-fixed/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-secondary-fixed-dim/40 blur-3xl" />

      <main className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/90 p-6 shadow-lg backdrop-blur sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-sm">
              <Leaf size={26} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">MindTrack</h1>
            <h2 className="mt-4 text-xl font-semibold text-on-background">{title}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
          </div>

          {children}

          <div className="mt-6 border-t border-outline-variant/40 pt-4 text-center text-sm text-on-surface-variant">{footer}</div>
          <div className="mt-2 text-center text-xs text-on-surface-variant">
            <Link to="/" className="underline hover:text-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
