import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { fetchStoryDetail } from "@/lib/storyDetail";
import { listDemoStorySlugs } from "@/lib/demo/storyDemoData";
import { StoryEngagementBar } from "@/components/story/story-engagement-bar";
import { StoryContributionPanel } from "@/components/story/story-contribution-panel";

const formatDate = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));

const formatDateTime = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );

type PageParams = {
  params: {
    locale: string;
    slug: string;
  };
};

export async function generateStaticParams() {
  return listDemoStorySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const detail = await fetchStoryDetail(params.slug);

  if (!detail) {
    return {};
  }

  return {
    title: detail.story.title,
    description: detail.story.summary ?? undefined,
  };
}

export default async function StoryDetailPage({ params }: PageParams) {
  const detail = await fetchStoryDetail(params.slug);

  if (!detail) {
    notFound();
  }

  const t = await getTranslations("StoryDetail");
  const numberFormatter = new Intl.NumberFormat(params.locale);
  const updatedLabel = t("meta.updated", {
    date: formatDate(detail.stats.lastUpdated, params.locale),
  });
  const readingTime = t("meta.readingTime", {
    minutes: detail.stats.readingTimeMinutes,
  });

  const stats = [
    {
      label: t("meta.statLabels.chapters"),
      value: numberFormatter.format(detail.stats.chapterCount),
    },
    {
      label: t("meta.statLabels.contributions"),
      value: numberFormatter.format(detail.stats.contributions),
    },
    {
      label: t("meta.statLabels.followers"),
      value: numberFormatter.format(detail.stats.followers),
    },
    {
      label: t("meta.statLabels.likes"),
      value: numberFormatter.format(detail.stats.likes),
    },
  ];

  const sourceKey = detail.source === "supabase" ? "supabase" : "demo";
  const sourceLabel = t(`status.source.${sourceKey}`);

  return (
    <article className="px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(76,201,240,0.25),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.2),_transparent_60%)]"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col gap-8 p-10">
            <Link
              href={`/${params.locale}`}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-300 bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-700 uppercase transition hover:border-zinc-500 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-zinc-50 dark:focus-visible:ring-emerald-500"
            >
              <span aria-hidden="true">←</span>
              {t("backLink")}
            </Link>
            <div className="flex flex-col gap-6 text-zinc-900 dark:text-zinc-50">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-300">
                <span className="rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-500/10">
                  {t("status.published")}
                </span>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-600 dark:bg-sky-500/10 dark:text-sky-200">
                  {sourceLabel}
                </span>
                {detail.story.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  {detail.story.title}
                </h1>
                {detail.story.summary ? (
                  <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
                    {detail.story.summary}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                <span>{updatedLabel}</span>
                <span aria-hidden="true">•</span>
                <span>{readingTime}</span>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
                  >
                    <dt className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                      {item.label}
                    </dt>
                    <dd className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#chapters"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-50 shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-emerald-500"
                >
                  {t("actions.continue")}
                </a>
                <a
                  href="#community"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-zinc-50 dark:focus-visible:ring-emerald-500"
                >
                  {t("actions.viewCommunity")}
                </a>
                <a
                  href="#contribute"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-300 px-6 py-3 text-sm font-medium text-emerald-700 transition hover:border-emerald-500 hover:text-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-emerald-500/60 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:text-emerald-200 dark:focus-visible:ring-emerald-500"
                >
                  {t("actions.startContribution")}
                </a>
              </div>
              <StoryEngagementBar
                key={detail.story.id}
                storyId={detail.story.id}
                authorId={detail.story.authorId}
                initialStoryLikes={detail.stats.likes}
                initialFollowerCount={detail.stats.followers}
                storyTitle={detail.story.title}
              />
            </div>
          </div>
        </header>

        <section id="chapters" className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t("chapters.title")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{readingTime}</p>
            </div>
          </div>
          {detail.chapters.length ? (
            <ol className="space-y-4">
              {detail.chapters.map((chapter) => {
                const chapterLabel = t("chapters.position", {
                  position: chapter.record.position + 1,
                });
                const chapterReadTime = t("chapters.readTime", {
                  minutes: chapter.estimatedDurationMinutes,
                });
                const chapterWordCount = t("chapters.wordCount", {
                  count: chapter.wordCount,
                });

                return (
                  <li
                    key={chapter.record.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-300">
                            {chapterLabel}
                          </p>
                          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                            {chapter.record.title}
                          </h3>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <span>{chapterReadTime}</span>
                          <span>{chapterWordCount}</span>
                        </div>
                      </div>
                      {chapter.record.summary ? (
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                          {chapter.record.summary}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>
                          {t("chapters.commentCount", {
                            count: chapter.commentCount,
                          })}
                        </span>
                        <span>
                          {t("chapters.likeCount", {
                            count: chapter.likeCount,
                          })}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
              {t("chapters.empty")}
            </p>
          )}
        </section>

        <section id="community" className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t("community.title")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("community.subtitle")}</p>
            </header>
            <div className="space-y-4">
              {detail.comments.length ? (
                detail.comments.map((comment) => (
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
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDateTime(comment.createdAt, params.locale)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{comment.body}</p>
                    <footer className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                      {t("community.comments.replyCount", { count: comment.repliesCount })}
                    </footer>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                  {t("community.empty.comments")}
                </p>
              )}
            </div>
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {t("community.collaborators.title")}
              </h3>
              <div className="mt-4 space-y-3">
                {detail.collaborators.length ? (
                  detail.collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {collaborator.displayName}
                        </p>
                        <p className="text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                          {t("community.collaborators.role", { role: collaborator.role })}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold tracking-wide text-emerald-600 uppercase dark:bg-emerald-500/10 dark:text-emerald-300">
                        {t("actions.startContribution")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {t("community.empty.collaborators")}
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {t("community.prompts.title")}
              </h3>
              <div className="mt-4 space-y-3">
                {detail.contributionPrompts.length ? (
                  detail.contributionPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="space-y-2 rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-700 dark:bg-zinc-900/70"
                    >
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {prompt.title}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300">
                        {prompt.description}
                      </p>
                      <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                        {t("community.prompts.due", {
                          date: formatDate(prompt.dueAt, params.locale),
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {t("community.empty.prompts")}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </section>

        <section id="contribute">
          <StoryContributionPanel
            storyId={detail.story.id}
            storyTitle={detail.story.title}
            dataSource={detail.source}
            initialContributions={detail.contributions}
            prompts={detail.contributionPrompts}
            chapters={detail.chapters.map((chapter) => ({
              id: chapter.record.id,
              title: chapter.record.title,
              position: chapter.record.position,
            }))}
          />
        </section>
      </div>
    </article>
  );
}
