import { createClient } from "@supabase/supabase-js";

import { getDemoProfileDetail } from "@/lib/demo/profileDemoData";
import { getUserProfileByUsername } from "@/lib/profiles";
import { listStoriesByAuthor, listStoryChapters, type StoryRecord } from "@/lib/storyData";

type ProfileSource = "supabase" | "demo";

export type ProfileSupportLink = {
  id: string;
  label: string;
  platform: string;
  url: string;
};

export type ProfileStoryHighlight = {
  story: StoryRecord;
  chapterCount: number;
  likeCount: number;
  lastUpdated: string;
};

export type ProfileDetailStats = {
  followers: number;
  following: number;
  contributions: number;
  storyCount: number;
};

export type ProfileDetailData = {
  profile: {
    id: string;
    username: string | null;
    avatar: string | null;
    bio: string | null;
    language: string | null;
    updatedAt: string | null;
    displayName: string;
  };
  stories: ProfileStoryHighlight[];
  stats: ProfileDetailStats;
  supportLinks: ProfileSupportLink[];
  source: ProfileSource;
};

function deriveDisplayName(username: string | null, fallbackId: string): string {
  if (username && username.trim().length > 0) {
    return username.trim();
  }

  return `Creator ${fallbackId.slice(0, 6)}`;
}

export async function fetchProfileDetail(username: string): Promise<ProfileDetailData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const profile = await getUserProfileByUsername(client, username);

      if (!profile) {
        return null;
      }

      const stories = await listStoriesByAuthor(client, {
        authorId: profile.id,
        includeDrafts: false,
        limit: 8,
      });

      const storyHighlights = await Promise.all(
        stories.map(async (story) => {
          const [chapters, likeResponse] = await Promise.all([
            listStoryChapters(client, story.id),
            client
              .from("StoryLike")
              .select("id", { head: true, count: "exact" })
              .eq("story_id", story.id),
          ]);

          if (likeResponse.error) {
            throw likeResponse.error;
          }

          const likeCount = likeResponse.count ?? 0;
          const chapterCount = chapters.length;
          const lastUpdated = chapters.reduce((latest, chapter) => {
            return new Date(chapter.updatedAt) > new Date(latest) ? chapter.updatedAt : latest;
          }, story.updatedAt);

          return {
            story,
            chapterCount,
            likeCount,
            lastUpdated,
          } satisfies ProfileStoryHighlight;
        }),
      );

      const [followersResult, followingResult, contributionsResult] = await Promise.all([
        client
          .from("UserFollow")
          .select("follower_id", { head: true, count: "exact" })
          .eq("following_id", profile.id),
        client
          .from("UserFollow")
          .select("following_id", { head: true, count: "exact" })
          .eq("follower_id", profile.id),
        client
          .from("StoryContribution")
          .select("id", { head: true, count: "exact" })
          .eq("contributor_id", profile.id),
      ]);

      if (followersResult.error) throw followersResult.error;
      if (followingResult.error) throw followingResult.error;
      if (contributionsResult.error) throw contributionsResult.error;

      const detail: ProfileDetailData = {
        profile: {
          id: profile.id,
          username: profile.username,
          avatar: profile.avatar,
          bio: profile.bio,
          language: profile.language,
          updatedAt: profile.updated_at,
          displayName: deriveDisplayName(profile.username, profile.id),
        },
        stories: storyHighlights,
        stats: {
          followers: followersResult.count ?? 0,
          following: followingResult.count ?? 0,
          contributions: contributionsResult.count ?? 0,
          storyCount: stories.length,
        },
        supportLinks: [],
        source: "supabase",
      };

      return detail;
    } catch (error) {
      console.warn(`[profileDetail] Falling back to demo data for username "${username}"`, error);
    }
  }

  return getDemoProfileDetail(username);
}
