import { useEffect } from "react";
import { Star } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { PsychiatristShell } from "./PsychiatristShell";

const averageRating = (reviews) => {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
  return total / reviews.length;
};

export default function PsychiatristReviewsPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { professional, loadReviews } = useAppStore();

  useEffect(() => {
    if (token && user?._id) loadReviews(user._id, token);
  }, [token, user, loadReviews]);

  const reviews = professional.reviews || [];
  const avg = averageRating(reviews);

  return (
    <PsychiatristShell title="Patient Feedback" subtitle="01_Ratings__Reviews_Management.html">
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Overall Rating</p>
          <p className="text-5xl font-semibold text-on-background">{avg.toFixed(1)}</p>
          <div className="mt-3 flex items-center justify-center gap-1 text-tertiary">
            {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={18} fill={n <= Math.round(avg) ? "currentColor" : "none"} />)}
          </div>
          <p className="mt-2 text-xs text-on-surface-variant">Based on {reviews.length} reviews</p>
        </section>
        <section className="lg:col-span-8 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
          <h3 className="mb-4 font-h3 text-h3 text-on-surface">Score Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((score) => {
              const count = reviews.filter((r) => Number(r.rating) === score).length;
              const percent = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
              return (
                <div key={score} className="flex items-center gap-3">
                  <span className="w-14 text-right text-xs text-on-surface">{score} Star</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-10 text-xs text-on-surface-variant">{percent}%</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <section className="space-y-3">
        {reviews.map((review) => (
          <article key={review._id} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-on-surface-variant">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recent"}</p>
              <div className="flex items-center gap-0.5 text-tertiary">
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} fill={n <= Number(review.rating || 0) ? "currentColor" : "none"} />)}
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{review.comment || "No comment provided."}</p>
          </article>
        ))}
        {!reviews.length ? <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 text-sm text-on-surface-variant">No reviews available yet.</div> : null}
      </section>
    </PsychiatristShell>
  );
}
