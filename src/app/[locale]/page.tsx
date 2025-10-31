import { HomeSection } from "@/components/home/home-section";
import { CategoryGrid } from "@/components/home/category-grid";
import { CommunityUpdates } from "@/components/home/community-updates";
import type { StoryCarouselItem } from "@/components/home/story-carousel";
import { StoryCarousel } from "@/components/home/story-carousel";
import { useTranslations } from "next-intl";

export default function HomePage({ params }: { params: { locale: string } }) {
  const t = useTranslations("Home");

  const shared = useTranslations("Home.sections.shared");

  const storyBadge = (badgeKey: string) => shared(`badges.${badgeKey}`);

  const storyDetailBasePath = `/${params.locale}/stories`;

  const trendingStories: StoryCarouselItem[] = [
    {
      title: t("sections.trending.items.stellarSymphony.title"),
      description: t("sections.trending.items.stellarSymphony.description"),
      author: t("sections.trending.items.stellarSymphony.author"),
      href: `${storyDetailBasePath}/stellar-symphony`,
      badges: [
        { label: storyBadge("audioSeries"), icon: <span aria-hidden="true">🎧</span> },
        { label: storyBadge("sciFi") },
      ],
    },
    {
      title: t("sections.trending.items.memoryMakers.title"),
      description: t("sections.trending.items.memoryMakers.description"),
      author: t("sections.trending.items.memoryMakers.author"),
      href: "#trending-memory-makers",
      badges: [
        { label: storyBadge("interactive"), icon: <span aria-hidden="true">🕹️</span> },
        { label: storyBadge("mystery") },
      ],
    },
    {
      title: t("sections.trending.items.clockworkHeist.title"),
      description: t("sections.trending.items.clockworkHeist.description"),
      author: t("sections.trending.items.clockworkHeist.author"),
      href: "#trending-clockwork-heist",
      badges: [
        { label: storyBadge("serialized"), icon: <span aria-hidden="true">🗞️</span> },
        { label: storyBadge("steampunk") },
      ],
    },
  ];

  const newStories: StoryCarouselItem[] = [
    {
      title: t("sections.fresh.items.luminousLagoon.title"),
      description: t("sections.fresh.items.luminousLagoon.description"),
      author: t("sections.fresh.items.luminousLagoon.author"),
      href: "#fresh-luminous-lagoon",
      badges: [
        { label: storyBadge("audioSeries"), icon: <span aria-hidden="true">🌊</span> },
        { label: storyBadge("fantasy") },
      ],
    },
    {
      title: t("sections.fresh.items.skylineBallad.title"),
      description: t("sections.fresh.items.skylineBallad.description"),
      author: t("sections.fresh.items.skylineBallad.author"),
      href: "#fresh-skyline-ballad",
      badges: [
        { label: storyBadge("shortForm"), icon: <span aria-hidden="true">🎤</span> },
        { label: storyBadge("romance") },
      ],
    },
    {
      title: t("sections.fresh.items.emberAccord.title"),
      description: t("sections.fresh.items.emberAccord.description"),
      author: t("sections.fresh.items.emberAccord.author"),
      href: "#fresh-ember-accord",
      badges: [
        { label: storyBadge("interactive"), icon: <span aria-hidden="true">🎲</span> },
        { label: storyBadge("adventure") },
      ],
    },
  ];

  const categories = [
    {
      title: t("sections.categories.items.immersiveAudio.title"),
      description: t("sections.categories.items.immersiveAudio.description"),
      href: "#category-immersive-audio",
      icon: "🔊",
    },
    {
      title: t("sections.categories.items.visualNovels.title"),
      description: t("sections.categories.items.visualNovels.description"),
      href: "#category-visual-novels",
      icon: "🎨",
    },
    {
      title: t("sections.categories.items.interactiveFiction.title"),
      description: t("sections.categories.items.interactiveFiction.description"),
      href: "#category-interactive-fiction",
      icon: "🧩",
    },
    {
      title: t("sections.categories.items.worldbuilding.title"),
      description: t("sections.categories.items.worldbuilding.description"),
      href: "#category-worldbuilding",
      icon: "🪐",
    },
  ];

  const communityUpdates = [
    {
      title: t("sections.community.items.collabSessions.title"),
      description: t("sections.community.items.collabSessions.description"),
      timeFrame: t("sections.community.items.collabSessions.timeFrame"),
      href: "#community-collab-sessions",
    },
    {
      title: t("sections.community.items.feedbackFriday.title"),
      description: t("sections.community.items.feedbackFriday.description"),
      timeFrame: t("sections.community.items.feedbackFriday.timeFrame"),
      href: "#community-feedback-friday",
    },
    {
      title: t("sections.community.items.openCall.title"),
      description: t("sections.community.items.openCall.description"),
      timeFrame: t("sections.community.items.openCall.timeFrame"),
      href: "#community-open-call",
    },
  ];

  const roadmapUrl =
    "https://github.com/FinishThatStory/FinishThatStory.com#finishthatstorycom-development-plan";
  const gettingStartedUrl =
    "https://github.com/FinishThatStory/FinishThatStory.com/blob/main/README.md";

  return (
    <div className="flex flex-col items-center px-6 py-16">
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
      <HomeSection
        eyebrow={t("sections.trending.eyebrow")}
        title={t("sections.trending.title")}
        description={t("sections.trending.description")}
        cta={{ label: t("sections.trending.cta"), href: roadmapUrl }}
      >
        <StoryCarousel items={trendingStories} ctaLabel={shared("previewCta")} />
      </HomeSection>
      <HomeSection
        eyebrow={t("sections.fresh.eyebrow")}
        title={t("sections.fresh.title")}
        description={t("sections.fresh.description")}
      >
        <StoryCarousel items={newStories} ctaLabel={shared("previewCta")} />
      </HomeSection>
      <HomeSection
        eyebrow={t("sections.categories.eyebrow")}
        title={t("sections.categories.title")}
        description={t("sections.categories.description")}
        cta={{ label: t("sections.categories.cta"), href: gettingStartedUrl }}
      >
        <CategoryGrid categories={categories} />
      </HomeSection>
      <HomeSection
        eyebrow={t("sections.community.eyebrow")}
        title={t("sections.community.title")}
        description={t("sections.community.description")}
      >
        <CommunityUpdates items={communityUpdates} />
      </HomeSection>
    </div>
  );
}
