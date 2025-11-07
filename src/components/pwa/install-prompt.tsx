"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

const DISMISS_STORAGE_KEY = "fts:pwa-install:dismissed-at";

// The BeforeInstallPromptEvent type is not yet part of the standard lib definitions
type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const isClient = () => typeof window !== "undefined";

const readDismissedAt = () => {
  if (!isClient()) {
    return null;
  }

  const value = window.localStorage.getItem(DISMISS_STORAGE_KEY);

  if (!value) {
    return null;
  }

  const timestamp = Number.parseInt(value, 10);

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return timestamp;
};

const markDismissed = () => {
  if (!isClient()) {
    return;
  }

  window.localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
};

const isStandaloneDisplay = () => {
  if (!isClient()) {
    return false;
  }

  if (window.matchMedia?.("(display-mode: standalone)")?.matches) {
    return true;
  }

  // @ts-expect-error - iOS Safari exposes navigator.standalone
  return Boolean(window.navigator?.standalone);
};

const hasRecentDismissal = (dismissedAt: number | null) => {
  if (!dismissedAt) {
    return false;
  }

  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

  return Date.now() - dismissedAt < THIRTY_DAYS;
};

export function InstallPrompt() {
  const t = useTranslations("PwaInstall");
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissedAt, setDismissedAt] = useState<number | null>(readDismissedAt);
  const [hasInstalled, setHasInstalled] = useState(() => isStandaloneDisplay());

  useEffect(() => {
    if (!isClient()) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setHasInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!isClient()) {
      return;
    }

    const media = window.matchMedia?.("(display-mode: standalone)");

    if (!media) {
      return;
    }

    const handler = () => {
      if (media.matches) {
        setHasInstalled(true);
      }
    };

    media.addEventListener("change", handler);

    return () => {
      media.removeEventListener("change", handler);
    };
  }, []);

  const shouldShowPrompt = useMemo(() => {
    if (hasInstalled) {
      return false;
    }

    if (hasRecentDismissal(dismissedAt)) {
      return false;
    }

    return Boolean(promptEvent);
  }, [dismissedAt, hasInstalled, promptEvent]);

  const handleInstall = useCallback(async () => {
    if (!promptEvent) {
      return;
    }

    try {
      await promptEvent.prompt();

      const choice = await promptEvent.userChoice;

      if (choice.outcome === "accepted") {
        setHasInstalled(true);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[pwa-install] Failed to trigger install", error);
      }
    } finally {
      setPromptEvent(null);
    }
  }, [promptEvent]);

  const handleDismiss = useCallback(() => {
    markDismissed();
    setDismissedAt(Date.now());
    setPromptEvent(null);
  }, []);

  if (!shouldShowPrompt) {
    return null;
  }

  return (
    <div className="pointer-events-auto fixed bottom-6 left-1/2 z-[60] w-full max-w-sm -translate-x-1/2 rounded-3xl border border-emerald-200 bg-white/90 p-4 shadow-xl shadow-emerald-500/20 backdrop-blur dark:border-emerald-500/30 dark:bg-emerald-950/70 dark:text-emerald-100">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-5 w-5"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25V9m0 0H5.625a2.25 2.25 0 00-2.121 2.872l1.5 5.25A2.25 2.25 0 007.125 18H16.875a2.25 2.25 0 002.121-1.878l1.5-5.25A2.25 2.25 0 0018.375 9H15.75m-7.5 0h7.5"
            />
          </svg>
        </div>
        <div className="flex-1 space-y-1 text-sm">
          <p className="text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-200">
            {t("badge")}
          </p>
          <p className="text-base font-semibold text-zinc-900 dark:text-emerald-50">{t("title")}</p>
          <p className="text-sm text-zinc-600 dark:text-emerald-200/80">{t("body")}</p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold tracking-wide text-white uppercase transition hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400 dark:focus-visible:ring-emerald-300"
            >
              {t("actions.install")}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold tracking-wide text-emerald-700 uppercase transition hover:border-emerald-300 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:border-emerald-400 dark:hover:text-emerald-50 dark:focus-visible:ring-emerald-500"
            >
              {t("actions.dismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
