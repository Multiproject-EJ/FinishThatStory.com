import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  getStoryBySlug,
  listStoryChapters,
  type ChapterRecord,
  type StoryRecord,
} from "@/lib/storyData";
import {
  type ChapterAmbientCue,
  type ChapterMediaAsset,
  type StoryReaderChapterData,
} from "@/lib/storyReader.types";
import { getDemoReaderChapter, listDemoReaderChapterParams } from "@/lib/demo/storyReaderDemo";

const mediaAssetRowSchema = z
  .object({
    id: z.string().uuid(),
    chapter_id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    media_type: z.enum(["audio", "video", "interactive", "text"]),
    media_url: z.string().url().nullable(),
    duration_seconds: z.number().int().nullable(),
    transcript: z.string().nullable(),
    sort_order: z.number().int().nullable(),
  })
  .transform(
    (row) =>
      ({
        id: row.id,
        chapterId: row.chapter_id,
        title: row.title,
        description: row.description,
        mediaType: row.media_type,
        mediaUrl: row.media_url,
        durationSeconds: row.duration_seconds,
        transcript: row.transcript,
        sortOrder: row.sort_order,
      }) satisfies ChapterMediaAsset,
  );

const ambientCueRowSchema = z
  .object({
    id: z.string().uuid(),
    chapter_id: z.string().uuid(),
    timestamp_seconds: z.number().int().nonnegative(),
    label: z.string(),
    description: z.string().nullable(),
  })
  .transform(
    (row) =>
      ({
        id: row.id,
        chapterId: row.chapter_id,
        timestampSeconds: row.timestamp_seconds,
        label: row.label,
        description: row.description,
      }) satisfies ChapterAmbientCue,
  );

const WORDS_PER_MINUTE = 180;

function calculateReadingMinutes(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function buildNavigation(
  chapters: ChapterRecord[],
  activeChapterId: string,
): {
  chapterIndex: number;
  previousChapterId: string | null;
  nextChapterId: string | null;
} {
  const ordered = [...chapters].sort((a, b) => a.position - b.position);
  const index = ordered.findIndex((chapter) => chapter.id === activeChapterId);

  return {
    chapterIndex: index,
    previousChapterId: index > 0 ? ordered[index - 1]!.id : null,
    nextChapterId: index >= 0 && index < ordered.length - 1 ? ordered[index + 1]!.id : null,
  };
}

function buildTableOfContents(chapters: ChapterRecord[]) {
  return [...chapters]
    .sort((a, b) => a.position - b.position)
    .map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      position: chapter.position,
    }));
}

async function fetchMediaAssets(client: SupabaseClient, chapterId: string) {
  try {
    const { data, error } = await client
      .from("chapter_media_assets")
      .select(
        "id, chapter_id, title, description, media_type, media_url, duration_seconds, transcript, sort_order",
      )
      .eq("chapter_id", chapterId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("[storyReader] Unable to fetch media assets, falling back to demo", error);
      return [] as ChapterMediaAsset[];
    }

    return mediaAssetRowSchema.array().parse(data ?? []);
  } catch (error) {
    console.warn("[storyReader] Media assets query failed, falling back to demo", error);
    return [] as ChapterMediaAsset[];
  }
}

async function fetchAmbientCues(client: SupabaseClient, chapterId: string) {
  try {
    const { data, error } = await client
      .from("chapter_ambient_cues")
      .select("id, chapter_id, timestamp_seconds, label, description")
      .eq("chapter_id", chapterId)
      .order("timestamp_seconds", { ascending: true });

    if (error) {
      console.warn("[storyReader] Unable to fetch ambient cues, falling back to demo", error);
      return [] as ChapterAmbientCue[];
    }

    return ambientCueRowSchema.array().parse(data ?? []);
  } catch (error) {
    console.warn("[storyReader] Ambient cues query failed, falling back to demo", error);
    return [] as ChapterAmbientCue[];
  }
}

function buildReaderPayload(
  story: StoryRecord,
  chapters: ChapterRecord[],
  chapter: ChapterRecord,
  mediaAssets: ChapterMediaAsset[],
  ambientCues: ChapterAmbientCue[],
): StoryReaderChapterData {
  const { chapterIndex, previousChapterId, nextChapterId } = buildNavigation(chapters, chapter.id);
  const orderedChapters = [...chapters].sort((a, b) => a.position - b.position);
  const wordCount = chapter.content.trim().split(/\s+/).length;

  return {
    story,
    chapter,
    chapterIndex,
    totalChapters: orderedChapters.length,
    stats: {
      wordCount,
      readingTimeMinutes: calculateReadingMinutes(chapter.content),
    },
    navigation: {
      previousChapterId,
      nextChapterId,
    },
    tableOfContents: buildTableOfContents(chapters),
    mediaAssets,
    ambientCues,
    source: "supabase",
  };
}

export async function fetchReaderChapter(
  slug: string,
  chapterId?: string,
): Promise<StoryReaderChapterData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const story = await getStoryBySlug(client, slug);

      if (!story) {
        return null;
      }

      const chapters = await listStoryChapters(client, story.id);

      if (!chapters.length) {
        return null;
      }

      const orderedChapters = [...chapters].sort((a, b) => a.position - b.position);
      const activeChapter = chapterId
        ? chapters.find((chapter) => chapter.id === chapterId)
        : orderedChapters[0];

      if (!activeChapter) {
        return null;
      }

      const [mediaAssets, ambientCues] = await Promise.all([
        fetchMediaAssets(client, activeChapter.id),
        fetchAmbientCues(client, activeChapter.id),
      ]);

      return buildReaderPayload(story, chapters, activeChapter, mediaAssets, ambientCues);
    } catch (error) {
      console.warn(`[storyReader] Falling back to demo data for slug "${slug}"`, error);
    }
  }

  return getDemoReaderChapter(slug, chapterId ?? null);
}

export { listDemoReaderChapterParams };

export type { StoryReaderChapterData, ChapterMediaAsset, ChapterAmbientCue };
