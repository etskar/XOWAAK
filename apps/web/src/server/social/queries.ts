import "server-only";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getMediaSignedUrls } from "@/server/media/urls";
import { createSupabaseServerClient } from "@/server/supabase/client";
import type { ProfileRecord } from "@/server/identity/types";
import type { Relationship, SocialListResult, SocialUser } from "@/server/social/types";

const pageDefault = 20;
const pageMaximum = 50;
const profileSelect = "id, username, display_name, bio, avatar_media_id, visibility";

function boundedPage(page: number, limit: number) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit)
    ? Math.min(Math.max(limit, 1), pageMaximum)
    : pageDefault;
  return { page: safePage, limit: safeLimit };
}

export async function getRelationship(viewerId: string, targetId: string): Promise<Relationship> {
  if (!hasSupabasePublicEnv() || viewerId === targetId) {
    return { state: "none", followId: null };
  }

  const supabase = await createSupabaseServerClient();
  const [outgoing, incoming, blocked, blockedBy] = await Promise.all([
    supabase
      .from("follows")
      .select("id, status")
      .eq("follower_id", viewerId)
      .eq("following_id", targetId)
      .maybeSingle(),
    supabase
      .from("follows")
      .select("id, status")
      .eq("follower_id", targetId)
      .eq("following_id", viewerId)
      .maybeSingle(),
    supabase
      .from("blocks")
      .select("id")
      .eq("blocker_id", viewerId)
      .eq("blocked_id", targetId)
      .maybeSingle(),
    supabase
      .from("blocks")
      .select("id")
      .eq("blocker_id", targetId)
      .eq("blocked_id", viewerId)
      .maybeSingle(),
  ]);

  if (blocked.data) return { state: "blocked", followId: null };
  if (blockedBy.data) return { state: "blocked_by", followId: null };

  const outgoingState = outgoing.data?.status as "pending" | "accepted" | undefined;
  const incomingState = incoming.data?.status as "pending" | "accepted" | undefined;

  if (outgoingState === "pending")
    return { state: "pending_outgoing", followId: outgoing.data?.id ?? null };
  if (incomingState === "pending")
    return { state: "pending_incoming", followId: incoming.data?.id ?? null };
  if (outgoingState === "accepted" && incomingState === "accepted")
    return { state: "mutual", followId: outgoing.data?.id ?? null };
  if (outgoingState === "accepted")
    return { state: "following", followId: outgoing.data?.id ?? null };
  if (incomingState === "accepted")
    return { state: "followed_by", followId: incoming.data?.id ?? null };

  return { state: "none", followId: null };
}

async function getSocialUsers(profileIds: string[], viewerId: string | null) {
  if (profileIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .in("id", profileIds);
  if (error) throw new Error("social_profiles_query_failed");

  const byId = new Map((data as ProfileRecord[]).map((profile) => [profile.id, profile]));
  const avatarIds = [
    ...new Set(
      (data ?? [])
        .map((profile) => (profile.avatar_media_id ? String(profile.avatar_media_id) : null))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const avatarUrls = await getMediaSignedUrls(avatarIds);
  return Promise.all(
    profileIds.flatMap((id) => {
      const profile = byId.get(id);
      if (!profile) return [];
      return [
        (async (): Promise<SocialUser> => ({
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name || profile.username,
          bio: profile.bio,
          avatarMediaId: profile.avatar_media_id,
          avatarUrl: profile.avatar_media_id
            ? (avatarUrls.get(String(profile.avatar_media_id)) ?? null)
            : null,
          visibility: profile.visibility,
          relationship: viewerId ? await getRelationship(viewerId, profile.id) : null,
        }))(),
      ];
    }),
  );
}

export async function getFollowers(
  userId: string,
  viewerId: string | null,
  page = 1,
  limit = pageDefault,
): Promise<SocialListResult> {
  if (!hasSupabasePublicEnv()) return { items: [], page, limit, hasMore: false };
  const bounded = boundedPage(page, limit);
  const from = (bounded.page - 1) * bounded.limit;
  const to = from + bounded.limit - 1;
  const supabase = await createSupabaseServerClient();
  const { data, count, error } = await supabase
    .from("follows")
    .select("follower_id", { count: "exact" })
    .eq("following_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw new Error("followers_query_failed");
  const ids = (data ?? []).map((row) => row.follower_id as string);
  return { items: await getSocialUsers(ids, viewerId), ...bounded, hasMore: (count ?? 0) > to + 1 };
}

export async function getFollowing(
  userId: string,
  viewerId: string | null,
  page = 1,
  limit = pageDefault,
): Promise<SocialListResult> {
  if (!hasSupabasePublicEnv()) return { items: [], page, limit, hasMore: false };
  const bounded = boundedPage(page, limit);
  const from = (bounded.page - 1) * bounded.limit;
  const to = from + bounded.limit - 1;
  const supabase = await createSupabaseServerClient();
  const { data, count, error } = await supabase
    .from("follows")
    .select("following_id", { count: "exact" })
    .eq("follower_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw new Error("following_query_failed");
  const ids = (data ?? []).map((row) => row.following_id as string);
  return { items: await getSocialUsers(ids, viewerId), ...bounded, hasMore: (count ?? 0) > to + 1 };
}

export async function getPendingFollowRequests(
  userId: string,
  viewerId: string | null,
): Promise<SocialUser[]> {
  if (!hasSupabasePublicEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("follows")
    .select("id, follower_id")
    .eq("following_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error("requests_query_failed");
  return getSocialUsers(
    (data ?? []).map((row) => row.follower_id as string),
    viewerId,
  );
}

export async function getBlockedUsers(userId: string): Promise<SocialUser[]> {
  if (!hasSupabasePublicEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);
  if (error) throw new Error("blocks_query_failed");
  return getSocialUsers(
    (data ?? []).map((row) => row.blocked_id as string),
    userId,
  );
}

export async function getFollowerCount(userId: string) {
  if (!hasSupabasePublicEnv()) return 0;
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("following_id", userId)
    .eq("status", "accepted");
  if (error) throw new Error("follower_count_failed");
  return count ?? 0;
}

export async function getFollowingCount(userId: string) {
  if (!hasSupabasePublicEnv()) return 0;
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("follower_id", userId)
    .eq("status", "accepted");
  if (error) throw new Error("following_count_failed");
  return count ?? 0;
}
