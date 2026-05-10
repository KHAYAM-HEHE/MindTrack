import { useState } from "react";
import { useAuthStore } from "../store/authStore";

export default function TwoFactorSection() {
  const user = useAuthStore((s) => s.user);
  const start2FASetup = useAuthStore((s) => s.start2FASetup);
  const verify2FASetup = useAuthStore((s) => s.verify2FASetup);
  const disable2FA = useAuthStore((s) => s.disable2FA);

  const [phase, setPhase] = useState("idle");
  const [setupPayload, setSetupPayload] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const enabled = Boolean(user?.is2FAEnabled);

  const onStart = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const data = await start2FASetup();
      setSetupPayload(data);
      setPhase("scan");
    } catch (e) {
      setError(e?.message || "Could not start setup");
    } finally {
      setBusy(false);
    }
  };

  const onVerifyEnable = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await verify2FASetup(verifyCode.replace(/\s/g, ""));
      setMessage("Two-factor authentication is on.");
      setPhase("idle");
      setSetupPayload(null);
      setVerifyCode("");
    } catch (e) {
      setError(e?.message || "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const onDisable = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await disable2FA({ password: disablePassword, code: disableCode.replace(/\s/g, "") });
      setMessage("Two-factor authentication has been turned off.");
      setDisablePassword("");
      setDisableCode("");
    } catch (e) {
      setError(e?.message || "Could not disable");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
      <h4 className="mb-1 text-xl font-semibold text-on-surface">Two-factor authentication (2FA)</h4>
      <p className="mb-4 text-sm text-on-surface-variant">
        Use an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, etc.). After you enable 2FA, sign-in
        will ask for a 6-digit code as well as your password.
      </p>

      {enabled ? (
        <div className="space-y-4">
          <p className="rounded-lg bg-primary-fixed/15 px-3 py-2 text-sm text-on-surface">2FA is enabled on your account.</p>
          <form className="grid max-w-md gap-3" onSubmit={onDisable}>
            <p className="text-sm font-medium text-on-surface">Turn off 2FA</p>
            <input
              type="password"
              className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface"
              placeholder="Current password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              autoComplete="current-password"
            />
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              className="rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface"
              placeholder="6-digit code from app"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
            />
            <button
              type="submit"
              className="w-fit rounded-lg border border-error text-error px-4 py-2 text-sm font-semibold hover:bg-error-container/20 disabled:opacity-50"
              disabled={busy}
            >
              Disable 2FA
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          {phase === "idle" ? (
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
              disabled={busy}
              onClick={onStart}
            >
              Set up authenticator
            </button>
          ) : null}

          {phase === "scan" && setupPayload ? (
            <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
              <div className="rounded-lg border border-outline-variant bg-surface p-2">
                <img src={setupPayload.qrDataUrl} alt="Authenticator QR code" className="h-44 w-44" />
              </div>
              <div className="space-y-3">
                <p className="text-sm text-on-surface-variant">
                  Scan this QR code with your app, or enter the secret manually:
                </p>
                <code className="block break-all rounded-lg bg-surface-container-high px-3 py-2 text-xs text-on-surface">
                  {setupPayload.secret}
                </code>
                <form className="flex flex-wrap items-end gap-2" onSubmit={onVerifyEnable}>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="min-w-[140px] rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface"
                    placeholder="6-digit code"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
                    disabled={busy}
                  >
                    Confirm & enable
                  </button>
                  <button
                    type="button"
                    className="text-sm text-on-surface-variant underline"
                    onClick={() => {
                      setPhase("idle");
                      setSetupPayload(null);
                      setVerifyCode("");
                    }}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {message ? <p className="mt-4 text-sm text-primary">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
    </div>
  );
}
