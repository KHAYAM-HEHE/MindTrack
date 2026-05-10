import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { professionalApi } from "../../api/professionalApi";
import TwoFactorSection from "../../components/TwoFactorSection";
import { PsychiatristShell } from "./PsychiatristShell";

export default function PsychiatristProfileManagePage() {
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState({
    displayName: "",
    specialization: "",
    bio: "",
    fee: 0,
    availability: "",
    isOnline: true,
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) return;
      try {
        const data = await professionalApi.getMyProfile(token);
        if (cancelled || !data) return;
        setForm({
          displayName: data.displayName || "",
          specialization: data.specialization || "",
          bio: data.bio || "",
          fee: data.consultationFee || 0,
          availability: (data.availability || []).join(", "),
          isOnline: Boolean(data.isOnline),
        });
      } catch {
        // keep defaults
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSave = async () => {
    setStatus("");
    await professionalApi.upsertProfile(
      {
        displayName: form.displayName,
        specialization: form.specialization,
        bio: form.bio,
        consultationFee: Number(form.fee) || 0,
        availability: form.availability.split(",").map((x) => x.trim()).filter(Boolean),
        isOnline: form.isOnline,
      },
      token
    );
    setStatus("Profile saved.");
  };

  return (
    <PsychiatristShell title="Professional Profile" subtitle="07_Manage_Professional_Profile.html">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-1">Professional Profile</h2>
          <p className="text-sm text-on-surface-variant">Manage your public listing and schedule preferences.</p>
        </div>
        <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary" onClick={onSave}>
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="xl:col-span-8 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
          <h3 className="mb-4 font-h3 text-h3 text-on-surface">Identity & Bio</h3>
          <div className="space-y-4">
            <input className="w-full rounded-lg border border-outline-variant bg-background px-4 py-2.5" placeholder="Full Name & Credentials" value={form.displayName} onChange={(e) => setForm((s) => ({ ...s, displayName: e.target.value }))} />
            <input className="w-full rounded-lg border border-outline-variant bg-background px-4 py-2.5" placeholder="Professional Title" value={form.specialization} onChange={(e) => setForm((s) => ({ ...s, specialization: e.target.value }))} />
            <textarea className="w-full rounded-lg border border-outline-variant bg-background px-4 py-2.5" rows={5} placeholder="Clinical Bio" value={form.bio} onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))} />
          </div>
        </section>

        <aside className="xl:col-span-4 space-y-6">
          <TwoFactorSection />
          <section className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
            <h3 className="mb-4 font-h3 text-h3 text-on-surface">Session Logistics</h3>
            <input className="w-full rounded-lg border border-outline-variant bg-background px-4 py-2.5" type="number" value={form.fee} onChange={(e) => setForm((s) => ({ ...s, fee: e.target.value }))} />
            <label className="mt-4 flex items-center gap-2 text-sm text-on-surface-variant">
              <input type="checkbox" checked={form.isOnline} onChange={(e) => setForm((s) => ({ ...s, isOnline: e.target.checked }))} />
              Visible as online
            </label>
          </section>
          <section className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
            <h3 className="mb-4 font-h3 text-h3 text-on-surface">Weekly Availability</h3>
            <textarea className="w-full rounded-lg border border-outline-variant bg-background px-4 py-2.5" rows={4} placeholder="Mon 9-5, Tue 10-6" value={form.availability} onChange={(e) => setForm((s) => ({ ...s, availability: e.target.value }))} />
            {status ? <p className="mt-3 text-xs text-green-700">{status}</p> : null}
          </section>
        </aside>
      </div>
    </PsychiatristShell>
  );
}
