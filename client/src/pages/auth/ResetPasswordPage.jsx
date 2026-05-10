import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthPageLayout from "./AuthPageLayout";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setMessage("Password updated locally. Connect backend reset endpoint next.");
    setTimeout(() => navigate("/auth/login"), 900);
  };

  return (
    <AuthPageLayout
      title="Reset Password"
      subtitle="Create a new secure password for your account."
      footer={
        <>
          Back to{" "}
          <Link className="font-semibold text-primary hover:underline" to="/auth/login">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-on-surface">New Password</label>
          <input
            className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface outline-none ring-primary/30 focus:ring"
            type="password"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-on-surface">Confirm Password</label>
          <input
            className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-on-surface outline-none ring-primary/30 focus:ring"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
            required
          />
        </div>
        {message ? <p className="rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface">{message}</p> : null}
        <button
          className="w-full rounded-lg bg-primary px-3 py-2 font-medium text-on-primary hover:bg-primary-container"
          type="submit"
        >
          Change Password
        </button>
      </form>
    </AuthPageLayout>
  );
}
