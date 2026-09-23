"use client";

import { useState } from "react";
import { addReview } from "@/lib/firebase";

/** iOS inset-grouped form with real-time Firebase Firestore review & feedback. */
export function NoteForm() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [rating, setRating] = useState<number>(5);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!name || !email || !message) return;

    setState("busy");
    try {
      // 1. Submit directly to Firebase Firestore
      await addReview({
        name,
        email,
        rating,
        comment: message,
      });

      setState("done");
      form.reset();
      setRating(5);
    } catch (err) {
      console.warn("Firestore submission note:", err);
      // Fallback to API if offline or firestore rules not yet enabled
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, message }),
        });
        setState("done");
        form.reset();
      } catch {
        setState("error");
      }
    }
  }

  const row = "flex items-center gap-4 px-4 py-3.5 transition-colors focus-within:bg-white/[0.03]";
  const input =
    "min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 outline-none focus-visible:outline-none";

  return (
    <form onSubmit={send} className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-[16px] bg-[#1c1c1e] ring-1 ring-white/10">
        <label className={row}>
          <span className="w-16 shrink-0 text-[15px] text-white">Name</span>
          <input name="name" required maxLength={120} autoComplete="name" placeholder="Ahmad Raza" className={input} />
        </label>
        <div className="ml-4 h-px bg-white/[0.08]" />
        <label className={row}>
          <span className="w-16 shrink-0 text-[15px] text-white">Email</span>
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            placeholder="you@domain.com"
            className={input}
          />
        </label>
        <div className="ml-4 h-px bg-white/[0.08]" />
        
        {/* Real-time Star Rating Selector */}
        <div className={row}>
          <span className="w-16 shrink-0 text-[15px] text-white">Rating</span>
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Review rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-[20px] transition-transform hover:scale-125 focus:outline-none"
                aria-label={`${star} star`}
              >
                <span className={star <= rating ? "text-lock" : "text-white/20"}>★</span>
              </button>
            ))}
            <span className="ml-2 font-mono text-[13px] text-white/50">{rating}.0 / 5.0</span>
          </div>
        </div>

        <div className="ml-4 h-px bg-white/[0.08]" />
        <label className="block px-4 py-3.5 transition-colors focus-within:bg-white/[0.03]">
          <span className="sr-only">Message or Review</span>
          <textarea
            name="message"
            required
            maxLength={4000}
            rows={5}
            placeholder="Write your review or feature request — instantly sent to the Admin Panel in real time."
            className="w-full resize-none bg-transparent text-[15px] leading-[1.6] text-white placeholder:text-white/30 outline-none focus-visible:outline-none"
          />
        </label>
      </div>
      <p className="px-4 text-[12.5px] text-white/35">
        Synced live with Firebase Firestore. Your review and email update real-time in the admin console.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={state === "busy"} className="btn-lock disabled:opacity-50">
          {state === "busy" ? "Sending to Firebase…" : "Submit Review"}
        </button>
        <span role="status" aria-live="polite" className="text-[14px]">
          {state === "done" && <span className="text-lock">Received in real-time — thank you!</span>}
          {state === "error" && <span className="text-rec">Could not submit. Please try again.</span>}
        </span>
      </div>
    </form>
  );
}
