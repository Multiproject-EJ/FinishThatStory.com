import { getDemoStoryDetail, listDemoStorySlugs } from "@/lib/demo/storyDemoData";
import type { StoryDetailData } from "@/lib/storyDetail";

export type DemoEngagementSnapshot = {
  storyLikeCount: number;
  storyLikedByUser: boolean;
  followerCount: number;
  followingAuthor: boolean;
};

type DemoCounter = {
  baseline: number;
  overrides: Map<string, boolean>;
};

type DemoEngagementState = {
  storyLikes: Map<string, DemoCounter>;
  authorFollowers: Map<string, DemoCounter>;
};

type GlobalWithEngagement = typeof globalThis & {
  __ftsDemoEngagement?: DemoEngagementState;
};

function getGlobalStore(): DemoEngagementState {
  const globalWithStore = globalThis as GlobalWithEngagement;

  if (!globalWithStore.__ftsDemoEngagement) {
    globalWithStore.__ftsDemoEngagement = {
      storyLikes: new Map(),
      authorFollowers: new Map(),
    };
  }

  return globalWithStore.__ftsDemoEngagement!;
}

function ensureCounter(collection: Map<string, DemoCounter>, key: string, baseline: number) {
  let counter = collection.get(key);
  if (!counter) {
    counter = { baseline, overrides: new Map() };
    collection.set(key, counter);
  }
  return counter;
}

function calculateTotal(counter: DemoCounter) {
  let delta = 0;
  for (const value of counter.overrides.values()) {
    if (value) {
      delta += 1;
    }
  }
  return Math.max(0, counter.baseline + delta);
}

function findDemoStory(predicate: (detail: StoryDetailData) => boolean) {
  for (const slug of listDemoStorySlugs()) {
    const detail = getDemoStoryDetail(slug);
    if (detail && predicate(detail)) {
      return detail;
    }
  }
  return null;
}

function resolveStoryBaseline(storyId: string) {
  const detail = findDemoStory((entry) => entry.story.id === storyId);
  return detail?.stats.likes ?? 0;
}

function resolveAuthorBaseline(authorId: string) {
  const detail = findDemoStory((entry) => entry.story.authorId === authorId);
  return detail?.stats.followers ?? 0;
}

export function getDemoStoryEngagementSnapshot(
  storyId: string,
  authorId: string,
  userId: string,
): DemoEngagementSnapshot {
  const store = getGlobalStore();
  const storyCounter = ensureCounter(store.storyLikes, storyId, resolveStoryBaseline(storyId));
  const authorCounter = ensureCounter(
    store.authorFollowers,
    authorId,
    resolveAuthorBaseline(authorId),
  );

  const storyLikedByUser = storyCounter.overrides.get(userId) ?? false;
  const followingAuthor = authorCounter.overrides.get(userId) ?? false;

  return {
    storyLikeCount: calculateTotal(storyCounter),
    storyLikedByUser,
    followerCount: calculateTotal(authorCounter),
    followingAuthor,
  };
}

export function toggleDemoStoryLike(storyId: string, userId: string): DemoEngagementSnapshot {
  const store = getGlobalStore();
  const storyCounter = ensureCounter(store.storyLikes, storyId, resolveStoryBaseline(storyId));
  const nextState = !(storyCounter.overrides.get(userId) ?? false);

  if (nextState) {
    storyCounter.overrides.set(userId, true);
  } else {
    storyCounter.overrides.delete(userId);
  }

  return {
    storyLikeCount: calculateTotal(storyCounter),
    storyLikedByUser: nextState,
    followerCount: 0,
    followingAuthor: false,
  };
}

export function toggleDemoAuthorFollow(authorId: string, userId: string): DemoEngagementSnapshot {
  const store = getGlobalStore();
  const authorCounter = ensureCounter(
    store.authorFollowers,
    authorId,
    resolveAuthorBaseline(authorId),
  );
  const nextState = !(authorCounter.overrides.get(userId) ?? false);

  if (nextState) {
    authorCounter.overrides.set(userId, true);
  } else {
    authorCounter.overrides.delete(userId);
  }

  return {
    storyLikeCount: 0,
    storyLikedByUser: false,
    followerCount: calculateTotal(authorCounter),
    followingAuthor: nextState,
  };
}
