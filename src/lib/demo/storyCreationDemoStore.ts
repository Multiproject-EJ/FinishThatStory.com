import type { ChapterRecord, StoryRecord } from "@/lib/storyData";
import type { ChapterMediaAsset } from "@/lib/storyReader.types";

function generateDemoId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type DemoStoryPayload = {
  authorId: string;
  authorDisplayName: string;
  title: string;
  slug?: string | null;
  summary: string | null;
  coverImage: string | null;
  language: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: string | null;
  chapter: {
    title: string | null;
    summary: string | null;
    content: string;
    isPublished: boolean;
  };
  mediaAssets: Array<{
    title: string;
    description: string | null;
    mediaType: "audio" | "video" | "interactive" | "text";
    mediaUrl: string | null;
    durationSeconds: number | null;
    transcript: string | null;
    sortOrder: number | null;
  }>;
};

type DemoStoryEntry = {
  story: StoryRecord;
  chapters: ChapterRecord[];
  mediaAssets: ChapterMediaAsset[];
  authorDisplayName: string;
  createdAtIso: string;
};

type DemoStoryStore = Map<string, DemoStoryEntry>;

type GlobalWithStoryStore = typeof globalThis & {
  __ftsDemoStories?: DemoStoryStore;
};

function getStore(): DemoStoryStore {
  const globalWithStore = globalThis as GlobalWithStoryStore;
  if (!globalWithStore.__ftsDemoStories) {
    globalWithStore.__ftsDemoStories = new Map();
  }
  return globalWithStore.__ftsDemoStories;
}

function ensureUniqueSlug(baseSlug: string): string {
  const store = getStore();
  if (!store.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let candidate = `${baseSlug}-${counter}`;
  while (store.has(candidate)) {
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
  return candidate;
}

export function addDemoStory(payload: DemoStoryPayload): DemoStoryEntry {
  const store = getStore();
  const now = new Date().toISOString();

  const baseSlug =
    payload.slug && payload.slug.trim()
      ? payload.slug.trim().toLowerCase()
      : slugify(payload.title);
  const slug = ensureUniqueSlug(baseSlug || slugify(`story-${Date.now()}`));

  const storyId = generateDemoId("demo-story");
  const story: StoryRecord = {
    id: storyId,
    authorId: payload.authorId,
    title: payload.title,
    slug,
    summary: payload.summary,
    coverImage: payload.coverImage,
    language: payload.language,
    tags: payload.tags,
    isPublished: payload.isPublished,
    publishedAt: payload.publishedAt,
    createdAt: now,
    updatedAt: now,
  };

  const chapterId = generateDemoId("demo-chapter");
  const chapter: ChapterRecord = {
    id: chapterId,
    storyId: storyId,
    authorId: payload.authorId,
    title: payload.chapter.title,
    summary: payload.chapter.summary,
    content: payload.chapter.content,
    position: 0,
    isPublished: payload.chapter.isPublished,
    createdAt: now,
    updatedAt: now,
  };

  const mediaAssets: ChapterMediaAsset[] = payload.mediaAssets.map((asset, index) => ({
    id: generateDemoId("demo-media"),
    chapterId,
    title: asset.title,
    description: asset.description,
    mediaType: asset.mediaType,
    mediaUrl: asset.mediaUrl,
    durationSeconds: asset.durationSeconds,
    transcript: asset.transcript,
    sortOrder: asset.sortOrder ?? index,
  }));

  const entry: DemoStoryEntry = {
    story,
    chapters: [chapter],
    mediaAssets,
    authorDisplayName: payload.authorDisplayName,
    createdAtIso: now,
  };

  store.set(slug, entry);

  return entry;
}

export function listDemoStoryCreations(): DemoStoryEntry[] {
  const store = getStore();
  return Array.from(store.values()).map((entry) => ({
    story: { ...entry.story },
    chapters: entry.chapters.map((chapter) => ({ ...chapter })),
    mediaAssets: entry.mediaAssets.map((asset) => ({ ...asset })),
    authorDisplayName: entry.authorDisplayName,
    createdAtIso: entry.createdAtIso,
  }));
}
