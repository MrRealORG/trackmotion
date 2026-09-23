"use client";

import { useState } from "react";

/** iOS inset-grouped form: rows share one rounded card, hairlines inset left. */
export function NoteForm() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setState("busy");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
      form.reset();
    } catch {
      setState("error");
    }
  }

  const row = "flex items-center gap-4 px-4 py-3.5 transition-colors focus-within:bg-white/[0.03]";
  const input =
    "min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 outline-none focus-visible:outline-none";

  return (
    <form onSubmit={send} className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-[16px] bg-[#1c1c1e]">
        <label className={row}>
          <span className="w-16 shrink-0 text-[15px] text-white">Name</span>
          <input name="name" required maxLength={120} autoComplete="name" placeholder="Nadia Oyelaran" className={input} />
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
            placeholder="you@studio.com"
            className={input}
          />
        </label>
        <div className="ml-4 h-px bg-white/[0.08]" />
        <label className="block px-4 py-3.5 transition-colors focus-within:bg-white/[0.03]">
          <span className="sr-only">Message</span>
          <textarea
            name="message"
            required
            maxLength={4000}
            rows={6}
            placeholder="What should the tracker do next?"
            className="w-full resize-none bg-transparent text-[15px] leading-[1.6] text-white placeholder:text-white/30 outline-none focus-visible:outline-none"
          />
        </label>
      </div>
      <p className="px-4 text-[12.5px] text-white/35">Your note goes straight to the admin console. We never share addresses.</p>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={state === "busy"} className="btn-lock disabled:opacity-50">
          {state === "busy" ? "Sending…" : "Send note"}
        </button>
        <span role="status" aria-live="polite" className="text-[14px]">
          {state === "done" && <span className="text-lock">Received — thank you.</span>}
          {state === "error" && <span className="text-rec">Couldn&apos;t send. Try again?</span>}
        </span>
      </div>
    </form>
  );
}
