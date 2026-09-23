"use client";

import { useEffect, useState } from "react";
import { subscribeToReviews, type RealtimeReview } from "@/lib/firebase";
import { NoteForm } from "./NoteForm";

const INITIAL_REVIEWS: RealtimeReview[] = [
  {
    id: "seed-1",
    name: "Elena Rostova",
    email: "elena.dance@creator.io",
    rating: 5,
    comment:
      "The face lock effect is insane! I dropped a 4K dance clip and it centered onto my nose in literally 10 seconds. Auto-reframe to 9:16 saved me at least 3 hours of keyframing in Premiere.",
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
  },
  {
    id: "seed-2",
    name: "Marcus Vance",
    email: "marcus.vfx@motion.co",
    rating: 5,
    comment:
      "Finally a web-based motion tracker that doesn't feel like a toy. Optical flow with forward-backward verification works flawlessly, and zero watermark on export is unmatched.",
    createdAt: Date.now() - 1000 * 60 * 60 * 42,
  },
  {
    id: "seed-3",
    name: "David Sterling",
    email: "david@sterlingfilms.com",
    rating: 5,
    comment:
      "100% on-device processing is a game changer for client privacy. Our footage never touches a cloud server, and rendering is frame-exact with sound intact.",
    createdAt: Date.now() - 1000 * 60 * 60 * 80,
  },
  {
    id: "seed-4",
    name: "Sofia Mendez",
    email: "sofia.skate@reels.media",
    rating: 5,
    comment:
      "Replaced Tracket Motion on my phone. Being able to track skateboard tricks and point tracks right on my PC browser without transferring files is so much faster.",
    createdAt: Date.now() - 1000 * 60 * 60 * 120,
  },
];

export function HomeReviews() {
  const [reviews, setReviews] = useState<RealtimeReview[]>(INITIAL_REVIEWS);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsub = subscribeToReviews((liveItems) => {
      if (liveItems && liveItems.length > 0) {
        // Merge live items with initial items, prioritizing live
        const liveIds = new Set(liveItems.map((r) => r.id));
        const remainingInitial = INITIAL_REVIEWS.filter((r) => !liveIds.has(r.id));
        setReviews([...liveItems, ...remainingInitial]);
      }
    });
    return () => unsub();
  }, []);

  const totalReviews = reviews.length;
  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1);

  return (
    <section className="border-y border-white/10 bg-[#0a0a0b]" aria-labelledby="reviews-title">
      <div className="mx-auto max-w-[1280px] px-6 py-24 sm:px-10 sm:py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="osd text-lock">04 — Verified Creator Reviews</p>
            <h2 id="reviews-title" className="h-title mt-4 text-[clamp(2.2rem,4.8vw,3.8rem)]">
              <span>
                Loved by creators. <span className="text-white/40">Zero watermark.</span>
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#161618] px-4 py-2">
              <span className="text-lock text-[16px]">★★★★★</span>
              <span className="font-mono text-[14px] font-semibold text-white">{avgRating} / 5.0</span>
              <span className="text-[12px] text-white/40">({totalReviews} reviews)</span>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 rounded-full bg-lock px-5 py-2.5 text-[14px] font-semibold text-black transition hover:bg-lock/90"
            >
              {showForm ? "Close Review Form" : "★ Leave a Review"}
            </button>
          </div>
        </div>

        {/* ── Interactive Review Form Drawer ── */}
        {showForm ? (
          <div className="mt-8 rounded-[20px] border border-lock/30 bg-[#141416] p-6 shadow-2xl sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Share Your Creator Feedback</h3>
                <p className="text-sm text-white/50">Your review syncs directly in real time.</p>
              </div>
            </div>
            <NoteForm />
          </div>
        ) : null}

        {/* ── Real-time Reviews Grid ── */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((r) => {
            const initial = r.name.charAt(0).toUpperCase() || "C";
            return (
              <div
                key={r.id}
                className="flex flex-col justify-between rounded-[20px] border border-white/10 bg-[#141416] p-6 transition duration-300 hover:border-white/20 hover:bg-[#18181b]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex text-lock text-sm">
                      {Array.from({ length: r.rating || 5 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-emerald-400">✓ Verified</span>
                  </div>

                  <p className="mt-4 text-[14px] leading-relaxed text-white/80">&ldquo;{r.comment}&rdquo;</p>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-white/[0.08] pt-4">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lock font-bold text-black text-xs">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-white">{r.name}</p>
                    <p className="truncate text-[11.5px] text-white/40">Verified Creator</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
