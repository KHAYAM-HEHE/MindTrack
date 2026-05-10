import ClientShell from "./ClientShell";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState } from "react";

export default function ClientProfilePage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const saveOnboardingProfile = useAuthStore((s) => s.saveOnboardingProfile);
  const [form, setForm] = useState({
    name: profile?.name || "",
    nickname: profile?.nickname || "",
    country: profile?.country || "",
    phone: profile?.phone || "",
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      setForm({
        name: profile?.name || "",
        nickname: profile?.nickname || "",
        country: profile?.country || "",
        phone: profile?.phone || "",
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [profile]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const onSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await saveOnboardingProfile(form);
      setMessage("Profile updated.");
    } catch (e) {
      setMessage(e?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientShell title="Profile">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm lg:col-span-4">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low text-2xl font-bold text-primary">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface">{user?.name || "MindTrack User"}</h3>
              <p className="text-sm text-on-surface-variant">{user?.email || "-"}</p>
            </div>
          </div>
          <span className="inline-flex rounded-full bg-secondary-fixed px-3 py-1 text-xs font-medium text-on-secondary-fixed-variant">
            {user?.role || "CLIENT"}
          </span>
        </div>
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm lg:col-span-8">
          <h4 className="mb-4 text-xl font-semibold text-on-surface">Account Overview</h4>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <p><span className="font-semibold">Name:</span> {user?.name || "-"}</p>
            <p><span className="font-semibold">Email:</span> {user?.email || "-"}</p>
            <p><span className="font-semibold">Role:</span> {user?.role || "-"}</p>
            <p><span className="font-semibold">Status:</span> {user?.status || "-"}</p>
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-5 lg:col-span-12">
          <p className="text-sm text-on-surface-variant">
            Keep your profile data updated to improve therapist matching and personalized recommendations.
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm lg:col-span-12">
          <h4 className="mb-4 text-xl font-semibold text-on-surface">Edit Profile</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-lg border border-outline-variant px-3 py-2"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
            <input
              className="rounded-lg border border-outline-variant px-3 py-2"
              placeholder="Nickname"
              value={form.nickname}
              onChange={(e) => setForm((s) => ({ ...s, nickname: e.target.value }))}
            />
            <input
              className="rounded-lg border border-outline-variant px-3 py-2"
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
            />
            <input
              className="rounded-lg border border-outline-variant px-3 py-2"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            />
          </div>
          <button className="mt-4 rounded-xl bg-primary px-4 py-2 text-on-primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
          {message ? <p className="mt-2 text-sm text-on-surface-variant">{message}</p> : null}
        </div>
      </div>
    </ClientShell>
  );
}

