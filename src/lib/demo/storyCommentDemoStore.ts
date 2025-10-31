import type { StoryCommentView } from "@/lib/storyDetail";

export type DemoCommentInput = {
  alias: string;
  role: string;
  body: string;
  chapterId: string | null;
};

type DemoCommentEntry = {
  baseline: StoryCommentView[];
  additions: StoryCommentView[];
};

type DemoCommentStore = Map<string, DemoCommentEntry>;

type GlobalWithCommentStore = typeof globalThis & {
  __ftsDemoComments?: DemoCommentStore;
};

function getStore(): DemoCommentStore {
  const globalWithStore = globalThis as GlobalWithCommentStore;
  if (!globalWithStore.__ftsDemoComments) {
    globalWithStore.__ftsDemoComments = new Map();
  }
  return globalWithStore.__ftsDemoComments;
}

function cloneComment(comment: StoryCommentView): StoryCommentView {
  return {
    ...comment,
    author: { ...comment.author },
  };
}

function ensureEntry(storyId: string, baseline: StoryCommentView[]): DemoCommentEntry {
  const store = getStore();
  const clones = baseline.map(cloneComment);
  const existing = store.get(storyId);

  if (existing) {
    existing.baseline = clones;
    const baselineIds = new Set(clones.map((comment) => comment.id));
    existing.additions = existing.additions
      .filter((comment) => !baselineIds.has(comment.id))
      .map(cloneComment);
    return existing;
  }

  const entry: DemoCommentEntry = {
    baseline: clones,
    additions: [],
  };
  store.set(storyId, entry);
  return entry;
}

function sortCommentsByTimestamp(comments: StoryCommentView[]): StoryCommentView[] {
  return [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function generateDemoId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getDemoCommentThread(
  storyId: string,
  baseline: StoryCommentView[],
): StoryCommentView[] {
  const entry = ensureEntry(storyId, baseline);
  return sortCommentsByTimestamp([
    ...entry.baseline.map(cloneComment),
    ...entry.additions.map(cloneComment),
  ]);
}

export function addDemoComment(
  storyId: string,
  baseline: StoryCommentView[],
  input: DemoCommentInput,
): StoryCommentView {
  const entry = ensureEntry(storyId, baseline);
  const now = new Date().toISOString();
  const comment: StoryCommentView = {
    id: generateDemoId("demo-comment"),
    body: input.body,
    createdAt: now,
    chapterId: input.chapterId,
    repliesCount: 0,
    author: {
      id: generateDemoId("demo-commenter"),
      displayName: input.alias,
      role: input.role,
      avatarUrl: null,
    },
  };

  entry.additions = sortCommentsByTimestamp([comment, ...entry.additions]);

  return cloneComment(comment);
}
