"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";

import { useAuth } from "@/components/auth/auth-provider";
import { addDemoStory, listDemoStoryCreations } from "@/lib/demo/storyCreationDemoStore";
import { createChapter, createStory } from "@/lib/storyData";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { createChapterMediaAssets } from "@/lib/storyMedia";
import type { ChapterMediaAsset } from "@/lib/storyReader.types";
import { locales } from "@/i18n/routing";

const DEMO_AUTHOR_STORAGE_KEY = "fts-demo-author-id";

function generateLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type ClientState = {
  client: SupabaseClient | null;
  error: string | null;
  initialized: boolean;
};

type MediaFormItem = {
  id: string;
  mediaType: "audio" | "video" | "interactive" | "text";
  title: string;
  description: string;
  mediaUrl: string;
  durationSeconds: string;
  transcript: string;
};

type FormState = {
  title: string;
  slug: string;
  summary: string;
  coverImage: string;
  language: string;
  tags: string;
  isPublished: boolean;
  publishedAt: string;
  chapterTitle: string;
  chapterSummary: string;
  chapterContent: string;
  demoAuthorAlias: string;
};

type CreationSummary = {
  mode: "supabase" | "demo";
  createdAt: string;
  story: {
    id: string;
    title: string;
    slug: string | null;
    summary: string | null;
    language: string;
    tags: string[];
  };
  chapter: {
    id: string;
    title: string | null;
    content: string;
  };
  mediaAssets: ChapterMediaAsset[];
};

const defaultMediaItem = (): MediaFormItem => ({
  id: generateLocalId("media"),
  mediaType: "text",
  title: "",
  description: "",
  mediaUrl: "",
  durationSeconds: "",
  transcript: "",
});

const initialFormState: FormState = {
  title: "",
  slug: "",
  summary: "",
  coverImage: "",
  language: "en",
  tags: "",
  isPublished: true,
  publishedAt: "",
  chapterTitle: "",
  chapterSummary: "",
  chapterContent: "",
  demoAuthorAlias: "",
};

function normalizeTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}

function parseDuration(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed);
}

export function StoryComposer({ locale }: { locale: string }) {
  const t = useTranslations("StoryComposer");
  const { user, initializationError } = useAuth();
  const [clientState, setClientState] = useState<ClientState>({
    client: null,
    error: null,
    initialized: false,
  });
  const [formState, setFormState] = useState<FormState>({
    ...initialFormState,
    language: locale,
  });
  const [mediaItems, setMediaItems] = useState<MediaFormItem[]>([defaultMediaItem()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [demoAuthorId, setDemoAuthorId] = useState<string | null>(null);
  const [creationSummary, setCreationSummary] = useState<CreationSummary | null>(null);
  const [demoCreations, setDemoCreations] = useState(() => listDemoStoryCreations());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(DEMO_AUTHOR_STORAGE_KEY);
      if (stored) {
        setDemoAuthorId(stored);
        return;
      }
      const newId = generateLocalId("demo-author");
      window.localStorage.setItem(DEMO_AUTHOR_STORAGE_KEY, newId);
      setDemoAuthorId(newId);
    } catch (error) {
      console.warn("[story-composer] Unable to access localStorage", error);
      setDemoAuthorId(generateLocalId("demo-author"));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const client = createSupabaseBrowserClient();
        if (isMounted) {
          setClientState({ client, error: null, initialized: true });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t("status.supabaseUnavailable");
        if (isMounted) {
          setClientState({ client: null, error: message, initialized: true });
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [t]);

  const dataSource: "supabase" | "demo" =
    clientState.client && !clientState.error ? "supabase" : "demo";

  const helperMessage = useMemo(() => {
    if (!clientState.initialized) {
      return t("status.initializing");
    }
    if (clientState.error) {
      return t("status.demoFallback");
    }
    if (dataSource === "supabase" && !user) {
      if (initializationError) {
        return initializationError;
      }
      return t("status.signInRequired");
    }
    return clientState.error ?? null;
  }, [clientState, dataSource, initializationError, t, user]);

  const handleMediaChange = (id: string, updates: Partial<MediaFormItem>) => {
    setMediaItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const addMediaItem = () => {
    setMediaItems((items) => [...items, defaultMediaItem()]);
  };

  const removeMediaItem = (id: string) => {
    setMediaItems((items) => (items.length > 1 ? items.filter((item) => item.id !== id) : items));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const trimmedTitle = formState.title.trim();
    const trimmedContent = formState.chapterContent.trim();

    if (!trimmedTitle) {
      setErrorMessage(t("form.validation.titleRequired"));
      return;
    }

    if (!trimmedContent) {
      setErrorMessage(t("form.validation.chapterRequired"));
      return;
    }

    const tags = normalizeTags(formState.tags);
    const summary = formState.summary.trim() || null;
    const coverImage = formState.coverImage.trim() || null;
    const slug = formState.slug.trim() || undefined;
    const publishedAtIso =
      formState.isPublished && formState.publishedAt
        ? new Date(formState.publishedAt).toISOString()
        : null;

    const mediaAssetsInput = mediaItems
      .map((item, index) => ({
        title: item.title.trim(),
        description: item.description.trim() || null,
        mediaType: item.mediaType,
        mediaUrl: item.mediaUrl.trim() || null,
        durationSeconds: parseDuration(item.durationSeconds),
        transcript: item.transcript.trim() || null,
        sortOrder: index,
      }))
      .filter((asset) => asset.title || asset.mediaUrl || asset.transcript);

    if (dataSource === "supabase") {
      if (!clientState.client) {
        setErrorMessage(t("status.supabaseUnavailable"));
        return;
      }
      if (!user) {
        setErrorMessage(t("status.signInRequired"));
        return;
      }

      setIsSubmitting(true);
      try {
        const story = await createStory(clientState.client, {
          authorId: user.id,
          title: trimmedTitle,
          slug,
          summary,
          coverImage,
          language: formState.language,
          tags,
          isPublished: formState.isPublished,
          publishedAt: publishedAtIso ?? undefined,
        });

        const chapter = await createChapter(clientState.client, {
          storyId: story.id,
          authorId: user.id,
          title: formState.chapterTitle.trim() || null,
          summary: formState.chapterSummary.trim() || null,
          content: trimmedContent,
          position: 0,
          isPublished: true,
        });

        let mediaAssets: ChapterMediaAsset[] = [];
        if (mediaAssetsInput.length) {
          try {
            mediaAssets = await createChapterMediaAssets(
              clientState.client,
              mediaAssetsInput.map((asset) => ({
                ...asset,
                chapterId: chapter.id,
              })),
            );
          } catch (error) {
            console.warn("[story-composer] Failed to persist chapter media assets", error);
          }
        }

        setCreationSummary({
          mode: "supabase",
          createdAt: new Date().toISOString(),
          story: {
            id: story.id,
            title: story.title,
            slug: story.slug,
            summary: story.summary,
            language: story.language,
            tags: story.tags ?? [],
          },
          chapter: {
            id: chapter.id,
            title: chapter.title,
            content: chapter.content,
          },
          mediaAssets,
        });

        setStatusMessage(t("status.successSupabase", { title: story.title }));
        setFormState({ ...initialFormState, language: locale });
        setMediaItems([defaultMediaItem()]);
      } catch (error) {
        const message = error instanceof Error ? error.message : t("status.unexpectedError");
        setErrorMessage(message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!demoAuthorId) {
      setErrorMessage(t("status.demoAuthorPending"));
      return;
    }

    const alias = formState.demoAuthorAlias.trim();
    if (!alias) {
      setErrorMessage(t("form.validation.aliasRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const entry = addDemoStory({
        authorId: demoAuthorId,
        authorDisplayName: alias,
        title: trimmedTitle,
        slug,
        summary,
        coverImage,
        language: formState.language,
        tags,
        isPublished: formState.isPublished,
        publishedAt: publishedAtIso,
        chapter: {
          title: formState.chapterTitle.trim() || null,
          summary: formState.chapterSummary.trim() || null,
          content: trimmedContent,
          isPublished: true,
        },
        mediaAssets: mediaAssetsInput,
      });

      setCreationSummary({
        mode: "demo",
        createdAt: entry.createdAtIso,
        story: {
          id: entry.story.id,
          title: entry.story.title,
          slug: entry.story.slug,
          summary: entry.story.summary,
          language: entry.story.language,
          tags: entry.story.tags ?? [],
        },
        chapter: {
          id: entry.chapters[0]!.id,
          title: entry.chapters[0]!.title,
          content: entry.chapters[0]!.content,
        },
        mediaAssets: entry.mediaAssets,
      });

      setStatusMessage(t("status.successDemo", { title: entry.story.title }));
      setFormState({ ...initialFormState, language: locale, demoAuthorAlias: alias });
      setMediaItems([defaultMediaItem()]);
      setDemoCreations(listDemoStoryCreations());
    } catch (error) {
      const message = error instanceof Error ? error.message : t("status.unexpectedError");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-300">
              {t("eyebrow")}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">{t("subtitle")}</p>
          </div>
          <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4 text-sm text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200">
            <p>
              {helperMessage ??
                (dataSource === "supabase" ? t("status.supabaseReady") : t("status.demoReady"))}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <form className="flex flex-col gap-10" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t("form.story.heading")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("form.story.helper")}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {t("form.story.fields.title")}
                </span>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((state) => ({ ...state, title: event.target.value }))
                  }
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {t("form.story.fields.slug")}
                </span>
                <input
                  type="text"
                  value={formState.slug}
                  onChange={(event) =>
                    setFormState((state) => ({ ...state, slug: event.target.value }))
                  }
                  placeholder={t("form.story.placeholders.slug")}
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {t("form.story.fields.summary")}
                </span>
                <textarea
                  value={formState.summary}
                  onChange={(event) =>
                    setFormState((state) => ({ ...state, summary: event.target.value }))
                  }
                  rows={3}
                  className="min-h-[96px] rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {t("form.story.fields.coverImage")}
                </span>
                <input
                  type="url"
                  value={formState.coverImage}
                  onChange={(event) =>
                    setFormState((state) => ({ ...state, coverImage: event.target.value }))
                  }
                  placeholder="https://"
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {t("form.story.fields.tags")}
                </span>
                <input
                  type="text"
                  value={formState.tags}
                  onChange={(event) =>
                    setFormState((state) => ({ ...state, tags: event.target.value }))
                  }
                  placeholder={t("form.story.placeholders.tags")}
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {t("form.story.fields.language")}
                </span>
                <select
                  value={formState.language}
                  onChange={(event) =>
                    setFormState((state) => ({ ...state, language: event.target.value }))
                  }
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                >
                  {locales.map((value) => (
                    <option key={value} value={value}>
                      {t(`form.story.languages.${value}`, { default: value })}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {t("form.story.fields.visibility")}
                </span>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      checked={formState.isPublished}
                      onChange={() => setFormState((state) => ({ ...state, isPublished: true }))}
                    />
                    <span>{t("form.story.visibility.public")}</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      checked={!formState.isPublished}
                      onChange={() => setFormState((state) => ({ ...state, isPublished: false }))}
                    />
                    <span>{t("form.story.visibility.draft")}</span>
                  </label>
                </div>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {t("form.story.fields.publishAt")}
                </span>
                <input
                  type="datetime-local"
                  value={formState.publishedAt}
                  onChange={(event) =>
                    setFormState((state) => ({ ...state, publishedAt: event.target.value }))
                  }
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t("form.story.help.publishAt")}
                </p>
              </label>
              {dataSource === "demo" ? (
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    {t("form.story.fields.demoAlias")}
                  </span>
                  <input
                    type="text"
                    value={formState.demoAuthorAlias}
                    onChange={(event) =>
                      setFormState((state) => ({ ...state, demoAuthorAlias: event.target.value }))
                    }
                    placeholder={t("form.story.placeholders.demoAlias")}
                    className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t("form.story.help.demoAlias")}
                  </p>
                </label>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t("form.chapter.heading")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("form.chapter.helper")}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {t("form.chapter.fields.title")}
                </span>
                <input
                  type="text"
                  value={formState.chapterTitle}
                  onChange={(event) =>
                    setFormState((state) => ({ ...state, chapterTitle: event.target.value }))
                  }
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {t("form.chapter.fields.summary")}
                </span>
                <input
                  type="text"
                  value={formState.chapterSummary}
                  onChange={(event) =>
                    setFormState((state) => ({ ...state, chapterSummary: event.target.value }))
                  }
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {t("form.chapter.fields.content")}
                </span>
                <textarea
                  value={formState.chapterContent}
                  onChange={(event) =>
                    setFormState((state) => ({ ...state, chapterContent: event.target.value }))
                  }
                  rows={8}
                  className="min-h-[160px] rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                  placeholder={t("form.chapter.placeholders.content")}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t("form.media.heading")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("form.media.helper")}</p>
            </div>
            <div className="space-y-6">
              {mediaItems.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      {t("form.media.assetLabel", { index: index + 1 })}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeMediaItem(item.id)}
                      className="text-xs font-medium text-zinc-500 transition hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-zinc-400 dark:hover:text-zinc-200 dark:focus-visible:ring-emerald-500"
                    >
                      {t("form.media.remove")}
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs">
                      <span className="font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
                        {t("form.media.fields.type")}
                      </span>
                      <select
                        value={item.mediaType}
                        onChange={(event) =>
                          handleMediaChange(item.id, {
                            mediaType: event.target.value as MediaFormItem["mediaType"],
                          })
                        }
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                      >
                        <option value="text">{t("form.media.types.text")}</option>
                        <option value="audio">{t("form.media.types.audio")}</option>
                        <option value="video">{t("form.media.types.video")}</option>
                        <option value="interactive">{t("form.media.types.interactive")}</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-2 text-xs">
                      <span className="font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
                        {t("form.media.fields.title")}
                      </span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(event) =>
                          handleMediaChange(item.id, { title: event.target.value })
                        }
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs md:col-span-2">
                      <span className="font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
                        {t("form.media.fields.description")}
                      </span>
                      <textarea
                        value={item.description}
                        onChange={(event) =>
                          handleMediaChange(item.id, { description: event.target.value })
                        }
                        rows={2}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs">
                      <span className="font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
                        {t("form.media.fields.url")}
                      </span>
                      <input
                        type="url"
                        value={item.mediaUrl}
                        onChange={(event) =>
                          handleMediaChange(item.id, { mediaUrl: event.target.value })
                        }
                        placeholder="https://"
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs">
                      <span className="font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
                        {t("form.media.fields.duration")}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={item.durationSeconds}
                        onChange={(event) =>
                          handleMediaChange(item.id, { durationSeconds: event.target.value })
                        }
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                      />
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {t("form.media.help.duration")}
                      </span>
                    </label>
                    <label className="flex flex-col gap-2 text-xs md:col-span-2">
                      <span className="font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
                        {t("form.media.fields.transcript")}
                      </span>
                      <textarea
                        value={item.transcript}
                        onChange={(event) =>
                          handleMediaChange(item.id, { transcript: event.target.value })
                        }
                        rows={3}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-emerald-500"
                      />
                    </label>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addMediaItem}
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-500 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:text-zinc-50 dark:focus-visible:ring-emerald-500"
              >
                {t("form.media.add")}
              </button>
            </div>
          </div>

          {statusMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200">
              {statusMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-50 shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-emerald-500"
            >
              {isSubmitting ? t("form.actions.submitting") : t("form.actions.submit")}
            </button>
          </div>
        </form>
      </section>

      {creationSummary ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t("summary.heading")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {t(`summary.mode.${creationSummary.mode}`)}
              </p>
            </div>
            <dl className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  {t("summary.fields.storyId")}
                </dt>
                <dd className="mt-2 text-sm break-all text-zinc-800 dark:text-zinc-100">
                  {creationSummary.story.id}
                </dd>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  {t("summary.fields.slug")}
                </dt>
                <dd className="mt-2 text-sm break-all text-zinc-800 dark:text-zinc-100">
                  {creationSummary.story.slug ?? t("summary.labels.noSlug")}
                </dd>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  {t("summary.fields.chapterId")}
                </dt>
                <dd className="mt-2 text-sm break-all text-zinc-800 dark:text-zinc-100">
                  {creationSummary.chapter.id}
                </dd>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  {t("summary.fields.createdAt")}
                </dt>
                <dd className="mt-2 text-sm break-all text-zinc-800 dark:text-zinc-100">
                  {new Date(creationSummary.createdAt).toLocaleString(locale)}
                </dd>
              </div>
            </dl>
            {creationSummary.mediaAssets.length ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {t("summary.mediaHeading", { count: creationSummary.mediaAssets.length })}
                </h3>
                <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                  {creationSummary.mediaAssets.map((asset) => (
                    <li
                      key={asset.id}
                      className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-700 dark:bg-zinc-900/60"
                    >
                      <p className="font-medium">{asset.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {t("summary.mediaLine", {
                          type: t(`form.media.types.${asset.mediaType}`),
                          url: asset.mediaUrl ?? t("summary.labels.noUrl"),
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {dataSource === "demo" && demoCreations.length ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t("demoLibrary.heading")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("demoLibrary.helper")}</p>
            </div>
            <ul className="space-y-3">
              {demoCreations.map((entry) => (
                <li
                  key={entry.story.id}
                  className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {entry.story.title}
                      </h3>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:bg-emerald-500/20 dark:text-emerald-200">
                        {t("demoLibrary.badge")}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {t("demoLibrary.summary", {
                        slug: entry.story.slug ?? t("summary.labels.noSlug"),
                        author: entry.authorDisplayName,
                      })}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(entry.createdAtIso).toLocaleString(locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
