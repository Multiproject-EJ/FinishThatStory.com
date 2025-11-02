"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type SubmissionStatus = "idle" | "loading" | "success" | "error";

const googleWebAppUrl = process.env.NEXT_PUBLIC_GOOGLE_WEBAPP_URL;

export function UnderConstructionOverlay() {
  const [isOpen, setIsOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Please enter an email address.");
      return;
    }

    if (!googleWebAppUrl) {
      setErrorMessage("Notification signup is temporarily unavailable. Please try again later.");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage(null);

      const response = await fetch(googleWebAppUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
      setEmail("");
    } catch (error) {
      console.error("Unable to submit email for construction updates", error);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/85">
        <button
          type="button"
          aria-label="Enter FinishThatStory.com"
          onClick={() => setIsOpen(false)}
          className="absolute top-3 -left-3 flex h-6 w-6 items-center justify-center rounded-full border border-white/40 bg-emerald-400 text-transparent transition hover:scale-105 focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-transparent focus:outline-none dark:border-emerald-900 dark:bg-emerald-500"
        >
          •
        </button>

        <div className="space-y-4 text-center">
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-[0.2em] text-emerald-600 uppercase dark:text-emerald-300">
              FinishThatStory.com
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Site under construction
            </h2>
            <p className="text-base text-zinc-700 dark:text-zinc-300">
              We&apos;re crafting a collaborative storytelling experience. Drop your email below and
              we&apos;ll let you know as soon as it&apos;s ready.
            </p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="under-construction-email">
              Email address
            </label>
            <input
              id="under-construction-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={status === "loading"}
              className="w-full rounded-full border border-zinc-300 bg-white/90 px-5 py-3 text-base text-zinc-900 shadow-sm transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100"
              placeholder="you@example.com"
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-transparent focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-400 dark:text-emerald-950"
            >
              {status === "loading" ? "Submitting…" : "Notify me"}
            </button>
          </form>

          {status === "success" && (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
              Thanks! You&apos;re on the list.
            </p>
          )}

          {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}
        </div>
      </div>
    </div>
  );
}
