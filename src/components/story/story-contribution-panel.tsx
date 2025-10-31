"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useFormatter, useTranslations } from "next-intl";

import { useAuth } from "@/components/auth/auth-provider";
import { addDemoContribution } from "@/lib/demo/storyContributionDemoStore";
import {
  mapContributionRecordToView,
  sortContributionsByRecency,
  type StoryContributionView,
} from "@/lib/storyContributions";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { submitContribution, type ContributionRecord } from "@/lib/storyData";
import type { StoryContributionPrompt } from "@/lib/storyDetail";

const CUSTOM_PROMPT_ID = "custom";

type ChapterSummary = {
  id: string;
  title: string | null;
  position: number;
};

type StoryContributionPanelProps = {
  storyId: string;
  storyTitle: string;
  dataSource: "supabase" | "demo";
  initialContributions: StoryContributionView[];
  prompts: StoryContributionPrompt[];
  chapters: ChapterSummary[];
};

type ClientState = {
  client: SupabaseClient | null;
  error: string | null;
  initialized: boolean;
};

type FormState = {
  promptId: string;
  customPrompt: string;
  chapterId: string | null;
  content: string;
  alias: string;
};

function createInitialFormState(prompts: StoryContributionPrompt[]): FormState {
  return {
    promptId: prompts[0]?.id ?? CUSTOM_PROMPT_ID,
    customPrompt: "",
    chapterId: null,
    content: "",
    alias: "",
  };
}

function getStatusToneClasses(status: StoryContributionView["status"]): string {
  switch (status) {
    case "accepted":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "rejected":
      return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300";
    default:
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  }
}

function buildResolvedPrompt(
  promptId: string,
  customPrompt: string,
  prompts: StoryContributionPrompt[],
) {
  if (promptId === CUSTOM_PROMPT_ID) {
    const trimmed = customPrompt.trim();
    return trimmed ? trimmed : null;
  }
  const prompt = prompts.find((entry) => entry.id === promptId);
  return prompt ? prompt.title : null;
}

function createChapterLookup(chapters: ChapterSummary[]) {
  return new Map(
    chapters.map((chapter) => [
      chapter.id,
      {
        title: chapter.title,
        position: chapter.position,
      },
    ]),
  );
}

function toContributionView(
  record: ContributionRecord,
  chapters: Map<string, { title: string | null; position: number }>,
  resolveContributor?: (contributorId: string) => StoryContributionView["contributor"] | null,
) {
  return mapContributionRecordToView(record, {
    resolveChapter: (chapterId) => chapters.get(chapterId) ?? null,
    resolveContributor,
  });
}

export function StoryContributionPanel({
  storyId,
  storyTitle,
  dataSource,
  initialContributions,
  prompts,
  chapters,
}: StoryContributionPanelProps) {
  const t = useTranslations("StoryDetail.contributions");
  const formatter = useFormatter();
  const { user, initializationError } = useAuth();

  const [contributions, setContributions] = useState(() =>
    sortContributionsByRecency(initialContributions),
  );
  const [clientState, setClientState] = useState<ClientState>({
    client: null,
    error: null,
    initialized: false,
  });
  const [formState, setFormState] = useState<FormState>(() => createInitialFormState(prompts));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const chapterLookup = useMemo(() => createChapterLookup(chapters), [chapters]);

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
          error instanceof Error ? error.message : "Supabase client could not be initialized.";
        if (isMounted) {
          setClientState({ client: null, error: message, initialized: true });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [dataSource]);

  useEffect(() => {
    setContributions(sortContributionsByRecency(initialContributions));
  }, [initialContributions]);

  const selectedPrompt =
    formState.promptId === CUSTOM_PROMPT_ID
      ? null
      : (prompts.find((entry) => entry.id === formState.promptId) ?? null);

  const resolvedPrompt = buildResolvedPrompt(formState.promptId, formState.customPrompt, prompts);

  const resolvedChapter = formState.chapterId ? chapterLookup.get(formState.chapterId) : null;

  const effectiveDataSource = dataSource === "supabase" && clientState.error ? "demo" : dataSource;

  const helperMessage = (() => {
    if (clientState.error) {
      return t("messages.supabaseUnavailable");
    }
    if (effectiveDataSource === "demo") {
      return t("messages.demoMode");
    }
    if (!clientState.initialized) {
      return t("messages.initializing");
    }
    if (!user) {
      return t("messages.signInRequired");
    }
    if (initializationError) {
      return initializationError;
    }
    return null;
  })();

  const chapterLabel = (position: number | null, title: string | null) => {
    if (position === null && !title) {
      return t("timeline.chapterFallback");
    }
    const resolvedTitle = title ?? t("timeline.chapterFallback");
    if (position === null) {
      return resolvedTitle;
    }
    return t("timeline.linkedChapter", {
      position: position + 1,
      title: resolvedTitle,
    });
  };

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const trimmedContent = formState.content.trim();
    if (!trimmedContent) {
      setErrorMessage(t("messages.contentRequired"));
      return;
    }

    if (effectiveDataSource === "demo") {
      const alias = formState.alias.trim();
      if (!alias) {
        setErrorMessage(t("messages.aliasRequired"));
        return;
      }

      setIsSubmitting(true);
      try {
        const newContribution = addDemoContribution(storyId, initialContributions, {
          alias,
          content: trimmedContent,
          prompt: resolvedPrompt,
          chapterId: formState.chapterId,
          chapterTitle: resolvedChapter?.title ?? null,
          chapterPosition: resolvedChapter?.position ?? null,
        });
        setContributions((previous) => sortContributionsByRecency([newContribution, ...previous]));
        setStatusMessage(t("messages.success"));
        setFormState((state) => ({
          ...state,
          content: "",
        }));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!clientState.client) {
      setErrorMessage(t("messages.supabaseUnavailable"));
      return;
    }

    if (!user) {
      setErrorMessage(t("messages.signInRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const record = await submitContribution(clientState.client, {
        storyId,
        contributorId: user.id,
        prompt: resolvedPrompt,
        content: trimmedContent,
        chapterId: formState.chapterId ?? undefined,
      });

      const resolveContributor = (contributorId: string) => {
        if (contributorId !== user.id) {
          return null;
        }
        const displayName =
          (user.user_metadata?.full_name as string | undefined) ??
          user.email ??
          t("form.aliasFallback");
        return {
          id: user.id,
          displayName,
          role: t("timeline.selfRole"),
          avatarUrl: null,
        };
      };

      const newContribution = toContributionView(record, chapterLookup, resolveContributor);
      setContributions((previous) => sortContributionsByRecency([newContribution, ...previous]));
      setStatusMessage(t("messages.success"));
      setFormState((state) => ({
        ...state,
        content: "",
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("messages.error");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedContributions = contributions;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("subtitle")}</p>
        {helperMessage ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-300">{helperMessage}</p>
        ) : null}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)]">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {t("timeline.title")}
          </h3>
          {sortedContributions.length ? (
            <ul className="space-y-4">
              {sortedContributions.map((contribution) => {
                const statusLabel = t(`timeline.status.${contribution.status}` as const);
                const badgeClasses = getStatusToneClasses(contribution.status);
                return (
                  <li
                    key={contribution.id}
                    className="rounded-xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {contribution.contributor.displayName}
                        </p>
                        <p className="text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                          {contribution.contributor.role}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 text-xs text-zinc-500 sm:items-end dark:text-zinc-400">
                        <span>
                          {formatter.dateTime(new Date(contribution.createdAt), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${badgeClasses}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    {contribution.prompt ? (
                      <p className="mt-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                        {contribution.prompt}
                      </p>
                    ) : null}
                    {contribution.content ? (
                      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {contribution.content}
                      </p>
                    ) : null}
                    {contribution.chapterId ? (
                      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {chapterLabel(contribution.chapterPosition, contribution.chapterTitle)}
                      </p>
                    ) : null}
                    {contribution.respondedAt ? (
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {t("timeline.responded", {
                          date: formatter.dateTime(new Date(contribution.respondedAt), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }),
                        })}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-300 bg-white/60 p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
              {t("timeline.empty")}
            </p>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              {t("form.promptLabel")}
            </label>
            <select
              value={formState.promptId}
              onChange={(event) => handleChange("promptId", event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
            >
              {prompts.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.title}
                </option>
              ))}
              <option value={CUSTOM_PROMPT_ID}>{t("form.promptCustomOption")}</option>
            </select>
            {selectedPrompt ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {selectedPrompt.description}
              </p>
            ) : (
              <input
                type="text"
                value={formState.customPrompt}
                onChange={(event) => handleChange("customPrompt", event.target.value)}
                placeholder={t("form.promptPlaceholder")}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              {t("form.chapterLabel")}
            </label>
            <select
              value={formState.chapterId ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                handleChange("chapterId", value ? value : null);
              }}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
            >
              <option value="">{t("form.chapterPlaceholder")}</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {t("form.chapterOption", {
                    position: chapter.position + 1,
                    title: chapter.title ?? t("timeline.chapterFallback"),
                  })}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              {t("form.contentLabel")}
            </label>
            <textarea
              value={formState.content}
              onChange={(event) => handleChange("content", event.target.value)}
              placeholder={t("form.contentPlaceholder", { title: storyTitle })}
              rows={5}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
            />
          </div>

          {effectiveDataSource === "demo" ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {t("form.aliasLabel")}
              </label>
              <input
                type="text"
                value={formState.alias}
                onChange={(event) => handleChange("alias", event.target.value)}
                placeholder={t("form.aliasPlaceholder")}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("form.aliasHint")}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting || (effectiveDataSource === "supabase" && !user)}
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-zinc-50 shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-emerald-500"
            >
              {isSubmitting ? t("form.submitting") : t("form.submit")}
            </button>
            {statusMessage ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-300" role="status">
                {statusMessage}
              </p>
            ) : null}
            {errorMessage ? (
              <p className="text-xs text-rose-600 dark:text-rose-300" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
