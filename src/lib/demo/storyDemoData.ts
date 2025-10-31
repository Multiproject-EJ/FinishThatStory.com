import type {
  StoryChapterView,
  StoryCommentView,
  StoryContributionPrompt,
  StoryDetailData,
  StoryDetailStats,
} from "@/lib/storyDetail";
import type { StoryContributionView } from "@/lib/storyContributions";
import type { StoryCollaborator } from "@/lib/storyCollaborators";
import type { ChapterRecord, StoryRecord } from "@/lib/storyData";
import { getDemoContributionTimeline } from "@/lib/demo/storyContributionDemoStore";

function minutesFromWordCount(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}

const stellarSymphonyStory: StoryRecord = {
  id: "5d2f2a16-2a7f-4e69-9d3d-3abdf7de1e4b",
  authorId: "1d88cc60-7d3a-445a-a7f9-6b7cf87db5e4",
  title: "Stellar Symphony",
  slug: "stellar-symphony",
  summary:
    "A cosmic audio drama where each chapter unlocks a new constellation composed with community-sourced melodies and lore.",
  coverImage: null,
  language: "en",
  tags: ["audio", "sci-fi", "collaborative"],
  isPublished: true,
  publishedAt: "2024-02-28T08:00:00.000Z",
  createdAt: "2024-02-12T09:30:00.000Z",
  updatedAt: "2024-03-22T18:45:00.000Z",
};

const stellarCollaborators: StoryCollaborator[] = [
  {
    id: "1d88cc60-7d3a-445a-a7f9-6b7cf87db5e4",
    displayName: "NovaQuill",
    role: "Showrunner",
    avatarUrl: null,
  },
  {
    id: "5f650d8f-2a6c-4df9-93f5-9c4bb77a9b21",
    displayName: "EchoWeaver",
    role: "Sound designer",
    avatarUrl: null,
  },
  {
    id: "a4de6a1e-13f5-4c9d-8e4a-6b7a929a1a99",
    displayName: "OrbitInk",
    role: "Lore curator",
    avatarUrl: null,
  },
];

const stellarChapterRecords: ChapterRecord[] = [
  {
    id: "6e84c6d4-fd87-4ed6-8e3c-b0c4a1f08a4f",
    storyId: stellarSymphonyStory.id,
    authorId: stellarCollaborators[0]!.id,
    title: "Movement I — Celestial Prelude",
    summary:
      "The crew tunes the resonance engines and invites listeners to hum along as the first star map blossoms into sound.",
    content:
      "The Starship Aria glided beyond Neptune's orbit as NovaQuill signaled the chorus to begin. Listeners across the galaxy " +
      "sent in vocal fragments, humming in divergent keys. EchoWeaver sampled each tone, stretching them into ribbons of " +
      "sustained harmony. OrbitInk annotated the constellations projected within the observation dome, mapping myths to the " +
      "frequencies. The chapter closed with an unresolved cadence, beckoning collaborators to submit percussive textures for " +
      "the next movement.",
    position: 0,
    isPublished: true,
    createdAt: "2024-02-28T08:00:00.000Z",
    updatedAt: "2024-03-05T14:12:00.000Z",
  },
  {
    id: "ab1bb077-587d-4d77-aa2d-e4fb6de916d9",
    storyId: stellarSymphonyStory.id,
    authorId: stellarCollaborators[1]!.id,
    title: "Movement II — Nebula Bridge",
    summary:
      "Community-sourced percussion transforms ion storms into polyrhythms while lore scribes weave in forgotten pilgrim chants.",
    content:
      "EchoWeaver layered percussive samples uploaded from contributors spanning four star systems. Metallic taps from cargo " +
      "bays merged with heartbeat drums, syncing to telemetry spikes as the Aria traversed the Orion Nebula. OrbitInk uncovered " +
      "a pilgrim chant hidden in a 200-year-old signal, guiding the harmonics toward a safe passage. NovaQuill requested " +
      "counter-melodies, inviting listeners to score the lull between plasma surges.",
    position: 1,
    isPublished: true,
    createdAt: "2024-03-07T09:00:00.000Z",
    updatedAt: "2024-03-18T10:27:00.000Z",
  },
  {
    id: "f5de88f4-90a4-4bc4-b32c-9a532df4087d",
    storyId: stellarSymphonyStory.id,
    authorId: stellarCollaborators[2]!.id,
    title: "Movement III — Harmonic Convergence",
    summary:
      "A call-and-response finale stitches together contributions from over 400 participants as the Aria approaches the Aurora Gate.",
    content:
      "As the Aurora Gate emerged, the chorus erupted with motifs sourced from every previous submission. EchoWeaver balanced " +
      "the frequencies to prevent resonance overload while OrbitInk narrated the legends of the gatekeepers. NovaQuill layered " +
      "a spoken-word plea for new storytellers to claim the upcoming interlude. The climax resolved into a shimmering chord, " +
      "leaving an intentional gap for future collaborators to complete the cadence.",
    position: 2,
    isPublished: true,
    createdAt: "2024-03-18T10:00:00.000Z",
    updatedAt: "2024-03-22T18:45:00.000Z",
  },
];

const stellarComments: StoryCommentView[] = [
  {
    id: "b74f0d86-f2fb-4bde-8b05-18f0d3c9bc4d",
    body: "Layered a low-frequency drone that mirrors the hum of the Aria's engines—feel free to sample it for the nebula bridge.",
    createdAt: "2024-03-08T11:45:00.000Z",
    chapterId: stellarChapterRecords[0]!.id,
    repliesCount: 2,
    author: {
      id: "4bf1c360-98fb-4b62-8aa2-4e6eb4f4a673",
      displayName: "PulsePilot",
      role: "Composer",
      avatarUrl: null,
    },
  },
  {
    id: "a4af20d5-5a78-4546-8d8d-4c5e42c51f0c",
    body: "Loved the pilgrim chant sample! I uploaded a harmony with whispered consonants to keep it otherworldly.",
    createdAt: "2024-03-18T13:02:00.000Z",
    chapterId: stellarChapterRecords[1]!.id,
    repliesCount: 1,
    author: {
      id: "a01d8c54-66dc-47a2-8f61-0ab516b88388",
      displayName: "ChromaFable",
      role: "Vocalist",
      avatarUrl: null,
    },
  },
  {
    id: "9eae07a0-7d04-4aea-9adf-1434159ebeb6",
    body: "Tagging lore keepers: I drafted a short verse about the gatekeepers' trials. Feedback welcome before the live session!",
    createdAt: "2024-03-22T19:10:00.000Z",
    chapterId: stellarChapterRecords[2]!.id,
    repliesCount: 3,
    author: {
      id: "dc5d6dd0-b09a-4e05-a94a-8a1cf41b18e5",
      displayName: "MythRelay",
      role: "Writer",
      avatarUrl: null,
    },
  },
];

const stellarPrompts: StoryContributionPrompt[] = [
  {
    id: "0e7c7b81-9a44-4ede-8d8b-6b3ac5e65ebf",
    title: "Compose the Aurora Interlude",
    description:
      "Add a 60-second motif representing the Aurora Gate opening. Instrumental or vocal textures welcome—think shimmering and warm.",
    dueAt: "2024-04-15T23:59:00.000Z",
  },
  {
    id: "7becc5bb-42b5-4c2e-a995-644c93361c1f",
    title: "Write the Gatekeeper's Oath",
    description:
      "Submit 120 words or fewer capturing the promise made before entering the gate. Spoken word or lyrical verses encouraged.",
    dueAt: "2024-04-18T18:00:00.000Z",
  },
];

const chapterLikeTotals = [860, 742, 615];

const stellarContributions: StoryContributionView[] = [
  {
    id: "6fa7a0c3-2321-4f9f-9c5d-09dc5520d2c2",
    status: "accepted",
    prompt: "Compose the Aurora Interlude",
    content:
      "Shared a rising string progression that holds on the gate's resonance frequency. Layered in choral breaths to cue the audience handoff.",
    createdAt: "2024-03-20T16:42:00.000Z",
    respondedAt: "2024-03-22T12:05:00.000Z",
    chapterId: stellarChapterRecords[2]!.id,
    chapterTitle: stellarChapterRecords[2]!.title,
    chapterPosition: stellarChapterRecords[2]!.position,
    contributor: {
      id: "c7f8d3a2-6fbe-4a67-9e89-8b0f6f6f9f70",
      displayName: "LumenChorus",
      role: "Composer",
      avatarUrl: null,
    },
  },
  {
    id: "96d54272-2f02-4d4d-b9eb-28c12a9372d2",
    status: "pending",
    prompt: "Write the Gatekeeper's Oath",
    content:
      "Drafted a bilingual oath referencing the original pilgrim chant. Includes a whispered counterpoint that can sit under NovaQuill's narration.",
    createdAt: "2024-03-24T09:18:00.000Z",
    respondedAt: null,
    chapterId: stellarChapterRecords[2]!.id,
    chapterTitle: stellarChapterRecords[2]!.title,
    chapterPosition: stellarChapterRecords[2]!.position,
    contributor: {
      id: "3d6b521e-1f8f-4f35-9cd2-4698807cc238",
      displayName: "VerseVoyager",
      role: "Writer",
      avatarUrl: null,
    },
  },
  {
    id: "4bd11d1b-887d-46f5-93c9-4f5a2df9fe3d",
    status: "rejected",
    prompt: null,
    content:
      "Proposed an aggressive percussion breakdown using sampled engine malfunctions. Happy to revisit if we open an alt mix.",
    createdAt: "2024-03-15T21:07:00.000Z",
    respondedAt: "2024-03-16T12:24:00.000Z",
    chapterId: stellarChapterRecords[1]!.id,
    chapterTitle: stellarChapterRecords[1]!.title,
    chapterPosition: stellarChapterRecords[1]!.position,
    contributor: {
      id: "f41fae2f-2c94-4ac1-909c-bd2165a9390d",
      displayName: "DriftPulse",
      role: "Percussionist",
      avatarUrl: null,
    },
  },
];

const stellarChapterViews: StoryChapterView[] = stellarChapterRecords.map((record, index) => ({
  record,
  wordCount: record.content.trim().split(/\s+/).length,
  estimatedDurationMinutes: minutesFromWordCount(record.content),
  likeCount: chapterLikeTotals[index] ?? 0,
  commentCount: stellarComments.filter((comment) => comment.chapterId === record.id).length,
}));

const stellarStats: StoryDetailStats = {
  likes: chapterLikeTotals.reduce((total, value) => total + value, 0),
  followers: 972,
  contributions: 34,
  readingTimeMinutes: stellarChapterViews.reduce(
    (total, chapter) => total + chapter.estimatedDurationMinutes,
    0,
  ),
  chapterCount: stellarChapterViews.length,
  lastUpdated: stellarChapterRecords.reduce((latest, chapter) => {
    return new Date(chapter.updatedAt) > new Date(latest) ? chapter.updatedAt : latest;
  }, stellarSymphonyStory.updatedAt),
};

const demoStoriesBySlug = new Map<string, StoryDetailData>([
  [
    stellarSymphonyStory.slug!,
    {
      story: stellarSymphonyStory,
      chapters: stellarChapterViews,
      comments: stellarComments,
      contributions: stellarContributions,
      collaborators: stellarCollaborators,
      contributionPrompts: stellarPrompts,
      stats: stellarStats,
      source: "demo",
    },
  ],
]);

export function getDemoStoryDetail(slug: string): StoryDetailData | null {
  const detail = demoStoriesBySlug.get(slug);
  if (!detail) {
    return null;
  }

  const contributions = getDemoContributionTimeline(detail.story.id, detail.contributions);

  const lastUpdated = contributions.reduce((latest, contribution) => {
    return new Date(contribution.createdAt) > new Date(latest) ? contribution.createdAt : latest;
  }, detail.stats.lastUpdated);

  const contributionCount = Math.max(detail.stats.contributions, contributions.length);

  return {
    ...detail,
    contributions,
    stats: {
      ...detail.stats,
      contributions: contributionCount,
      lastUpdated,
    },
  };
}

export function listDemoStorySlugs(): string[] {
  return Array.from(demoStoriesBySlug.keys());
}
