import { describe, expect, test, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addComment,
  createStory,
  fetchPublishedStories,
  followUser,
  listComments,
  StoryCreateInput,
  toggleStoryLike,
  updateStory,
} from "@/lib/storyData";

function createMockClient(handlers: Record<string, any>): SupabaseClient {
  return {
    from: (table: string) => {
      const handler = handlers[table];
      if (!handler) {
        throw new Error(`Unexpected table ${table}`);
      }
      return handler;
    },
  } as unknown as SupabaseClient;
}

describe("createStory", () => {
  test("generates slug and publishes timestamp", async () => {
    const inserted: any[] = [];
    const dbRow = {
      id: "11111111-1111-1111-1111-111111111111",
      author_id: "11111111-1111-1111-1111-111111111111",
      title: "Test Story",
      slug: "test-story",
      summary: null,
      cover_image: null,
      language: "en",
      tags: [],
      is_published: true,
      published_at: "2024-01-01T00:00:00.000Z",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const single = vi.fn(async () => ({ data: dbRow, error: null }));
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn((payload: unknown) => {
      inserted.push(payload);
      return { select };
    });

    const client = createMockClient({
      Story: { insert },
    });

    const input: StoryCreateInput = {
      authorId: dbRow.author_id,
      title: dbRow.title,
      isPublished: true,
    };

    const result = await createStory(client, input);

    expect(insert).toHaveBeenCalledTimes(1);
    const insertPayload = inserted[0] as Record<string, unknown>;
    expect(insertPayload.slug).toBe("test-story");
    expect(insertPayload.published_at).toBeTypeOf("string");
    expect(single).toHaveBeenCalledOnce();
    expect(result.slug).toBe("test-story");
  });
});

describe("updateStory", () => {
  test("unpublishing clears published date when not provided", async () => {
    const updateCalls: Record<string, unknown>[] = [];
    const dbRow = {
      id: "11111111-1111-1111-1111-111111111111",
      author_id: "11111111-1111-1111-1111-111111111111",
      title: "Test Story",
      slug: "test-story",
      summary: null,
      cover_image: null,
      language: "en",
      tags: [],
      is_published: false,
      published_at: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const single = vi.fn(async () => ({ data: dbRow, error: null }));
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn((payload: Record<string, unknown>) => {
      updateCalls.push(payload);
      return { eq };
    });

    const client = createMockClient({
      Story: { update },
    });

    await updateStory(client, dbRow.id, { isPublished: false });

    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].is_published).toBe(false);
    expect(updateCalls[0].published_at).toBeNull();
    expect(eq).toHaveBeenCalledWith("id", dbRow.id);
    expect(single).toHaveBeenCalledOnce();
  });
});

describe("fetchPublishedStories", () => {
  test("applies filters before returning records", async () => {
    const dbRow = {
      id: "11111111-1111-1111-1111-111111111111",
      author_id: "11111111-1111-1111-1111-111111111111",
      title: "Nebula",
      slug: "nebula",
      summary: null,
      cover_image: null,
      language: "es",
      tags: ["sci-fi"],
      is_published: true,
      published_at: "2024-01-01T00:00:00.000Z",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const eqCalls: Array<[string, unknown]> = [];
    const containsCalls: Array<[string, unknown]> = [];
    const ilikeCalls: Array<[string, unknown]> = [];

    const resultValue = { data: [dbRow], error: null };
    const builder: any = {
      select: vi.fn(() => builder),
      eq: vi.fn((column: string, value: unknown) => {
        eqCalls.push([column, value]);
        return builder;
      }),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      contains: vi.fn((column: string, value: unknown) => {
        containsCalls.push([column, value]);
        return builder;
      }),
      ilike: vi.fn((column: string, value: unknown) => {
        ilikeCalls.push([column, value]);
        return builder;
      }),
      then: (onFulfilled: (value: typeof resultValue) => unknown) =>
        Promise.resolve(resultValue).then(onFulfilled),
    };

    const client = createMockClient({
      Story: builder,
    });

    const stories = await fetchPublishedStories(client, {
      language: "es",
      tags: ["sci-fi"],
      search: "neb",
      limit: 5,
    });

    expect(builder.select).toHaveBeenCalledOnce();
    expect(eqCalls).toContainEqual(["is_published", true]);
    expect(eqCalls).toContainEqual(["language", "es"]);
    expect(containsCalls).toContainEqual(["tags", ["sci-fi"]]);
    expect(ilikeCalls).toContainEqual(["title", "%neb%"]);
    expect(stories).toHaveLength(1);
    expect(stories[0].slug).toBe("nebula");
  });
});

describe("comment helpers", () => {
  test("addComment returns normalized record", async () => {
    const dbRow = {
      id: "55555555-5555-5555-5555-555555555555",
      story_id: "11111111-1111-1111-1111-111111111111",
      chapter_id: null,
      author_id: "22222222-2222-2222-2222-222222222222",
      body: "Hello",
      parent_comment_id: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    const single = vi.fn(async () => ({ data: dbRow, error: null }));
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));

    const client = createMockClient({
      Comment: { insert },
    });

    const result = await addComment(client, {
      storyId: dbRow.story_id,
      authorId: dbRow.author_id,
      body: dbRow.body,
    });

    expect(insert).toHaveBeenCalledOnce();
    expect(result.authorId).toBe(dbRow.author_id);
  });

  test("listComments supports null chapter filter", async () => {
    const dbRow = {
      id: "55555555-5555-5555-5555-555555555555",
      story_id: "11111111-1111-1111-1111-111111111111",
      chapter_id: null,
      author_id: "22222222-2222-2222-2222-222222222222",
      body: "Hello",
      parent_comment_id: null,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    let isCall: [string, unknown] | undefined;
    const resultValue = { data: [dbRow], error: null };
    const builder: any = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      is: vi.fn((column: string, value: unknown) => {
        isCall = [column, value];
        return builder;
      }),
      then: (onFulfilled: (value: typeof resultValue) => unknown) =>
        Promise.resolve(resultValue).then(onFulfilled),
    };

    const client = createMockClient({
      Comment: builder,
    });

    const comments = await listComments(client, {
      storyId: dbRow.story_id,
      chapterId: null,
    });

    expect(builder.select).toHaveBeenCalledOnce();
    expect(isCall).toEqual(["chapter_id", null]);
    expect(comments).toHaveLength(1);
    expect(comments[0].chapterId).toBeNull();
  });
});

describe("follow and like safety", () => {
  test("toggleStoryLike removes like when false", async () => {
    const eqUser = vi.fn(() => ({
      then: (
        onFulfilled: (value: { data: null; error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected),
    }));
    const eqStory = vi.fn(() => ({ eq: eqUser }));
    const del = vi.fn(() => ({ eq: eqStory }));

    const client = createMockClient({
      StoryLike: { delete: del },
    });

    await toggleStoryLike(client, {
      targetId: "11111111-1111-1111-1111-111111111111",
      userId: "22222222-2222-2222-2222-222222222222",
      like: false,
    });

    expect(del).toHaveBeenCalledOnce();
    expect(eqStory).toHaveBeenCalledWith("story_id", expect.any(String));
    expect(eqUser).toHaveBeenCalledWith("user_id", expect.any(String));
  });

  test("followUser rejects matching ids", async () => {
    await expect(
      followUser(createMockClient({ UserFollow: { upsert: vi.fn() } }), {
        followerId: "11111111-1111-1111-1111-111111111111",
        followingId: "11111111-1111-1111-1111-111111111111",
      }),
    ).rejects.toThrow(/Users cannot follow themselves/);
  });
});
