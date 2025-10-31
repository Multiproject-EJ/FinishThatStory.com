import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { ChapterMediaAsset } from "@/lib/storyReader.types";

const chapterMediaAssetRowSchema = z
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
  .transform((row) => ({
    id: row.id,
    chapterId: row.chapter_id,
    title: row.title,
    description: row.description,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    durationSeconds: row.duration_seconds,
    transcript: row.transcript,
    sortOrder: row.sort_order,
  }));

const chapterMediaAssetCreateSchema = z.object({
  chapterId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().max(500).nullable().optional(),
  mediaType: z.enum(["audio", "video", "interactive", "text"]),
  mediaUrl: z.string().url().nullable().optional(),
  durationSeconds: z.number().int().nonnegative().nullable().optional(),
  transcript: z.string().nullable().optional(),
  sortOrder: z.number().int().nonnegative().nullable().optional(),
});

export type ChapterMediaAssetCreateInput = z.input<typeof chapterMediaAssetCreateSchema>;

export async function createChapterMediaAssets(
  client: SupabaseClient,
  inputs: ChapterMediaAssetCreateInput[],
): Promise<ChapterMediaAsset[]> {
  if (!inputs.length) {
    return [];
  }

  const payload = z.array(chapterMediaAssetCreateSchema).parse(inputs);

  const { data, error } = await client
    .from("chapter_media_assets")
    .insert(
      payload.map((asset) => ({
        chapter_id: asset.chapterId,
        title: asset.title,
        description: asset.description ?? null,
        media_type: asset.mediaType,
        media_url: asset.mediaUrl ?? null,
        duration_seconds: asset.durationSeconds ?? null,
        transcript: asset.transcript ?? null,
        sort_order: asset.sortOrder ?? null,
      })),
    )
    .select(
      "id, chapter_id, title, description, media_type, media_url, duration_seconds, transcript, sort_order",
    );

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => chapterMediaAssetRowSchema.parse(row));
}
