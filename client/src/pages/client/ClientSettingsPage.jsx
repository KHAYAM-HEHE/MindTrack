import { useEffect, useState } from "react";
import ClientShell from "./ClientShell";
import TwoFactorSection from "../../components/TwoFactorSection";
import { useAuthStore } from "../../store/authStore";

export default function ClientSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const saveOnboardingProfile = useAuthStore((s) => s.saveOnboardingProfile);
  const [theme, setTheme] = useState("light");
  const [quoteType, setQuoteType] = useState("SECULAR");
  useEffect(() => {
    const prefs = profile?.preferences || {};
    const timer = setTimeout(() => {
      if (prefs?.theme) setTheme(prefs.theme);
      if (prefs?.quoteType) setQuoteType(prefs.quoteType);
    }, 0);
    return () => clearTimeout(timer);
  }, [profile]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const onSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await saveOnboardingProfile({ preferences: { theme, quoteType } });
      setMessage("Settings updated.");
    } catch (e) {
      setMessage(e?.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientShell title="Settings">
      <div className="grid max-w-2xl gap-6">
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
          <h4 className="mb-4 text-xl font-semibold text-on-surface">Personalization</h4>
          <p className="mb-4 text-sm text-on-surface-variant">Customize your interface and motivational experience.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Theme</label>
              <select className="w-full rounded-lg border border-outline-variant px-3 py-2" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Quote Type</label>
              <select className="w-full rounded-lg border border-outline-variant px-3 py-2" value={quoteType} onChange={(e) => setQuoteType(e.target.value)}>
                <option value="SECULAR">Secular</option>
                <option value="RELIGIOUS">Religious</option>
                <option value="ISLAMIC">Islamic</option>
              </select>
            </div>
          </div>
          <button className="mt-5 rounded-xl bg-primary px-4 py-2 text-on-primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
        <TwoFactorSection />
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-5">
          <p className="text-sm text-on-surface-variant">Signed in as <b>{user?.email || "-"}</b></p>
        </div>
        {message ? <p className="rounded-lg bg-surface-container-lowest p-3 text-sm text-on-surface-variant shadow-sm">{message}</p> : null}
      </div>
    </ClientShell>
  );
}

