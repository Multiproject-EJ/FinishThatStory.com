import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("Home");
  const roadmapUrl =
    "https://github.com/FinishThatStory/FinishThatStory.com#finishthatstorycom-development-plan";
  const gettingStartedUrl =
    "https://github.com/FinishThatStory/FinishThatStory.com/blob/main/README.md";

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-zinc-50 via-white to-slate-100 px-6 py-16 dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
      <section className="flex w-full max-w-5xl flex-col gap-8 text-center md:text-left">
        <div className="flex flex-col gap-4">
          <span className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-1 text-sm font-medium text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            {t("tagline")}
          </span>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-zinc-900 md:text-5xl lg:text-6xl dark:text-zinc-50">
            {t("heroTitle")}
          </h1>
          <p className="text-lg text-zinc-600 md:text-xl dark:text-zinc-300">{t("heroSubtitle")}</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <a
            href={roadmapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-zinc-50 shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {t("ctaStart")}
          </a>
          <a
            href={gettingStartedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-zinc-50"
          >
            {t("ctaPlan")}
          </a>
        </div>
      </section>
      <section className="mt-16 grid w-full max-w-5xl gap-6 md:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t("featureCreation.title")}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {t("featureCreation.body")}
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t("featureCommunity.title")}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {t("featureCommunity.body")}
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t("featureAi.title")}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{t("featureAi.body")}</p>
        </article>
      </section>
    </main>
  );
}
