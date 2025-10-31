import { sortContributionsByRecency, type StoryContributionView } from "@/lib/storyContributions";

export type DemoContributionInput = {
  alias: string;
  content: string;
  prompt: string | null;
  chapterId: string | null;
  chapterTitle: string | null;
  chapterPosition: number | null;
};

type DemoContributionEntry = {
  baseline: StoryContributionView[];
  additions: StoryContributionView[];
};

type DemoContributionStore = Map<string, DemoContributionEntry>;

type GlobalWithContributionStore = typeof globalThis & {
  __ftsDemoContributions?: DemoContributionStore;
};

function getStore(): DemoContributionStore {
  const globalWithStore = globalThis as GlobalWithContributionStore;
  if (!globalWithStore.__ftsDemoContributions) {
    globalWithStore.__ftsDemoContributions = new Map();
  }
  return globalWithStore.__ftsDemoContributions;
}

function cloneContribution(contribution: StoryContributionView): StoryContributionView {
  return {
    ...contribution,
    contributor: { ...contribution.contributor },
  };
}

function ensureEntry(storyId: string, baseline: StoryContributionView[]): DemoContributionEntry {
  const store = getStore();
  const existing = store.get(storyId);
  if (existing) {
    existing.baseline = baseline.map(cloneContribution);
    return existing;
  }

  const entry: DemoContributionEntry = {
    baseline: baseline.map(cloneContribution),
    additions: [],
  };
  store.set(storyId, entry);
  return entry;
}

function generateDemoId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getDemoContributionTimeline(
  storyId: string,
  baseline: StoryContributionView[],
): StoryContributionView[] {
  const entry = ensureEntry(storyId, baseline);
  return sortContributionsByRecency([
    ...entry.baseline.map(cloneContribution),
    ...entry.additions.map(cloneContribution),
  ]);
}

export function addDemoContribution(
  storyId: string,
  baseline: StoryContributionView[],
  input: DemoContributionInput,
): StoryContributionView {
  const entry = ensureEntry(storyId, baseline);
  const now = new Date().toISOString();
  const id = generateDemoId("demo-contribution");
  const contributorId = generateDemoId("demo-contributor");

  const contribution: StoryContributionView = {
    id,
    status: "pending",
    prompt: input.prompt,
    content: input.content,
    createdAt: now,
    respondedAt: null,
    chapterId: input.chapterId,
    chapterTitle: input.chapterTitle,
    chapterPosition: input.chapterPosition,
    contributor: {
      id: contributorId,
      displayName: input.alias,
      role: "Guest contributor",
      avatarUrl: null,
    },
  };

  entry.additions = [contribution, ...entry.additions];

  return cloneContribution(contribution);
}
