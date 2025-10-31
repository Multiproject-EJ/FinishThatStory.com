"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next-intl/link";
import { useTranslations } from "next-intl";

import type { StoryReaderChapterData } from "@/lib/storyReader.types";

const CACHE_KEY = "fts:reader:offline-cache";
const MAX_CACHED_CHAPTERS = 12;

type CachedChapterEntry = {
  storyId: string;
  storySlug: string;
  storyTitle: string;
  chapterId: string;
  chapterTitle: string | null;
  chapterPosition: number;
  cachedAt: string;
  payload: StoryReaderChapterData;
};

const nowIso = () => new Date().toISOString();

const readCache = (): CachedChapterEntry[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is CachedChapterEntry => {
      if (typeof entry !== "object" || entry === null) {
        return false;
      }

      return (
        typeof entry.storyId === "string" &&
        typeof entry.storySlug === "string" &&
        typeof entry.chapterId === "string" &&
        typeof entry.cachedAt === "string" &&
        typeof entry.chapterPosition === "number" &&
        "payload" in entry
      );
    });
  } catch (error) {
    console.warn("[reader-offline] Failed to read cache", error);
    return [];
  }
};

const writeCache = (entries: CachedChapterEntry[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn("[reader-offline] Failed to write cache", error);
  }
};

const buildEntry = (reader: StoryReaderChapterData): CachedChapterEntry => ({
  storyId: reader.story.id,
  storySlug: reader.story.slug ?? reader.story.id,
  storyTitle: reader.story.title,
  chapterId: reader.chapter.id,
  chapterTitle: reader.chapter.title ?? null,
  chapterPosition: reader.chapter.position,
  cachedAt: nowIso(),
  payload: reader,
});

const dedupeEntries = (entries: CachedChapterEntry[]) => {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const key = `${entry.storyId}:${entry.chapterId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const sortByPosition = (entries: CachedChapterEntry[]) =>
  [...entries].sort((a, b) => a.chapterPosition - b.chapterPosition);

const formatDateTime = (locale: string, iso: string) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const scheduleStateUpdate = (update: () => void) => {
  if (typeof window === "undefined") {
    update();
    return;
  }

  window.requestAnimationFrame(update);
};

export type ReaderOfflineStatusProps = {
  reader: StoryReaderChapterData;
  locale: string;
};

export function ReaderOfflineStatus({ reader, locale }: ReaderOfflineStatusProps) {
  const t = useTranslations("Reader.offline");
  const [cachedChapters, setCachedChapters] = useState<CachedChapterEntry[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(nowIso());
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const existing = readCache();
    const storyEntries = sortByPosition(
      existing.filter((entry) => entry.storyId === reader.story.id),
    );
    const latestTimestamp =
      storyEntries.reduce<string | null>((latest, entry) => {
        if (!latest || entry.cachedAt > latest) {
          return entry.cachedAt;
        }

        return latest;
      }, null) ?? nowIso();

    scheduleStateUpdate(() => {
      setCachedChapters(storyEntries);
      setLastUpdatedAt(latestTimestamp);
    });
  }, [reader.story.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const entry = buildEntry(reader);
    const cache = readCache();
    const filtered = cache.filter(
      (existing) => existing.storyId !== entry.storyId || existing.chapterId !== entry.chapterId,
    );
    const updated = dedupeEntries([entry, ...filtered]).slice(0, MAX_CACHED_CHAPTERS);
    writeCache(updated);
    const storyEntries = sortByPosition(updated.filter((item) => item.storyId === entry.storyId));
    scheduleStateUpdate(() => {
      setCachedChapters(storyEntries);
      setLastUpdatedAt(entry.cachedAt);
    });
  }, [reader]);

  const clearCache = useCallback(() => {
    const cache = readCache();
    const remaining = cache.filter((entry) => entry.storyId !== reader.story.id);

    writeCache(remaining);

    scheduleStateUpdate(() => {
      setCachedChapters([]);
      setLastUpdatedAt(nowIso());
    });
  }, [reader.story.id]);

  const statusLabel = useMemo(
    () => (isOffline ? t("status.offline") : t("status.online", { count: MAX_CACHED_CHAPTERS })),
    [isOffline, t],
  );

  const lastSyncedLabel = useMemo(
    () => t("status.lastSynced", { time: formatDateTime(locale, lastUpdatedAt) }),
    [lastUpdatedAt, locale, t],
  );

  return (
    <section
      aria-live="polite"
      className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 text-sm text-emerald-900 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wide uppercase">{t("heading")}</p>
            <p className="font-medium">{statusLabel}</p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-200/80">
              {lastSyncedLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={clearCache}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white/70 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-700 uppercase transition hover:border-emerald-400 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:border-emerald-400 dark:hover:text-emerald-50 dark:focus-visible:ring-emerald-500"
          >
            {t("actions.clear")}
          </button>
        </div>
        <div className="space-y-3">
          <h3 className="text-xs font-semibold tracking-wide uppercase">
            {t("savedChapters.heading")}
          </h3>
          {cachedChapters.length ? (
            <ul className="space-y-2">
              {cachedChapters.map((chapter) => {
                const href = `/${locale}/stories/${chapter.storySlug}/read/${chapter.chapterId}`;

                return (
                  <li
                    key={chapter.chapterId}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/60 bg-white/80 px-4 py-3 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {chapter.chapterTitle ??
                          t("savedChapters.untitled", {
                            position: chapter.chapterPosition + 1,
                          })}
                      </span>
                      <span className="text-xs text-emerald-700/80 dark:text-emerald-200/80">
                        {t("savedChapters.position", {
                          position: chapter.chapterPosition + 1,
                        })}
                      </span>
                    </div>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-600 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-50 uppercase transition hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-emerald-500/50 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 dark:focus-visible:ring-emerald-300"
                    >
                      {t("savedChapters.open")}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-emerald-200/60 bg-white/70 px-4 py-3 text-xs text-emerald-700/80 dark:border-emerald-500/40 dark:bg-emerald-500/5 dark:text-emerald-200/80">
              {t("savedChapters.empty")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
