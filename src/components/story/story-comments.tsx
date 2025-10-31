"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useFormatter, useTranslations } from "next-intl";

import { useAuth } from "@/components/auth/auth-provider";
import { addDemoComment } from "@/lib/demo/storyCommentDemoStore";
import { createPlaceholderCollaborator } from "@/lib/storyCollaborators";
import type { StoryCommentView } from "@/lib/storyDetail";
import { addComment } from "@/lib/storyData";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type ChapterSummary = {
  id: string;
  title: string | null;
  position: number;
};

type StoryCommentsProps = {
  storyId: string;
  storyTitle: string;
  dataSource: "supabase" | "demo";
  initialComments: StoryCommentView[];
  chapters: ChapterSummary[];
};

type ClientState = {
  client: SupabaseClient | null;
  error: string | null;
  initialized: boolean;
};

type FormState = {
  chapterId: string;
  body: string;
  alias: string;
};

function sortComments(comments: StoryCommentView[]): StoryCommentView[] {
  return [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function StoryComments({
  storyId,
  storyTitle,
  dataSource,
  initialComments,
  chapters,
}: StoryCommentsProps) {
  const t = useTranslations("StoryDetail.community");
  const composerT = useTranslations("StoryDetail.community.composer");
  const commentsT = useTranslations("StoryDetail.community.comments");
  const formatter = useFormatter();
  const { user, initializationError } = useAuth();

  const [comments, setComments] = useState(() => sortComments(initialComments));
  const [clientState, setClientState] = useState<ClientState>({
    client: null,
    error: null,
    initialized: false,
  });
  const [formState, setFormState] = useState<FormState>({
    chapterId: "",
    body: "",
    alias: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const chapterLookup = useMemo(
    () =>
      new Map(
        chapters.map((chapter) => [
          chapter.id,
          {
            title: chapter.title,
            position: chapter.position,
          },
        ]),
      ),
    [chapters],
  );

  useEffect(() => {
    setComments(sortComments(initialComments));
  }, [initialComments]);

  useEffect(() => {
    if (dataSource !== "supabase") {
      setClientState({ client: null, error: null, initialized: true });
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const client = createSupabaseBrowserClient();
        if (isMounted) {
          setClientState({ client, error: null, initialized: true });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : composerT("messages.supabaseUnavailable");
        if (isMounted) {
          setClientState({ client: null, error: message, initialized: true });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [composerT, dataSource]);

  const effectiveDataSource = dataSource === "supabase" && clientState.error ? "demo" : dataSource;

  const helperMessage = (() => {
    if (clientState.error) {
      return composerT("messages.supabaseUnavailable");
    }
    if (effectiveDataSource === "demo") {
      return composerT("messages.demoMode");
    }
    if (!clientState.initialized) {
      return composerT("messages.initializing");
    }
    if (!user) {
      return composerT("messages.signInRequired");
    }
    if (initializationError) {
      return initializationError;
    }
    return null;
  })();

  const chapterOptions = useMemo(() => {
    return [
      {
        value: "",
        label: composerT("fields.chapterGeneral"),
      },
      ...chapters
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((chapter) => {
          const position = chapter.position + 1;
          if (chapter.title) {
            return {
              value: chapter.id,
              label: composerT("fields.chapterOptionWithTitle", {
                position,
                title: chapter.title,
              }),
            };
          }
          return {
            value: chapter.id,
            label: composerT("fields.chapterOption", { position }),
          };
        }),
    ];
  }, [chapters, composerT]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const trimmedBody = formState.body.trim();
    if (!trimmedBody) {
      setErrorMessage(composerT("messages.messageRequired"));
      return;
    }

    const chapterId = formState.chapterId ? formState.chapterId : null;

    if (effectiveDataSource === "demo") {
      const alias = formState.alias.trim();
      if (!alias) {
        setErrorMessage(composerT("messages.aliasRequired"));
        return;
      }

      setIsSubmitting(true);
      try {
        const newComment = addDemoComment(storyId, initialComments, {
          alias,
          role: composerT("demoRole"),
          body: trimmedBody,
          chapterId,
        });
        setComments((previous) => sortComments([...previous, newComment]));
        setStatusMessage(composerT("messages.success"));
        setFormState((state) => ({ ...state, body: "" }));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!clientState.client) {
      setErrorMessage(composerT("messages.supabaseUnavailable"));
      return;
    }

    if (!user) {
      setErrorMessage(composerT("messages.signInRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const record = await addComment(clientState.client, {
        storyId,
        authorId: user.id,
        body: trimmedBody,
        chapterId: chapterId ?? undefined,
        parentCommentId: undefined,
      });

      const displayName =
        (user.user_metadata?.full_name as string | undefined) ??
        user.email ??
        composerT("aliasFallback");

      const newComment: StoryCommentView = {
        id: record.id,
        body: record.body,
        createdAt: record.createdAt,
        chapterId: record.chapterId,
        repliesCount: 0,
        author: {
          ...createPlaceholderCollaborator(record.authorId),
          displayName,
          role: composerT("selfRole"),
        },
      };

      setComments((previous) => sortComments([...previous, newComment]));
      setStatusMessage(composerT("messages.success"));
      setFormState((state) => ({ ...state, body: "" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : composerT("messages.error");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedComments = comments;

  const commentBadge = (comment: StoryCommentView) => {
    if (!comment.chapterId) {
      return composerT("fields.chapterGeneral");
    }
    const chapter = chapterLookup.get(comment.chapterId);
    if (!chapter) {
      return composerT("fields.chapterGeneral");
    }
    const position = chapter.position + 1;
    if (chapter.title) {
      return commentsT("chapterBadge.titled", { position, title: chapter.title });
    }
    return commentsT("chapterBadge.untitled", { position });
  };

  const isFormDisabled =
    isSubmitting || (effectiveDataSource === "supabase" && (!clientState.initialized || !user));

  const submitLabel = isSubmitting ? composerT("posting") : composerT("submit");

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("subtitle")}</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
              <span>{composerT("fields.chapter")}</span>
              <select
                value={formState.chapterId}
                onChange={(event) =>
                  setFormState((state) => ({ ...state, chapterId: event.target.value }))
                }
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-normal text-zinc-700 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                disabled={isSubmitting}
              >
                {chapterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {effectiveDataSource === "demo" ? (
              <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                <span>{composerT("fields.alias")}</span>
                <input
                  type="text"
                  value={formState.alias}
                  onChange={(event) =>
                    setFormState((state) => ({ ...state, alias: event.target.value }))
                  }
                  placeholder={composerT("fields.aliasPlaceholder")}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-normal text-zinc-700 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                  disabled={isSubmitting}
                  required
                />
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  {composerT("fields.aliasHelp")}
                </span>
              </label>
            ) : (
              <div className="flex flex-col justify-end gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  {composerT("postingAs", {
                    name:
                      (user?.user_metadata?.full_name as string | undefined) ??
                      user?.email ??
                      composerT("aliasFallback"),
                  })}
                </span>
              </div>
            )}
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            <span>{composerT("fields.message")}</span>
            <textarea
              value={formState.body}
              onChange={(event) =>
                setFormState((state) => ({ ...state, body: event.target.value }))
              }
              placeholder={composerT("fields.messagePlaceholder", { title: storyTitle })}
              rows={4}
              className="min-h-[120px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-normal text-zinc-700 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
              disabled={
                isSubmitting ||
                (effectiveDataSource === "supabase" && (!clientState.initialized || !user))
              }
            />
          </label>
          {helperMessage ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-300">{helperMessage}</p>
          ) : null}
          {statusMessage ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-300" role="status">
              {statusMessage}
            </p>
          ) : null}
          {errorMessage ? (
            <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none disabled:opacity-60 dark:hover:bg-emerald-500/90 dark:focus-visible:ring-emerald-500"
              disabled={isFormDisabled}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </section>

      <div className="space-y-4">
        {sortedComments.length ? (
          sortedComments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {comment.author.displayName}
                  </p>
                  <p className="text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                    {comment.author.role}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    {formatter.dateTime(new Date(comment.createdAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-zinc-600 uppercase dark:bg-zinc-900 dark:text-zinc-300">
                    {commentBadge(comment)}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{comment.body}</p>
              <footer className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                {commentsT("replyCount", { count: comment.repliesCount })}
              </footer>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
            {t("empty.comments")}
          </p>
        )}
      </div>
    </div>
  );
}
