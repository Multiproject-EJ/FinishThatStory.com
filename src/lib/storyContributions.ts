import type { ContributionRecord } from "@/lib/storyData";
import { createPlaceholderCollaborator, type StoryCollaborator } from "@/lib/storyCollaborators";

export type StoryContributionStatus = ContributionRecord["status"];

export type StoryContributionView = {
  id: string;
  status: StoryContributionStatus;
  prompt: string | null;
  content: string | null;
  createdAt: string;
  respondedAt: string | null;
  chapterId: string | null;
  chapterTitle: string | null;
  chapterPosition: number | null;
  contributor: StoryCollaborator;
};

type ResolveContributor = (contributorId: string) => StoryCollaborator | null;
type ResolveChapter = (
  chapterId: string,
) => { title: string | null; position: number | null } | null;

type MapOptions = {
  resolveContributor?: ResolveContributor;
  resolveChapter?: ResolveChapter;
};

export function mapContributionRecordToView(
  record: ContributionRecord,
  options: MapOptions = {},
): StoryContributionView {
  const contributor =
    (options.resolveContributor && options.resolveContributor(record.contributorId)) ||
    createPlaceholderCollaborator(record.contributorId);

  const chapterInfo = record.chapterId
    ? (options.resolveChapter && options.resolveChapter(record.chapterId)) || null
    : null;

  return {
    id: record.id,
    status: record.status,
    prompt: record.prompt,
    content: record.content,
    createdAt: record.createdAt,
    respondedAt: record.respondedAt,
    chapterId: record.chapterId,
    chapterTitle: chapterInfo?.title ?? null,
    chapterPosition: chapterInfo?.position ?? null,
    contributor,
  };
}

export function sortContributionsByRecency(
  contributions: StoryContributionView[],
): StoryContributionView[] {
  return [...contributions].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
