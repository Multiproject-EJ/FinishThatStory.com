import type { SupabaseClient } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  language: string | null;
  updated_at: string | null;
};

export type UserProfileInput = {
  username: string | null;
  avatar: string | null;
  bio: string | null;
  language: string | null;
};

export async function getUserProfile(
  client: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await client
    .from("UserProfile")
    .select("id, username, avatar, bio, language, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function getUserProfileByUsername(
  client: SupabaseClient,
  username: string,
): Promise<UserProfile | null> {
  const normalized = username.trim().toLowerCase();
  const { data, error } = await client
    .from("UserProfile")
    .select("id, username, avatar, bio, language, updated_at")
    .ilike("username", normalized)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function upsertUserProfile(
  client: SupabaseClient,
  userId: string,
  values: UserProfileInput,
): Promise<UserProfile> {
  const { data, error } = await client
    .from("UserProfile")
    .upsert(
      {
        id: userId,
        username: values.username,
        avatar: values.avatar,
        bio: values.bio,
        language: values.language,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("id, username, avatar, bio, language, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
