import type { ChapterRecord, StoryRecord } from "@/lib/storyData";

export type ChapterMediaAsset = {
  id: string;
  chapterId: string;
  title: string;
  description: string | null;
  mediaType: "audio" | "video" | "interactive" | "text";
  mediaUrl: string | null;
  durationSeconds: number | null;
  transcript: string | null;
  sortOrder: number | null;
};

export type ChapterAmbientCue = {
  id: string;
  chapterId: string;
  timestampSeconds: number;
  label: string;
  description: string | null;
};

export type StoryReaderChapterData = {
  story: StoryRecord;
  chapter: ChapterRecord;
  chapterIndex: number;
  totalChapters: number;
  stats: {
    wordCount: number;
    readingTimeMinutes: number;
  };
  navigation: {
    previousChapterId: string | null;
    nextChapterId: string | null;
  };
  tableOfContents: Array<{
    id: string;
    title: string | null;
    position: number;
  }>;
  mediaAssets: ChapterMediaAsset[];
  ambientCues: ChapterAmbientCue[];
  source: "supabase" | "demo";
};
