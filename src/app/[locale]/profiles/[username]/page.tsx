import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { listDemoProfileUsernames } from "@/lib/demo/profileDemoData";
import { fetchProfileDetail } from "@/lib/profileDetail";

type PageParams = {
  params: {
    locale: string;
    username: string;
  };
};

export async function generateStaticParams() {
  return listDemoProfileUsernames().map((username) => ({ username }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const detail = await fetchProfileDetail(params.username);

  if (!detail) {
    return {};
  }

  return {
    title: detail.profile.displayName,
    description: detail.profile.bio ?? undefined,
  };
}

export default async function ProfileDetailPage({ params }: PageParams) {
  const detail = await fetchProfileDetail(params.username);

  if (!detail) {
    notFound();
  }

  const t = await getTranslations("ProfileDetail");

  const languageName = detail.profile.language
    ? new Intl.DisplayNames([params.locale], { type: "language" }).of(detail.profile.language)
    : null;

  const updatedLabel = detail.profile.updatedAt
    ? t("updated", {
        date: new Intl.DateTimeFormat(params.locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(detail.profile.updatedAt)),
      })
    : null;

  const stats = [
    { label: t("stats.followers"), value: detail.stats.followers },
    { label: t("stats.following"), value: detail.stats.following },
    { label: t("stats.stories"), value: detail.stats.storyCount },
    { label: t("stats.contributions"), value: detail.stats.contributions },
  ];

  const sourceKey = detail.source === "supabase" ? "supabase" : "demo";
  const sourceLabel = t(`source.${sourceKey}` as const);

  const initials = detail.profile.displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.2),_transparent_60%)]"
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
                  {t("badge")}
                </span>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-600 dark:bg-sky-500/10 dark:text-sky-200">
                  {sourceLabel}
                </span>
                {languageName ? (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                    {t("profileLanguage", { language: languageName })}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-semibold text-white shadow-lg shadow-emerald-500/30">
                    <span aria-hidden="true">{initials}</span>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                      {detail.profile.displayName}
                    </h1>
                    {detail.profile.username ? (
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
                        @{detail.profile.username}
                      </p>
                    ) : null}
                    {updatedLabel ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{updatedLabel}</p>
                    ) : null}
                  </div>
                </div>
                <div className="inline-flex items-center gap-3 rounded-full border border-dashed border-emerald-300/70 bg-emerald-50/80 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {t("callouts.collaboration")}
                </div>
              </div>
              <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
                {detail.profile.bio ?? t("bioFallback")}
              </p>
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
                      {new Intl.NumberFormat(params.locale).format(item.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </header>

        <section id="stories" className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t("stories.title")}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("stories.subtitle")}</p>
            </div>
          </div>
          {detail.stories.length ? (
            <ol className="grid gap-4 md:grid-cols-2">
              {detail.stories.map((storyHighlight) => {
                const story = storyHighlight.story;
                const storyHref = story.slug
                  ? `/${params.locale}/stories/${story.slug}`
                  : undefined;
                const storyUpdatedLabel = t("stories.updated", {
                  date: new Intl.DateTimeFormat(params.locale, {
                    dateStyle: "medium",
                  }).format(new Date(storyHighlight.lastUpdated)),
                });

                return (
                  <li
                    key={story.id}
                    className="flex h-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-300">
                        <span>{storyUpdatedLabel}</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                          {story.title}
                        </h3>
                        {story.summary ? (
                          <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            {story.summary}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>
                        {t("stories.chapterCount", {
                          count: storyHighlight.chapterCount,
                        })}
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>
                        {t("stories.likeCount", {
                          count: storyHighlight.likeCount,
                        })}
                      </span>
                    </div>
                    {storyHref ? (
                      <Link
                        href={storyHref}
                        className="mt-6 inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-zinc-50 shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-emerald-500"
                      >
                        {t("stories.cta")}
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-8 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
              {t("stories.empty")}
            </p>
          )}
        </section>

        <section id="support" className="space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {t("support.title")}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("support.subtitle")}</p>
          </div>
          {detail.supportLinks.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {detail.supportLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-full flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-500"
                  >
                    <span className="text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-300">
                      {link.platform}
                    </span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {link.label}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{link.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-8 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
              {t("support.empty")}
            </p>
          )}
        </section>
      </div>
    </article>
  );
}
