import type {
  ChapterAmbientCue,
  ChapterMediaAsset,
  StoryReaderChapterData,
} from "@/lib/storyReader.types";
import { getDemoStoryDetail, listDemoStorySlugs } from "@/lib/demo/storyDemoData";

type DemoChapterExtras = {
  mediaAssets: ChapterMediaAsset[];
  ambientCues: ChapterAmbientCue[];
};

function ensureChapterExtras(
  slug: string,
  chapterId: string,
  createExtras: () => DemoChapterExtras,
  cache: Map<string, Map<string, DemoChapterExtras>>,
): DemoChapterExtras {
  if (!cache.has(slug)) {
    cache.set(slug, new Map());
  }

  const slugMap = cache.get(slug)!;

  if (!slugMap.has(chapterId)) {
    slugMap.set(chapterId, createExtras());
  }

  return slugMap.get(chapterId)!;
}

const demoExtrasCache = new Map<string, Map<string, DemoChapterExtras>>();

function buildChapterExtras(chapterId: string, position: number): DemoChapterExtras {
  const baseId = (suffix: string) => `${chapterId}-${suffix}`;

  const mediaAssets: ChapterMediaAsset[] = [
    {
      id: baseId("audio"),
      chapterId,
      title: `Movement ${position + 1} — Studio Cut`,
      description:
        "High-fidelity mix capturing community submissions layered with starship instrumentation.",
      mediaType: "audio",
      mediaUrl: "https://cdn.pixabay.com/audio/2023/01/31/audio_9ff50a4c6d.mp3",
      durationSeconds: 312 - position * 28,
      transcript: null,
      sortOrder: 0,
    },
    {
      id: baseId("transcript"),
      chapterId,
      title: "Narrated transcript",
      description: "Text-aligned transcript highlighting collaborative callouts.",
      mediaType: "text",
      mediaUrl: null,
      durationSeconds: null,
      transcript: null,
      sortOrder: 1,
    },
  ];

  const ambientCues: ChapterAmbientCue[] = [
    {
      id: baseId("cue-1"),
      chapterId,
      timestampSeconds: 45,
      label: "Resonance engines bloom",
      description: "Fade in layered humming textures gathered from listener submissions.",
    },
    {
      id: baseId("cue-2"),
      chapterId,
      timestampSeconds: 138,
      label: "Community bridge solo",
      description: "Percussive polyrhythm featuring sampled cargo bay taps and pulse drums.",
    },
    {
      id: baseId("cue-3"),
      chapterId,
      timestampSeconds: 246,
      label: "Aurora crescendo",
      description: "Collective crescendo guiding the Aria toward the Aurora Gate portal.",
    },
  ];

  return { mediaAssets, ambientCues };
}

export function getDemoReaderChapter(
  slug: string,
  chapterId: string | null,
): StoryReaderChapterData | null {
  const detail = getDemoStoryDetail(slug);

  if (!detail) {
    return null;
  }

  const chapters = detail.chapters
    .map((chapterView) => chapterView.record)
    .sort((a, b) => a.position - b.position);

  if (!chapters.length) {
    return null;
  }

  const activeChapter = chapterId
    ? chapters.find((chapter) => chapter.id === chapterId)
    : chapters[0];

  if (!activeChapter) {
    return null;
  }

  const chapterIndex = chapters.findIndex((chapter) => chapter.id === activeChapter.id);

  const extras = ensureChapterExtras(
    slug,
    activeChapter.id,
    () => buildChapterExtras(activeChapter.id, activeChapter.position),
    demoExtrasCache,
  );

  const statsSource = detail.chapters.find((chapter) => chapter.record.id === activeChapter.id);
  const wordCount = statsSource?.wordCount ?? activeChapter.content.trim().split(/\s+/).length;
  const readingTimeMinutes =
    statsSource?.estimatedDurationMinutes ?? Math.max(1, Math.round(wordCount / 180));

  return {
    story: detail.story,
    chapter: activeChapter,
    chapterIndex,
    totalChapters: chapters.length,
    stats: {
      wordCount,
      readingTimeMinutes,
    },
    navigation: {
      previousChapterId: chapterIndex > 0 ? chapters[chapterIndex - 1]!.id : null,
      nextChapterId: chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1]!.id : null,
    },
    tableOfContents: chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      position: chapter.position,
    })),
    mediaAssets: extras.mediaAssets,
    ambientCues: extras.ambientCues,
    source: "demo",
  } satisfies StoryReaderChapterData;
}

export function listDemoReaderChapterParams() {
  const params: Array<{ slug: string; chapterId: string }> = [];

  for (const slug of listDemoStorySlugs()) {
    const detail = getDemoStoryDetail(slug);

    detail?.chapters.forEach((chapter) => {
      params.push({ slug, chapterId: chapter.record.id });
    });
  }

  return params;
}

export function getDemoReaderRedirect(slug: string) {
  const detail = getDemoStoryDetail(slug);

  if (!detail || detail.chapters.length === 0) {
    return null;
  }

  return detail.chapters.map((chapter) => chapter.record).sort((a, b) => a.position - b.position)[0]
    ?.id;
}
