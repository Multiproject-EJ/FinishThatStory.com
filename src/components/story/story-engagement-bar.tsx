"use client";

import { useMemo } from "react";
import { useFormatter, useTranslations } from "next-intl";

import { useAuth } from "@/components/auth/auth-provider";
import { useStoryEngagement } from "@/hooks/useStoryEngagement";

type StoryEngagementBarProps = {
  storyId: string;
  authorId: string;
  initialStoryLikes: number;
  initialFollowerCount: number;
  storyTitle: string;
};

type StatusMessageKey =
  | "messages.demoMode"
  | "messages.signInRequired"
  | "messages.selfFollow"
  | "messages.error";

type IconProps = {
  className?: string;
};

function HeartIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21s-6.75-4.35-9-8.25C1.27 10.1 1 8.84 1 7.5 1 4.42 3.42 2 6.5 2c1.74 0 3.41.81 4.5 2.09C12.09 2.81 13.76 2 15.5 2 18.58 2 21 4.42 21 7.5c0 1.34-.27 2.6-2 5.25C18.75 16.65 12 21 12 21z" />
    </svg>
  );
}

function UserPlusIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      <path d="M4.5 8h5" />
      <path d="M7 5.5v5" />
    </svg>
  );
}

export function StoryEngagementBar({
  storyId,
  authorId,
  initialStoryLikes,
  initialFollowerCount,
  storyTitle,
}: StoryEngagementBarProps) {
  const t = useTranslations("StoryDetail.engagement");
  const formatter = useFormatter();
  const { user, initializationError } = useAuth();

  const {
    storyLikes,
    storyLikedByUser,
    followerCount,
    followingAuthor,
    isLoading,
    isTogglingLike,
    isTogglingFollow,
    dataSource,
    error,
    supabaseInitializationError,
    toggleStoryLike,
    toggleAuthorFollow,
    supabaseAvailable,
  } = useStoryEngagement({
    storyId,
    authorId,
    initialStoryLikeCount: initialStoryLikes,
    initialFollowerCount,
    userId: user?.id ?? null,
  });

  const isAuthRequired = dataSource === "supabase" && !user;
  const isAuthorSelf = dataSource === "supabase" && user?.id === authorId;

  const likeDisabled = isLoading || isTogglingLike || (dataSource === "supabase" && !user);
  const followDisabled =
    isLoading || isTogglingFollow || (dataSource === "supabase" && (!user || user.id === authorId));

  const likeCountLabel = t("appreciate.count", { count: storyLikes });
  const followerCountLabel = t("follow.count", { count: followerCount });

  const likeAria = storyLikedByUser
    ? t("aria.likeButtonLiked", { title: storyTitle })
    : t("aria.likeButton", { title: storyTitle });

  const followAria = followingAuthor
    ? t("aria.followingButton", { title: storyTitle })
    : t("aria.followButton");

  const messageKey: StatusMessageKey | null = useMemo(() => {
    if (dataSource === "demo" && (supabaseInitializationError || initializationError)) {
      return "messages.demoMode";
    }
    if (isAuthRequired) {
      return "messages.signInRequired";
    }
    if (isAuthorSelf) {
      return "messages.selfFollow";
    }
    if (error) {
      return "messages.error";
    }
    return null;
  }, [
    dataSource,
    error,
    initializationError,
    isAuthRequired,
    isAuthorSelf,
    supabaseInitializationError,
  ]);

  const message = messageKey ? t(messageKey) : null;

  const sourceLabel = dataSource === "supabase" ? t("source.supabase") : t("source.demo");

  const likeLabel = storyLikedByUser ? t("appreciate.liked") : t("appreciate.cta");
  const followLabel = followingAuthor ? t("follow.following") : t("follow.cta");

  const likeCountFormatted = formatter.number(storyLikes, { maximumFractionDigits: 0 });
  const followerCountFormatted = formatter.number(followerCount, { maximumFractionDigits: 0 });

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {sourceLabel}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatter.dateTime(new Date(), { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </header>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => toggleStoryLike()}
              disabled={likeDisabled}
              aria-pressed={storyLikedByUser}
              aria-label={likeAria}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:focus-visible:ring-emerald-500 ${
                storyLikedByUser
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-500"
                  : "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              } ${likeDisabled ? "opacity-60" : ""}`}
            >
              <HeartIcon className="h-5 w-5" />
              <span>{likeLabel}</span>
              <span className="text-xs font-semibold">{likeCountFormatted}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleAuthorFollow()}
              disabled={followDisabled}
              aria-pressed={followingAuthor}
              aria-label={followAria}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500 dark:focus-visible:ring-emerald-500 ${
                followingAuthor
                  ? "border-emerald-500 text-emerald-600 hover:border-emerald-400 dark:border-emerald-500 dark:text-emerald-300"
                  : "border-zinc-300 text-zinc-700 hover:border-zinc-500 hover:text-zinc-900"
              } ${followDisabled ? "opacity-60" : ""}`}
            >
              <UserPlusIcon className="h-5 w-5" />
              <span>{followLabel}</span>
              <span className="text-xs font-semibold">{followerCountFormatted}</span>
            </button>
          </div>
          <div className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{likeCountLabel}</span>
            <span>{followerCountLabel}</span>
          </div>
        </div>
        {message ? (
          <p className="text-xs text-amber-600 dark:text-amber-400" role="status">
            {message}
          </p>
        ) : null}
        {!supabaseAvailable && (supabaseInitializationError || initializationError) ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("messages.demoHint")}</p>
        ) : null}
      </div>
    </section>
  );
}
