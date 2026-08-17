import "server-only";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";
import { decodePostCursor, encodePostCursor } from "@/server/posts/pagination";
import { getPostEngagement } from "@/server/posts/engagement";
import { getMediaSignedUrls } from "@/server/media/urls";
import type { PostListResult, PostMedia, PostQueryResult, PostRecord } from "@/server/posts/types";

const defaultLimit = 20;
const maximumLimit = 50;
const postSelect = "id, author_id, content, visibility, status, created_at, updated_at, deleted_at";

function boundedLimit(limit: number) {
  return Number.isInteger(limit) ? Math.min(Math.max(limit, 1), maximumLimit) : defaultLimit;
}

async function hydratePosts(rows: Array<Record<string, unknown>>): Promise<PostRecord[]> {
  if (rows.length === 0) return [];
  const authorIds = [...new Set(rows.map((row) => String(row.author_id)))];
  const postIds = rows.map((row) => String(row.id));
  const supabase = await createSupabaseServerClient();
  const [{ data: profiles, error: profileError }, { data: media, error: mediaError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_media_id")
        .in("id", authorIds),
      supabase
        .from("post_media")
        .select("id, post_id, media_asset_id, media_type, position")
        .in("post_id", postIds)
        .order("position"),
    ]);

  if (profileError || mediaError) throw new Error("post_hydration_failed");

  const profileById = new Map((profiles ?? []).map((profile) => [String(profile.id), profile]));
  const mediaAssetIds = (media ?? []).map((item) => String(item.media_asset_id));
  const mediaUrls = await getMediaSignedUrls(mediaAssetIds);
  const mediaByPost = new Map<string, PostMedia[]>();
  for (const item of media ?? []) {
    const postId = String(item.post_id);
    const list = mediaByPost.get(postId) ?? [];
    list.push({
      id: String(item.id),
      mediaAssetId: String(item.media_asset_id),
      mediaType: item.media_type as "image" | "video",
      position: Number(item.position),
      url: mediaUrls.get(String(item.media_asset_id)) ?? null,
    });
    mediaByPost.set(postId, list);
  }

  const engagementByPost = await getPostEngagement(postIds);

  return rows.flatMap((row) => {
    const authorId = String(row.author_id);
    const profile = profileById.get(authorId);
    if (!profile) return [];

    return [
      {
        id: String(row.id),
        authorId,
        content: row.content ? String(row.content) : null,
        visibility: row.visibility as PostRecord["visibility"],
        status: row.status as PostRecord["status"],
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
        deletedAt: row.deleted_at ? String(row.deleted_at) : null,
        author: {
          id: authorId,
          username: String(profile.username),
          displayName: String(profile.display_name || profile.username),
          avatarMediaId: profile.avatar_media_id ? String(profile.avatar_media_id) : null,
        },
        media: mediaByPost.get(String(row.id)) ?? [],
        engagement: engagementByPost.get(String(row.id)),
      },
    ];
  });
}

async function queryPosts(options: {
  authorId?: string;
  cursor?: string | null;
  offset?: number;
  limit?: number;
}): Promise<PostQueryResult<PostListResult>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };

  try {
    const limit = boundedLimit(options.limit ?? defaultLimit);
    const cursor = decodePostCursor(options.cursor);
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("posts")
      .select(postSelect)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (options.authorId) query = query.eq("author_id", options.authorId);
    if (options.offset && options.offset > 0) {
      query = query.range(options.offset, options.offset + limit);
    } else if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      );
    }

    const { data, error } = await query;
    if (error) return { status: "error", data: null };

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const items = await hydratePosts(pageRows);
    const last = items.at(-1);
    const nextCursor =
      hasMore && last ? encodePostCursor({ createdAt: last.createdAt, id: last.id }) : null;

    return { status: "ok", data: { items, nextCursor, hasMore } };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getFeed(cursor?: string | null, limit = defaultLimit) {
  const user = await getCurrentUser();
  if (!user) return { status: "unauthenticated" as const, data: null };
  return queryPosts({ cursor, limit });
}

export async function getPostsPage(offset = 0, limit = 12): Promise<PostRecord[]> {
  const result = await queryPosts({ offset, limit });
  return result.status === "ok" ? result.data.items : [];
}

export async function getPost(postId: string): Promise<PostQueryResult<PostRecord | null>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("posts")
      .select(postSelect)
      .eq("id", postId)
      .maybeSingle();
    if (error) return { status: "error", data: null };
    const posts = await hydratePosts(data ? [data as Record<string, unknown>] : []);
    return { status: "ok", data: posts[0] ?? null };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getUserPosts(authorId: string, cursor?: string | null, limit = defaultLimit) {
  return queryPosts({ authorId, cursor, limit });
}

export async function getUserPostsCount(authorId: string): Promise<number> {
  if (!hasSupabasePublicEnv()) return 0;
  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", authorId)
      .eq("status", "published");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
