import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const storyRowSchema = z
  .object({
    id: z.string().uuid(),
    author_id: z.string().uuid(),
    title: z.string(),
    slug: z.string().nullable(),
    summary: z.string().nullable(),
    cover_image: z.string().nullable(),
    language: z.string(),
    tags: z.array(z.string()).nullable().transform((value) => value ?? []),
    is_published: z.boolean(),
    published_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    coverImage: row.cover_image,
    language: row.language,
    tags: row.tags,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

export type StoryRecord = z.infer<typeof storyRowSchema>;

const storyFiltersSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  language: z.string().min(2).max(8).optional(),
  tags: z.array(z.string().min(1)).min(1).max(8).optional(),
  search: z.string().min(2).max(120).optional(),
});

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
  .max(96);

const storyCreateSchema = z.object({
  authorId: z.string().uuid(),
  title: z.string().min(3, "Story title must be at least 3 characters"),
  slug: slugSchema.optional(),
  summary: z.string().max(500).nullable().optional(),
  coverImage: z.string().url().max(500).nullable().optional(),
  language: z.string().min(2).max(8).default("en"),
  tags: z.array(z.string().min(2).max(32)).max(12).default([]),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

const storyUpdateSchema = z.object({
  title: z.string().min(3, "Story title must be at least 3 characters").optional(),
  slug: z.union([slugSchema, z.literal("")]).optional(),
  summary: z.string().max(500).nullable().optional(),
  coverImage: z.string().url().max(500).nullable().optional(),
  language: z.string().min(2).max(8).optional(),
  tags: z.array(z.string().min(2).max(32)).max(12).optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

const chapterRowSchema = z
  .object({
    id: z.string().uuid(),
    story_id: z.string().uuid(),
    author_id: z.string().uuid(),
    title: z.string().nullable(),
    summary: z.string().nullable(),
    content: z.string(),
    position: z.number().int(),
    is_published: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    storyId: row.story_id,
    authorId: row.author_id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    position: row.position,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

export type ChapterRecord = z.infer<typeof chapterRowSchema>;

const chapterInputSchema = z.object({
  storyId: z.string().uuid(),
  authorId: z.string().uuid(),
  title: z.string().min(1).max(120).nullable().optional(),
  summary: z.string().max(500).nullable().optional(),
  content: z.string().min(1, "Chapter content cannot be empty"),
  position: z.number().int().nonnegative(),
  isPublished: z.boolean().default(true),
});

const chapterUpdateSchema = chapterInputSchema.partial({
  storyId: true,
  authorId: true,
  position: true,
});

const commentRowSchema = z
  .object({
    id: z.string().uuid(),
    story_id: z.string().uuid(),
    chapter_id: z.string().uuid().nullable(),
    author_id: z.string().uuid(),
    body: z.string(),
    parent_comment_id: z.string().uuid().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    storyId: row.story_id,
    chapterId: row.chapter_id,
    authorId: row.author_id,
    body: row.body,
    parentCommentId: row.parent_comment_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

export type CommentRecord = z.infer<typeof commentRowSchema>;

const commentInputSchema = z.object({
  storyId: z.string().uuid(),
  chapterId: z.string().uuid().nullable().optional(),
  authorId: z.string().uuid(),
  body: z.string().min(1).max(2000),
  parentCommentId: z.string().uuid().nullable().optional(),
});

const commentListFiltersSchema = z.object({
  storyId: z.string().uuid(),
  chapterId: z.string().uuid().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

const likeToggleSchema = z.object({
  targetId: z.string().uuid(),
  userId: z.string().uuid(),
  like: z.boolean(),
});

const followInputSchema = z
  .object({
    followerId: z.string().uuid(),
    followingId: z.string().uuid(),
  })
  .refine((value) => value.followerId !== value.followingId, {
    message: "Users cannot follow themselves",
    path: ["followingId"],
  });

const contributionRowSchema = z
  .object({
    id: z.string().uuid(),
    story_id: z.string().uuid(),
    contributor_id: z.string().uuid(),
    chapter_id: z.string().uuid().nullable(),
    status: z.enum(["pending", "accepted", "rejected"]),
    prompt: z.string().nullable(),
    content: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    responded_at: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    storyId: row.story_id,
    contributorId: row.contributor_id,
    chapterId: row.chapter_id,
    status: row.status,
    prompt: row.prompt,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    respondedAt: row.responded_at,
  }));

export type ContributionRecord = z.infer<typeof contributionRowSchema>;

const contributionCreateSchema = z.object({
  storyId: z.string().uuid(),
  contributorId: z.string().uuid(),
  prompt: z.string().max(500).nullable().optional(),
  content: z.string().max(5000).nullable().optional(),
});

const contributionUpdateSchema = z.object({
  contributionId: z.string().uuid(),
  status: z.enum(["pending", "accepted", "rejected"]),
  chapterId: z.string().uuid().nullable().optional(),
  respondedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export type StoryListFilters = z.input<typeof storyFiltersSchema>;
export type StoryCreateInput = z.input<typeof storyCreateSchema>;
export type StoryUpdateInput = z.input<typeof storyUpdateSchema>;
export type ChapterCreateInput = z.input<typeof chapterInputSchema>;
export type ChapterUpdateInput = z.input<typeof chapterUpdateSchema>;
export type CommentCreateInput = z.input<typeof commentInputSchema>;
export type CommentListFilters = z.input<typeof commentListFiltersSchema>;
export type LikeToggleInput = z.input<typeof likeToggleSchema>;
export type FollowInput = z.input<typeof followInputSchema>;
export type ContributionCreateInput = z.input<typeof contributionCreateSchema>;
export type ContributionUpdateInput = z.input<typeof contributionUpdateSchema>;

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 96);
}

function storySelection() {
  return "id, author_id, title, slug, summary, cover_image, language, tags, is_published, published_at, created_at, updated_at";
}

function chapterSelection() {
  return "id, story_id, author_id, title, summary, content, position, is_published, created_at, updated_at";
}

function commentSelection() {
  return "id, story_id, chapter_id, author_id, body, parent_comment_id, created_at, updated_at";
}

function contributionSelection() {
  return "id, story_id, contributor_id, chapter_id, status, prompt, content, created_at, updated_at, responded_at";
}

export async function fetchPublishedStories(
  client: SupabaseClient,
  filters: StoryListFilters = {},
): Promise<StoryRecord[]> {
  const resolved = storyFiltersSchema.parse(filters);
  const limit = resolved.limit ?? 12;
  const query = client
    .from("Story")
    .select(storySelection())
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: true })
    .limit(limit);

  if (resolved.language) {
    query.eq("language", resolved.language);
  }

  if (resolved.tags?.length) {
    query.contains("tags", resolved.tags);
  }

  if (resolved.search) {
    query.ilike("title", `%${resolved.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => storyRowSchema.parse(row));
}

export async function getStoryBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<StoryRecord | null> {
  const normalizedSlug = slug.toLowerCase();
  const { data, error } = await client
    .from("Story")
    .select(storySelection())
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? storyRowSchema.parse(data) : null;
}

export async function createStory(
  client: SupabaseClient,
  input: StoryCreateInput,
): Promise<StoryRecord> {
  const payload = storyCreateSchema.parse(input);
  const slug = payload.slug ?? slugify(payload.title);

  const { data, error } = await client
    .from("Story")
    .insert({
      author_id: payload.authorId,
      title: payload.title,
      slug: slug || null,
      summary: payload.summary ?? null,
      cover_image: payload.coverImage ?? null,
      language: payload.language,
      tags: payload.tags,
      is_published: payload.isPublished,
      published_at: payload.isPublished
        ? payload.publishedAt ?? new Date().toISOString()
        : payload.publishedAt ?? null,
    })
    .select(storySelection())
    .single();

  if (error) {
    throw error;
  }

  return storyRowSchema.parse(data);
}

export async function updateStory(
  client: SupabaseClient,
  storyId: string,
  input: StoryUpdateInput,
): Promise<StoryRecord> {
  const payload = storyUpdateSchema.parse(input);

  const update: Record<string, unknown> = {};
  if (payload.title !== undefined) update.title = payload.title;
  if (payload.slug !== undefined) {
    update.slug = payload.slug === "" ? null : payload.slug;
  }
  if (payload.summary !== undefined) update.summary = payload.summary;
  if (payload.coverImage !== undefined) update.cover_image = payload.coverImage;
  if (payload.language !== undefined) update.language = payload.language;
  if (payload.tags !== undefined) update.tags = payload.tags;
  if (payload.isPublished !== undefined) {
    update.is_published = payload.isPublished;
    if (payload.publishedAt === undefined) {
      update.published_at = payload.isPublished ? new Date().toISOString() : null;
    }
  }
  if (payload.publishedAt !== undefined) update.published_at = payload.publishedAt;

  const { data, error } = await client
    .from("Story")
    .update(update)
    .eq("id", storyId)
    .select(storySelection())
    .single();

  if (error) {
    throw error;
  }

  return storyRowSchema.parse(data);
}

export async function listStoryChapters(
  client: SupabaseClient,
  storyId: string,
): Promise<ChapterRecord[]> {
  const { data, error } = await client
    .from("Chapter")
    .select(chapterSelection())
    .eq("story_id", storyId)
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => chapterRowSchema.parse(row));
}

export async function createChapter(
  client: SupabaseClient,
  input: ChapterCreateInput,
): Promise<ChapterRecord> {
  const payload = chapterInputSchema.parse(input);
  const { data, error } = await client
    .from("Chapter")
    .insert({
      story_id: payload.storyId,
      author_id: payload.authorId,
      title: payload.title ?? null,
      summary: payload.summary ?? null,
      content: payload.content,
      position: payload.position,
      is_published: payload.isPublished,
    })
    .select(chapterSelection())
    .single();

  if (error) {
    throw error;
  }

  return chapterRowSchema.parse(data);
}

export async function updateChapter(
  client: SupabaseClient,
  chapterId: string,
  input: ChapterUpdateInput,
): Promise<ChapterRecord> {
  const payload = chapterUpdateSchema.parse(input);
  const update: Record<string, unknown> = {};
  if (payload.title !== undefined) update.title = payload.title;
  if (payload.summary !== undefined) update.summary = payload.summary;
  if (payload.content !== undefined) update.content = payload.content;
  if (payload.position !== undefined) update.position = payload.position;
  if (payload.isPublished !== undefined) update.is_published = payload.isPublished;

  const { data, error } = await client
    .from("Chapter")
    .update(update)
    .eq("id", chapterId)
    .select(chapterSelection())
    .single();

  if (error) {
    throw error;
  }

  return chapterRowSchema.parse(data);
}

export async function listComments(
  client: SupabaseClient,
  filters: CommentListFilters,
): Promise<CommentRecord[]> {
  const payload = commentListFiltersSchema.parse(filters);
  const query = client
    .from("Comment")
    .select(commentSelection())
    .eq("story_id", payload.storyId)
    .order("created_at", { ascending: true })
    .limit(payload.limit);

  if (payload.chapterId !== undefined) {
    if (payload.chapterId === null) {
      query.is("chapter_id", null);
    } else {
      query.eq("chapter_id", payload.chapterId);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => commentRowSchema.parse(row));
}

export async function addComment(
  client: SupabaseClient,
  input: CommentCreateInput,
): Promise<CommentRecord> {
  const payload = commentInputSchema.parse(input);
  const { data, error } = await client
    .from("Comment")
    .insert({
      story_id: payload.storyId,
      chapter_id: payload.chapterId ?? null,
      author_id: payload.authorId,
      body: payload.body,
      parent_comment_id: payload.parentCommentId ?? null,
    })
    .select(commentSelection())
    .single();

  if (error) {
    throw error;
  }

  return commentRowSchema.parse(data);
}

export async function toggleStoryLike(
  client: SupabaseClient,
  input: LikeToggleInput,
): Promise<void> {
  const payload = likeToggleSchema.parse(input);
  if (payload.like) {
    const { error } = await client
      .from("StoryLike")
      .upsert({
        story_id: payload.targetId,
        user_id: payload.userId,
      }, { onConflict: "user_id,story_id" });
    if (error) {
      throw error;
    }
  } else {
    const { error } = await client
      .from("StoryLike")
      .delete()
      .eq("story_id", payload.targetId)
      .eq("user_id", payload.userId);
    if (error) {
      throw error;
    }
  }
}

export async function toggleChapterLike(
  client: SupabaseClient,
  input: LikeToggleInput,
): Promise<void> {
  const payload = likeToggleSchema.parse(input);
  if (payload.like) {
    const { error } = await client
      .from("StoryLike")
      .upsert({
        chapter_id: payload.targetId,
        user_id: payload.userId,
      }, { onConflict: "user_id,chapter_id" });
    if (error) {
      throw error;
    }
  } else {
    const { error } = await client
      .from("StoryLike")
      .delete()
      .eq("chapter_id", payload.targetId)
      .eq("user_id", payload.userId);
    if (error) {
      throw error;
    }
  }
}

export async function followUser(
  client: SupabaseClient,
  input: FollowInput,
): Promise<void> {
  const payload = followInputSchema.parse(input);
  const { error } = await client
    .from("UserFollow")
    .upsert({
      follower_id: payload.followerId,
      following_id: payload.followingId,
    });
  if (error) {
    throw error;
  }
}

export async function unfollowUser(
  client: SupabaseClient,
  input: FollowInput,
): Promise<void> {
  const payload = followInputSchema.parse(input);
  const { error } = await client
    .from("UserFollow")
    .delete()
    .eq("follower_id", payload.followerId)
    .eq("following_id", payload.followingId);
  if (error) {
    throw error;
  }
}

export async function submitContribution(
  client: SupabaseClient,
  input: ContributionCreateInput,
): Promise<ContributionRecord> {
  const payload = contributionCreateSchema.parse(input);
  const { data, error } = await client
    .from("StoryContribution")
    .insert({
      story_id: payload.storyId,
      contributor_id: payload.contributorId,
      prompt: payload.prompt ?? null,
      content: payload.content ?? null,
    })
    .select(contributionSelection())
    .single();

  if (error) {
    throw error;
  }

  return contributionRowSchema.parse(data);
}

export async function updateContribution(
  client: SupabaseClient,
  input: ContributionUpdateInput,
): Promise<ContributionRecord> {
  const payload = contributionUpdateSchema.parse(input);
  const update: Record<string, unknown> = {
    status: payload.status,
  };
  if (payload.chapterId !== undefined) {
    update.chapter_id = payload.chapterId;
  }
  if (payload.respondedAt !== undefined) {
    update.responded_at = payload.respondedAt;
  }

  const { data, error } = await client
    .from("StoryContribution")
    .update(update)
    .eq("id", payload.contributionId)
    .select(contributionSelection())
    .single();

  if (error) {
    throw error;
  }

  return contributionRowSchema.parse(data);
}

export async function listContributions(
  client: SupabaseClient,
  storyId: string,
): Promise<ContributionRecord[]> {
  const { data, error } = await client
    .from("StoryContribution")
    .select(contributionSelection())
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => contributionRowSchema.parse(row));
}
