"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  followUser as followAuthor,
  toggleStoryLike as supabaseToggleStoryLike,
  unfollowUser as unfollowAuthor,
} from "@/lib/storyData";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  getDemoStoryEngagementSnapshot,
  toggleDemoAuthorFollow,
  toggleDemoStoryLike,
} from "@/lib/demo/engagementDemoStore";

export type StoryEngagementSource = "supabase" | "demo";

export type StoryEngagementState = {
  storyLikes: number;
  storyLikedByUser: boolean;
  followerCount: number;
  followingAuthor: boolean;
  isLoading: boolean;
  isTogglingLike: boolean;
  isTogglingFollow: boolean;
  dataSource: StoryEngagementSource;
  error: string | null;
  supabaseInitializationError: string | null;
};

type Options = {
  storyId: string;
  authorId: string;
  initialStoryLikeCount: number;
  initialFollowerCount: number;
  userId: string | null;
};

type ClientState = {
  client: SupabaseClient | null;
  error: string | null;
  initialized: boolean;
};

const initialState: StoryEngagementState = {
  storyLikes: 0,
  storyLikedByUser: false,
  followerCount: 0,
  followingAuthor: false,
  isLoading: true,
  isTogglingLike: false,
  isTogglingFollow: false,
  dataSource: "demo",
  error: null,
  supabaseInitializationError: null,
};

function ensureDemoUserId() {
  if (typeof window === "undefined") {
    return "demo-user";
  }
  const storageKey = "fts-demo-user-id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(storageKey, next);
  return next;
}

async function fetchSupabaseEngagement(
  client: SupabaseClient,
  storyId: string,
  authorId: string,
  userId: string | null,
) {
  const [likeCountResult, followerCountResult, storyLikeRow, followRow] = await Promise.all([
    client
      .from("StoryLike")
      .select("id", { count: "exact", head: true })
      .eq("story_id", storyId)
      .is("chapter_id", null),
    client
      .from("UserFollow")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", authorId),
    userId
      ? client
          .from("StoryLike")
          .select("id")
          .eq("story_id", storyId)
          .eq("user_id", userId)
          .is("chapter_id", null)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    userId
      ? client
          .from("UserFollow")
          .select("follower_id")
          .eq("following_id", authorId)
          .eq("follower_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (likeCountResult.error) {
    throw likeCountResult.error;
  }
  if (followerCountResult.error) {
    throw followerCountResult.error;
  }
  if (storyLikeRow.error) {
    throw storyLikeRow.error;
  }
  if (followRow.error) {
    throw followRow.error;
  }

  return {
    storyLikes: likeCountResult.count ?? 0,
    followerCount: followerCountResult.count ?? 0,
    storyLikedByUser: Boolean(storyLikeRow.data),
    followingAuthor: Boolean(followRow.data),
  };
}

export function useStoryEngagement(options: Options) {
  const [clientState, setClientState] = useState<ClientState>({
    client: null,
    error: null,
    initialized: false,
  });

  const [state, setState] = useState<StoryEngagementState>({
    ...initialState,
    storyLikes: options.initialStoryLikeCount,
    followerCount: options.initialFollowerCount,
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const client = createSupabaseBrowserClient();
        if (isMounted) {
          setClientState({ client, error: null, initialized: true });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Supabase client could not be initialized.";
        if (isMounted) {
          setClientState({ client: null, error: message, initialized: true });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const demoUserId = useMemo(() => {
    if (!clientState.initialized || clientState.client) {
      return null;
    }
    return options.userId ?? ensureDemoUserId();
  }, [clientState.client, clientState.initialized, options.userId]);

  const effectiveUserId = clientState.client ? options.userId : demoUserId;

  useEffect(() => {
    if (!clientState.initialized) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      if (clientState.client) {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          dataSource: "supabase",
          supabaseInitializationError: null,
        }));
        try {
          const result = await fetchSupabaseEngagement(
            clientState.client,
            options.storyId,
            options.authorId,
            options.userId,
          );
          if (!isMounted) {
            return;
          }
          setState((prev) => ({
            ...prev,
            storyLikes: result.storyLikes,
            storyLikedByUser: result.storyLikedByUser,
            followerCount: result.followerCount,
            followingAuthor: result.followingAuthor,
            isLoading: false,
            dataSource: "supabase",
            error: null,
          }));
        } catch (error) {
          if (!isMounted) {
            return;
          }
          const message = error instanceof Error ? error.message : "Failed to load engagement.";
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: message,
            dataSource: "supabase",
          }));
        }
      } else if (effectiveUserId) {
        const snapshot = getDemoStoryEngagementSnapshot(
          options.storyId,
          options.authorId,
          effectiveUserId,
        );
        if (!isMounted) {
          return;
        }
        setState((prev) => ({
          ...prev,
          storyLikes: snapshot.storyLikeCount,
          storyLikedByUser: snapshot.storyLikedByUser,
          followerCount: snapshot.followerCount,
          followingAuthor: snapshot.followingAuthor,
          isLoading: false,
          dataSource: "demo",
          error: null,
          supabaseInitializationError: clientState.error,
        }));
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [
    clientState.client,
    clientState.error,
    clientState.initialized,
    effectiveUserId,
    options.authorId,
    options.storyId,
    options.userId,
  ]);

  const toggleStoryLike = useCallback(async () => {
    if (state.isTogglingLike || state.isLoading) {
      return;
    }

    if (clientState.client) {
      if (!options.userId) {
        return;
      }

      const nextLike = !state.storyLikedByUser;
      setState((prev) => ({
        ...prev,
        isTogglingLike: true,
        error: null,
      }));
      try {
        await supabaseToggleStoryLike(clientState.client, {
          targetId: options.storyId,
          userId: options.userId,
          like: nextLike,
        });
        setState((prev) => ({
          ...prev,
          storyLikes: Math.max(0, prev.storyLikes + (nextLike ? 1 : -1)),
          storyLikedByUser: nextLike,
          isTogglingLike: false,
          error: null,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update appreciation.";
        setState((prev) => ({
          ...prev,
          isTogglingLike: false,
          error: message,
        }));
      }
    } else if (effectiveUserId) {
      setState((prev) => ({
        ...prev,
        isTogglingLike: true,
        dataSource: "demo",
        error: null,
      }));
      const snapshot = toggleDemoStoryLike(options.storyId, effectiveUserId);
      setState((prev) => ({
        ...prev,
        storyLikes: snapshot.storyLikeCount,
        storyLikedByUser: snapshot.storyLikedByUser,
        isTogglingLike: false,
        error: null,
        supabaseInitializationError: clientState.error,
      }));
    }
  }, [
    clientState.client,
    clientState.error,
    effectiveUserId,
    options.storyId,
    options.userId,
    state.isLoading,
    state.isTogglingLike,
    state.storyLikedByUser,
  ]);

  const toggleAuthorFollow = useCallback(async () => {
    if (state.isTogglingFollow || state.isLoading) {
      return;
    }

    if (clientState.client) {
      if (!options.userId) {
        return;
      }

      const nextFollow = !state.followingAuthor;
      setState((prev) => ({
        ...prev,
        isTogglingFollow: true,
        error: null,
      }));
      try {
        if (nextFollow) {
          await followAuthor(clientState.client, {
            followerId: options.userId,
            followingId: options.authorId,
          });
        } else {
          await unfollowAuthor(clientState.client, {
            followerId: options.userId,
            followingId: options.authorId,
          });
        }
        setState((prev) => ({
          ...prev,
          followerCount: Math.max(0, prev.followerCount + (nextFollow ? 1 : -1)),
          followingAuthor: nextFollow,
          isTogglingFollow: false,
          error: null,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update follow status.";
        setState((prev) => ({
          ...prev,
          isTogglingFollow: false,
          error: message,
        }));
      }
    } else if (effectiveUserId) {
      setState((prev) => ({
        ...prev,
        isTogglingFollow: true,
        dataSource: "demo",
        error: null,
      }));
      const snapshot = toggleDemoAuthorFollow(options.authorId, effectiveUserId);
      setState((prev) => ({
        ...prev,
        followerCount: snapshot.followerCount,
        followingAuthor: snapshot.followingAuthor,
        isTogglingFollow: false,
        error: null,
        supabaseInitializationError: clientState.error,
      }));
    }
  }, [
    clientState.client,
    clientState.error,
    effectiveUserId,
    options.authorId,
    options.userId,
    state.followingAuthor,
    state.isLoading,
    state.isTogglingFollow,
  ]);

  return {
    ...state,
    toggleStoryLike,
    toggleAuthorFollow,
    supabaseAvailable: Boolean(clientState.client),
  };
}
