import Link from "next-intl/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ReaderOfflineStatus } from "@/components/pwa/reader-offline-status";
import { fetchReaderChapter, listDemoReaderChapterParams } from "@/lib/storyReader";

type PageParams = {
  params: {
    locale: string;
    slug: string;
    chapterId: string;
  };
};

const formatTimestamp = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainder}`;
};

export async function generateStaticParams() {
  return listDemoReaderChapterParams().map(({ slug, chapterId }) => ({ slug, chapterId }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const reader = await fetchReaderChapter(params.slug, params.chapterId);

  if (!reader) {
    return {};
  }

  const chapterPosition = reader.chapterIndex + 1;

  return {
    title: `${reader.story.title} — ${reader.chapter.title ?? `Chapter ${chapterPosition}`}`,
    description: reader.chapter.summary ?? reader.story.summary ?? undefined,
  };
}

export default async function ReaderChapterPage({ params }: PageParams) {
  const reader = await fetchReaderChapter(params.slug, params.chapterId);

  if (!reader) {
    notFound();
  }

  const t = await getTranslations("Reader");

  const storyHref = `/${params.locale}/stories/${params.slug}`;
  const positionLabel = t("meta.position", {
    position: reader.chapterIndex + 1,
    total: reader.totalChapters,
  });
  const wordCountLabel = t("meta.wordCount", { count: reader.stats.wordCount });
  const readingTimeLabel = t("meta.readTime", { minutes: reader.stats.readingTimeMinutes });
  const sourceLabel = t(`meta.source.${reader.source}`);
  const primaryAudio = reader.mediaAssets.find((asset) => asset.mediaType === "audio");
  const otherAssets = reader.mediaAssets.filter((asset) => asset !== primaryAudio);

  return (
    <article className="px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <nav className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-300">
          <Link
            href={storyHref}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:border-emerald-400 dark:hover:text-emerald-50 dark:focus-visible:ring-emerald-500"
          >
            <span aria-hidden="true">←</span>
            {t("breadcrumbs.story")}
          </Link>
          <span className="rounded-full border border-emerald-200/60 bg-white px-3 py-1 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
            {positionLabel}
          </span>
          <span className="rounded-full border border-emerald-200/60 bg-white px-3 py-1 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
            {sourceLabel}
          </span>
        </nav>

        <header className="space-y-6">
          <div className="space-y-3 text-zinc-900 dark:text-zinc-50">
            <p className="text-sm font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-300">
              {t("hero.eyebrow")}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              {reader.chapter.title ?? reader.story.title}
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-300">
              {reader.chapter.summary ?? reader.story.summary ?? t("hero.summaryFallback")}
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[wordCountLabel, readingTimeLabel]
              .concat(
                primaryAudio?.durationSeconds
                  ? [
                      t("meta.audioDuration", {
                        minutes: Math.max(1, Math.round((primaryAudio.durationSeconds ?? 0) / 60)),
                      }),
                    ]
                  : [],
              )
              .map((label) => (
                <div
                  key={label}
                  className="rounded-2xl border border-zinc-200 bg-white/90 p-4 text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  {label}
                </div>
              ))}
          </dl>
          {reader.source === "demo" ? (
            <p className="rounded-2xl border border-dashed border-emerald-300/70 bg-emerald-50/60 p-4 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              {t("hero.demoNotice")}
            </p>
          ) : null}
        </header>

        <ReaderOfflineStatus locale={params.locale} reader={reader} />
        <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {t("player.title")}
                  </h2>
                  {primaryAudio?.durationSeconds ? (
                    <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                      {t("player.duration", {
                        duration: formatTimestamp(primaryAudio.durationSeconds),
                      })}
                    </span>
                  ) : null}
                </div>
                {primaryAudio ? (
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {primaryAudio.description}
                    </p>
                    <audio
                      controls
                      preload="none"
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-100/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/80"
                    >
                      {primaryAudio.mediaUrl ? (
                        <source src={primaryAudio.mediaUrl} type="audio/mpeg" />
                      ) : null}
                      {t("player.noMedia")}
                    </audio>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                    {t("player.noMedia")}
                  </p>
                )}
                {otherAssets.length ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                      {t("player.additionalAssets")}
                    </h3>
                    <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {otherAssets.map((asset) => (
                        <li
                          key={asset.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/80"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-zinc-800 dark:text-zinc-100">
                              {asset.title}
                            </p>
                            {asset.description ? (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {asset.description}
                              </p>
                            ) : null}
                          </div>
                          {asset.durationSeconds ? (
                            <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                              {formatTimestamp(asset.durationSeconds)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t("content.title")}
              </h2>
              <div className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-8 text-base leading-relaxed text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                {reader.chapter.content
                  .split(/\n{2,}/)
                  .map((paragraph) => paragraph.trim())
                  .filter((paragraph) => paragraph.length > 0)
                  .map((paragraph, index) => (
                    <p key={index} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {t("ambient.title")}
              </h2>
              {reader.ambientCues.length ? (
                <ol className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {reader.ambientCues.map((cue) => (
                    <li
                      key={cue.id}
                      className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/80"
                    >
                      <span className="text-xs font-semibold tracking-wide text-emerald-600 uppercase dark:text-emerald-300">
                        {formatTimestamp(cue.timestampSeconds)}
                      </span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-100">
                        {cue.label}
                      </span>
                      {cue.description ? (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {cue.description}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white/60 p-4 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
                  {t("ambient.empty")}
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {t("toc.title")}
              </h2>
              <ol className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                {reader.tableOfContents
                  .sort((a, b) => a.position - b.position)
                  .map((chapter) => {
                    const isActive = chapter.id === reader.chapter.id;

                    return (
                      <li key={chapter.id}>
                        <Link
                          href={`/${params.locale}/stories/${params.slug}/read/${chapter.id}`}
                          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:focus-visible:ring-emerald-500 ${
                            isActive
                              ? "bg-emerald-100/80 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-900/60"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <span className="font-medium">{chapter.title ?? t("toc.untitled")}</span>
                          <span className="text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                            {t("toc.chapterNumber", { number: chapter.position + 1 })}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
              </ol>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  {t("navigation.title")}
                </h2>
                <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <Link
                    href={
                      reader.navigation.previousChapterId
                        ? `/${params.locale}/stories/${params.slug}/read/${reader.navigation.previousChapterId}`
                        : storyHref
                    }
                    className={`inline-flex items-center justify-between gap-3 rounded-full border px-4 py-2 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:focus-visible:ring-emerald-500 ${
                      reader.navigation.previousChapterId
                        ? "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:text-zinc-50"
                        : "border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
                    }`}
                  >
                    <span>{t("navigation.previous")}</span>
                    <span aria-hidden="true">↑</span>
                  </Link>
                  <Link
                    href={
                      reader.navigation.nextChapterId
                        ? `/${params.locale}/stories/${params.slug}/read/${reader.navigation.nextChapterId}`
                        : storyHref
                    }
                    className={`inline-flex items-center justify-between gap-3 rounded-full border px-4 py-2 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:focus-visible:ring-emerald-500 ${
                      reader.navigation.nextChapterId
                        ? "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:text-zinc-50"
                        : "border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
                    }`}
                  >
                    <span>{t("navigation.next")}</span>
                    <span aria-hidden="true">↓</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </article>
  );
}
