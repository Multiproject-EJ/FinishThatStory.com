import { createClient } from "@supabase/supabase-js";

import {
  getStoryBySlug,
  listComments,
  listContributions,
  listStoryChapters,
  type ChapterRecord,
  type CommentRecord,
  type StoryRecord,
} from "@/lib/storyData";
import { getDemoStoryDetail } from "@/lib/demo/storyDemoData";
import { createPlaceholderCollaborator, type StoryCollaborator } from "@/lib/storyCollaborators";
import { mapContributionRecordToView, type StoryContributionView } from "@/lib/storyContributions";

export type StoryContributionPrompt = {
  id: string;
  title: string;
  description: string;
  dueAt: string;
};

export type StoryCommentView = {
  id: string;
  body: string;
  createdAt: string;
  chapterId: string | null;
  repliesCount: number;
  author: StoryCollaborator;
};

export type StoryChapterView = {
  record: ChapterRecord;
  wordCount: number;
  estimatedDurationMinutes: number;
  likeCount: number;
  commentCount: number;
};

export type StoryDetailStats = {
  likes: number;
  followers: number;
  contributions: number;
  readingTimeMinutes: number;
  chapterCount: number;
  lastUpdated: string;
};

export type StoryDetailData = {
  story: StoryRecord;
  chapters: StoryChapterView[];
  comments: StoryCommentView[];
  contributions: StoryContributionView[];
  collaborators: StoryCollaborator[];
  contributionPrompts: StoryContributionPrompt[];
  stats: StoryDetailStats;
  source: "supabase" | "demo";
};

function calculateReadingMinutes(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}

function buildCommentViews(comments: CommentRecord[]): StoryCommentView[] {
  return comments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    chapterId: comment.chapterId,
    repliesCount: comments.filter((reply) => reply.parentCommentId === comment.id).length,
    author: createPlaceholderCollaborator(comment.authorId),
  }));
}

function buildChapterViews(
  chapters: ChapterRecord[],
  comments: CommentRecord[],
): StoryChapterView[] {
  return chapters.map((chapter) => {
    const estimatedDurationMinutes = calculateReadingMinutes(chapter.content);
    const commentCount = comments.filter((comment) => comment.chapterId === chapter.id).length;
    return {
      record: chapter,
      wordCount: chapter.content.trim().split(/\s+/).length,
      estimatedDurationMinutes,
      likeCount: 0,
      commentCount,
    };
  });
}

function deriveStats(
  story: StoryRecord,
  chapters: StoryChapterView[],
  contributions: StoryContributionView[],
): StoryDetailStats {
  const lastUpdated = chapters
    .map((chapter) => chapter.record.updatedAt)
    .concat(story.updatedAt)
    .concat(contributions.map((contribution) => contribution.createdAt))
    .reduce((latest, timestamp) => {
      return new Date(timestamp) > new Date(latest) ? timestamp : latest;
    }, story.updatedAt);

  return {
    likes: 0,
    followers: 0,
    contributions: contributions.length,
    readingTimeMinutes: chapters.reduce(
      (total, chapter) => total + chapter.estimatedDurationMinutes,
      0,
    ),
    chapterCount: chapters.length,
    lastUpdated,
  };
}

export async function fetchStoryDetail(slug: string): Promise<StoryDetailData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const story = await getStoryBySlug(client, slug);

      if (!story) {
        return null;
      }

      const [chapters, comments, contributions] = await Promise.all([
        listStoryChapters(client, story.id),
        listComments(client, { storyId: story.id, limit: 50 }),
        listContributions(client, story.id),
      ]);

      const chapterViews = buildChapterViews(chapters, comments);
      const commentViews = buildCommentViews(comments);
      const chapterLookup = new Map(
        chapterViews.map((chapter) => [
          chapter.record.id,
          {
            title: chapter.record.title,
            position: chapter.record.position,
          },
        ]),
      );
      const contributionViews = contributions.map((contribution) =>
        mapContributionRecordToView(contribution, {
          resolveChapter: (chapterId) => chapterLookup.get(chapterId) ?? null,
        }),
      );
      const stats = deriveStats(story, chapterViews, contributionViews);

      return {
        story,
        chapters: chapterViews,
        comments: commentViews,
        contributions: contributionViews,
        collaborators: [],
        contributionPrompts: [],
        stats,
        source: "supabase",
      };
    } catch (error) {
      console.warn(`[storyDetail] Falling back to demo data for slug "${slug}"`, error);
    }
  }

  return getDemoStoryDetail(slug);
}

export type { StoryRecord };
