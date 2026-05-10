import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-on-background">
      <div className="pointer-events-none absolute -left-28 -top-28 h-96 w-96 rounded-full bg-primary-fixed/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-secondary-fixed-dim/40 blur-3xl" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-sm">
            <Leaf size={22} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-primary sm:text-xl">MindTrack</h1>
            <p className="truncate text-xs text-on-surface-variant">Mental Health Care Platform</p>
          </div>
        </div>
        <nav className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <Link
            className="rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high sm:px-4"
            to="/auth/login"
          >
            Sign In
          </Link>
          <Link
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-container sm:px-4"
            to="/auth/signup"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-4 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:grid-cols-2 lg:items-center">
        <section className="min-w-0">
          <p className="mb-3 inline-flex items-center rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed">
            Role-Based Unified Platform
          </p>
          <h2 className="text-3xl font-bold leading-tight text-on-background sm:text-4xl md:text-5xl">
            One ecosystem for
            <span className="text-primary"> clients, psychiatrists, HR, and admins.</span>
          </h2>
          <p className="mt-4 max-w-xl text-base text-on-surface-variant">
            Track mood, goals, medication, and progress reports while professionals manage sessions and admins govern safety,
            verification, and operations in one secure workspace.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary hover:bg-primary-container" to="/auth/signup">
              Create Account
            </Link>
            <Link
              className="rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
              to="/auth/login"
            >
              Login
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/90 p-6 shadow-lg backdrop-blur">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">Enterprise Mental Health Suite</p>
          <h3 className="mb-4 text-2xl font-semibold text-on-background">Designed for clinical teams and operations leaders.</h3>

          <div className="space-y-3">
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
              <p className="text-sm font-semibold text-on-surface">Role-Based Security</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Access controls for clients, psychiatrists, HR, and administrators with protected workflows.
              </p>
            </div>
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
              <p className="text-sm font-semibold text-on-surface">Clinical + Operational Visibility</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Unified reporting, verification tracking, moderation pipelines, and auditable decision history.
              </p>
            </div>
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
              <p className="text-sm font-semibold text-on-surface">Scalable Care Coordination</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Structured journeys from intake to session delivery, secure communication, and outcome monitoring.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-inverse-surface px-4 py-3 text-sm text-inverse-on-surface">
            For enterprise onboarding and implementation support, continue with account setup and environment activation.
          </div>
        </section>
      </main>
    </div>
  );
}
