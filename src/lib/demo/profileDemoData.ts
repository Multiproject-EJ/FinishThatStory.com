import type {
  ProfileDetailData,
  ProfileStoryHighlight,
  ProfileSupportLink,
} from "@/lib/profileDetail";
import { getDemoStoryDetail } from "@/lib/demo/storyDemoData";

function buildStoryHighlights(): ProfileStoryHighlight[] {
  const stellar = getDemoStoryDetail("stellar-symphony");

  if (!stellar) {
    return [];
  }

  return [
    {
      story: stellar.story,
      chapterCount: stellar.chapters.length,
      likeCount: stellar.stats.likes,
      lastUpdated: stellar.stats.lastUpdated,
    },
  ];
}

const novaQuillSupportLinks: ProfileSupportLink[] = [
  {
    id: "patreon",
    platform: "Patreon",
    label: "Support NovaQuill on Patreon",
    url: "https://www.patreon.com/novaquill",
  },
  {
    id: "kofi",
    platform: "Ko-fi",
    label: "Buy NovaQuill a tea on Ko-fi",
    url: "https://ko-fi.com/novaquill",
  },
  {
    id: "website",
    platform: "Website",
    label: "Visit the Stellar Symphony hub",
    url: "https://finishthatstory.com/demo/stellar-symphony",
  },
];

const demoProfilesByUsername = new Map<string, ProfileDetailData>([
  [
    "novaquill",
    {
      profile: {
        id: "1d88cc60-7d3a-445a-a7f9-6b7cf87db5e4",
        username: "novaquill",
        avatar: null,
        bio: "Audio fiction showrunner weaving collaborative galaxies with fellow storytellers.",
        language: "en",
        updatedAt: "2024-03-22T18:45:00.000Z",
        displayName: "NovaQuill",
      },
      stories: buildStoryHighlights(),
      stats: {
        followers: 972,
        following: 48,
        contributions: 34,
        storyCount: 1,
      },
      supportLinks: novaQuillSupportLinks,
      source: "demo",
    },
  ],
  [
    "echoweaver",
    {
      profile: {
        id: "5f650d8f-2a6c-4df9-93f5-9c4bb77a9b21",
        username: "echoweaver",
        avatar: null,
        bio: "Sound designer turning crowd-sourced beats into nebula soundscapes for Stellar Symphony.",
        language: "en",
        updatedAt: "2024-03-18T10:27:00.000Z",
        displayName: "EchoWeaver",
      },
      stories: buildStoryHighlights(),
      stats: {
        followers: 486,
        following: 61,
        contributions: 19,
        storyCount: 1,
      },
      supportLinks: [
        {
          id: "custom",
          platform: "Custom",
          label: "Download collaborative stems",
          url: "https://finishthatstory.com/demo/echoweaver-stems",
        },
      ],
      source: "demo",
    },
  ],
]);

export function getDemoProfileDetail(username: string): ProfileDetailData | null {
  return demoProfilesByUsername.get(username.toLowerCase()) ?? null;
}

export function listDemoProfileUsernames(): string[] {
  return Array.from(demoProfilesByUsername.keys());
}
