"use client";

import Image from "next/image";
import { startTransition, useEffect, useState } from "react";

const STORAGE_KEY = "finish-that-story_has-visited";

export function UnderConstructionOverlay() {
  const [visibility, setVisibility] = useState<"pending" | "visible" | "hidden">("pending");

  useEffect(() => {
    const hasVisited = window.localStorage.getItem(STORAGE_KEY) === "true";
    const frame = window.requestAnimationFrame(() => {
      startTransition(() => {
        setVisibility(hasVisited ? "hidden" : "visible");
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleContinue = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setVisibility("hidden");
  };

  if (visibility !== "visible") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="under-construction-title"
        className="mx-6 max-w-md rounded-3xl border border-white/30 bg-white/90 p-10 text-center shadow-2xl backdrop-blur-sm dark:border-white/20 dark:bg-slate-900/80"
      >
        <div className="flex justify-center">
          <Image
            src="/icons/under-construction.svg"
            alt="Under construction"
            width={96}
            height={96}
            priority
            className="drop-shadow-lg"
          />
        </div>
        <h2
          id="under-construction-title"
          className="mt-6 text-2xl font-semibold text-slate-900 dark:text-slate-100"
        >
          We&apos;re building something new
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          FinishThatStory.com is still under construction, but we&apos;re excited to share a preview
          with you.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Expect regular updates as we polish the experience.
        </p>
        <button
          type="button"
          onClick={handleContinue}
          className="mt-10 text-[11px] font-medium text-slate-500/30 underline decoration-dotted underline-offset-4 transition hover:text-slate-500/60 focus:text-slate-500 focus:outline-none"
        >
          continue to the prototype
        </button>
      </div>
    </div>
  );
}
