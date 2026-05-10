import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { professionalApi } from "../../api/professionalApi";
import { PsychiatristShell } from "./PsychiatristShell";

export default function PsychiatristProfileDetailPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token || !user?._id) return;
      const [nextProfile, nextReviews] = await Promise.all([
        professionalApi.getMyProfile(token),
        professionalApi.listReviews(user._id, token),
      ]);
      if (cancelled) return;
      setProfile(nextProfile);
      setReviews(nextReviews || []);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  return (
    <PsychiatristShell title="Professional Profile Detail" subtitle="27_Professional_Profile_Detail.html">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-surface-container-lowest rounded-[24px] p-6 md:p-8 shadow-sm border border-outline-variant/30">
          <h1 className="font-h1 text-on-surface mb-1">{profile?.displayName || "Professional Profile"}</h1>
          <p className="font-body-lg text-primary mb-4">{profile?.specialization || "Clinical Psychologist"}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(profile?.availability || []).slice(0, 4).map((item) => (
              <span key={item} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm uppercase">{item}</span>
            ))}
          </div>
          <p className="text-on-surface-variant">
            {profile?.bio || "This profile preview mirrors your public directory card and booking-facing information."}
          </p>
        </section>
        <aside className="lg:col-span-4 bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/30">
          <h2 className="font-h3 text-on-surface mb-4">Book a Session</h2>
          <p className="text-sm text-on-surface-variant mb-3">Consultation Fee</p>
          <p className="text-2xl font-semibold text-on-surface mb-4">${profile?.consultationFee || 0}</p>
          <button className="w-full bg-primary text-on-primary font-label-md py-3 px-6 rounded-xl">See Full Availability</button>
          <p className="font-label-sm text-center text-on-surface-variant mt-4">{reviews.length} total review(s)</p>
        </aside>
      </div>
    </PsychiatristShell>
  );
}
