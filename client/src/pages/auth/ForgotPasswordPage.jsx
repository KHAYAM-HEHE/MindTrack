import { useState } from "react";
import { Link } from "react-router-dom";
import AuthPageLayout from "./AuthPageLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (event) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <AuthPageLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a password reset link."
      footer={
        <>
          Remembered your password?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/auth/login">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-on-surface">Email</label>
          <input
            className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface outline-none ring-primary/30 focus:ring"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {sent ? (
          <p className="rounded-lg bg-primary-fixed px-3 py-2 text-sm text-on-primary-fixed">
            Reset request recorded. Backend forgot-password endpoint will be connected next.
          </p>
        ) : null}
        <button
          className="w-full rounded-lg bg-primary px-3 py-2 font-medium text-on-primary hover:bg-primary-container"
          type="submit"
        >
          Send Reset Link
        </button>
      </form>
    </AuthPageLayout>
  );
}
